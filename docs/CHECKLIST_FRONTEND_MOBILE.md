# Checklist de Implementacao do Front-end Mobile

Este checklist guia a implementacao da interface mobile do PillGator em `mobile/`, usando React Native, Expo, Expo Router, TypeScript e Axios. O prototipo `prototipo-interativo---abp-4` deve servir como referencia de identidade visual e UI, nao como codigo a ser copiado.

## Objetivo do App

- [ ] Criar uma interface mobile real para responsaveis acompanharem pacientes, medicamentos, horarios, gavetas, historico e notificacoes.
- [ ] Manter a identidade visual do prototipo: fundo escuro, verde PillGator como cor principal, cards de alto contraste, acoes claras e leitura confortavel.
- [ ] Consumir as rotas reais do backend, sem dados mockados nas telas finais.
- [ ] Priorizar acessibilidade para idosos e cuidadores: fonte legivel, botoes grandes, estados claros e fluxos simples.

## Bibliotecas

### Ja instaladas no `mobile/`

- [x] `expo`
- [x] `expo-router`
- [x] `react-native`
- [x] `axios`
- [x] `@expo/vector-icons`
- [x] `react-native-safe-area-context`
- [x] `react-native-screens`
- [x] `react-native-reanimated`
- [x] `jest-expo`
- [x] `typescript`

### Recomendadas para instalar

- [x] `@tanstack/react-query`
  - Motivo: cache, loading, erro, refetch e invalidacao para chamadas HTTP.
  - Uso: queries de pacientes, medicamentos, agendamentos, notificacoes, dispositivos e eventos.

- [x] `expo-secure-store`
  - Motivo: armazenar o JWT de login de forma mais adequada que AsyncStorage.
  - Uso: persistir token, recuperar sessao e limpar dados no logout.

- [x] `expo-notifications`
  - Motivo: registrar token push do aparelho e integrar com `POST /notificacoes/tokens-push`.
  - Uso: permissoes, token Expo Push, listeners e navegacao ao tocar em notificacao.

- [ ] `react-hook-form`
  - Motivo: formularios com menos estado manual.
  - Uso: login, cadastro de usuario, paciente, medicamento, agendamento e dispositivo.

- [ ] `zod`
  - Motivo: validacao dos formularios e payloads em TypeScript.
  - Uso: schemas compartilhados no front para validar entrada antes de chamar a API.

- [ ] `@hookform/resolvers`
  - Motivo: integrar `zod` ao `react-hook-form`.

- [x] `@react-native-community/datetimepicker`
  - Motivo: campos de data e horario nativos.
  - Uso: data de nascimento, horarios fixos, inicio/fim de tratamento.

- [x] `@testing-library/react-native`
  - Motivo: testar componentes e telas pela perspectiva do usuario.
  - Uso: testes de estados de loading, erro, vazio e acoes principais.

- [x] `expo-image-picker`
  - Motivo: permitir foto opcional do paciente a partir da galeria do aparelho.
  - Uso: cadastro/edicao de paciente e avatar na lista/header.

### Opcionais

- [ ] `lucide-react-native` e `react-native-svg`
  - Motivo: icones consistentes, modernos e legiveis.
  - Observacao: como `@expo/vector-icons` ja esta instalado, podemos comecar com ele e adicionar Lucide apenas se a identidade visual pedir.

- [ ] `react-native-paper`
  - Motivo: componentes prontos, acessibilidade, theming e snackbar.
  - Decisao sugerida: nao usar como base principal agora, porque o visual Material pode brigar com a identidade propria do PillGator. Preferir componentes customizados simples.

## Estrutura de Pastas Proposta

```text
mobile/
  app/
    _layout.tsx
    index.tsx
    login.tsx
    cadastro.tsx
    (app)/
      _layout.tsx
      inicio.tsx
      pacientes.tsx
      medicamentos.tsx
      agenda.tsx
      gavetas.tsx
      historico.tsx
      alertas.tsx
      configuracoes.tsx
    modais/
      medicamento.tsx
      agendamento.tsx
      paciente.tsx
      compartimento.tsx
  src/
    componentes/
      base/
        Botao.tsx
        CampoTexto.tsx
        EstadoErro.tsx
        EstadoVazio.tsx
        EstadoCarregando.tsx
        CabecalhoTela.tsx
        Cartao.tsx
        Badge.tsx
      formularios/
        CampoData.tsx
        CampoHorario.tsx
        SeletorDiasSemana.tsx
        SeletorPaciente.tsx
      dominio/
        CartaoMedicamento.tsx
        CartaoProximaDose.tsx
        CartaoCompartimento.tsx
        CartaoEvento.tsx
        CartaoNotificacao.tsx
    config/
      ambiente.ts
      tema.ts
    contextos/
      AutenticacaoContexto.tsx
      PacienteSelecionadoContexto.tsx
    hooks/
      useAutenticacao.ts
      usePacienteSelecionado.ts
      useRegistrarPushToken.ts
    servicos/
      api.ts
      autenticacaoServico.ts
      usuariosServico.ts
      pacientesServico.ts
      medicamentosServico.ts
      baseMedicamentosServico.ts
      agendamentosServico.ts
      dispositivosServico.ts
      eventosServico.ts
      notificacoesServico.ts
    tipos/
      autenticacao.ts
      usuario.ts
      paciente.ts
      medicamento.ts
      agendamento.ts
      dispositivo.ts
      evento.ts
      notificacao.ts
      api.ts
    validacoes/
      usuarioSchema.ts
      pacienteSchema.ts
      medicamentoSchema.ts
      agendamentoSchema.ts
      dispositivoSchema.ts
    utils/
      datas.ts
      erros.ts
      formatadores.ts
```

