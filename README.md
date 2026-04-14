# Sistema Inteligente de Gerenciamento e Dispensação de Medicamentos

**Projeto de Aprendizagem Baseada em Projetos (ABP) - 4º Semestre DSM**
**Faculdade de Tecnologia Professor Francisco de Moura - FATEC Jacareí**

---

## 🐊 Equipe CodeGators
* Anderson
* Arthur Augusto
* Gustavo Silva
* Rafael Shinji
* Rodrigo Augusto
* Stefan Souza

---

## 📌 Sobre o Projeto

O envelhecimento da população e a alta incidência de doenças crônicas exigem um acompanhamento rigoroso na administração de medicamentos. Pensando nisso, este projeto propõe o desenvolvimento de um **Sistema Inteligente de Gerenciamento e Dispensação de Medicamentos com Integração IoT e Aplicativo Móvel**. 

A solução visa apoiar o tratamento medicamentoso de idosos e pacientes que fazem uso de múltiplos fármacos, garantindo que o remédio certo seja tomado no horário correto. O sistema alerta o paciente no momento exato e, em caso de não retirada do medicamento, notifica remotamente um responsável ou cuidador.

### 🎯 Principais Funcionalidades
* **Controle Físico Seguro (IoT):** A gaveta inteligente bloqueia compartimentos indevidos e libera apenas o remédio do horário programado.
* **Alertas Sonoros:** Emissão de aviso sonoro na hora exata da medicação.
* **Monitoramento Remoto:** Registro de retirada do medicamento e envio de notificações push via app para responsáveis caso o paciente esqueça.
* **Gestão via App:** Aplicativo simples e intuitivo para visualizar a programação de medicamentos, histórico e alertas.

---

## 🛠️ Arquitetura e Tecnologias

A solução segue uma arquitetura distribuída (Cliente-Servidor), composta pelas seguintes tecnologias obrigatórias:

**Backend (API REST)**
* Node.js
* Express
* TypeScript
* Banco de Dados em Nuvem para persistência de histórico e eventos

**Dispositivo IoT**
* Hardware embarcado (Arduino/ESP32) com sensores de abertura, atuadores (servo motores) e buzzer.
* Comunicação segura com o servidor via protocolos HTTP ou MQTT.

**Frontend Mobile**
* Aplicativo nativo ou híbrido focado em usabilidade e acessibilidade para o público idoso.

**DevOps & Infraestrutura**
* **Controle de Versão:** Git com branches organizadas.
* **CI/CD:** Pipeline automatizado (ex: GitHub Actions) executando build, lint e testes automatizados a cada commit.
* **Deploy:** Automatizado em ambiente de nuvem.
* **Conteinerização:** Docker para padronização de ambiente.

---

## 🗓️ Cronograma de Sprints

O desenvolvimento seguirá um modelo incremental, dividido nas seguintes Sprints:

* **Sprint 1:** 13/04 a 30/04/2026
* **Sprint 2:** 04/05 a 21/05/2026
* **Sprint 3:** 25/05 a 11/06/2026
* **Apresentação Final:** Semana de 22 de Julho de 2026

---

## 🚀 Como Executar o Projeto (Em Breve)

*(Esta seção será atualizada ao longo das Sprints conforme o ambiente for configurado)*

### Pré-requisitos
* Node.js v18+
* Docker e Docker Compose

### Rodando o Backend
```bash
# Clone o repositório
git clone [https://github.com/CodeGators/nome-do-repo.git](https://github.com/CodeGators/nome-do-repo.git)

# Acesse a pasta do backend
cd backend

# Instale as dependências
npm install

# Inicie o servidor em modo de desenvolvimento
npm run dev
