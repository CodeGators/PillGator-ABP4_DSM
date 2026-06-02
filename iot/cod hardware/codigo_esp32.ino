// ===========================================================
// PillGator ESP32 — Firmware com WiFi + MQTT + Gavetas
// ===========================================================
// Baseado no codigo original do Arduino, adaptado para ESP32
// com conexao WiFi, MQTT (HiveMQ Cloud) e relogio NTP.
//
// Bibliotecas necessarias (instalar pela Arduino IDE):
//   - ESP32Servo        (Gerenciador de Bibliotecas)
//   - PubSubClient      (Gerenciador de Bibliotecas)
//   - LiquidCrystal_I2C (Gerenciador de Bibliotecas)
//   - ArduinoJson       (Gerenciador de Bibliotecas)
//
// Placa: ESP32 Dev Module (Boards Manager -> esp32 by Espressif)
// ===========================================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include <time.h>

// ===========================================================
// CONFIGURACOES — PREENCHA COM SEUS DADOS
// ===========================================================

// WiFi
const char* WIFI_SSID     = "NOME_DA_SUA_REDE";
const char* WIFI_PASSWORD = "SENHA_DA_SUA_REDE";

// MQTT (HiveMQ Cloud)
const char* MQTT_HOST     = "SEU_CLUSTER.s1.eu.hivemq.cloud";  // ex: 3e76902adb2d45bc8af311ed003cc05f.s1.eu.hivemq.cloud
const int   MQTT_PORT     = 8883;
const char* MQTT_USER     = "pillgator-esp32";
const char* MQTT_PASSWORD = "SUA_SENHA_MQTT";

// Identificador unico deste dispositivo
const char* DEVICE_ID     = "PILL-001";

// ===========================================================
// MAPEAMENTO DE PINOS ESP32
// ===========================================================
// Ajuste conforme sua montagem. Estes sao pinos comuns do ESP32.

const int pinosServo[] = {13, 12, 14};       // Servos das gavetas 1, 2, 3
const int leds[]       = {27, 26, 25};       // LEDs das gavetas 1, 2, 3
const int pinoBuzzer   = 33;
const int pinosTrig[]  = {32, 35, 34};       // Ultrasonicos TRIG
const int pinosEcho[]  = {39, 36, 15};       // Ultrasonicos ECHO
// I2C (LCD): SDA = 21, SCL = 22 (padrao ESP32)

// ===========================================================
// OBJETOS GLOBAIS
// ===========================================================

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo servos[3];

WiFiClientSecure espClient;
PubSubClient mqtt(espClient);

// ===========================================================
// VARIAVEIS DO SISTEMA
// ===========================================================

const int limiteAbertura = 10;  // cm
bool interagindoComGaveta = false;

// Relogio (modo apresentacao — igual ao original)
unsigned long anteriorMillis = 0;
int horas = 7, minutos = 45;

bool doseEntregue[3] = {false, false, false};
int horariosGaveta[3] = {8, 14, 20};
const char* nomesRemedio[3] = {"REMEDIO A", "REMEDIO B", "REMEDIO C"};

// MQTT
unsigned long ultimoHeartbeat = 0;
const unsigned long INTERVALO_HEARTBEAT = 60000;  // 60 segundos
bool mqttConectado = false;

// Contadores para msgId unico
unsigned long contadorMsg = 0;

// ===========================================================
// FUNCOES MQTT
// ===========================================================

// Gera um msgId unico simples (timestamp + contador)
String gerarMsgId() {
  contadorMsg++;
  return String(DEVICE_ID) + "-" + String(millis()) + "-" + String(contadorMsg);
}

// Monta topico: pillgator/PILL-001/evento/gaveta_aberta
String montarTopico(const char* categoria, const char* tipo) {
  return String("pillgator/") + DEVICE_ID + "/" + categoria + "/" + tipo;
}

