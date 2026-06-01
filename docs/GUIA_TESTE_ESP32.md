# Guia de Teste — ESP32 + MQTT + Backend

Este guia ensina como testar se o ESP32 esta se comunicando com o backend na nuvem.

## Pre-requisitos

- Arduino IDE instalada
- Placa ESP32 conectada via USB
- Backend rodando no Railway (GET /health respondendo)
- HiveMQ Cloud com credenciais criadas

## 1. Configurar Arduino IDE para ESP32

### 1.1 Instalar suporte ao ESP32

1. Abra a Arduino IDE
2. Va em **Arquivo > Preferencias**
3. Em **URLs Adicionais de Gerenciador de Placas**, adicione:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. Va em **Ferramentas > Placa > Gerenciador de Placas**
5. Pesquise `esp32` e instale **"esp32 by Espressif Systems"**
6. Selecione a placa: **Ferramentas > Placa > ESP32 Dev Module**

### 1.2 Instalar bibliotecas

Va em **Ferramentas > Gerenciar Bibliotecas** e instale:

| Biblioteca | Para que serve |
|------------|---------------|
| `ESP32Servo` | Controlar servos no ESP32 |
| `PubSubClient` | Cliente MQTT |
| `LiquidCrystal I2C` | Display LCD |
| `ArduinoJson` | Montar/parsear JSON |

### 1.3 Preencher credenciais no codigo

Abra `iot/cod hardware/codigo_esp32.ino` e preencha:

```cpp
const char* WIFI_SSID     = "NOME_DA_SUA_REDE";
const char* WIFI_PASSWORD = "SENHA_DA_SUA_REDE";

const char* MQTT_HOST     = "SEU_CLUSTER.s1.eu.hivemq.cloud";
const int   MQTT_PORT     = 8883;
const char* MQTT_USER     = "pillgator-esp32";
const char* MQTT_PASSWORD = "SUA_SENHA_MQTT";

const char* DEVICE_ID     = "PILL-001";
```

### 1.4 Ajustar pinos

Se a montagem dos seus componentes usa pinos diferentes, ajuste:

```cpp
const int pinosServo[] = {13, 12, 14};
const int leds[]       = {27, 26, 25};
const int pinoBuzzer   = 33;
const int pinosTrig[]  = {32, 35, 34};
const int pinosEcho[]  = {39, 36, 15};
```

### 1.5 Upload

1. Conecte o ESP32 via USB
2. Selecione a porta: **Ferramentas > Porta > COMx**
3. Clique em **Upload** (seta para a direita)
4. Abra o **Monitor Serial** (lupa no canto superior direito)
5. Configure baud rate: **115200**

## 2. Verificar no Monitor Serial

Apos o upload, o Monitor Serial deve mostrar:

```
=== PillGator ESP32 v5.0 ===
WiFi: conectando a NOME_DA_SUA_REDE... OK! IP: 192.168.1.xxx
NTP: sincronizando... OK! Hora: 14:30
MQTT: conectando... OK!
MQTT: inscrito em pillgator/PILL-001/comando/#
MQTT: heartbeat enviado
```

### Problemas comuns