## Fase 1 - Fundacao Visual e Estrutural

- [x] Remover telas de exemplo do template, como `Tab One` e `Tab Two`.
- [x] Criar `src/config/tema.ts` com tokens da identidade:
  - [x] `cores.fundo = #0A0A0A`
  - [x] `cores.superficie = #161616`
  - [x] `cores.borda = #222222`
  - [x] `cores.primaria = #00FF66`
  - [x] `cores.perigo = #FF4444`
  - [x] `cores.alerta = #FFB800`
  - [x] `cores.info = #00A3FF`
- [x] Definir escala tipografica com tamanhos maiores que o prototipo para melhor acessibilidade.
- [x] Criar componentes base: `Botao`, `CampoTexto`, `Cartao`, `Badge`, `CabecalhoTela`, `EstadoCarregando`, `EstadoErro`, `EstadoVazio`.
- [x] Criar layout autenticado em `app/(app)/_layout.tsx` com abas reais.
- [x] Definir navegacao principal:
  - [x] Inicio
  - [x] Pacientes
  - [x] Medicamentos
  - [x] Agenda
  - [x] Gavetas
  - [x] Historico
  - [x] Alertas
  - [x] Configuracoes
- [x] Garantir `SafeAreaView` e compatibilidade com Android edge-to-edge.

## Fase 2 - Camada HTTP e Sessao

- [x] Criar `src/config/ambiente.ts` com `API_URL`.
- [x] Criar `src/servicos/api.ts` com Axios centralizado.
- [x] Configurar interceptor para enviar `Authorization: Bearer <token>`.
- [x] Configurar tratamento padrao de erro da API.
- [x] Criar tipos comuns em `src/tipos/api.ts`, como `ErroApi`.
- [x] Instalar e configurar `expo-secure-store`.
- [x] Criar `AutenticacaoContexto`:
  - [x] `usuario`
  - [x] `token`
  - [x] `entrar`
  - [x] `sair`
  - [x] `carregandoSessao`
- [x] Ao iniciar o app, recuperar token salvo e direcionar para login ou area autenticada.
- [x] Ao receber 401, limpar sessao e voltar para login.

## Fase 3 - Autenticacao e Cadastro

Rotas usadas:

- `POST /auth/login`
- `POST /usuarios`

Checklist:

- [x] Criar tela `login.tsx`.
- [x] Criar formulario com email e senha.
- [x] Validar campos obrigatorios.
- [x] Chamar `autenticacaoServico.login`.
- [x] Salvar token e usuario no contexto.
- [x] Criar tela `cadastro.tsx` para responsavel.
- [x] Enviar payload de usuario responsavel para `POST /usuarios`.
- [x] Depois do cadastro, permitir login.
- [x] Criar estados de loading, erro de credencial e erro de rede.

## Fase 4 - Pacientes

Rotas usadas:

- `GET /pacientes/meus`
- `GET /pacientes`
- `POST /pacientes`
- `GET /pacientes/:id`
- `PUT /pacientes/:id`
- `DELETE /pacientes/:id`
- `GET /pacientes/:pacienteId/responsaveis`
- `POST /pacientes/:pacienteId/responsaveis`
- `DELETE /pacientes/:pacienteId/responsaveis/:responsavelId`

Checklist:

- [x] Criar `pacientesServico.ts`.
- [x] Criar tipos `Paciente`, `CriarPacienteEntrada`, `AtualizarPacienteEntrada`.
- [x] Criar contexto de paciente selecionado.
- [x] Criar tela de lista de pacientes vinculados.
- [x] Criar cadastro de paciente com `nome`, `dataNascimento`, `observacoes` e `souEuMesmo`.
- [x] Criar edicao de paciente.
- [x] Criar remocao logica com confirmacao.
- [x] Criar area de responsaveis vinculados.
- [x] Persistir e restaurar o ultimo paciente selecionado por usuario.
- [x] Manter cadastro pelo botao Novo sem card vazio na lista de pacientes.
- [x] Bloquear telas dependentes quando nenhum paciente estiver selecionado.

