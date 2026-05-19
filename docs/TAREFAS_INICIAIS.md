# Tarefas Iniciais - PillGator

Esta lista organiza os primeiros passos de desenvolvimento do mobile e backend. A parte de IoT nao entra neste fluxo inicial.

Referencia complementar:

- `docs/REQUISITOS_DESAFIO_4DSM.md`: rastreabilidade entre o PDF do desafio e as tarefas do projeto.

Observacao de escopo: a implementacao do firmware/codigo C++ do dispositivo IoT fica fora do nosso escopo. Porem, contratos, endpoints, eventos, banco, app mobile, notificacoes, deploy, documentacao e integracao com o dispositivo ficam no nosso escopo.

## 0. Preparacao do Git

- [x] Verificar branch principal remota.
- [x] Criar branch local `develop` a partir de `main`.
- [x] Criar branch local `docs/contexto-roadmap-inicial`.
- [x] Publicar `develop` no GitHub.
- [x] Publicar documentacao inicial no GitHub.
- [x] Abrir PR de documentacao/configuracao inicial para `develop`.

Comandos sugeridos:

```bash
git push origin develop
git push -u origin docs/contexto-roadmap-inicial
```

Depois de publicar as branches, abrir PR no GitHub:

```text
base: develop
compare: docs/contexto-roadmap-inicial
titulo: docs: adiciona contexto e roadmap inicial
```

## 1. Fundacao do Backend

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/backend-fundacao-typeorm
```

Tarefas:

- [x] Separar `backend/src/app.ts` e `backend/src/server.ts`.
- [x] Criar rota `GET /saude`.
- [x] Manter rota `GET /health` para compatibilidade.
- [x] Ajustar teste de saude para importar a app real.
- [x] Instalar TypeORM e `reflect-metadata`.
- [x] Configurar `DataSource` do TypeORM.
- [x] Configurar variaveis de ambiente do banco.
- [x] Criar entidade `Medicamento`.
- [x] Criar migration inicial.
- [x] Validar `npm run lint`, `npm test` e `npm run build`.
- [x] Abrir PR para `develop`.

## 2. CRUD de Medicamentos

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/crud-medicamentos
```

Tarefas:

- [x] Criar modulo `medicamentos`.
- [x] Criar controller de medicamentos.
- [x] Criar service de medicamentos.
- [x] Criar rotas:
  - `POST /medicamentos`
  - `GET /medicamentos`
  - `GET /medicamentos/:id`
  - `PUT /medicamentos/:id`
  - `DELETE /medicamentos/:id`
- [x] Trocar dados mockados por dados do PostgreSQL.
- [x] Criar validacoes de entrada.
- [x] Criar testes integrados.
- [x] Abrir PR para `develop`.

## 3. Agendamentos

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/agendamentos-medicamentos
```

Tarefas:

- [x] Criar entidade `AgendamentoMedicamento`.
- [x] Criar modulo `agendamentos`.
- [x] Criar CRUD de agendamentos.
- [x] Vincular agendamentos a medicamentos.
- [x] Validar horarios e dias da semana.
- [x] Suportar agendamentos por horarios fixos.
- [x] Suportar agendamentos por intervalo, como de 8 em 8 horas.
- [x] Permitir inicio/fim do tratamento e tolerancia de retirada.
- [x] Criar testes.
- [x] Abrir PR para `develop`.

## 4. Configurar e Validar Banco Local

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/configuracao-banco-local
```

Tarefas:

- [x] Criar `backend/.env.example` com `PORT` e `DATABASE_URL`.
- [x] Revisar `docker-compose.yml` para Postgres e backend.
- [x] Subir Postgres local com `docker compose up -d postgres`.
- [x] Rodar migrations do TypeORM no banco local.
- [x] Validar tabelas `medicamentos` e `agendamentos_medicamentos`.
- [x] Criar script de verificacao das tabelas do banco.
- [x] Subir backend conectado ao banco real.
- [x] Testar manualmente rotas principais usando banco local.
- [x] Documentar comandos no README.
- [x] Garantir que dados sensiveis continuem fora do Git.

## 5. Eventos e Historico

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/historico-eventos
```

Tarefas:

- [x] Criar entidade `EventoMedicamento`.
- [x] Criar modulo `eventos`.
- [x] Criar endpoint para registrar evento.
- [x] Criar endpoint para listar historico.
- [x] Registrar eventos de alerta emitido.
- [x] Registrar eventos de compartimento aberto.
- [x] Registrar eventos de medicamento retirado.
- [x] Registrar eventos de atraso ou falha.
- [x] Relacionar eventos a medicamento, agendamento e dispositivo quando existir.
- [x] Preparar tipos de evento para futura integracao IoT.
- [x] Criar testes.
- [ ] Abrir PR para `develop`.

## 6. Usuarios, Pacientes e Responsaveis

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/usuarios-pacientes-responsaveis
```