| Mensagem | Causa | Solucao |
|----------|-------|---------|
| `WiFi: conectando... FALHOU!` | SSID ou senha errada | Confira WIFI_SSID e WIFI_PASSWORD |
| `MQTT: FALHOU! Codigo: -2` | Host MQTT errado | Confira MQTT_HOST (sem mqtts://, sem porta) |
| `MQTT: FALHOU! Codigo: -4` | Usuario/senha MQTT errada | Confira MQTT_USER e MQTT_PASSWORD no HiveMQ |
| `MQTT: FALHOU! Codigo: 5` | Nao autorizado | Verifique permissoes do usuario no HiveMQ |

## 3. Verificar se o Backend esta Recebendo

### Opcao A: Ver nos logs do Railway

1. Abra o Railway (railway.app)
2. Clique no servico do backend
3. Va na aba **Logs**
4. Quando o ESP32 enviar heartbeat, deve aparecer:
   ```
   MQTT: heartbeat atualizado para PILL-001
   ```
5. Quando uma gaveta abrir, deve aparecer:
   ```
   MQTT: evento compartimento_aberto salvo para dispositivo PILL-001
   ```

### Opcao B: Consultar o banco pelo Swagger

1. Acesse `https://SUA-URL-RAILWAY/docs`
2. Use a rota `GET /eventos` para ver os eventos salvos
3. Filtre por dispositivo para ver eventos do `PILL-001`

## 4. Testar SEM o ESP32 (Simulador)

Se o ESP32 nao estiver disponivel, voce pode simular eventos usando qualquer cliente MQTT.

### 4.1 Usando MQTT Explorer (interface grafica)

1. Baixe: https://mqtt-explorer.com/
2. Conecte ao HiveMQ Cloud:
   - Host: `SEU_CLUSTER.s1.eu.hivemq.cloud`
   - Port: `8883`
   - Username: `pillgator-esp32`
   - Password: sua senha
   - Marque **Encryption (tls)**
3. Publique uma mensagem de teste:
   - Topic: `pillgator/PILL-001/evento/gaveta_aberta`
   - Payload:
     ```json
     {
       "dispositivoId": "PILL-001",
       "compartimento": 1,
       "tipo": "gaveta_aberta",
       "timestamp": "2026-05-19T14:00:00-03:00",
       "msgId": "teste-001"
     }
     ```
4. Verifique nos logs do Railway se apareceu o evento

### 4.2 Usando mosquitto_pub (linha de comando)

```bash
mosquitto_pub \
  -h SEU_CLUSTER.s1.eu.hivemq.cloud \
  -p 8883 \
  --capath /etc/ssl/certs/ \
  -u pillgator-esp32 \
  -P SUA_SENHA \
  -t "pillgator/PILL-001/evento/gaveta_aberta" \
  -m '{"dispositivoId":"PILL-001","compartimento":1,"tipo":"gaveta_aberta","timestamp":"2026-05-19T14:00:00-03:00","msgId":"teste-002"}'
```

## 5. Testar Comando do Backend para o ESP32

Para testar se o ESP32 recebe comandos, publique pelo MQTT Explorer:

- Topic: `pillgator/PILL-001/comando/liberar`
- Payload:
  ```json
  {
    "compartimento": 1,
    "acao": "liberar",
    "medicamentoNome": "Dipirona 500mg"
  }
  ```

No Monitor Serial do ESP32 deve aparecer:

```
MQTT recebido: pillgator/PILL-001/comando/liberar
  Payload: {"compartimento":1,"acao":"liberar","medicamentoNome":"Dipirona 500mg"}
  Comando: liberar gaveta 1
```

E a gaveta 1 deve abrir fisicamente.

## 6. Checklist de Teste

- [ ] ESP32 conecta no WiFi (IP aparece no Serial Monitor)
- [ ] ESP32 conecta no MQTT (mensagem "OK!" no Serial Monitor)
- [ ] Heartbeat aparece nos logs do Railway a cada 60s
- [ ] Gaveta abre e evento `gaveta_aberta` aparece nos logs do Railway
- [ ] Medicamento retirado e evento `medicamento_retirado` aparece
- [ ] Dose perdida (nao retirou) e evento `dose_perdida` aparece
- [ ] Comando `liberar` enviado pelo MQTT Explorer abre a gaveta no ESP32
- [ ] Display mostra `[M]` quando MQTT conectado, `[X]` quando offline

## Indicador no Display

O display do ESP32 mostra o status da conexao MQTT no canto:

```
HR:14:30:00 [M]      <- [M] = MQTT conectado
PROX: B as 14:00

HR:14:30:00 [X]      <- [X] = MQTT offline
PROX: B as 14:00
```
