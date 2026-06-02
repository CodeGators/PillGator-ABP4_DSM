# Guia de Deploy em Nuvem - Neon + HiveMQ + Railway

Este guia sobe o PillGator em uma infraestrutura com custo zero ou quase zero para apresentacao e testes escolares.

Arquitetura:

```text
Mobile Expo
  -> HTTPS
Backend Railway
  -> PostgreSQL Neon

Backend Railway
  -> MQTT
HiveMQ Cloud
  -> MQTT
ESP32 ou simulador IoT
```

## Custos Esperados

- Neon Free: banco PostgreSQL gratuito para projeto escolar.
- HiveMQ Cloud Serverless Free: broker MQTT gratuito para testes.
- Railway Free/Trial: backend com credito gratuito limitado. Se acabar credito, usar backend local como plano B.

## Fase 1 - Criar Banco no Neon

1. Acesse `https://neon.com`.
2. Crie uma conta.
3. Crie um projeto PostgreSQL.
4. Copie a connection string.
5. Garanta que ela termine com SSL habilitado, por exemplo:

```text
postgresql://usuario:senha@host.neon.tech/banco?sslmode=require
```

Essa URL sera usada como:

```env
DATABASE_URL=postgresql://...
```

## Fase 2 - Criar Broker MQTT no HiveMQ Cloud

1. Acesse `https://www.hivemq.com/products/mqtt-cloud-broker/`.
2. Crie uma instancia Serverless Free.
3. Copie o host do cluster.
4. Crie um usuario para o backend:
   - username: `pillgator-backend`
   - password: senha segura
5. Crie um usuario para ESP32/simulador:
   - username: `pillgator-esp32`
   - password: senha segura
6. Monte a URL:

```env
MQTT_BROKER_URL=mqtts://SEU_CLUSTER.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=pillgator-backend
MQTT_PASSWORD=SENHA_BACKEND
MQTT_ESP32_USERNAME=pillgator-esp32
MQTT_ESP32_PASSWORD=SENHA_ESP32
SIMULADOR_DEVICE_ID=PILL-001
SIMULADOR_GAVETAS=3
```

## Fase 3 - Preparar Railway

1. Acesse `https://railway.com`.
2. Crie conta e conecte GitHub.
3. Crie um projeto novo.
4. Selecione o repositorio do PillGator.
5. Configure o servico do backend:
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm start`

O script `npm start` executa:

```bash
node dist/src/server.js
```

## Fase 4 - Variaveis no Railway

Configure no painel do servico backend:

```env
PORT=3000
DATABASE_URL=URL_DO_NEON
JWT_SECRET=uma-chave-grande-e-segura
JWT_EXPIRES_IN=8h
MQTT_BROKER_URL=mqtts://SEU_CLUSTER.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=pillgator-backend
MQTT_PASSWORD=SENHA_BACKEND
MQTT_ESP32_USERNAME=pillgator-esp32
MQTT_ESP32_PASSWORD=SENHA_ESP32
SIMULADOR_DEVICE_ID=PILL-001
SIMULADOR_GAVETAS=3
EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send
```

Observacoes:

- Nao commitar `.env` real.
- O `PORT` normalmente e fornecido pelo Railway, mas deixar `3000` como fallback nao atrapalha.
- `JWT_SECRET` nao deve ser o valor de desenvolvimento.

## Fase 5 - Deploy do Backend

1. Dispare o deploy pelo Railway.
2. Abra os logs.
3. Confira se aparece:

```text
Server running on port ...
MQTT: conectando ao broker ...
MQTT: conectado ao broker com sucesso
MQTT: inscrito em pillgator/+/evento/#
MQTT: inscrito em pillgator/+/status/#
```

Se aparecer:

```text
MQTT: MQTT_BROKER_URL nao configurada
```

revise as variaveis MQTT.

## Fase 6 - Rodar Migrations no Neon

Depois do deploy/build, rode um comando one-off no Railway:

```bash
npm run migration:run:dist
```

Depois valide:

```bash
npm run db:check
```

Se preferir rodar local apontando para o Neon:

```bash
cd backend
DATABASE_URL="URL_DO_NEON" npm run migration:run
DATABASE_URL="URL_DO_NEON" npm run db:check
```

## Fase 7 - Testar API em Nuvem

Substitua pela URL publica do Railway:

```text
https://SUA-API.up.railway.app/saude
https://SUA-API.up.railway.app/health
https://SUA-API.up.railway.app/docs
```

Resultado esperado em `/saude`:

```json
{ "status": "ok" }
```

## Fase 8 - Testar Mobile com API em Nuvem

No terminal:

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://SUA-API.up.railway.app npx expo start --lan
```

No celular:

1. Abrir Expo Go.
2. Fazer cadastro/login.
3. Criar/selecionar paciente.
4. Criar medicamento.
5. Criar dispositivo/gaveta.
6. Ir em `Gavetas`.

## Fase 9 - Testar MQTT com Simulador

Em ambiente local, usando o mesmo HiveMQ:

```bash
cd backend
npm run iot:simular
```

O simulador deve mostrar:

```text
SIMULADOR: conectado ao broker
SIMULADOR: escutando pillgator/PILL-001/comando/#
SIMULADOR: publicado pillgator/PILL-001/status/heartbeat
```

No Railway, os logs devem mostrar:

```text
MQTT: heartbeat atualizado para PILL-001
```

Se aparecer dispositivo desconhecido, crie no app/backend um dispositivo com:

```text
identificador = PILL-001
```

## Fase 10 - Plano B Gratuito

Se Railway limitar credito ou pedir algo que atrapalhe:

1. Manter Neon na nuvem.
2. Manter HiveMQ na nuvem.
3. Rodar backend no notebook:

```bash
cd backend
npm run dev
```

4. Rodar mobile apontando para o IP do notebook:

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://IP_DO_NOTEBOOK:3000 npx expo start --lan
```

Esse plano ainda testa:

```text
Celular -> Backend local -> Neon -> HiveMQ -> ESP32/simulador
```

## Checklist Final

- [ ] Neon criado.
- [ ] `DATABASE_URL` copiada.
- [ ] HiveMQ criado.
- [ ] Usuario MQTT do backend criado.
- [ ] Usuario MQTT do ESP32/simulador criado.
- [ ] Railway conectado ao repositorio.
- [ ] Root Directory configurado como `backend`.
- [ ] Variaveis de ambiente configuradas no Railway.
- [ ] Deploy executado.
- [ ] Migrations rodadas.
- [ ] `/saude` responde.
- [ ] `/docs` abre.
- [ ] Mobile usa `EXPO_PUBLIC_API_URL` da Railway.
- [ ] Simulador envia heartbeat.
- [ ] App consegue liberar gaveta e simulador recebe comando.