Tarefas:

- [x] Criar entidade `Usuario`.
- [x] Criar entidade `Paciente`.
- [x] Criar vinculo entre paciente e responsaveis.
- [x] Permitir um ou mais responsaveis por paciente.
- [x] Criar CRUD minimo de usuarios/pacientes/responsaveis.
- [x] Preparar modelo para responsaveis receberem notificacoes.
- [x] Criar listagem de pacientes vinculados ao responsavel logado.
- [x] Vincular automaticamente novo paciente ao responsavel que criou.
- [x] Restringir acesso do responsavel apenas aos pacientes vinculados a ele.
- [x] Simplificar cadastro: pacientes ficam em `/pacientes`, e responsavel pode usar `souEuMesmo` quando tambem for paciente.
- [x] Criar testes.
- [ ] Abrir PR para `develop`.

## 7. Autenticacao e Seguranca

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/autenticacao-seguranca
```

Tarefas:

- [x] Criar login.
- [x] Criar hash de senha.
- [x] Criar autenticacao com JWT ou estrategia equivalente.
- [x] Proteger rotas privadas.
- [x] Separar permissoes de paciente, responsavel e administrador.
- [x] Garantir que dados sensiveis nao sejam retornados em respostas da API.
- [x] Documentar variaveis de seguranca no `.env.example`.
- [x] Criar testes.
- [ ] Abrir PR para `develop`.

## 8. Dispositivos e Compartimentos

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/dispositivos-compartimentos
```

Tarefas:

- [x] Criar entidade `Dispositivo`.
- [x] Criar entidade `Compartimento`.
- [x] Vincular dispositivo a paciente.
- [x] Permitir multiplos compartimentos por dispositivo.
- [x] Associar medicamento a compartimento.
- [x] Criar status de compartimento: bloqueado, liberado, aberto, erro.
- [x] Criar CRUD/API para dispositivos e compartimentos.
- [x] Criar testes.
- [ ] Abrir PR para `develop`.

## 9. Integracao Backend com IoT

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/integracao-iot-backend
```

Tarefas:

- [ ] Definir protocolo inicial: HTTP ou MQTT.
- [ ] Criar contrato para dispositivo buscar programacoes.
- [ ] Criar endpoint/topico para registrar abertura de compartimento.
- [ ] Criar endpoint/topico para registrar retirada de medicamento.
- [ ] Criar endpoint/topico para registrar alerta emitido.
- [ ] Criar endpoint/topico para registrar falha do dispositivo.
- [ ] Criar mecanismo de identificacao/autenticacao do dispositivo.
- [ ] Documentar payloads de integracao.
- [ ] Criar testes de contrato.
- [ ] Abrir PR para `develop`.

Observacao: esta tarefa nao implementa o firmware C++ do dispositivo. Ela implementa apenas o lado backend e a documentacao de integracao.

## 10. Monitoramento de Atrasos e Notificacoes

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/notificacoes-atrasos
```

Tarefas:

- [x] Criar regra de tolerancia por agendamento.
- [x] Detectar medicamento nao retirado dentro do tempo esperado.
- [x] Registrar evento de atraso.
- [x] Criar entidade/camada de notificacoes.
- [x] Enviar notificacao para responsaveis cadastrados.
- [x] Criar historico de notificacoes enviadas.
- [x] Preparar integracao com push notification no mobile.
- [x] Criar testes.
- [ ] Abrir PR para `develop`.

## 11. Sincronizacao, Confiabilidade e Retry

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/sincronizacao-confiabilidade
```

Tarefas:

- [ ] Definir estrategia de sincronizacao entre backend, app e dispositivo.
- [ ] Criar controle de `ultimoSinalEm` do dispositivo.
- [ ] Criar status online/offline do dispositivo.
- [ ] Criar estrategia de retry para eventos vindos do IoT.
- [ ] Definir como lidar com eventos duplicados.
- [ ] Preparar armazenamento local/simulacao para falhas temporarias de conexao.
- [ ] Criar testes para idempotencia/retry quando aplicavel.

## 12. Restricoes e Interacoes entre Medicamentos

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/restricoes-medicamentos
```

Tarefas:

- [ ] Modelar restricoes entre medicamentos do mesmo paciente.
- [ ] Permitir registrar que dois medicamentos nao devem ser tomados juntos.
- [ ] Permitir configurar intervalo minimo entre medicamentos conflitantes.
- [ ] Alertar ao criar ou alterar agendamento com conflito.
- [ ] Criar testes para conflitos simples.
- [ ] Avaliar integracao futura com base publica de medicamentos/bulas.

Observacao: esta tarefa nao substitui orientacao medica. O sistema deve alertar sobre restricoes cadastradas e, futuramente, restricoes vindas de fonte confiavel.

