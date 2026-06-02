// ===========================================================
// PillGator ESP32 v6.0 — Modo Comando (sem relogio interno)
// ===========================================================
// O ESP32 NAO decide sozinho quando abrir a gaveta.
// Ele AGUARDA comandos do backend via MQTT.
//
// Fluxo:
//   1. Backend verifica agendamentos a cada 60s
//   2. Backend publica: pillgator/PILL-001/comando/liberar
//   3. ESP32 recebe e abre a gaveta
//   4. ESP32 publica eventos de volta (gaveta_aberta, etc)
//
// Bibliotecas necessarias (Arduino IDE > Gerenciar Bibliotecas):
//   - ESP32Servo
//   - PubSubClient
//   - LiquidCrystal_I2C
//   - ArduinoJson
//
// Placa: ESP32 Dev Module
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
const char* MQTT_HOST     = "SEU_CLUSTER.s1.eu.hivemq.cloud";
const int   MQTT_PORT     = 8883;
const char* MQTT_USER     = "pillgator-esp32";
const char* MQTT_PASSWORD = "SUA_SENHA_MQTT";

// Identificador unico deste dispositivo (deve bater com o cadastro no backend)
const char* DEVICE_ID     = "PILL-001";

// ===========================================================
// MAPEAMENTO DE PINOS ESP32
// ===========================================================

const int pinosServo[] = {13, 12, 14};
const int leds[]       = {27, 26, 25};
const int pinoBuzzer   = 33;
const int pinosTrig[]  = {32, 35, 34};
const int pinosEcho[]  = {39, 36, 15};
// I2C (LCD): SDA = 21, SCL = 22 (padrao ESP32)

// ===========================================================
// OBJETOS GLOBAIS
// ===========================================================

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo servos[3];

WiFiClientSecure espClient;
PubSubClient mqtt(espClient);

// ===========================================================
// VARIAVEIS
// ===========================================================

const int NUM_GAVETAS = 3;
const int limiteAbertura = 10;  // cm

bool interagindoComGaveta = false;

// MQTT
unsigned long ultimoHeartbeat = 0;
const unsigned long INTERVALO_HEARTBEAT = 60000;

// msgId
unsigned long contadorMsg = 0;

// Status das gavetas
String statusGavetas[3] = {"bloqueado", "bloqueado", "bloqueado"};

// ===========================================================
// FUNCOES AUXILIARES
// ===========================================================

String gerarMsgId() {
  contadorMsg++;
  return String(DEVICE_ID) + "-" + String(millis()) + "-" + String(contadorMsg);
}

String obterTimestamp() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char ts[30];
    strftime(ts, sizeof(ts), "%Y-%m-%dT%H:%M:%S-03:00", &timeinfo);
    return String(ts);
  }
  return String(millis());
}

String obterHoraFormatada() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char buffer[6];
    strftime(buffer, sizeof(buffer), "%H:%M", &timeinfo);
    return String(buffer);
  }
  return "--:--";
}

// ===========================================================
// MQTT — PUBLICAR
// ===========================================================

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
  doc["timestamp"] = obterTimestamp();

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));

  String topico = String("pillgator/") + DEVICE_ID + "/evento/" + tipo;
  bool ok = mqtt.publish(topico.c_str(), payload, false);

  Serial.println(ok ? ("MQTT pub -> " + topico) : ("MQTT FALHA -> " + topico));
}

void publicarHeartbeat() {
  if (!mqtt.connected()) return;

  JsonDocument doc;
  doc["dispositivoId"] = DEVICE_ID;
  doc["uptimeSegundos"] = millis() / 1000;

  JsonArray gavetas = doc["gavetas"].to<JsonArray>();
  for (int i = 0; i < NUM_GAVETAS; i++) {
    JsonObject g = gavetas.add<JsonObject>();
    g["numero"] = i + 1;
    g["status"] = statusGavetas[i];
  }
  doc["timestamp"] = obterTimestamp();

  char payload[512];
  serializeJson(doc, payload, sizeof(payload));

  String topico = String("pillgator/") + DEVICE_ID + "/status/heartbeat";
  mqtt.publish(topico.c_str(), payload, false);
  Serial.println("MQTT: heartbeat enviado");
}

