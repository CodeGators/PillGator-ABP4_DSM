<div align="center">

<img src="https://img.shields.io/badge/4º%20Semestre-DSM-6366f1?style=for-the-badge" />
<img src="https://img.shields.io/badge/FATEC-Jacareí-0ea5e9?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-f59e0b?style=for-the-badge" />

# 🔒 PillGator — Gaveta Inteligente de Medicamentos

**Sistema IoT de controle físico de medicamentos por horário, com monitoramento remoto via aplicativo móvel.**

*Aprendizagem Baseada em Projetos (ABP) · 4º Semestre DSM · FATEC Jacareí — Prof. Francisco de Moura*

</div>

---

## 👥 Equipe CodeGators

| Membro |
|---|
| Anderson Fontes |
| Arthur Augusto |
| Gustavo Silva |
| Rafael Shinji |
| Rodrigo Augusto |
| Stefan Souza |

---

## 📌 Sobre o Projeto

O envelhecimento da população e a alta prevalência de doenças crônicas tornam o controle rigoroso de medicamentos uma necessidade crítica. O esquecimento ou a ingestão incorreta de remédios é uma das principais causas de internações evitáveis entre idosos e pacientes polimedicados.

O **PillGator** é um sistema integrado de hardware e software que resolve esse problema de forma simples e segura: uma **gaveta física com travamento eletrônico** que permanece bloqueada e só é desbloqueada automaticamente no horário exato programado para cada medicamento. Fora do horário, o compartimento permanece trancado, impedindo retiradas incorretas.

O sistema registra cada abertura e, caso o paciente esqueça de retirar o remédio, notifica remotamente um cuidador ou responsável pelo aplicativo móvel.

---

## 🎯 Funcionalidades

### 🔒 Controle Físico por Gaveta (IoT)
- Gaveta com **travamento eletromecânico**
- Desbloqueio automático **somente no horário programado** do medicamento
- Fora do horário: compartimento permanece **fisicamente bloqueado**, evitando retiradas indevidas
- Sensor de abertura registra se o remédio foi retirado ou não

### 🔔 Alertas e Notificações
- **Alerta sonoro** (buzzer) disparado no horário da medicação
- **Notificação push** enviada ao app do responsável caso o medicamento não seja retirado dentro de um intervalo configurável

### 📱 Aplicativo Mobile
- Cadastro e programação dos medicamentos e horários
- Histórico detalhado de retiradas e eventos
- Visualização do status atual da gaveta (bloqueada / desbloqueada / aberta)
- Interface pensada para **acessibilidade e usabilidade para idosos** (fonte ampla, alto contraste, navegação simples)

### 🌐 Monitoramento Remoto
- Cuidadores e responsáveis acompanham a adesão ao tratamento em tempo real
- Alertas de não-retirada com registro de data e hora

---

## 🗓️ Cronograma de Sprints

| Sprint | Período | Objetivo |
|---|---|---|
| **Sprint 1** | 13/04 → 30/04/2026 | Configuração do ambiente, estrutura base do backend e protótipo do hardware |
| **Sprint 2** | 04/05 → 21/05/2026 | Integração IoT ↔ Backend, lógica de travamento/destravamento por horário |
| **Sprint 3** | 25/05 → 11/06/2026 | Aplicativo mobile, notificações push e testes de integração |
| **Apresentação Final** | Semana de 22/07/2026 | Entrega e apresentação do sistema completo |

---

## 🚀 Como Executar

### Pre-requisitos

- Node.js 20 ou superior
- npm
- Docker e Docker Compose para banco local
- Expo Go no celular para testar o app em desenvolvimento
- Conta Expo/EAS apenas se for gerar APK pela nuvem

### Estrutura principal

```text
backend/  API Node.js, Express, TypeORM e PostgreSQL
mobile/   App React Native com Expo
iot/      Codigo e referencias do ESP32
docs/     Guias de teste, deploy, IoT e checklist do frontend
```

---

## 🌐 Backend Online

O backend esta publicado no Railway e usando banco Neon PostgreSQL.

API publica:

```text
https://pillgator-abp4dsm-production-072b.up.railway.app
```

Rotas de verificacao:

```text
https://pillgator-abp4dsm-production-072b.up.railway.app/saude
https://pillgator-abp4dsm-production-072b.up.railway.app/health
```

Swagger:

```text
https://pillgator-abp4dsm-production-072b.up.railway.app/docs
```

No Railway, o servico do backend deve estar configurado com:

```text
Root Directory: /backend
Build Command: npm run build
Start Command: npm start
```

