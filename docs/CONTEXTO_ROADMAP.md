# Contexto e Roadmap - PillGator

## Visao Geral

O PillGator e um projeto academico de ABP do 4o semestre de DSM da FATEC Jacarei. O objetivo e construir uma solucao para controle de medicamentos, com aplicativo mobile para pacientes/cuidadores e backend para cadastro, agenda, historico e monitoramento.

O firmware/codigo C++ do dispositivo IoT ficara sob responsabilidade de outros membros do grupo. O restante da solucao fica neste roadmap, incluindo contratos e integracao backend com o dispositivo.

- Aplicativo mobile com React Native e Expo.
- Backend com Node.js, TypeScript, Express, TypeORM e PostgreSQL.
- Comunicacao mobile/backend usando Axios.
- Integracao backend com IoT por HTTP/MQTT ou protocolo equivalente.
- Banco de dados PostgreSQL.
- CI/CD com GitHub Actions.

Referencia complementar:

- `docs/REQUISITOS_DESAFIO_4DSM.md`: rastreabilidade entre o PDF do desafio e as frentes de trabalho.

## Estado Atual do Projeto

### Backend

Tecnologias atuais:

- Node.js
- TypeScript
- Express
- CORS
- PostgreSQL instalado como dependencia `pg`
- Jest/Supertest configurados parcialmente
- Dockerfile

Implementado hoje:

- `GET /health` e `GET /saude` retornando `{ status: "ok" }`.
- Estrutura separada entre `app.ts` e `server.ts`.
- TypeORM configurado com PostgreSQL.
- Entidades e migrations iniciais de medicamentos e agendamentos.
- CRUD de medicamentos.
- CRUD de agendamentos.
- Testes automatizados de saude, medicamentos e agendamentos.

Ainda falta:

- Autenticacao.
- CRUD de usuarios, pacientes e responsaveis.
- Validar conexao real com PostgreSQL via Docker/migrations locais.
- Registro de tomadas/retiradas.
- Regras de alerta.
- Integracao backend com dispositivo IoT.
- Notificacoes para responsaveis.
- Swagger/OpenAPI.
- Deploy em ambiente real.

### Mobile

Tecnologias atuais:

- React Native
- Expo
- Expo Router
- Axios instalado

Implementado hoje:

- Estrutura inicial gerada pelo template do Expo.
- Duas abas de exemplo.

Ainda falta:

- Telas reais do PillGator.
- Camada de servicos HTTP com Axios.
- Fluxo de autenticacao.
- Cadastro e listagem de medicamentos.
- Agenda de horarios.
- Historico de eventos.
- Status do dispositivo/gaveta vindo do backend.
- Estados de loading, erro e vazio.
- Padrao visual acessivel para idosos e cuidadores.

### Banco de Dados

Existe Postgres no `docker-compose.yml`, mas o backend ainda nao usa o banco.

Ainda falta:

- Definir modelo relacional.
- Configurar TypeORM.
- Criar migrations.
- Separar ambiente local, teste e producao.

### IoT

Existe um prototipo em Arduino/Tinkercad com servos, LEDs, LCD, buzzer e sensores. A parte de IoT nao faz parte deste escopo imediato de desenvolvimento.

Para o backend, vamos deixar contratos preparados para futura integracao IoT, como eventos de gaveta aberta, medicamento retirado, dispositivo online/offline e status da gaveta.

## Stack Definida

### Backend

- Node.js
- TypeScript
- Express
- TypeORM
- PostgreSQL
- Jest
- Supertest
- Docker
- GitHub Actions

### Mobile

- React Native
- Expo
- Expo Router
- Axios
- TypeScript

### Boas Praticas

O projeto deve seguir:

- DRY: evitar duplicacao de regras, schemas e chamadas HTTP.
- SOLID: separar responsabilidades e depender de abstracoes simples quando fizer sentido.
- Camadas claras: rotas, controllers, services, repositories/entities.
- Nomes em portugues para funcoes, classes, variaveis e rotas criadas pelo time.
- Nomes vindos de bibliotecas devem permanecer no padrao original da biblioteca.
- Validacao de dados na entrada da API.
- Erros padronizados.
- Testes para regras importantes.
- Commits pequenos e revisaveis.