// ===========================================================
// HARDWARE — LCD, SENSOR, BUZZER, SERVO
// ===========================================================

void atualizarVisor(String linha1, String linha2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linha1);
  lcd.setCursor(0, 1);
  lcd.print(linha2);
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

// ===========================================================
// LOGICA DA GAVETA (chamada quando recebe comando MQTT)
// ===========================================================

void liberarGaveta(int numeroGaveta, const char* nomeMedicamento) {
  if (numeroGaveta < 1 || numeroGaveta > NUM_GAVETAS) {
    Serial.println("ERRO: gaveta invalida: " + String(numeroGaveta));
    return;
  }

  interagindoComGaveta = true;
  int indice = numeroGaveta - 1;
  statusGavetas[indice] = "liberado";

  atualizarVisor("HORA DO REMEDIO", String(nomeMedicamento));
  delay(1500);

  atualizarVisor("GAVETA " + String(numeroGaveta), "PODE PUXAR!");
  digitalWrite(leds[indice], HIGH);
  servos[indice].write(90);

  publicarEvento("alerta_emitido", numeroGaveta);
  tocarAvisoAgradavel();

  // Aguarda ate 10 segundos para puxar
  bool gavetaFoiAberta = false;
  for (int i = 0; i < 100; i++) {
    if (medirDistancia(indice) > limiteAbertura) {
      gavetaFoiAberta = true;
      break;
    }
    delay(100);
  }

  if (gavetaFoiAberta) {
    statusGavetas[indice] = "aberto";
    publicarEvento("gaveta_aberta", numeroGaveta);
    atualizarVisor("MEDICACAO OK", "FECHE A GAVETA");

    // Aguarda ate 10 segundos para fechar
    bool gavetaFoiFechada = false;
    for (int i = 0; i < 100; i++) {
      long d = medirDistancia(indice);
      if (d > 0 && d <= limiteAbertura) {
        gavetaFoiFechada = true;
        break;
      }
      delay(100);
    }

    // Alerta infinito se nao fechou
    if (!gavetaFoiFechada) {
      atualizarVisor("ALERTA CRITICO!", "GAVETA ABERTA!");
      while (medirDistancia(indice) > limiteAbertura) {
        tone(pinoBuzzer, 800); delay(300);
        noTone(pinoBuzzer);    delay(300);
        mqtt.loop();
      }
    }

    publicarEvento("medicamento_retirado", numeroGaveta);

    // Contagem regressiva para trancar
    for (int s = 8; s > 0; s--) {
      atualizarVisor("GAVETA FECHADA", "TRANCA EM: " + String(s) + "s");
      delay(1000);
    }
  } else {
    // Ninguem puxou — dose perdida
    publicarEvento("dose_perdida", numeroGaveta);
    atualizarVisor("ALERTA CRITICO!", "DOSE PERDIDA");
    tocarAlertaErro();
    delay(3000);
  }

  // Trancar
  servos[indice].write(0);
  digitalWrite(leds[indice], LOW);
  statusGavetas[indice] = "bloqueado";

  atualizarVisor("SISTEMA", "TRANCADO");
  delay(1500);

  interagindoComGaveta = false;
}

void bloquearGaveta(int numeroGaveta) {
  if (numeroGaveta < 1 || numeroGaveta > NUM_GAVETAS) return;

  int indice = numeroGaveta - 1;
  servos[indice].write(0);
  digitalWrite(leds[indice], LOW);
  statusGavetas[indice] = "bloqueado";
  Serial.println("Gaveta " + String(numeroGaveta) + " bloqueada por comando");
}

// ===========================================================
// MQTT — RECEBER COMANDOS
// ===========================================================