// Publica evento no MQTT
void publicarEvento(const char* tipo, int compartimento) {
  if (!mqtt.connected()) {
    Serial.println("MQTT: offline, evento nao enviado: " + String(tipo));
    return;
  }

  JsonDocument doc;
  doc["dispositivoId"] = DEVICE_ID;
  doc["compartimento"] = compartimento;
  doc["tipo"] = tipo;
  doc["msgId"] = gerarMsgId();

  // Timestamp ISO 8601
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char ts[30];
    strftime(ts, sizeof(ts), "%Y-%m-%dT%H:%M:%S-03:00", &timeinfo);
    doc["timestamp"] = ts;
  } else {
    doc["timestamp"] = String(millis());
  }

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));

  String topico = montarTopico("evento", tipo);
  bool ok = mqtt.publish(topico.c_str(), payload, false);

  Serial.println(ok ? ("MQTT: publicado -> " + topico) : ("MQTT: FALHA ao publicar -> " + topico));
}

// Publica heartbeat
void publicarHeartbeat() {
  if (!mqtt.connected()) return;

  JsonDocument doc;
  doc["dispositivoId"] = DEVICE_ID;
  doc["uptimeSegundos"] = millis() / 1000;

  JsonArray gavetas = doc["gavetas"].to<JsonArray>();
  for (int i = 0; i < 3; i++) {
    JsonObject g = gavetas.add<JsonObject>();
    g["numero"] = i + 1;
    g["status"] = "bloqueado";
  }

  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char ts[30];
    strftime(ts, sizeof(ts), "%Y-%m-%dT%H:%M:%S-03:00", &timeinfo);
    doc["timestamp"] = ts;
  }

  char payload[512];
  serializeJson(doc, payload, sizeof(payload));

  String topico = montarTopico("status", "heartbeat");
  mqtt.publish(topico.c_str(), payload, false);
  Serial.println("MQTT: heartbeat enviado");
}

// Callback quando recebe mensagem MQTT (comandos do backend)
void callbackMqtt(char* topico, byte* payload, unsigned int length) {
  char msg[256];
  int len = min((unsigned int)255, length);
  memcpy(msg, payload, len);
  msg[len] = '\0';

  Serial.println("MQTT recebido: " + String(topico));
  Serial.println("  Payload: " + String(msg));

  // Parsear comando
  JsonDocument doc;
  DeserializationError erro = deserializeJson(doc, msg);
  if (erro) {
    Serial.println("  Erro ao parsear JSON");
    return;
  }

  // Extrair tipo de comando do topico
  // pillgator/PILL-001/comando/liberar
  String topicoStr = String(topico);
  
  if (topicoStr.endsWith("/liberar")) {
    int compartimento = doc["compartimento"] | 0;
    if (compartimento >= 1 && compartimento <= 3) {
      Serial.println("  Comando: liberar gaveta " + String(compartimento));
      liberarRemedio(compartimento, nomesRemedio[compartimento - 1]);
    }
  } else if (topicoStr.endsWith("/bloquear")) {
    int compartimento = doc["compartimento"] | 0;
    if (compartimento >= 1 && compartimento <= 3) {
      servos[compartimento - 1].write(0);
      digitalWrite(leds[compartimento - 1], LOW);
      Serial.println("  Comando: bloquear gaveta " + String(compartimento));
    }
  } else if (topicoStr.endsWith("/sincronizar")) {
    Serial.println("  Comando: sincronizar recebido (programacoes atualizadas)");
    // Aqui voces podem processar novos horarios vindos do backend
  }
}

// ===========================================================
// CONEXOES
// ===========================================================

void conectarWiFi() {
  Serial.print("WiFi: conectando a " + String(WIFI_SSID));
  atualizarVisor("Conectando...", "WiFi");
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK! IP: " + WiFi.localIP().toString());
    atualizarVisor("WiFi OK!", WiFi.localIP().toString());
    delay(1500);
  } else {
    Serial.println(" FALHOU!");
    atualizarVisor("WiFi FALHOU", "Modo offline");
    delay(2000);
  }
}

void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqtt.connected()) return;

  Serial.print("MQTT: conectando...");
  atualizarVisor("Conectando...", "MQTT");

  if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASSWORD)) {
    Serial.println(" OK!");
    mqttConectado = true;
    atualizarVisor("MQTT OK!", "Conectado");
    delay(1000);

    // Inscrever nos topicos de comando
    String topicoComando = String("pillgator/") + DEVICE_ID + "/comando/#";
    mqtt.subscribe(topicoComando.c_str());
    Serial.println("MQTT: inscrito em " + topicoComando);
  } else {
    Serial.println(" FALHOU! Codigo: " + String(mqtt.state()));
    mqttConectado = false;
    atualizarVisor("MQTT FALHOU", "Cod: " + String(mqtt.state()));
    delay(2000);
  }
}