## Arquitetura Backend Proposta

Estrutura sugerida:

```text
backend/src
  config/
    data-source.ts
    env.ts
  database/
    migrations/
  entidades/
    Usuario.ts
    Medicamento.ts
    AgendamentoMedicamento.ts
    EventoMedicamento.ts
    Dispositivo.ts
  modulos/
    saude/
      rotas.ts
      controlador.ts
    usuarios/
      rotas.ts
      controlador.ts
      servico.ts
    medicamentos/
      rotas.ts
      controlador.ts
      servico.ts
    agendamentos/
      rotas.ts
      controlador.ts
      servico.ts
    eventos/
      rotas.ts
      controlador.ts
      servico.ts
    dispositivos/
      rotas.ts
      controlador.ts
      servico.ts
  middlewares/
    tratarErros.ts
    validarRequisicao.ts
  app.ts
  server.ts
```

Separacao recomendada:

- `server.ts`: apenas sobe o servidor.
- `app.ts`: cria e configura o Express.
- `rotas.ts`: define endpoints.
- `controlador.ts`: recebe request/response e chama servicos.
- `servico.ts`: contem regras de negocio.
- `entidades`: modelos persistidos pelo TypeORM.

## Modelo Inicial de Dados

### Usuario

Representa paciente, cuidador ou administrador.

Campos sugeridos:

- `id`
- `nome`
- `email`
- `senhaHash`
- `tipo`: `paciente`, `cuidador`, `administrador`
- `telefone`
- `criadoEm`
- `atualizadoEm`

### Medicamento

Representa um medicamento cadastrado para um paciente.

Campos sugeridos:

- `id`
- `pacienteId`
- `nome`
- `dosagem`
- `observacoes`
- `ativo`
- `criadoEm`
- `atualizadoEm`

### AgendamentoMedicamento

Representa os horarios em que um medicamento deve ser tomado.

Campos sugeridos:

- `id`
- `medicamentoId`
- `horario`
- `diasSemana`
- `toleranciaMinutos`
- `ativo`
- `criadoEm`
- `atualizadoEm`

### EventoMedicamento

Representa eventos do uso do medicamento.

Campos sugeridos:

- `id`
- `medicamentoId`
- `agendamentoId`
- `tipo`: `liberado`, `retirado`, `ignorado`, `atrasado`, `erro_dispositivo`
- `ocorridoEm`
- `origem`: `mobile`, `backend`, `iot`
- `observacao`

### Dispositivo

Representa uma gaveta/dispositivo fisico no futuro.

Campos sugeridos:

- `id`
- `pacienteId`
- `identificadorExterno`
- `nome`
- `status`: `online`, `offline`, `bloqueado`, `desbloqueado`, `aberto`
- `ultimoSinalEm`
- `criadoEm`
- `atualizadoEm`

## Rotas Iniciais Propostas

Padrao: usar nomes em portugues.

```text
GET    /saude

POST   /usuarios
GET    /usuarios/:id

POST   /medicamentos
GET    /medicamentos
GET    /medicamentos/:id
PUT    /medicamentos/:id
DELETE /medicamentos/:id

POST   /agendamentos
GET    /agendamentos
GET    /agendamentos/:id
PUT    /agendamentos/:id
DELETE /agendamentos/:id

POST   /eventos-medicamento
GET    /eventos-medicamento

GET    /dispositivos
GET    /dispositivos/:id
PATCH  /dispositivos/:id/status
```

Observacao: a rota atual `/health` pode continuar por compatibilidade com CI/CD, mas a rota em portugues `/saude` tambem deve existir.

## Arquitetura Mobile Proposta

Estrutura sugerida:

```text
mobile
  app/
    (auth)/
      login.tsx
    (tabs)/
      index.tsx
      medicamentos.tsx
      agenda.tsx
      historico.tsx
      perfil.tsx
  src/
    config/
      ambiente.ts
    servicos/
      api.ts
      medicamentosServico.ts
      agendamentosServico.ts
      eventosServico.ts
    tipos/
      medicamento.ts
      agendamento.ts
      eventoMedicamento.ts
    componentes/
      BotaoPrimario.tsx
      CampoTexto.tsx
      EstadoVazio.tsx
      IndicadorCarregamento.tsx
```

Telas iniciais:

- Login simples.
- Inicio com proximos medicamentos.
- Medicamentos cadastrados.
- Cadastro/edicao de medicamento.
- Agenda de horarios.
- Historico de eventos.
- Perfil/configuracoes.

## Git, Branches e Pull Requests

Estado verificado:

- Branch local atual antes deste documento: `main`.
- Branch remota principal: `origin/main`.
- Nao existia `develop` local ou remota no momento da verificacao.
- CI ja esta configurado para `main`, `develop` e `feature/**`.
- CD backend roda em push para `main`.

Fluxo recomendado:

1. `main`: branch estavel/deploy.
2. `develop`: branch de integracao do time.
3. `feature/nome-da-tarefa`: novas funcionalidades.
4. `fix/nome-do-ajuste`: correcoes.
5. Pull requests devem ir para `develop`.
6. Quando `develop` estiver validada, abrir PR de `develop` para `main`.

Como ainda nao existia `develop`, ela deve ser criada a partir da `main` e enviada para o remoto antes dos primeiros PRs.

## CI/CD Atual

### CI

Arquivo: `.github/workflows/ci.yml`

Executa em:

- Push para `main`, `develop` e `feature/**`.
- Pull request para `main` e `develop`.

Jobs:

- Backend: `npm ci`, lint, test e build.
- Mobile: `npm ci`, lint e test.

Ponto de atencao:

- O mobile possui script de `test`? Hoje o `package.json` do mobile nao define `test` nem `lint`. Como o workflow usa `--if-present`, isso nao quebra, mas tambem nao testa nada no mobile.
- O backend tem `lint`, `test` e `build`, mas os testes precisam importar a aplicacao real em vez de recriar um Express separado.

### CD Backend

Arquivo: `.github/workflows/cd-backend.yml`

Executa em:

- Push para `main`.

Acao:

- Build e push da imagem Docker do backend para GitHub Container Registry.

## Roadmap de Implementacao

### Fase 1 - Fundacao do Backend

- Separar `app.ts` e `server.ts`.
- Criar rota `/saude` mantendo `/health`.
- Instalar e configurar TypeORM.
- Criar `data-source.ts`.
- Conectar backend ao PostgreSQL.
- Criar primeira migration.
- Criar entidades iniciais.
- Padronizar erros.
- Ajustar testes para usar a aplicacao real.

### Fase 2 - Medicamentos e Agendamentos

- Criar CRUD de medicamentos.
- Criar CRUD de agendamentos.
- Criar validacoes de entrada.
- Criar testes de services e rotas.
- Remover dados mockados de `/medicamentos`.

### Fase 2.5 - Banco Local

- Criar `backend/.env.example`.
- Subir PostgreSQL local pelo Docker Compose.
- Rodar migrations do TypeORM.
- Validar tabelas e conexao real do backend.
- Documentar comandos de banco no README.

### Fase 3 - Eventos e Historico

- Criar registro de eventos de medicamento.
- Listar historico por paciente e medicamento.
- Registrar eventos manuais pelo mobile.
- Preparar contratos para futura integracao IoT.

### Fase 3.5 - Restricoes e Interacoes

- Modelar restricoes entre medicamentos do mesmo paciente.
- Permitir cadastrar medicamentos que nao podem ser tomados juntos.
- Permitir intervalo minimo entre medicamentos conflitantes.
- Bloquear ou alertar ao criar agendamentos conflitantes.
- Manter esta regra separada do agendamento simples, porque depende de contexto clinico e fonte confiavel.

