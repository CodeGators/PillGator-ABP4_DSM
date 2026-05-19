# Backend - Checklist de Implementacao

Este documento guia a conclusao do backend e banco de dados seguindo o fluxo real do aplicativo PillGator.

## Regras do Produto

- Usuario que baixa o app cria conta sempre como `responsavel`.
- Responsavel pode cuidar de varios pacientes.
- Paciente pode ter varios responsaveis.
- Paciente nao precisa acessar o app.
- Se o responsavel tambem for paciente, o paciente e criado com `souEuMesmo: true`.
- Se um paciente quiser acesso ao app, ele deve ter uma conta de responsavel vinculada ao proprio paciente.
- A base CSV de remedios e somente consulta. Responsavel nao edita nem apaga essa base.
- Responsavel cria, altera e remove apenas o medicamento do paciente, nunca o medicamento da base.
- Agendamento pertence ao medicamento do paciente.
- Gavetas/compartimentos pertencem ao dispositivo do paciente.
- IoT fica para o final, mas o backend deve preparar contratos para destravar/travar gavetas e receber eventos.

## Checklist Geral

### 1. Cadastro de Responsavel

- [x] Adicionar campos obrigatorios de cadastro em `usuarios`: CPF, data de nascimento e endereco.
- [x] Validar CPF, CEP, email, senha e confirmacao de senha.
- [x] Atualizar migration, entidade, servico, testes e Swagger.
- [x] Garantir que cadastro publico cria apenas `responsavel`.

### 2. Modelo de Usuario e Paciente

- [x] Remover uso pratico de `paciente` como tipo de usuario.
- [x] Manter paciente como entidade de cuidado em `/pacientes`.
- [x] Permitir responsavel criar paciente para outra pessoa.
- [x] Permitir responsavel criar paciente para si mesmo com `souEuMesmo`.
- [x] Permitir vincular outro responsavel a um paciente existente.
- [x] Garantir que responsavel so acesse pacientes vinculados.

### 3. Base CSV de Medicamentos

- [x] Versionar o CSV em pasta adequada do projeto.
- [x] Criar entidade `BaseMedicamento`.
- [x] Criar migration para `base_medicamentos`.
- [x] Modelar campos principais da base: produto, categoria, principio ativo, concentracao, forma fisica e restricoes.
- [x] Criar rotina/script de importacao do CSV ISO-8859 separado por `;`.
- [x] Salvar medicamentos de referencia no banco local.
- [x] Criar endpoint `GET /base-medicamentos?busca=...`.
- [x] Criar endpoint `GET /base-medicamentos/:id`.
- [x] Criar testes de importacao e consulta.
- [x] Documentar no Swagger.

### 4. Medicamento do Paciente

- [ ] Refatorar `medicamentos` para representar medicamento do paciente.
- [ ] Adicionar `pacienteId`.
- [ ] Adicionar `baseMedicamentoId` opcional.
- [ ] Adicionar quantidade administrada e unidade.
- [ ] Garantir que responsavel so altere medicamentos dos seus pacientes.
- [ ] Impedir alteracao da base de medicamentos por responsavel.
- [ ] Atualizar testes e Swagger.

### 5. Agendamentos

- [ ] Garantir que agendamento sempre pertence a medicamento do paciente.
- [ ] Validar horarios fixos, dias da semana e intervalos.
- [ ] Validar permissao pelo paciente do medicamento.
- [ ] Preparar consulta de proximas administracoes por paciente/responsavel.
- [ ] Atualizar testes e Swagger.

### 6. Notificacoes Push

- [ ] Criar tabela de tokens push do app.
- [ ] Criar endpoint para registrar token Expo Push.
- [ ] Criar tipos de notificacao: antes do horario, no horario e atraso.
- [ ] Criar rotina/job para gerar notificacoes proximas do horario.
- [ ] Integrar envio real com Expo Push Notification.
- [ ] Manter historico em `notificacoes`.

### 7. Gavetas e Dispositivo

- [ ] Garantir que dispositivo pertence ao paciente.
- [ ] Garantir que compartimento/gaveta so aceite medicamento do mesmo paciente.
- [ ] Permitir responsavel cadastrar gavetas do paciente.
- [ ] Permitir associar medicamento do paciente a uma gaveta.
- [ ] Preparar endpoints para liberar/travar gaveta.
- [ ] Registrar eventos de gaveta aberta/fechada/medicamento retirado.

### 8. Contratos IoT

- [ ] Analisar codigo atual do ESP32 e mapear comandos necessarios.
- [ ] Criar endpoint para dispositivo consultar comandos pendentes.
- [ ] Criar endpoint para dispositivo enviar eventos.
- [ ] Criar controle de status online/offline.
- [ ] Criar estrategia contra eventos duplicados.
- [ ] Documentar contrato para o grupo de IoT.

### 9. Qualidade Final

- [ ] Atualizar `CONTEXTO_ROADMAP.md`.
- [ ] Atualizar `TAREFAS_INICIAIS.md`.
- [ ] Atualizar `REQUISITOS_DESAFIO_4DSM.md`.
- [ ] Rodar migrations em banco local.
- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm test`.
- [ ] Rodar `npm run build`.
- [ ] Abrir PR para `develop`.
