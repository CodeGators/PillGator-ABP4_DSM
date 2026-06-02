# Contrato Backend x IoT

Este documento descreve os contratos que o firmware pode usar. O caminho principal atual e MQTT. Os endpoints REST continuam como fallback para comandos pendentes e registro direto de eventos.

## Identificacao do Dispositivo

Cada dispositivo cadastrado possui um `identificador`, por exemplo `pillgator-01`.

O firmware deve usar esse valor nas rotas IoT:

- `GET /iot/dispositivos/:identificador/comandos-pendentes`
- `POST /iot/dispositivos/:identificador/eventos`

Sempre que o IoT chama uma dessas rotas, o backend atualiza `ultimoSinalEm`. O status online/offline pode ser consultado em:

- `GET /dispositivos/:id/status`

O dispositivo e considerado online quando enviou sinal nos ultimos 5 minutos.

## Contrato MQTT Principal

Todos os topicos seguem o formato:

```text
pillgator/{identificador}/{categoria}/{tipo}
```

Exemplo com `PILL-001`:

### Backend -> IoT

O backend publica comandos quando o app solicita liberar/travar uma gaveta.

Topicos:

- `pillgator/PILL-001/comando/liberar`
- `pillgator/PILL-001/comando/bloquear`

Payload de liberar:

```json
{
  "acao": "liberar",
  "comandoId": "uuid-do-comando",
  "msgId": "uuid-do-comando",
  "compartimento": 1,
  "medicamentoId": "uuid-do-medicamento",
  "motivo": "Administrar medicamento",
  "agendamentoId": "uuid-do-agendamento"
}
```

Payload de bloquear:

```json
{
  "acao": "bloquear",
  "comandoId": "uuid-do-comando",
  "msgId": "uuid-do-comando",
  "compartimento": 1,
  "motivo": "Travamento manual pelo app"
}
```

### IoT -> Backend

O ESP32 ou simulador publica status e eventos.

Topicos:

- `pillgator/PILL-001/status/heartbeat`
- `pillgator/PILL-001/evento/alerta_emitido`
- `pillgator/PILL-001/evento/gaveta_aberta`
- `pillgator/PILL-001/evento/medicamento_retirado`
- `pillgator/PILL-001/evento/dose_perdida`
- `pillgator/PILL-001/evento/erro`

Heartbeat:

```json
{
  "dispositivoId": "PILL-001",
  "uptimeSegundos": 120,
  "gavetas": [
    { "numero": 1, "status": "bloqueado" }
  ],
  "timestamp": "2026-06-01T12:00:00.000Z"
}
```

Regras do heartbeat:

- Atualiza `ultimoSinalEm` do dispositivo.
- Se a gaveta existir no banco, cada item de `gavetas` atualiza `compartimentos.status`.
- Status aceitos para gaveta: `bloqueado`, `liberado`, `aberto`, `erro`.

Evento:

```json
{
  "dispositivoId": "PILL-001",
  "compartimento": 1,
  "tipo": "gaveta_aberta",
  "timestamp": "2026-06-01T12:00:00.000Z",
  "msgId": "PILL-001-123-1",
  "dados": {
    "origem": "simulador"
  }
}
```

Regras dos eventos MQTT:

- `gaveta_aberta` e salvo como `compartimento_aberto` e muda a gaveta para `aberto`.
- `medicamento_retirado` muda a gaveta para `bloqueado`.
- `erro` e salvo como `falha` e muda a gaveta para `erro`.
- `dose_perdida` e salvo como `atraso`.
- Se a gaveta tiver medicamento vinculado, o evento fica associado ao `medicamentoId`.
- `msgId` e usado para evitar processamento duplicado do mesmo evento.

## Simulador Node

Sem hardware, use:

```bash
cd backend
npm run iot:simular
```

O simulador escuta `pillgator/PILL-001/comando/#`, simula a gaveta e publica eventos MQTT de volta para o backend.

Para diagnosticar o caminho MQTT com o backend online e o banco Neon:

```bash
cd backend
npm run iot:diagnosticar
```

Esse comando publica heartbeat e evento como se fosse o ESP32 e confirma se o backend processou no banco.

## Buscar Comandos Pendentes

`GET /iot/dispositivos/pillgator-01/comandos-pendentes`

Resposta esperada:

```json
[
  {
    "id": "uuid-do-comando",
    "dispositivoId": "uuid-do-dispositivo",
    "compartimentoId": "uuid-da-gaveta",
    "tipo": "liberar_gaveta",
    "status": "enviado",
    "dados": {
      "numeroCompartimento": 1,
      "medicamentoId": "uuid-do-medicamento",
      "motivo": "Administrar medicamento"
    }
  }
]
```

Tipos de comando:

- `liberar_gaveta`: destravar/abrir permissao da gaveta.
- `travar_gaveta`: travar a gaveta.

## Registrar Evento

`POST /iot/dispositivos/pillgator-01/eventos`

Exemplo:

```json
{
  "chaveEvento": "pillgator-01-0001",
  "tipo": "compartimento_aberto",
  "compartimentoNumero": 1,
  "ocorridoEm": "2026-05-12T08:00:00.000Z",
  "dados": {
    "distanciaCm": 18
  }
}
```

Tipos de evento aceitos:

- `compartimento_aberto`
- `compartimento_fechado`
- `medicamento_retirado`
- `falha`

Regras importantes:

- `chaveEvento` deve ser unica por evento para evitar duplicidade.
- Pode enviar `compartimentoNumero` ou `compartimentoId`.
- Se o evento for da gaveta e ela tiver medicamento vinculado, o backend associa o `medicamentoId` automaticamente.
- `compartimento_aberto` muda a gaveta para `aberto`.
- `compartimento_fechado` e `medicamento_retirado` mudam a gaveta para `bloqueado`.
- `falha` muda a gaveta para `erro`.

## Fluxo Sugerido

1. App cria comando para liberar ou travar gaveta.
2. Backend publica comando MQTT para o identificador do dispositivo.
3. ESP32 ou simulador recebe o comando no topico `comando/#`.
4. ESP32 ou simulador executa o comando.
5. ESP32 ou simulador publica heartbeat/eventos MQTT.
6. Backend salva o evento e atualiza status da gaveta.

Fallback REST:

1. App cria comando para liberar ou travar gaveta.
2. ESP32 consulta comandos pendentes por REST.
3. ESP32 executa o comando.
4. ESP32 registra evento por REST.
5. Backend salva o evento e atualiza status da gaveta.