## 13. Base do Mobile

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/mobile-base
```

Tarefas:

- [ ] Criar `mobile/src/servicos/api.ts` com Axios.
- [ ] Criar tipos TypeScript para medicamento, agendamento e evento.
- [ ] Substituir telas de template por telas reais.
- [ ] Criar fluxo de login/autenticacao.
- [ ] Criar tela inicial com proximos medicamentos.
- [ ] Criar tela de medicamentos.
- [ ] Criar tela de agendamentos/programacao.
- [ ] Criar tela de historico de administracoes.
- [ ] Preparar recebimento/visualizacao de notificacoes.
- [ ] Consumir `GET /medicamentos`.
- [ ] Criar estados de carregamento, erro e vazio.
- [ ] Ajustar navegacao por abas.
- [ ] Aplicar diretrizes de acessibilidade para idosos.
- [ ] Abrir PR para `develop`.

## 14. Base Publica de Medicamentos e Bulas

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/base-medicamentos-anvisa
```

Tarefas:

- [ ] Pesquisar fonte oficial de CSV/dados abertos da Anvisa para medicamentos.
- [ ] Criar rotina de importacao periodica do CSV da Anvisa.
- [ ] Salvar medicamentos de referencia no banco.
- [ ] Modelar campos como registro, principio ativo, nome comercial, empresa e apresentacao.
- [ ] Criar endpoint `GET /base-medicamentos?busca=dipirona`.
- [ ] Criar endpoint `GET /base-medicamentos/:registro`.
- [ ] Criar endpoint `GET /base-medicamentos/:registro/bula`.
- [ ] No mobile, permitir buscar medicamento na base antes de adicionar ao tratamento.
- [ ] Criar testes de importacao e consulta.

Observacao: esta base deve ajudar o cadastro, mas nao substitui o medicamento do paciente. O medicamento cadastrado no tratamento continua sendo uma entidade propria do PillGator.

## 15. Documentacao Interativa da API com Swagger

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/swagger-api
```

Tarefas:

- [x] Instalar e configurar Swagger/OpenAPI no backend.
- [x] Expor a documentacao em `GET /docs`.
- [x] Expor o JSON OpenAPI em `GET /docs.json`.
- [x] Documentar rotas de saude, medicamentos e agendamentos.
- [x] Documentar exemplos de payload e respostas de erro.
- [x] Garantir que seja possivel testar as rotas pelo Swagger UI.
- [x] Criar teste simples garantindo que `/docs.json` responde.

## 16. Documentacao Tecnica e Diagramas

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c docs/arquitetura-diagramas
```

Tarefas:

- [ ] Documentar arquitetura geral da solucao.
- [ ] Criar diagrama de componentes.
- [ ] Criar diagrama de casos de uso.
- [x] Criar diagrama/descricao da comunicacao app/backend/IoT.
- [ ] Documentar modelo de dados.
- [ ] Documentar estrategia de branches/versionamento.
- [x] Documentar limites de escopo do firmware IoT.

## 17. Deploy, Conteinerizacao e Ambiente de Nuvem

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/deploy-backend
```

Tarefas:

- [ ] Validar Dockerfile do backend.
- [ ] Validar `docker-compose.yml` completo.
- [ ] Definir ambiente de homologacao/producao.
- [ ] Configurar variaveis de ambiente do deploy.
- [ ] Validar CD do backend em ambiente real.
- [ ] Garantir feedback claro de build/deploy no GitHub Actions.
- [ ] Documentar processo de deploy.

## 18. Qualidade e CI/CD

Tarefas:

- [x] Garantir que o backend rode `lint`, `test` e `build` no CI.
- [ ] Adicionar scripts reais de `lint` e `test` no mobile.
- [x] Confirmar que PR para `develop` executa CI.
- [x] Confirmar que CD backend executa apenas em merge/push para `main`.
- [x] Documentar comandos de execucao local no README.

## Ordem Recomendada

1. Fundacao do backend.
2. TypeORM/PostgreSQL.
3. CRUD de medicamentos.
4. Agendamentos.
5. Configurar e validar banco local.
6. Eventos/historico.
7. Usuarios, pacientes e responsaveis.
8. Autenticacao e seguranca.
9. Dispositivos e compartimentos.
10. Integracao backend com IoT.
11. Monitoramento de atrasos e notificacoes.
12. Sincronizacao, confiabilidade e retry.
13. Restricoes e interacoes entre medicamentos.
14. Mobile consumindo a API.
15. Swagger/OpenAPI para testar rotas.
16. Documentacao tecnica e diagramas.
17. Deploy/conteinerizacao em ambiente real.
18. Base publica de medicamentos e bulas.
19. Ajustes finais de CI/CD e qualidade.
