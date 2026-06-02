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

- Node.js 20
- npm
- Docker e Docker Compose

### Backend com PostgreSQL local

1. Instale as dependencias do backend:

```bash
cd backend
npm install
```

2. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Suba o PostgreSQL:

```bash
cd ..
docker compose up -d postgres
```

4. Rode as migrations:

```bash
cd backend
npm run migration:run
```

5. Verifique se as tabelas esperadas foram criadas:

```bash
npm run db:check
```

6. Inicie a API:

```bash
npm run dev
```

A API ficara disponivel em:

```text
http://localhost:3000
```

Rotas de saude:

```text
GET http://localhost:3000/health
GET http://localhost:3000/saude
```

Documentacao interativa da API:

```text
http://localhost:3000/docs
```

JSON OpenAPI:

```text
http://localhost:3000/docs.json
```

### Comandos uteis do backend

```bash
npm run lint
npm test
npm run build
npm run migration:run
npm run migration:revert
npm run db:check
```

### Deploy em nuvem

O caminho recomendado para apresentacao e testes remotos e:

- Backend: Railway
- Banco: Neon PostgreSQL
- MQTT: HiveMQ Cloud

Passo a passo:

```text
docs/GUIA_DEPLOY_NUVEM.md
```

### Banco de dados

Configuracao local padrao:

```text
POSTGRES_DB=abp4
POSTGRES_USER=abp4user
POSTGRES_PASSWORD=abp4pass
DATABASE_URL=postgresql://abp4user:abp4pass@localhost:5432/abp4
```

As credenciais acima sao apenas para desenvolvimento local. Arquivos `.env` reais nao devem ser commitados.

Se o comando `docker compose` nao estiver disponivel, instale o Docker antes de rodar as migrations. Sem o PostgreSQL ativo, o backend nao conseguira iniciar porque ele valida a conexao com o banco na subida.

---

<div align="center">
  <sub>Desenvolvido com 🐊 pela equipe <strong>CodeGators</strong> · FATEC Jacareí · 2026</sub>
</div>