Variaveis obrigatorias no servico do Railway:

```text
DATABASE_URL=<url do Neon com sslmode=require>
JWT_SECRET=<segredo forte>
JWT_EXPIRES_IN=8h
```

MQTT ainda pode ficar desligado durante testes sem hardware. Nesse caso o backend sobe normalmente e os logs mostram que a conexao MQTT foi pulada.

Guia completo:

```text
docs/GUIA_DEPLOY_NUVEM.md
```

---

## 🖥️ Backend Local

1. Instale as dependencias:

```bash
cd backend
npm install
```

2. Crie o `.env` local:

```bash
cp .env.example .env
```

3. Suba o PostgreSQL local:

```bash
cd ..
docker compose up -d postgres
```

4. Rode as migrations:

```bash
cd backend
npm run migration:run
```

5. Confira o banco:

```bash
npm run db:check
```

6. Popule a base de medicamentos, se necessario:

```bash
npm run base-medicamentos:importar
```

7. Inicie a API local:

```bash
npm run dev
```

API local:

```text
http://localhost:3000
```

Rotas locais:

```text
http://localhost:3000/saude
http://localhost:3000/health
http://localhost:3000/docs
```

Comandos uteis do backend:

```bash
npm run lint
npm test
npm run build
npm run migration:run
npm run migration:run:dist
npm run migration:revert
npm run db:check
npm run base-medicamentos:importar
npm run iot:simular
npm run iot:diagnosticar
```

Configuracao local padrao:

```text
POSTGRES_DB=abp4
POSTGRES_USER=abp4user
POSTGRES_PASSWORD=abp4pass
DATABASE_URL=postgresql://abp4user:abp4pass@localhost:5432/abp4
```

As credenciais acima sao apenas para desenvolvimento local. Arquivos `.env` reais nao devem ser commitados.

---

## 📱 App Mobile

1. Instale as dependencias:

```bash
cd mobile
npm install
```

2. Para testar no celular com Expo Go apontando para o backend online:

```bash
npm run start:online
```

3. Para testar no navegador usando o backend online:

```bash
npm run web:online
```

4. Para testar com backend local:

```bash
npm start
```

Quando usar backend local no celular, o app tenta descobrir o IP do Expo e acessar `http://IP_DO_NOTEBOOK:3000`. O celular e o notebook precisam estar na mesma rede.

Scripts principais do mobile:

```bash
npm start
npm run start:online
npm run android
npm run android:online
npm run web
npm run web:online
npm test
```

---

## 📦 APK

O projeto possui um perfil EAS `preview` em `mobile/eas.json` para gerar APK usando o backend online.

Comando:

```bash
cd mobile
npm run apk:online
```

Esse comando usa:

```text
EXPO_PUBLIC_API_URL=https://pillgator-abp4dsm-production-072b.up.railway.app
```

Para build local ou customizada, tambem e possivel definir a variavel manualmente:

```bash
EXPO_PUBLIC_API_URL=https://pillgator-abp4dsm-production-072b.up.railway.app npx expo start --lan
```

---

## 🔌 IoT e MQTT

O backend ja possui contrato para comandos de gaveta, publicacao MQTT e simulador ESP32.

Sem hardware, use:

```bash
cd backend
npm run iot:simular
```

Para validar se MQTT, backend online e banco estao conectados corretamente:

```bash
cd backend
npm run iot:diagnosticar
```

Com hardware, siga:

```text
docs/GUIA_TESTE_ESP32.md
docs/CHECKLIST_IOT_SIMULADOR_MQTT.md
docs/CONTRATO_IOT_BACKEND.md
```

Fluxo esperado:

```text
App Mobile -> Backend Railway -> MQTT -> ESP32 ou simulador -> Evento de retorno
```

---

## ✅ Validacao Recomendada

Backend:

```bash
cd backend
npm run build
npm test -- --runInBand
```

Mobile:

```bash
cd mobile
npx tsc --noEmit
npm test -- --watchAll=false
```

Fluxo manual minimo:

```text
1. Abrir /saude da API online
2. Rodar npm run start:online no mobile
3. Criar usuario
4. Fazer login
5. Criar paciente
6. Criar medicamento
7. Criar agendamento
8. Conferir dashboard, agenda e gavetas
9. Rodar npm run iot:diagnosticar quando MQTT estiver configurado
```

---

<div align="center">
  <sub>Desenvolvido com 🐊 pela equipe <strong>CodeGators</strong> · FATEC Jacareí · 2026</sub>
</div>
