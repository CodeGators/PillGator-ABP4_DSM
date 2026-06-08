// ===========================================================
// PillGator ESP32 v6.0 — Modo Comando (PIR Unico)
// ===========================================================
// O ESP32 AGUARDA comandos do backend via MQTT para abrir gavetas.
// Hardware: servos invertidos (180=fechado, 90=aberto), PIR unico.
//
// Fluxo:
//   1. Backend verifica agendamentos a cada 60s
//   2. Backend publica: pillgator/PILL-001/comando/liberar
//   3. ESP32 recebe e abre a gaveta
//   4. ESP32 publica eventos de volta (gaveta_aberta, etc)
//
// Bibliotecas (Arduino IDE > Gerenciar Bibliotecas):
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

// Identificador unico (deve bater com o cadastro no backend)
const char* DEVICE_ID     = "PILL-001";

// ===========================================================
// CONFIGURACOES DOS SERVOS (invertidos)
// ===========================================================

const int ANGULO_FECHADO = 180;
const int ANGULO_ABERTO  = 90;

// ===========================================================
// MAPEAMENTO DE PINOS ESP32
// ===========================================================

const int pinosServo[] = {13, 12, 14};
const int leds[]       = {27, 26, 25};
const int pinoBuzzer   = 33;
const int pinoPir      = 4;  // PIR unico para deteccao de mao
// I2C (LCD): SDA = 21, SCL = 22

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
bool interagindoComGaveta = false;

// MQTT
unsigned long ultimoHeartbeat = 0;
const unsigned long INTERVALO_HEARTBEAT = 60000;
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
  Serial.println(ok ? ("MQTT pub -> " + String(tipo)) : ("MQTT FALHA -> " + String(tipo)));
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
// HARDWARE — LCD, BUZZER
// ===========================================================

void atualizarVisor(String linha1, String linha2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linha1);
  lcd.setCursor(0, 1);
  lcd.print(linha2);
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
// LOGICA DA GAVETA — PIR unico (chamada por comando MQTT)
// ===========================================================

void liberarGaveta(int numeroGaveta, const char* nomeMedicamento) {
  if (numeroGaveta < 1 || numeroGaveta > NUM_GAVETAS) {
    Serial.println("ERRO: gaveta invalida: " + String(numeroGaveta));
    return;
  }

  interagindoComGaveta = true;
  int indice = numeroGaveta - 1;
  statusGavetas[indice] = "liberado";

  // Aviso sonoro imediato
  tocarAvisoAgradavel();

  atualizarVisor("HORA DO REMEDIO", String(nomeMedicamento));
  delay(1500);

  // ==========================================
  // 1a DETECCAO: ESPERA A MAO PARA ABRIR
  // ==========================================
  atualizarVisor("APROXIME A MAO", "PARA ABRIR");
  bool primeiraDeteccao = false;

  for (int i = 0; i < 100; i++) {
    if (digitalRead(pinoPir) == HIGH) {
      primeiraDeteccao = true;
      break;
    }
    delay(100);
  }

  // CASO NAO DETECTE: DOSE PERDIDA
  if (!primeiraDeteccao) {
    publicarEvento("dose_perdida", numeroGaveta);
    statusGavetas[indice] = "bloqueado";
    atualizarVisor("ALERTA CRITICO!", "DOSE PERDIDA");
    tocarAlertaErro();
    delay(3000);
    interagindoComGaveta = false;
    return;
  }

  // SE DETECTOU: ABRE A GAVETA
  statusGavetas[indice] = "aberto";
  atualizarVisor("GAVETA " + String(numeroGaveta), "ABERTA!");
  digitalWrite(leds[indice], HIGH);
  servos[indice].write(ANGULO_ABERTO);
  publicarEvento("gaveta_aberta", numeroGaveta);
  tocarAvisoAgradavel();

  // Espera PIR voltar a LOW
  delay(500);
  while (digitalRead(pinoPir) == HIGH) {
    delay(100);
  }

  // ==========================================
  // 2a DETECCAO: ESPERA A MAO PARA FECHAR
  // ==========================================
  atualizarVisor("RETIRE O REMEDIO", "PASSE A MAO P/ FCH");

  unsigned long tempoInicioEspera = millis();
  const unsigned long TEMPO_LIMITE_ABERTA = 30000; // 30 segundos

  while (digitalRead(pinoPir) == LOW) {
    delay(100);
    mqtt.loop();  // Manter conexao viva

    // Alerta se gaveta ficou aberta tempo demais
    if (millis() - tempoInicioEspera >= TEMPO_LIMITE_ABERTA) {
      publicarEvento("alerta_gaveta_aberta", numeroGaveta);
      atualizarVisor("ALERTA GAVETA!", "AINDA ABERTA");
      tocarAlertaErro();
      atualizarVisor("RETIRE O REMEDIO", "PASSE A MAO P/ FCH");
      tempoInicioEspera = millis();  // Reseta para alertar novamente
    }
  }

  // ==========================================
  // DETECTOU MAO: INICIA FECHAMENTO
  // ==========================================
  publicarEvento("medicamento_retirado", numeroGaveta);

  // Contagem regressiva antes de trancar
  for (int s = 35; s > 0; s--) {
    atualizarVisor("FECHANDO...", "TRANCA EM: " + String(s) + "s");
    delay(1000);
  }

  // Trancar
  servos[indice].write(ANGULO_FECHADO);
  digitalWrite(leds[indice], LOW);
  statusGavetas[indice] = "bloqueado";

  atualizarVisor("SISTEMA", "TRANCADO");
  delay(1500);

  interagindoComGaveta = false;
}