## Fase 5 - Medicamentos

Rotas usadas:

- `GET /base-medicamentos?busca=...`
- `GET /base-medicamentos/:id`
- `GET /medicamentos?pacienteId=...`
- `POST /medicamentos`
- `GET /medicamentos/:id`
- `PUT /medicamentos/:id`
- `DELETE /medicamentos/:id`

Checklist:

- [x] Criar `baseMedicamentosServico.ts`.
- [x] Criar `medicamentosServico.ts`.
- [x] Criar tipos de medicamento e base de medicamentos.
- [x] Criar tela de medicamentos do paciente.
- [x] Criar busca na base de medicamentos.
- [x] Permitir cadastro manual caso nao encontre na base.
- [x] Criar formulario com:
  - [x] paciente
  - [x] medicamento da base ou nome manual
  - [x] dosagem
  - [x] quantidade administrada
  - [x] unidade de administracao
  - [x] observacoes
- [x] Criar edicao e remocao de medicamento.
- [x] Invalidar queries de medicamentos apos criar, editar ou remover.
- [x] Exibir medicamentos em cards no estilo do prototipo.

## Fase 6 - Agenda e Proximas Doses

Rotas usadas:

- `GET /agendamentos?pacienteId=...`
- `GET /agendamentos?medicamentoId=...`
- `GET /agendamentos/proximas-administracoes?pacienteId=...&data=DD/MM/AAAA`
- `POST /agendamentos`
- `GET /agendamentos/:id`
- `PUT /agendamentos/:id`
- `DELETE /agendamentos/:id`

Checklist:

- [x] Criar `agendamentosServico.ts`.
- [x] Criar tipos para agendamento fixo e por intervalo.
- [x] Criar tela `agenda.tsx`.
- [x] Criar componente `SeletorDiasSemana`.
- [x] Criar formulario com:
  - [x] medicamento
  - [x] tipo: horarios fixos ou intervalo
  - [x] dias da semana
  - [x] horarios
  - [x] intervalo em horas
  - [x] horario inicial
  - [x] inicio/fim do tratamento
  - [x] tolerancia em minutos
  - [x] cuidados
- [x] Criar tela inicial com proximas administracoes do dia.
- [x] Exibir status visual de proxima dose, dose em horario e dose atrasada quando houver dado suficiente.
- [x] Invalidar agenda e proximas doses apos alteracoes.

## Fase 7 - Dispositivos e Gavetas

Rotas usadas:

- `GET /dispositivos?pacienteId=...`
- `POST /dispositivos`
- `GET /dispositivos/:id/status`
- `GET /dispositivos/:id`
- `PUT /dispositivos/:id`
- `DELETE /dispositivos/:id`
- `GET /dispositivos/:dispositivoId/compartimentos`
- `POST /dispositivos/:dispositivoId/compartimentos`
- `PUT /dispositivos/:dispositivoId/compartimentos/:compartimentoId`
- `DELETE /dispositivos/:dispositivoId/compartimentos/:compartimentoId`
- `POST /dispositivos/:dispositivoId/compartimentos/:compartimentoId/liberar`
- `POST /dispositivos/:dispositivoId/compartimentos/:compartimentoId/travar`

Checklist:

- [x] Criar `dispositivosServico.ts`.
- [x] Criar tipos `Dispositivo`, `Compartimento`, `StatusCompartimento`, `ComandoDispositivo`.
- [x] Criar tela `gavetas.tsx` baseada no painel visual do prototipo.
- [x] Remover cadastro manual de dispositivo do app; equipamento sera configurado pelo backend/equipe IoT.
- [x] Exibir status do dispositivo: online/offline e ultimo sinal.
- [x] Listar compartimentos/gavetas.
- [x] Exibir medicamento associado por gaveta.
- [x] Permitir associar medicamento a compartimento.
- [x] Permitir liberar gaveta com confirmacao.
- [x] Permitir travar gaveta com confirmacao.
- [x] Revalidar status e compartimentos apos comandos.
- [x] Destacar estados:
  - [x] bloqueado
  - [x] liberado
  - [x] aberto
  - [x] erro
- [x] Evitar acao perigosa sem confirmacao clara.

## Fase 8 - Historico de Eventos

Rotas usadas:

- `GET /eventos?medicamentoId=...`
- `GET /eventos?agendamentoId=...`
- `POST /eventos`
- `GET /eventos/:id`

Checklist:

- [x] Criar `eventosServico.ts`.
- [x] Criar tipos de evento:
  - [x] `alerta_emitido`
  - [x] `compartimento_aberto`
  - [x] `compartimento_fechado`
  - [x] `medicamento_retirado`
  - [x] `dose_perdida`
  - [x] `atraso`
  - [x] `falha`