void sincronizarRelogio() {
  // Configura NTP com fuso horario de Brasilia (UTC-3)
  configTime(-3 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  
  Serial.print("NTP: sincronizando...");
  struct tm timeinfo;
  int tentativas = 0;
  while (!getLocalTime(&timeinfo) && tentativas < 10) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  
  if (getLocalTime(&timeinfo)) {
    horas = timeinfo.tm_hour;
    minutos = timeinfo.tm_min;
    Serial.printf(" OK! Hora: %02d:%02d\n", horas, minutos);
  } else {
    Serial.println(" FALHOU! Usando relogio simulado.");
  }
}

// ===========================================================
// FUNCOES DO HARDWARE (adaptadas do codigo original)
// ===========================================================

void atualizarVisor(String linha1, String linha2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linha1);
  lcd.setCursor(0, 1);
  lcd.print(linha2);
}

String obterHoraAtual() {
  char buffer[9];
  sprintf(buffer, "%02d:%02d:00", horas, minutos);
  return String(buffer);
}

String obterProximoRemedio() {
  if (!doseEntregue[0] && horas < horariosGaveta[0]) return "PROX: A as 08:00";
  if (!doseEntregue[1] && horas < horariosGaveta[1]) return "PROX: B as 14:00";
  if (!doseEntregue[2] && horas < horariosGaveta[2]) return "PROX: C as 20:00";
  return "PROX: A as 08:00";
}

long medirDistancia(int indiceGaveta) {
  digitalWrite(pinosTrig[indiceGaveta], LOW);
  delayMicroseconds(2);
  digitalWrite(pinosTrig[indiceGaveta], HIGH);
  delayMicroseconds(10);
  digitalWrite(pinosTrig[indiceGaveta], LOW);

  long duracao = pulseIn(pinosEcho[indiceGaveta], HIGH, 30000);
  if (duracao == 0) return 999;
  return duracao * 0.034 / 2;
}

void tocarAvisoAgradavel() {
  for (int i = 0; i < 3; i++) {
    tone(pinoBuzzer, 2500); delay(100);
    tone(pinoBuzzer, 3000); delay(100);
    noTone(pinoBuzzer);     delay(100);
  }
}

void tocarAlertaErro() {
  for (int i = 0; i < 5; i++) {
    tone(pinoBuzzer, 2000); delay(200);
    noTone(pinoBuzzer);     delay(50);
  }
}

void liberarRemedio(int numeroGaveta, const char* nome) {
  interagindoComGaveta = true;
  int indice = numeroGaveta - 1;

  atualizarVisor("HORA: " + obterHoraAtual(), "ABRINDO: " + String(nome));
  delay(1500);

  atualizarVisor("GAVETA " + String(numeroGaveta), "PODE PUXAR!");
  digitalWrite(leds[indice], HIGH);
  servos[indice].write(90);

  // Publicar evento: alerta emitido
  publicarEvento("alerta_emitido", numeroGaveta);
  tocarAvisoAgradavel();

  bool gavetaFoiAberta = false;

  // Aguarda ate 10 segundos para a pessoa puxar a gaveta
  for (int i = 0; i < 100; i++) {
    long distanciaAtual = medirDistancia(indice);
    if (distanciaAtual > limiteAbertura) {
      gavetaFoiAberta = true;
      break;
    }
    delay(100);
  }

  if (gavetaFoiAberta) {
    // Publicar evento: gaveta aberta
    publicarEvento("gaveta_aberta", numeroGaveta);

    atualizarVisor("MEDICACAO OK", "FECHE A GAVETA");

    bool gavetaFoiFechada = false;

    for (int i = 0; i < 100; i++) {
      long d = medirDistancia(indice);
      if (d > 0 && d <= limiteAbertura) {
        gavetaFoiFechada = true;
        break;
      }
      delay(100);
    }

    if (!gavetaFoiFechada) {
      atualizarVisor("ALERTA CRITICO!", "GAVETA ABERTA!");
      while (medirDistancia(indice) > limiteAbertura) {
        tone(pinoBuzzer, 800); delay(300);
        noTone(pinoBuzzer);    delay(300);
        mqtt.loop();  // Manter MQTT vivo durante espera
      }
    }

    // Publicar evento: medicamento retirado
    publicarEvento("medicamento_retirado", numeroGaveta);

    for (int s = 8; s > 0; s--) {
      atualizarVisor("GAVETA FECHADA", "TRANCA EM: " + String(s) + "s");
      delay(1000);
    }

  } else {
    // Publicar evento: dose perdida
    publicarEvento("dose_perdida", numeroGaveta);

    atualizarVisor("ALERTA CRITICO!", "DOSE PERDIDA");
    tocarAlertaErro();
    delay(3000);
  }

  servos[indice].write(0);
  digitalWrite(leds[indice], LOW);
  atualizarVisor("SISTEMA", "TRANCADO");
  delay(1500);

  interagindoComGaveta = false;
  anteriorMillis = millis();
}

