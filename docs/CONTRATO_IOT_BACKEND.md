# Contrato Backend x IoT

Este documento descreve os endpoints que o firmware pode usar. O codigo C++ do ESP32 fica com o grupo de IoT; aqui ficam apenas os contratos do backend.

## Identificacao do Dispositivo

Cada dispositivo cadastrado possui um `identificador`, por exemplo `pillgator-01`.

O firmware deve usar esse valor nas rotas IoT:

- `GET /iot/dispositivos/:identificador/comandos-pendentes`
- `POST /iot/dispositivos/:identificador/eventos`

Sempre que o IoT chama uma dessas rotas, o backend atualiza `ultimoSinalEm`. O status online/offline pode ser consultado em:

- `GET /dispositivos/:id/status`

O dispositivo e considerado online quando enviou sinal nos ultimos 5 minutos.

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
2. ESP32 consulta comandos pendentes.
3. ESP32 executa o comando.
4. ESP32 registra evento de abertura, fechamento, retirada ou falha.
5. Backend salva o evento e atualiza status da gaveta.
