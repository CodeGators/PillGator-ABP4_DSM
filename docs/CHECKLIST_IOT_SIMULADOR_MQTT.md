# Checklist IoT - Simulador ESP32 com MQTT

Este checklist guia a implementacao de um simulador do ESP32 em Node/TypeScript para testar a integracao completa sem ter o hardware fisico em maos.

Objetivo final:

- Rodar o backend local ou em nuvem conectado ao broker MQTT.
- Rodar um simulador que se comporta como o ESP32.
- Testar pelo app no celular, usando Wi-Fi, o envio de comandos para liberar/travar gavetas.
- Ver o simulador receber o comando, responder com eventos e atualizar o status no app.

## Fluxo Completo Desejado

Este e o fluxo que queremos deixar funcionando antes de ligar o hardware real:

```text
App no celular
  -> HTTP/REST
Backend
  -> MQTT publish
Broker MQTT
  -> MQTT subscribe
Simulador IoT
  -> MQTT publish de eventos/status
Broker MQTT
  -> MQTT subscribe
Backend
  -> Banco PostgreSQL
App no celular consulta status/historico
```

Na gaveta real, o bloco `Simulador IoT` sera substituido pelo ESP32 rodando `iot/cod hardware/codigo_esp32.ino`.

## Onde o IoT Entra

O IoT entra entre o broker MQTT e a parte fisica da gaveta.

- O app nao fala direto com o ESP32.
- O app chama o backend por HTTP.
- O backend publica um comando MQTT.
- O ESP32 escuta esse comando MQTT.
- O ESP32 aciona servo/LED/buzzer/sensor.
- O ESP32 publica eventos MQTT de volta.
- O backend recebe esses eventos e salva no banco.

Isso e bom porque o celular nao precisa estar na mesma rede do ESP32 quando o projeto estiver em nuvem. O broker MQTT vira o ponto de encontro entre backend e dispositivo.

## O Que Da Para Testar Sem Hardware

Da para testar quase tudo:

- [x] App no celular mandando HTTP para o backend.
- [x] Backend recebendo o comando do app.
- [ ] Backend publicando comando MQTT para o dispositivo.
- [ ] Um simulador recebendo o comando MQTT.
- [ ] Simulador publicando `heartbeat`.
- [ ] Simulador publicando `gaveta_aberta`, `medicamento_retirado`, `dose_perdida` e `erro`.
- [x] Backend recebendo eventos MQTT.
- [x] Backend salvando status/eventos no banco.
- [x] App consultando status/historico pelo backend.

O que nao da para validar sem hardware:

- Movimento real do servo.
- Leitura real do sensor ultrassonico.
- Buzzer/LED/display fisicos.
- Problemas eletricos, alimentacao e pinagem.

## Niveis de Simulacao

### Nivel 1 - Simulador Node Recomendado

Este e o caminho principal para desenvolvimento.

- Mais facil de automatizar.
- Roda no terminal junto com backend e Expo.
- Simula o comportamento do ESP32 via MQTT.
- Permite testar o fluxo completo pelo celular.
- Nao executa o arquivo `.ino`, mas imita o protocolo dele.

### Nivel 2 - Firmware C/C++ em Simulador

Tambem e possivel testar o codigo C/C++ do IoT em ambiente simulado, usando ferramentas como simulador de ESP32.

Objetivo:

- Rodar uma versao do `codigo_esp32.ino`.
- Conectar no mesmo broker MQTT.
- Receber comando do backend.
- Publicar eventos MQTT de volta.

Checklist especifico:

- [ ] Avaliar simulador compativel com ESP32, Wi-Fi e MQTT.
- [ ] Criar projeto de simulacao para o firmware.
- [ ] Configurar bibliotecas equivalentes:
  - [ ] Wi-Fi/MQTT
  - [ ] ArduinoJson
  - [ ] stubs ou simulacao de Servo/LCD/sensores
- [ ] Manter `DEVICE_ID = PILL-001`.
- [ ] Conectar no mesmo broker MQTT do backend.
- [ ] Assinar `pillgator/PILL-001/comando/#`.
- [ ] Publicar `pillgator/PILL-001/status/heartbeat`.
- [ ] Publicar eventos ao receber comando.

Observacao: esse nivel e mais proximo do firmware real, mas costuma exigir ajustes porque bibliotecas fisicas como servo, LCD e sensor podem nao funcionar exatamente igual no simulador. Por isso, para desenvolvimento do app/backend, o simulador Node continua sendo o caminho mais estavel.

### Nivel 3 - Hardware Real

Quando o equipamento chegar:

- Usar o mesmo `DEVICE_ID`.
- Usar os mesmos topicos MQTT.
- Usar as mesmas credenciais do usuario MQTT do ESP32.
- Trocar o simulador Node pelo ESP32 real.
- Validar servo, sensor, buzzer, LCD e alimentacao.

## Estado Atual