void bloquearGaveta(int numeroGaveta) {
  if (numeroGaveta < 1 || numeroGaveta > NUM_GAVETAS) return;

  int indice = numeroGaveta - 1;
  servos[indice].write(ANGULO_FECHADO);
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
  if (deserializeJson(doc, msg)) {
    Serial.println("  Erro ao parsear JSON");
    return;
  }

  String topicoStr = String(topico);

  if (topicoStr.endsWith("/liberar")) {
    int compartimento = doc["compartimento"] | 0;
    // Usa nome do medicamento se veio no payload, senao generico
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
  } else {
    Serial.println(" FALHOU!");
    atualizarVisor("WiFi FALHOU", "Sem rede");
  }
  delay(1500);
}

void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) return;

  Serial.print("MQTT: conectando...");
  atualizarVisor("Conectando...", "MQTT");

  if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASSWORD)) {
    Serial.println(" OK!");
    atualizarVisor("MQTT OK!", "Conectado");

    String topicoComando = String("pillgator/") + DEVICE_ID + "/comando/#";
    mqtt.subscribe(topicoComando.c_str());
    Serial.println("MQTT: inscrito em " + topicoComando);
  } else {
    Serial.println(" FALHOU! Codigo: " + String(mqtt.state()));
    atualizarVisor("MQTT FALHOU", "Cod: " + String(mqtt.state()));
  }
  delay(1500);
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
  Serial.println("\n=== PillGator ESP32 v6.0 (Modo Comando + PIR) ===");

  lcd.init();
  lcd.backlight();
  atualizarVisor("PillGator v6.0", "Iniciando...");
  delay(1500);

  // Servos na posicao fechada (180 graus)
  for (int i = 0; i < NUM_GAVETAS; i++) {
    servos[i].attach(pinosServo[i]);
    servos[i].write(ANGULO_FECHADO);
  }

  // Pinos
  for (int i = 0; i < NUM_GAVETAS; i++) {
    pinMode(leds[i], OUTPUT);
  }
  pinMode(pinoPir, INPUT);
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

  // Processar mensagens MQTT
  mqtt.loop();

  // Heartbeat a cada 60s
  if (millis() - ultimoHeartbeat > INTERVALO_HEARTBEAT) {
    publicarHeartbeat();
    ultimoHeartbeat = millis();
  }

  // Atualizar display
  static unsigned long ultimoDisplay = 0;
  if (!interagindoComGaveta && millis() - ultimoDisplay > 1000) {
    String statusMqtt = mqtt.connected() ? "[M]" : "[X]";
    String hora = obterHoraFormatada();
    atualizarVisor(hora + " " + statusMqtt, "Aguardando cmd...");
    ultimoDisplay = millis();
  }
}
