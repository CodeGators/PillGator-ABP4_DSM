<div align="center">

<br/>

```
██████╗ ██╗██╗     ██╗      ██████╗  █████╗ ████████╗ ██████╗ ██████╗
██╔══██╗██║██║     ██║     ██╔════╝ ██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗
██████╔╝██║██║     ██║     ██║  ███╗███████║   ██║   ██║   ██║██████╔╝
██╔═══╝ ██║██║     ██║     ██║   ██║██╔══██║   ██║   ██║   ██║██╔══██╗
██║     ██║███████╗███████╗╚██████╔╝██║  ██║   ██║   ╚██████╔╝██║  ██║
╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
```

### 🔒 Gaveta Inteligente de Medicamentos — IoT + Mobile

**A medicação certa, na hora certa, com segurança física e monitoramento remoto.**

<br/>

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-f59e0b?style=flat-square&logo=clockify&logoColor=white)](https://github.com/CodeGators/PillGator-ABP4_DSM)
[![Backend](https://img.shields.io/badge/backend-Railway-7c3aed?style=flat-square&logo=railway&logoColor=white)](https://pillgator-abp4dsm-production-072b.up.railway.app)
[![Docs](https://img.shields.io/badge/API-Swagger-85ea2d?style=flat-square&logo=swagger&logoColor=black)](https://pillgator-abp4dsm-production-072b.up.railway.app/docs)
[![Node](https://img.shields.io/badge/node-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Expo](https://img.shields.io/badge/mobile-Expo-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![ESP32](https://img.shields.io/badge/IoT-ESP32-e7352c?style=flat-square&logo=espressif&logoColor=white)](https://espressif.com)
[![License](https://img.shields.io/badge/licença-MIT-6366f1?style=flat-square)](LICENSE)

<br/>

> Projeto de Aprendizagem Baseada em Projetos (ABP) · 4º Semestre DSM · FATEC Jacareí
> Orientação: Prof. Francisco de Moura

</div>

---

## O Problema

O esquecimento ou a ingestão incorreta de medicamentos é uma das principais causas de internações evitáveis entre idosos e pacientes polimedicados. Horários confusos, múltiplos remédios e ausência de supervisão tornam a adesão ao tratamento um desafio diário.

## A Solução

O **PillGator** é um sistema integrado de hardware e software que combina uma **gaveta física com travamento eletrônico** e um **aplicativo mobile** para cuidadores. A gaveta permanece trancada e só abre automaticamente no horário exato programado para cada medicamento — sem intervenção manual, sem erro de horário.

```
┌─────────────┐     MQTT      ┌──────────────┐    Push     ┌──────────────┐
│   ESP32     │ ◄──────────── │   Backend    │ ──────────► │  App Mobile  │
│  + Trava    │               │  (Railway)   │             │  Cuidador    │
│  + Buzzer   │               │  + Neon DB   │             │             │
│  + Sensor   │ ──────────────►              │             │             │
└─────────────┘   Confirmação  └──────────────┘             └──────────────┘
```

---

## Funcionalidades

### 🔒 Controle Físico (Hardware)
- Trava eletromecânica que **só abre no horário programado**
- Fora do horário: compartimento permanece fisicamente bloqueado
- Sensor de abertura confirma se o medicamento foi retirado
- Buzzer com alerta sonoro no momento da dose

### 📱 Aplicativo Mobile
- Cadastro de pacientes, medicamentos e horários de dose
- Histórico completo de retiradas e eventos
- Status em tempo real da gaveta (bloqueada / desbloqueada / aberta)
- **Interface pensada para idosos:** fonte ampla, alto contraste, navegação simples
- Notificação push ao cuidador se o remédio não for retirado no prazo

### 🌐 Monitoramento Remoto
- Cuidadores acompanham a adesão ao tratamento de qualquer lugar
- Alertas de não-retirada com registro de data e hora
- Histórico de eventos auditável

---

## Arquitetura e Tecnologias

| Camada | Stack |
|---|---|
| **Hardware** | ESP32, trava solenóide, buzzer, sensor reed switch |
| **Protocolo IoT** | MQTT (broker em nuvem) |
| **Backend** | Node.js 20 · Express · TypeORM · PostgreSQL (Neon) |
| **Mobile** | React Native · Expo · TypeScript |
| **Infraestrutura** | Railway (API) · Neon (banco) · EAS (build APK) |
| **Docs API** | Swagger / OpenAPI |

### Estrutura de Pastas

```
PillGator-ABP4_DSM/
├── backend/      # API REST — Node.js, Express, TypeORM, PostgreSQL
├── mobile/       # App React Native com Expo
├── iot/          # Código-fonte e referências do ESP32
└── docs/         # Guias de deploy, IoT, testes e checklist do frontend
```

---

## Links Rápidos — Backend em Produção

O backend está publicado no Railway com banco Neon PostgreSQL.

| Recurso | URL |
|---|---|
| **API Base** | `https://pillgator-abp4dsm-production-072b.up.railway.app` |
| **Health Check** | [`/health`](https://pillgator-abp4dsm-production-072b.up.railway.app/health) · [`/saude`](https://pillgator-abp4dsm-production-072b.up.railway.app/saude) |
| **Documentação** | [`/docs`](https://pillgator-abp4dsm-production-072b.up.railway.app/docs) (Swagger) |

---

## Configuração e Execução

### Pré-requisitos

- [Node.js 20+](https://nodejs.org)
- [Docker e Docker Compose](https://www.docker.com) — para banco de dados local
- [Expo Go](https://expo.dev/go) — para testar o app no celular em desenvolvimento

---

### Backend (local)

```bash
# 1. Instale as dependências
cd backend
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env
```

Edite o `.env` gerado. As credenciais padrão para desenvolvimento local são:

```env
POSTGRES_DB=abp4
POSTGRES_USER=abp4user
POSTGRES_PASSWORD=abp4pass
DATABASE_URL=postgresql://abp4user:abp4pass@localhost:5432/abp4
JWT_SECRET=<segredo-forte>
JWT_EXPIRES_IN=8h
```

> ⚠️ Nunca suba arquivos `.env` reais para o repositório.

```bash
# 3. Suba o banco PostgreSQL
cd ..
docker compose up -d postgres

# 4. Execute as migrations
cd backend
npm run migration:run

# 5. (Opcional) Verifique o banco
npm run db:check

# 6. (Opcional) Importe a base de medicamentos
npm run base-medicamentos:importar

# 7. Inicie a API
npm run dev
```

A API local estará disponível em:

```
http://localhost:3000
http://localhost:3000/docs  ← Swagger
```

#### Scripts úteis do backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a API em modo desenvolvimento |
| `npm run build` | Compila o projeto TypeScript |
| `npm test` | Executa os testes |
| `npm run lint` | Verifica o código com ESLint |
| `npm run migration:run` | Aplica todas as migrations pendentes |
| `npm run migration:revert` | Reverte a última migration |
| `npm run db:check` | Verifica a conexão e estado do banco |
| `npm run base-medicamentos:importar` | Importa a base inicial de medicamentos |
| `npm run iot:simular` | Simula o ESP32 via MQTT (sem hardware) |

---

### Backend (Railway — deploy em nuvem)

Configure o serviço no Railway com as seguintes definições:

```
Root Directory:  /backend
Build Command:   npm run build
Start Command:   npm start
```

Variáveis de ambiente obrigatórias no painel do Railway:

```env
DATABASE_URL=<url-do-neon-com-sslmode=require>
JWT_SECRET=<segredo-forte>
JWT_EXPIRES_IN=8h
```

> O MQTT pode ficar desativado durante testes sem hardware — o backend sobe normalmente e registra nos logs que a conexão foi ignorada.

Guia completo: [`docs/GUIA_DEPLOY_NUVEM.md`](docs/GUIA_DEPLOY_NUVEM.md)

---

### App Mobile

```bash
# 1. Instale as dependências
cd mobile
npm install
```

| Cenário | Comando |
|---|---|
| Testar no celular com backend **online** | `npm run start:online` |
| Testar no navegador com backend **online** | `npm run web:online` |
| Testar com backend **local** | `npm start` |

> Ao usar o backend local no celular, o notebook e o celular precisam estar na mesma rede Wi-Fi. O app usa o IP detectado pelo Expo automaticamente.

#### Gerar APK

O projeto inclui o perfil `preview` no EAS para gerar APK apontando para o backend online:

```bash
cd mobile
npm run apk:online
```

Ou, para builds manuais:

```bash
EXPO_PUBLIC_API_URL=https://pillgator-abp4dsm-production-072b.up.railway.app \
  npx expo start --lan
```

---

### IoT — ESP32 e MQTT

O backend já expõe o contrato completo de comandos de gaveta e publicação MQTT.

**Sem hardware disponível**, use o simulador:

```bash
cd backend
npm run iot:simular
```

**Com hardware**, consulte os guias em `/docs`:

| Arquivo | Conteúdo |
|---|---|
| `GUIA_TESTE_ESP32.md` | Setup e flash do firmware |
| `CHECKLIST_IOT_SIMULADOR_MQTT.md` | Passo a passo de validação |
| `CONTRATO_IOT_BACKEND.md` | Especificação dos tópicos e payloads MQTT |

Fluxo de comunicação:

```
App Mobile → Backend (Railway) → MQTT Broker → ESP32 / Simulador → Evento de retorno
```

---

## Validação Rápida

Execute isso antes de abrir um PR ou entregar uma sprint:

**Backend:**

```bash
cd backend
npm run build
npm test -- --runInBand
```

**Mobile:**

```bash
cd mobile
npx tsc --noEmit
npm test -- --watchAll=false
```

**Fluxo manual mínimo (E2E):**

```
1. Acessar /health da API online e confirmar status 200
2. Rodar npm run start:online no mobile
3. Criar usuário e fazer login
4. Cadastrar paciente
5. Cadastrar medicamento
6. Criar agendamento com horário
7. Verificar dashboard, agenda e status da gaveta
```

---

## Cronograma de Sprints

| Sprint | Período | Entregas |
|---|---|---|
| **Sprint 1** | 13/04 → 30/04 | Ambiente configurado, estrutura base do backend, protótipo do hardware |
| **Sprint 2** | 04/05 → 21/05 | Integração IoT ↔ Backend, lógica de travamento/destravamento por horário |
| **Sprint 3** | 25/05 → 11/06 | App mobile, notificações push, testes de integração |
| **Apresentação Final** | Semana de 22/07 | Sistema completo integrado e apresentado |

---

## Equipe

<div align="center">

| Membro | GitHub |
|---|---|
| Anderson Fontes | [@andersonfontes](https://github.com/andersonfontes) |
| Arthur Augusto | [@arthuraugusto](https://github.com/arthuraugusto) |
| Gustavo Silva | [@gustavosilva](https://github.com/gustavosilva) |
| Rafael Shinji | [@rafaelshinji](https://github.com/rafaelshinji) |
| Rodrigo Augusto | [@rodrigoaugusto](https://github.com/rodrigoaugusto) |
| Stefan Souza | [@stefansouza](https://github.com/stefansouza) |

</div>

> Os links acima podem precisar de atualização com os usuários reais do GitHub de cada membro.

---

<div align="center">
  <sub>Desenvolvido pela equipe <strong>CodeGators</strong> · FATEC Jacareí · 4º Semestre DSM · 2026</sub>
</div>