// Relogio simulado (modo apresentacao — igual ao original)
void processarRelogio() {
  if (interagindoComGaveta) return;

  unsigned long atualMillis = millis();

  if (atualMillis - anteriorMillis >= 100) {
    anteriorMillis = atualMillis;
    minutos += 3;

    if (minutos >= 60) {
      minutos = minutos % 60;
      horas++;
    }

    if (horas >= 24) {
      horas = 0;
      doseEntregue[0] = false;
      doseEntregue[1] = false;
      doseEntregue[2] = false;
    }
  }
}

// ===========================================================
// SETUP
// ===========================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== PillGator ESP32 v5.0 ===");

  // LCD
  lcd.init();
  lcd.backlight();
  atualizarVisor("PillGator v5.0", "Iniciando...");
  delay(1500);

  // Servos
  for (int i = 0; i < 3; i++) {
    servos[i].attach(pinosServo[i]);
    servos[i].write(0);
  }

  // Pinos
  for (int i = 0; i < 3; i++) {
    pinMode(leds[i], OUTPUT);
    pinMode(pinosTrig[i], OUTPUT);
    pinMode(pinosEcho[i], INPUT);
  }
  pinMode(pinoBuzzer, OUTPUT);

  // WiFi
  conectarWiFi();

  // NTP (relogio real)
  if (WiFi.status() == WL_CONNECTED) {
    sincronizarRelogio();
  }

  // MQTT
  espClient.setInsecure();  // Aceita qualquer certificado TLS (ok para projeto academico)
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(callbackMqtt);
  mqtt.setBufferSize(512);
  conectarMQTT();

  atualizarVisor("PillGator v5.0", "Pronto!");
  delay(1500);
}

// ===========================================================
// LOOP
// ===========================================================

void loop() {
  // Manter conexoes
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  if (!mqtt.connected()) {
    static unsigned long ultimaTentativaMqtt = 0;
    if (millis() - ultimaTentativaMqtt > 5000) {
      conectarMQTT();
      ultimaTentativaMqtt = millis();
    }
  }

  mqtt.loop();  // Processar mensagens MQTT recebidas

  // Heartbeat a cada 60 segundos
  if (millis() - ultimoHeartbeat > INTERVALO_HEARTBEAT) {
    publicarHeartbeat();
    ultimoHeartbeat = millis();
  }

  // Relogio simulado (modo apresentacao)
  processarRelogio();

  // Atualizar display
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 200) {
    if (!interagindoComGaveta) {
      String statusMqtt = mqtt.connected() ? " [M]" : " [X]";
      atualizarVisor("HR:" + obterHoraAtual() + statusMqtt, obterProximoRemedio());
    }
    lastUpdate = millis();
  }

  // Verificar horarios das gavetas
  for (int i = 0; i < 3; i++) {
    if (horas >= horariosGaveta[i] && !doseEntregue[i]) {
      liberarRemedio(i + 1, nomesRemedio[i]);
      doseEntregue[i] = true;
    }
  }
}
