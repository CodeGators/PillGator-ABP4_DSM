// ===========================================================
// PillGator ESP32 — Firmware com WiFi + MQTT + Gavetas (PIR Único)
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
const char* WIFI_SSID     = "Bora Bill";
const char* WIFI_PASSWORD = "biruleibe69";

// MQTT (HiveMQ Cloud)
const char* MQTT_HOST     = "SEU_CLUSTER.s1.eu.hivemq.cloud"; 
const int   MQTT_PORT     = 8883;
const char* MQTT_USER     = "pillgator-esp32";
const char* MQTT_PASSWORD = "SUA_SENHA_MQTT";
const char* DEVICE_ID     = "PILL-001";

// ===========================================================
// CONFIGURAÇÕES DOS SERVOS (PARA INVERTER O GIRO)
// ===========================================================
// Para girar para o lado oposto, o fechado passa a ser 180 e o aberto 90 (ou 0)
const int ANGULO_FECHADO = 180; 
const int ANGULO_ABERTO  = 90;  

// ===========================================================
// MAPEAMENTO DE PINOS ESP32
// ===========================================================

const int pinosServo[] = {13, 12, 14};       
const int leds[]       = {27, 26, 25};       
const int pinoBuzzer   = 33;
const int pinoPir      = 4;                  
// I2C (LCD): SDA = 21, SCL = 22

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

bool interagindoComGaveta = false;
unsigned long anteriorMillis = 0;
int horas = 7, minutos = 45;

bool doseEntregue[3] = {false, false, false};
int horariosGaveta[3] = {8, 14, 20};
const char* nomesRemedio[3] = {"REMEDIO A", "REMEDIO B", "REMEDIO C"};

// MQTT
unsigned long ultimoHeartbeat = 0;
const unsigned long INTERVALO_HEARTBEAT = 60000;
bool mqttConectado = false;
unsigned long contadorMsg = 0;

// ===========================================================
// FUNCOES MQTT
// ===========================================================

String gerarMsgId() {
  contadorMsg++;
  return String(DEVICE_ID) + "-" + String(millis()) + "-" + String(contadorMsg);
}

String montarTopico(const char* categoria, const char* tipo) {
  return String("pillgator/") + DEVICE_ID + "/" + categoria + "/" + tipo;
}

void publicarEvento(const char* tipo, int compartimento) {
  if (!mqtt.connected()) return;

  JsonDocument doc;
  doc["dispositivoId"] = DEVICE_ID;
  doc["compartimento"] = compartimento;
  doc["tipo"] = tipo;
  doc["msgId"] = gerarMsgId();

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
  mqtt.publish(topico.c_str(), payload, false);
}

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
}

void callbackMqtt(char* topico, byte* payload, unsigned int length) {
  char msg[256];
  int len = min((unsigned int)255, length);
  memcpy(msg, payload, len);
  msg[len] = '\0';

  JsonDocument doc;
  if (deserializeJson(doc, msg)) return;

  String topicoStr = String(topico);
  
  if (topicoStr.endsWith("/liberar")) {
    int compartimento = doc["compartimento"] | 0;
    if (compartimento >= 1 && compartimento <= 3) {
      liberarRemedio(compartimento, nomesRemedio[compartimento - 1]);
    }
  } else if (topicoStr.endsWith("/bloquear")) {
    int compartimento = doc["compartimento"] | 0;
    if (compartimento >= 1 && compartimento <= 3) {
      servos[compartimento - 1].write(ANGULO_FECHADO);
      digitalWrite(leds[compartimento - 1], LOW);
    }
  }
}

// ===========================================================
// CONEXOES
// ===========================================================

void conectarWiFi() {
  atualizarVisor("Conectando...", "WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    tentativas++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    atualizarVisor("WiFi OK!", WiFi.localIP().toString());
  } else {
    atualizarVisor("WiFi FALHOU", "Modo offline");
  }
  delay(1500);
}

void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) return;
  atualizarVisor("Conectando...", "MQTT");

  if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASSWORD)) {
    atualizarVisor("MQTT OK!", "Conectado");
    String topicoComando = String("pillgator/") + DEVICE_ID + "/comando/#";
    mqtt.subscribe(topicoComando.c_str());
  } else {
    atualizarVisor("MQTT FALHOU", "Cod: " + String(mqtt.state()));
  }
  delay(1500);
}