void callbackMqtt(char* topico, byte* payload, unsigned int length) {
  char msg[256];
  int len = min((unsigned int)255, length);
  memcpy(msg, payload, len);
  msg[len] = '\0';

  Serial.println("MQTT recebido: " + String(topico));
  Serial.println("  Payload: " + String(msg));

  JsonDocument doc;
  DeserializationError erro = deserializeJson(doc, msg);
  if (erro) {
    Serial.println("  Erro ao parsear JSON");
    return;
  }

  String topicoStr = String(topico);

  if (topicoStr.endsWith("/liberar")) {
    int compartimento = doc["compartimento"] | 0;
    const char* nomeMed = doc["medicamentoNome"] | "Medicamento";

    if (compartimento >= 1 && compartimento <= NUM_GAVETAS) {
      Serial.println("  >> COMANDO: liberar gaveta " + String(compartimento));
      liberarGaveta(compartimento, nomeMed);
    }
  } else if (topicoStr.endsWith("/bloquear")) {
    int compartimento = doc["compartimento"] | 0;

    if (compartimento >= 1 && compartimento <= NUM_GAVETAS) {
      Serial.println("  >> COMANDO: bloquear gaveta " + String(compartimento));
      bloquearGaveta(compartimento);
    }
  } else if (topicoStr.endsWith("/sincronizar")) {
    Serial.println("  >> COMANDO: sincronizar (futuro)");
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
    atualizarVisor("WiFi FALHOU", "Sem rede");
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
    atualizarVisor("MQTT OK!", "Conectado");
    delay(1000);

    // Inscrever nos topicos de comando
    String topicoComando = String("pillgator/") + DEVICE_ID + "/comando/#";
    mqtt.subscribe(topicoComando.c_str());
    Serial.println("MQTT: inscrito em " + topicoComando);
  } else {
    Serial.println(" FALHOU! Codigo: " + String(mqtt.state()));
    atualizarVisor("MQTT FALHOU", "Cod: " + String(mqtt.state()));
    delay(2000);
  }
}

void sincronizarRelogio() {
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
    Serial.printf(" OK! %02d:%02d\n", timeinfo.tm_hour, timeinfo.tm_min);
  } else {
    Serial.println(" FALHOU!");
  }
}

// ===========================================================
// SETUP
// ===========================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== PillGator ESP32 v6.0 (Modo Comando) ===");

  lcd.init();
  lcd.backlight();
  atualizarVisor("PillGator v6.0", "Iniciando...");
  delay(1500);

  // Servos
  for (int i = 0; i < NUM_GAVETAS; i++) {
    servos[i].attach(pinosServo[i]);
    servos[i].write(0);
  }

  // Pinos
  for (int i = 0; i < NUM_GAVETAS; i++) {
    pinMode(leds[i], OUTPUT);
    pinMode(pinosTrig[i], OUTPUT);
    pinMode(pinosEcho[i], INPUT);
  }
  pinMode(pinoBuzzer, OUTPUT);

  // Conexoes
  conectarWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    sincronizarRelogio();
  }

  espClient.setInsecure();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(callbackMqtt);
  mqtt.setBufferSize(512);
  conectarMQTT();

  atualizarVisor("PillGator v6.0", "Aguardando...");
  delay(1000);
}

// ===========================================================
// LOOP — Apenas escuta comandos e envia heartbeat
// ===========================================================

void loop() {
  // Reconectar se necessario
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  if (!mqtt.connected()) {
    static unsigned long ultimaTentativa = 0;
    if (millis() - ultimaTentativa > 5000) {
      conectarMQTT();
      ultimaTentativa = millis();
    }
  }

  // Processar mensagens MQTT recebidas
  mqtt.loop();

  // Heartbeat a cada 60s
  if (millis() - ultimoHeartbeat > INTERVALO_HEARTBEAT) {
    publicarHeartbeat();
    ultimoHeartbeat = millis();
  }

  // Atualizar display (quando nao esta interagindo com gaveta)
  static unsigned long ultimoDisplay = 0;
  if (!interagindoComGaveta && millis() - ultimoDisplay > 1000) {
    String statusMqtt = mqtt.connected() ? "[M]" : "[X]";
    String hora = obterHoraFormatada();
    atualizarVisor(hora + " " + statusMqtt, "Aguardando cmd...");
    ultimoDisplay = millis();
  }
}
