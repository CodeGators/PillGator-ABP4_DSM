# Infraestrutura em Nuvem — PillGator

Este documento descreve a infraestrutura cloud do PillGator, o protocolo de comunicacao IoT e como cada parte se conecta.

## Visao Geral

```
┌─────────────┐     MQTT (TLS)     ┌──────────────┐     subscribe     ┌─────────────────┐
│   ESP32     │ ──────────────────> │   HiveMQ     │ ───────────────>  │  Backend Node.js│
│  (gaveta)   │ <────────────────── │   Cloud      │ <───────────────  │  (Railway)      │
└─────────────┘     comandos       └──────────────┘     publish       └────────┬────────┘
                                                                               │
                                                                               │ TypeORM
                                                                               │
┌─────────────┐     HTTPS/REST     ┌─────────────────┐                ┌────────▼────────┐
│   Mobile    │ ──────────────────> │  Backend Node.js│                │   PostgreSQL    │
│  (app)      │ <────────────────── │  (Railway)      │                │   (Neon)        │
└─────────────┘                    └─────────────────┘                └─────────────────┘
```

## Servicos em Uso

| Servico | Funcao | URL/Acesso | Plano |
|---------|--------|------------|-------|
| **Neon** | Banco PostgreSQL | Painel: neon.tech | Free |
| **Railway** | Hospedagem backend | Painel: railway.app | Starter (gratis) |
| **HiveMQ Cloud** | Broker MQTT (IoT) | Painel: hivemq.com | Serverless Free |

## Variaveis de Ambiente (Railway)

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3000` |
| `DATABASE_URL` | URL do PostgreSQL (Neon) | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Segredo para tokens JWT | `minha-chave-secreta-longa` |
| `JWT_EXPIRES_IN` | Tempo de expiracao do token | `8h` |
| `MQTT_BROKER_URL` | URL do broker HiveMQ com protocolo | `mqtts://abc123.s1.eu.hivemq.cloud:8883` |
| `MQTT_USERNAME` | Usuario MQTT do backend | `pillgator-backend` |
| `MQTT_PASSWORD` | Senha MQTT do backend | `(senha definida no HiveMQ)` |

Importante: nunca commitar essas variaveis no Git. Elas ficam apenas no painel do Railway.

## Protocolo MQTT — Comunicacao IoT

### O que e MQTT

MQTT e um protocolo de mensagens leve, ideal para IoT. Funciona com pub/sub:

- **Publish**: o dispositivo ou backend envia uma mensagem para um topico.
- **Subscribe**: quem esta inscrito naquele topico recebe a mensagem automaticamente.
- **Broker**: o HiveMQ Cloud e o intermediario que roteia as mensagens.

### Topicos

Todos os topicos seguem o padrao: `pillgator/{DEVICE_ID}/{categoria}/{tipo}`

Onde `{DEVICE_ID}` e o identificador unico do dispositivo (ex: `PILL-001`).

#### Dispositivo -> Backend (ESP32 publica, backend escuta)

| Topico | Quando enviar |
|--------|---------------|
| `pillgator/{ID}/evento/gaveta_aberta` | Sensor detectou que a gaveta foi puxada |
| `pillgator/{ID}/evento/medicamento_retirado` | Medicamento foi retirado com sucesso |
| `pillgator/{ID}/evento/dose_perdida` | Tempo esgotou e o paciente nao retirou |
| `pillgator/{ID}/evento/alerta_emitido` | Buzzer tocou |
| `pillgator/{ID}/evento/erro` | Qualquer falha no hardware |
| `pillgator/{ID}/status/heartbeat` | A cada 60 segundos (sinal de vida) |

#### Backend -> Dispositivo (backend publica, ESP32 escuta)

| Topico | Quando o backend envia |
|--------|------------------------|
| `pillgator/{ID}/comando/liberar` | Hora de liberar um compartimento |
| `pillgator/{ID}/comando/bloquear` | Trancar um compartimento |
| `pillgator/{ID}/comando/sincronizar` | Enviar programacoes atualizadas |

### Payloads JSON

Todos os payloads sao JSON. Exemplos:

#### Evento do dispositivo (ex: gaveta aberta)