### Fase 4 - Mobile Base

- Criar cliente Axios centralizado.
- Definir tipos TypeScript compartilhados no mobile.
- Substituir telas de template por telas reais.
- Implementar listagem de medicamentos.
- Implementar cadastro/edicao de medicamento.
- Implementar agenda.
- Implementar historico.

### Fase 5 - Autenticacao e Usuarios

- Criar usuarios.
- Criar login.
- Criar hash de senha.
- Criar JWT ou estrategia equivalente.
- Proteger rotas privadas.
- Adaptar mobile para armazenar sessao com seguranca.

### Fase 6 - Qualidade e Entrega

- Melhorar cobertura de testes.
- Adicionar lint/test/build tambem no mobile.
- Revisar Docker e variaveis de ambiente.
- Configurar Swagger/OpenAPI para testar as rotas em ambiente local.
- Documentar como rodar localmente.
- Garantir CI verde em PR para `develop`.
- Garantir CD backend somente em merge para `main`.

### Fase 7 - Base Publica de Medicamentos e Bulas

- Pesquisar e validar CSV/dados abertos oficiais da Anvisa.
- Criar importacao periodica para carregar a base no banco.
- Criar endpoints proprios para consulta:
  - `GET /base-medicamentos?busca=dipirona`
  - `GET /base-medicamentos/:registro`
  - `GET /base-medicamentos/:registro/bula`
- Permitir que o mobile consulte a base antes de cadastrar um medicamento no tratamento do paciente.
- Manter a base publica separada dos medicamentos cadastrados para cada paciente.

### Atualizacao - Backend Alinhado ao Fluxo Real

- Cadastro de responsavel com dados completos, senha e autenticacao.
- Paciente como entidade de cuidado, com vinculo N:N com responsaveis.
- Medicamento do paciente separado da base publica de medicamentos.
- Agendamento vinculado ao medicamento do paciente.
- Notificacoes push com tokens Expo e historico em `notificacoes`.
- Dispositivos e gavetas vinculados ao paciente.
- Comandos de liberar/travar gaveta para o IoT buscar.
- Eventos do IoT com chave idempotente para evitar duplicidade.
- Contrato IoT documentado em `docs/CONTRATO_IOT_BACKEND.md`.

## Lista Inicial de Tarefas

### Tarefa 1 - Preparar fluxo Git

- Criar branch `develop` a partir da `main`.
- Enviar `develop` para o remoto.
- Criar branch de trabalho para cada tarefa.
- Confirmar que PRs serao abertos contra `develop`.

### Tarefa 2 - Documentar roadmap

- Adicionar este arquivo em `docs/CONTEXTO_ROADMAP.md`.
- Abrir PR para `develop`.

### Tarefa 3 - Refatorar bootstrap do backend

- Criar `backend/src/app.ts`.
- Deixar `backend/src/server.ts` apenas com o `listen`.
- Mover rotas atuais para modulos.
- Ajustar teste de saude para importar `app`.

### Tarefa 4 - Configurar TypeORM e PostgreSQL

- Instalar TypeORM e reflect-metadata.
- Criar arquivo de configuracao do data source.
- Criar entidade inicial de medicamento.
- Criar migration inicial.
- Atualizar Docker/env.

### Tarefa 5 - CRUD de medicamentos

- Criar entidade `Medicamento`.
- Criar controller, service e rotas.
- Criar endpoints de listar, buscar, criar, editar e remover.
- Criar testes integrados.

### Tarefa 6 - Base do mobile

- Criar `src/servicos/api.ts` com Axios.
- Criar tela de inicio com proximos medicamentos.
- Criar tela de medicamentos consumindo backend.
- Criar componentes basicos acessiveis.

## Proxima Acao Recomendada

Comecar pela Tarefa 3 e Tarefa 4, porque o backend precisa de base real antes do mobile consumir dados confiaveis.

Branch sugerida para a primeira implementacao:

```text
feature/backend-fundacao-typeorm
```