void sincronizarRelogio() {
  configTime(-3 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeinfo;
  int tentativas = 0;
  while (!getLocalTime(&timeinfo) && tentativas < 10) {
    delay(500);
    tentativas++;
  }
  if (getLocalTime(&timeinfo)) {
    horas = timeinfo.tm_hour;
    minutos = timeinfo.tm_min;
  }
}

// ===========================================================
// FUNCOES DO HARDWARE
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

  // Emite o aviso sonoro imediatamente quando dá o horário configurado
  tocarAvisoAgradavel();

  atualizarVisor("HORA DO REMEDIO", String(nome));
  delay(1500);

  bool primeiraDeteccao = false;
  atualizarVisor("APROXIME A MAO", "PARA ABRIR");

  // ==========================================
  // 1ª DETECÇÃO: ESPERA A MÃO PARA ABRIR
  // ==========================================
  for (int i = 0; i < 100; i++) { 
    if (digitalRead(pinoPir) == HIGH) {
      primeiraDeteccao = true;
      break;
    }
    delay(100);
  }

  // CASO NÃO DETECTE: DOSE PERDIDA
  if (!primeiraDeteccao) {
    publicarEvento("dose_perdida", numeroGaveta);
    atualizarVisor("ALERTA CRITICO!", "DOSE PERDIDA");
    tocarAlertaErro();
    delay(3000);
    
    interagindoComGaveta = false;
    anteriorMillis = millis();
    return; 
  }

  // SE DETECTOU: GAVETA ABERTA
  atualizarVisor("GAVETA " + String(numeroGaveta), "ABERTA!");
  digitalWrite(leds[indice], HIGH);
  servos[indice].write(ANGULO_ABERTO); // Usa o novo ângulo
  publicarEvento("alerta_emitido", numeroGaveta);
  tocarAvisoAgradavel();

  // Espera o sinal do PIR voltar para LOW antes de procurar o fechamento
  delay(500); 
  while (digitalRead(pinoPir) == HIGH) {
    delay(100); 
  }

  // ==========================================
  // 2ª DETECÇÃO: ESPERA A MÃO PARA FECHAR (COM ALERTA DE ESQUECIMENTO)
  // ==========================================
  atualizarVisor("RETIRE O REMEDIO", "PASSE A MAO P/ FCH");
  
  unsigned long tempoInicioEspera = millis();
  const unsigned long TEMPO_LIMITE_ABERTA = 30000; // 30 segundos (ajuste se precisar)

  // O sistema vai ficar preso aqui até a pessoa passar a mão novamente
  while (digitalRead(pinoPir) == LOW) {
    delay(100);
    mqtt.loop(); // Mantém a conexão com o servidor ativa

    // Verifica se a gaveta ficou aberta tempo demais sem detecção
    if (millis() - tempoInicioEspera >= TEMPO_LIMITE_ABERTA) {
      publicarEvento("alerta_gaveta_aberta", numeroGaveta); // Envia alerta via MQTT
      atualizarVisor("ALERTA GAVETA!", "AINDA ABERTA");
      
      tocarAlertaErro(); // Toca o bipe de erro para chamar atenção
      
      // Retorna a mensagem original para a tela
      atualizarVisor("RETIRE O REMEDIO", "PASSE A MAO P/ FCH");
      
      // Reseta o cronômetro para alertar novamente após mais 30 segundos
      tempoInicioEspera = millis();
    }
  }

  // ==========================================
  // SE DETECTOU A MÃO NOVAMENTE: INICIA O FECHAMENTO
  // ==========================================
  publicarEvento("medicamento_retirado", numeroGaveta);
  
  // DELAY MAIOR: Contagem de 8 segundos antes de trancar de fato
  for (int s = 35; s > 0; s--) {
    atualizarVisor("FECHANDO...", "TRANCA EM: " + String(s) + "s");
    delay(1000);
  }

  servos[indice].write(ANGULO_FECHADO); // Tranca usando o novo ângulo oposto
  digitalWrite(leds[indice], LOW);
  atualizarVisor("SISTEMA", "TRANCADO");
  delay(1500);

  interagindoComGaveta = false;
  anteriorMillis = millis();
}

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

  lcd.init();
  lcd.backlight();
  atualizarVisor("PillGator v5.2", "Iniciando...");
  delay(1500);

  // Inicia os servos na nova posição fechada (180 graus)
  for (int i = 0; i < 3; i++) {
    servos[i].attach(pinosServo[i]);
    servos[i].write(ANGULO_FECHADO); 
  }

  for (int i = 0; i < 3; i++) {
    pinMode(leds[i], OUTPUT);
  }
  pinMode(pinoPir, INPUT);
  pinMode(pinoBuzzer, OUTPUT);

  conectarWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    sincronizarRelogio();
  }

  espClient.setInsecure();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(callbackMqtt);
  mqtt.setBufferSize(512);
  conectarMQTT();

  atualizarVisor("PillGator v5.2", "Pronto!");
  delay(1500);
}

// ===========================================================
// LOOP
// ===========================================================

void loop() {
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

  mqtt.loop();

  if (millis() - ultimoHeartbeat > INTERVALO_HEARTBEAT) {
    publicarHeartbeat();
    ultimoHeartbeat = millis();
  }

  processarRelogio();

  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 200) {
    if (!interagindoComGaveta) {
      String statusMqtt = mqtt.connected() ? " [M]" : " [X]";
      atualizarVisor("HR:" + obterHoraAtual() + statusMqtt, obterProximoRemedio());
    }
    lastUpdate = millis();
  }

  for (int i = 0; i < 3; i++) {
    if (horas >= horariosGaveta[i] && !doseEntregue[i]) {
      liberarRemedio(i + 1, nomesRemedio[i]);
      doseEntregue[i] = true;
    }
  }
}