```json
{
  "dispositivoId": "PILL-001",
  "compartimento": 1,
  "tipo": "gaveta_aberta",
  "timestamp": "2026-05-18T14:00:05-03:00",
  "msgId": "um-uuid-v4-unico"
}
```

#### Heartbeat (sinal de vida)

```json
{
  "dispositivoId": "PILL-001",
  "uptimeSegundos": 3600,
  "gavetas": [
    { "numero": 1, "status": "bloqueado" },
    { "numero": 2, "status": "bloqueado" },
    { "numero": 3, "status": "bloqueado" }
  ],
  "timestamp": "2026-05-18T14:01:00-03:00"
}
```

#### Comando do backend (ex: liberar compartimento)

```json
{
  "compartimento": 2,
  "acao": "liberar",
  "medicamentoNome": "Dipirona 500mg",
  "tempoLimiteSegundos": 300,
  "msgId": "outro-uuid-v4"
}
```

### O campo `msgId`

Cada mensagem deve ter um `msgId` unico (UUID v4). O backend usa esse campo para evitar processar a mesma mensagem duas vezes (idempotencia). Isso e importante para resiliencia: se o ESP32 reenvia um evento por falha de rede, o backend nao duplica no banco.

## Credenciais do ESP32

Quem esta fazendo o firmware precisa dessas informacoes:

```
MQTT Broker:
  Host: (ver variavel MQTT_BROKER_URL no Railway, sem o mqtts://)
  Port: 8883 (TLS obrigatorio)
  Username: pillgator-esp32
  Password: (a senha criada no painel HiveMQ para o usuario esp32)

Topicos para PUBLICAR:
  pillgator/PILL-001/evento/gaveta_aberta
  pillgator/PILL-001/evento/medicamento_retirado
  pillgator/PILL-001/evento/dose_perdida
  pillgator/PILL-001/evento/alerta_emitido
  pillgator/PILL-001/evento/erro
  pillgator/PILL-001/status/heartbeat

Topicos para ESCUTAR:
  pillgator/PILL-001/comando/#
```

Bibliotecas recomendadas para ESP32:

- `WiFi.h` (nativa do ESP32)
- `WiFiClientSecure.h` (TLS)
- `PubSubClient.h` (MQTT) — instalar pelo gerenciador de bibliotecas da Arduino IDE

## Arquivos do Modulo MQTT no Backend

```
backend/src/modulos/mqtt/
  mqttCliente.ts        — Conexao com o broker, pub/sub, reconexao automatica
  mqttManipuladores.ts  — Processa eventos recebidos e salva no banco
  mqttTopicos.ts        — Constantes dos topicos MQTT
```

O MQTT e iniciado automaticamente em `server.ts` apos o banco conectar. Se o broker estiver fora do ar, o backend continua funcionando normalmente (apenas sem IoT).

## Resiliencia

| Cenario | O que acontece |
|---------|----------------|
| ESP32 perde Wi-Fi | Deve armazenar eventos na SPIFFS e reenviar ao reconectar |
| Broker MQTT cai | Backend tenta reconectar a cada 5 segundos automaticamente |
| Backend reinicia | Railway reinicia automatico, MQTT reconecta sozinho |
| Evento duplicado | Backend ignora pelo `msgId` (idempotencia) |
| Banco Neon cai | Backend retorna erro 500, mas nao crasha |

## Deploy

O deploy e automatico. Ao fazer push na branch `main` do fork no GitHub, o Railway detecta e faz redeploy.

Repositorio monitorado pelo Railway:

```
https://github.com/GustavoReis-xml/PillGator-ABP4_DSM
Branch: main
Root Directory: backend
```

### Como atualizar o deploy

```bash
# 1. Commitar suas mudancas
git add .
git commit -m "descricao da mudanca"

# 2. Push para o fork (da branch local develop para main do fork)
git push fork develop:main
```

O Railway faz o resto sozinho.

## Rotas da API

A API completa esta documentada em:

```
https://<sua-url-railway>/docs
```

Rotas de verificacao:

```
GET /health  — retorna { "status": "ok" }
GET /saude   — retorna { "status": "ok" }
```