- [x] Backend possui modulo MQTT em `backend/src/modulos/mqtt`.
- [x] Backend conecta no broker MQTT ao iniciar `server.ts`.
- [x] Backend escuta topicos:
  - [x] `pillgator/+/evento/#`
  - [x] `pillgator/+/status/#`
- [x] Backend processa `heartbeat` e atualiza `ultimoSinalEm` do dispositivo.
- [x] Backend processa eventos MQTT e salva em `eventos_medicamentos`.
- [x] Existe firmware real em `iot/cod hardware/codigo_esp32.ino`.
- [x] Existe simulador Node do ESP32 em `backend/src/scripts/simular-esp32.ts`.
- [x] Comandos REST de liberar/travar publicam MQTT automaticamente.

## Fase 1 - Configuracao MQTT

- [ ] Criar ou confirmar conta/broker no HiveMQ Cloud.
- [ ] Criar usuario MQTT para o backend.
- [ ] Criar usuario MQTT para o simulador ESP32.
- [x] Documentar variaveis MQTT em `backend/.env.example`.
- [ ] Configurar no `.env` do backend:
  - [ ] `MQTT_BROKER_URL=mqtts://HOST_DO_BROKER:8883`
  - [ ] `MQTT_USERNAME=usuario_backend`
  - [ ] `MQTT_PASSWORD=senha_backend`
  - [ ] `MQTT_ESP32_USERNAME=usuario_simulador`
  - [ ] `MQTT_ESP32_PASSWORD=senha_simulador`
- [ ] Definir identificador padrao do dispositivo de teste:
  - [ ] `PILL-001`
- [ ] Garantir que existe no banco um dispositivo com `identificador = PILL-001`.
- [ ] Garantir que esse dispositivo esta vinculado ao paciente usado no app.
- [ ] Garantir que existe pelo menos uma gaveta/compartimento para o dispositivo.

## Fase 2 - Simulador ESP32

Arquivo sugerido:

- `backend/src/scripts/simular-esp32.ts`

Checklist:

- [x] Criar script Node/TypeScript usando a biblioteca `mqtt`.
- [x] Ler configuracoes por variaveis de ambiente:
  - [x] `MQTT_BROKER_URL`
  - [x] `MQTT_ESP32_USERNAME`
  - [x] `MQTT_ESP32_PASSWORD`
  - [x] `SIMULADOR_DEVICE_ID`, padrao `PILL-001`
  - [x] `SIMULADOR_GAVETAS`, padrao `3`
- [x] Conectar no broker MQTT com TLS.
- [x] Assinar comandos:
  - [x] `pillgator/PILL-001/comando/#`
- [x] Publicar heartbeat periodico:
  - [x] topico `pillgator/PILL-001/status/heartbeat`
  - [x] intervalo padrao de 30 ou 60 segundos
- [x] Simular gavetas com estado em memoria:
  - [x] `bloqueado`
  - [x] `liberado`
  - [x] `aberto`
  - [x] `erro`
- [x] Ao receber comando `liberar`:
  - [x] marcar gaveta como `liberado`
  - [x] publicar evento `alerta_emitido`
  - [x] apos alguns segundos, publicar evento `gaveta_aberta`
  - [x] apos alguns segundos, publicar evento `medicamento_retirado`
  - [x] voltar estado para `bloqueado`
- [x] Ao receber comando `bloquear`:
  - [x] marcar gaveta como `bloqueado`
  - [x] publicar heartbeat com status atualizado
- [x] Criar modo manual por terminal:
  - [x] digitar `abrir 1`
  - [x] digitar `retirar 1`
  - [x] digitar `perdida 1`
  - [x] digitar `erro 1`
  - [x] digitar `status`
- [x] Gerar `msgId` unico para cada evento.
- [x] Imprimir logs claros:
  - [x] conectado ao MQTT
  - [x] heartbeat enviado
  - [x] comando recebido
  - [x] evento publicado

## Fase 3 - Script NPM

No `backend/package.json`:

- [x] Adicionar script:

```json
{
  "scripts": {
    "iot:simular": "tsx src/scripts/simular-esp32.ts"
  }
}
```

- [ ] Testar:

```bash
cd backend
npm run iot:simular
```

## Fase 4 - Ligar App -> Backend -> MQTT

Hoje o app chama o backend para liberar/travar gaveta. O backend cria comando no banco, mas ainda precisa publicar o comando MQTT para o ESP32/simulador.

Arquivo principal:

- `backend/src/modulos/dispositivos/dispositivosServico.ts`

Checklist:

- [x] Importar `publicarComando` de `backend/src/modulos/mqtt/mqttCliente.ts`.
- [x] Ao criar comando `liberar_gaveta`, publicar MQTT:
  - [x] topico `pillgator/{identificador}/comando/liberar`
  - [x] payload com `compartimento`, `acao`, `msgId`, `medicamentoId`, `agendamentoId`, `motivo`
- [x] Ao criar comando `travar_gaveta`, publicar MQTT:
  - [x] topico `pillgator/{identificador}/comando/bloquear`
  - [x] payload com `compartimento`, `acao`, `msgId`, `motivo`