- [x] Criar tela `historico.tsx`.
- [x] Permitir filtros por medicamento e agendamento quando aplicavel.
- [x] Criar componente `CartaoEvento`.
- [x] Diferenciar visualmente consumo, alerta, atraso e falha.
- [x] Exibir data/hora formatada.

## Fase 9 - Alertas e Notificacoes

Rotas usadas:

- `GET /notificacoes?pacienteId=...`
- `POST /notificacoes/tokens-push`
- `POST /notificacoes/processar-proximas`
- `POST /notificacoes/verificar-atrasos`

Checklist:

- [x] Criar `notificacoesServico.ts`.
- [x] Criar tipos `Notificacao`, `TokenPush`, `StatusNotificacao`.
- [x] Instalar e configurar `expo-notifications`.
- [x] Pedir permissao de notificacao no fluxo autenticado.
- [x] Obter token Expo Push.
- [x] Registrar token no backend com `responsavelId`, `token`, `plataforma` e `dispositivoNome`.
- [x] Criar tela `alertas.tsx`.
- [x] Listar notificacoes do paciente.
- [x] Criar cards para alerta antes do horario, horario do medicamento e atraso.
- [x] Implementar listener para abrir a tela correta ao tocar em uma notificacao.
- [x] Deixar botoes administrativos de `processar-proximas` e `verificar-atrasos` fora do fluxo normal, ou escondidos em tela de debug.

## Fase 10 - Configuracoes

- [x] Criar tela `configuracoes.tsx`.
- [x] Exibir dados do usuario logado.
- [x] Exibir paciente selecionado.
- [x] Permitir trocar paciente ativo.
- [x] Permitir sair da conta.
- [x] Mostrar status da gaveta/equipamento do paciente selecionado.

## Fase 11 - UX e Acessibilidade

- [x] Usar texto minimo de 16px em conteudo principal.
- [x] Usar botoes com altura confortavel.
- [x] Evitar textos cinza escuro demais sobre fundo preto.
- [x] Garantir contraste nos badges.
- [x] Usar labels claros em todos os campos.
- [x] Usar mensagens de erro proximas do campo.
- [x] Evitar depender so de cor para status; combinar texto e icone.
- [x] Confirmar acoes criticas: liberar gaveta, travar gaveta, remover medicamento, remover paciente.
- [x] Testar telas em largura pequena.
- [x] Evitar barra inferior que cubra conteudo rolavel.

## Fase 12 - Testes e Validacao

- [x] Rodar `npm run lint --if-present`.
- [x] Rodar `npm test --if-present`.
- [x] Criar testes de componentes base.
- [x] Criar teste de login com sucesso e erro.
- [x] Criar teste de estado vazio de pacientes.
- [x] Criar teste de listagem de medicamentos.
- [x] Criar teste de formulario de agendamento.
- [x] Testar manualmente com backend local em `http://localhost:3000`.
- [ ] Testar no Android/emulador usando URL acessivel ao dispositivo.
- [ ] Validar fluxo completo:
  - [ ] criar conta
  - [ ] login
  - [ ] criar paciente
  - [ ] buscar medicamento na base
  - [ ] criar medicamento
  - [ ] criar agendamento
  - [ ] criar dispositivo
  - [ ] criar compartimento
  - [ ] associar medicamento a compartimento
  - [ ] liberar/travar gaveta
  - [ ] ver historico
  - [ ] ver notificacoes

## Ordem Recomendada de Implementacao

1. Fundacao visual, tema e componentes base.
2. Axios, React Query, SecureStore e contexto de autenticacao.
3. Login e cadastro de responsavel.
4. Pacientes e paciente selecionado.
5. Medicamentos e busca na base.
6. Agendamentos e proximas administracoes.
7. Dispositivos, compartimentos e comandos de gaveta.
8. Historico de eventos.
9. Notificacoes push e tela de alertas.
10. Testes, refinamento visual e acessibilidade.

## Referencias Tecnicas Consultadas

- Expo Router: roteamento baseado em arquivos dentro de `app/`.
- TanStack Query: cache e sincronizacao de dados remotos em React Native.
- Expo SecureStore: armazenamento seguro de pares chave/valor no dispositivo.
- Expo Notifications: instalacao e configuracao de notificacoes push.
- Zod: validacao TypeScript-first.
- React Native Paper: avaliado como opcional; util, mas nao recomendado como base visual inicial.

## Melhorias

- [x] Usar consulta por CEP para preencher endereco automaticamente no cadastro.
- [x] Criar fluxo para relembrar senha e recuperar acesso.
- [x] Permitir foto opcional do paciente e exibir avatar na lista; sem foto, mostrar iniciais do nome, como "T'challa" = "TC" e "Rodrigo Augusto" = "RA".