- [x] Usar `dispositivo.identificador`, nao o UUID interno do banco, no topico MQTT.
- [x] Manter o comando salvo no banco mesmo se MQTT estiver offline.
- [x] Definir comportamento esperado quando MQTT estiver offline:
  - [x] manter status `pendente`
  - [x] mostrar log no backend
  - [x] permitir que o simulador/hardware busque comandos pendentes por REST como fallback, se necessario

## Fase 5 - Teste Local com Celular no Wi-Fi

Objetivo: testar o app real no celular chamando o backend local.

Este teste valida o envio do sinal do celular ate o IoT simulado:

```text
Celular no Wi-Fi -> backend local -> MQTT -> simulador IoT
```

Checklist:

- [ ] Confirmar IP da maquina na rede Wi-Fi:

```bash
hostname -I
```

- [ ] Subir backend escutando em todas as interfaces:

```bash
cd backend
npm run dev
```

- [ ] Confirmar que o celular acessa:

```text
http://IP_DA_MAQUINA:3000/saude
```

- [ ] Subir o simulador:

```bash
cd backend
npm run iot:simular
```

- [ ] Subir o app Expo:

```bash
cd mobile
npx expo start --lan
```

- [ ] Abrir o app no celular pelo Expo Go.
- [ ] Fazer login.
- [ ] Selecionar paciente que possui dispositivo `PILL-001`.
- [ ] Ir em `Gavetas`.
- [ ] Confirmar status online depois do heartbeat.
- [ ] Clicar em `Liberar`.
- [ ] Confirmar no log do backend que a rota REST recebeu o pedido de liberar.
- [ ] Confirmar no log do backend que o comando MQTT foi publicado.
- [ ] Ver no terminal do simulador:
  - [ ] comando MQTT recebido
  - [ ] evento `alerta_emitido`
  - [ ] evento `gaveta_aberta`
  - [ ] evento `medicamento_retirado`
- [ ] Ver no backend logs de eventos recebidos.
- [ ] Ver no app se status/historico atualizam apos refetch.

## Fase 6 - Dados de Teste

- [ ] Criar paciente de teste.
- [ ] Criar medicamento de teste.
- [ ] Criar dispositivo no banco/API:
  - [ ] `nome = PillGator Teste`
  - [ ] `identificador = PILL-001`
  - [ ] `pacienteId = id do paciente`
- [ ] Criar compartimento:
  - [ ] `numero = 1`
  - [ ] `medicamentoId = id do medicamento`
  - [ ] `status = bloqueado`
- [ ] Confirmar no app que a gaveta aparece para o paciente.

## Fase 7 - Testes Automatizados

Backend:

- [x] Criar testes unitarios para montagem de payload MQTT.
- [x] Mockar `publicarComando`.
- [x] Testar que `liberarCompartimento` cria comando e chama MQTT.
- [x] Testar que `travarCompartimento` cria comando e chama MQTT.
- [x] Testar fallback quando MQTT nao esta conectado.
- [ ] Testar `processarMensagem` com heartbeat.
- [ ] Testar `processarMensagem` com evento `gaveta_aberta`.
- [ ] Testar idempotencia por `msgId`.

Simulador:

- [ ] Testar geracao de topicos.
- [x] Testar geracao de payload heartbeat.
- [ ] Testar fluxo automatico ao receber `liberar`.
- [x] Testar comandos manuais do terminal.

Mobile:

- [ ] Garantir que tela `Gavetas` mostra online quando `ultimoSinalEm` e recente.
- [ ] Garantir que botao `Liberar` chama backend.
- [ ] Garantir que botao `Travar` chama backend.
- [ ] Garantir que tela `Historico` exibe eventos de origem `iot`.

## Fase 8 - Documentacao Final

- [x] Atualizar `docs/GUIA_TESTE_ESP32.md` com secao do simulador Node.
- [x] Atualizar `docs/INFRAESTRUTURA_NUVEM.md` informando que o simulador substitui temporariamente o ESP32.
- [x] Atualizar `docs/CONTRATO_IOT_BACKEND.md` com o fluxo MQTT e fallback REST.
- [x] Atualizar `docs/ROTEIRO_TESTES_SWAGGER.md` se as rotas de dispositivo mudarem.
- [x] Registrar comandos finais:
  - [x] subir backend
  - [x] subir simulador
  - [x] subir Expo em LAN
  - [x] testar pelo celular

## Resultado Esperado

Ao final, o fluxo deve funcionar assim:

1. O simulador publica heartbeat no MQTT.
2. O backend recebe heartbeat e marca o dispositivo como online.
3. O app no celular mostra a gaveta online.
4. O usuario toca em `Liberar`.
5. O backend cria comando e publica MQTT.
6. O simulador recebe o comando e simula a gaveta.
7. O simulador publica eventos de abertura/retirada.
8. O backend salva os eventos.
9. O app consegue consultar status e historico.
