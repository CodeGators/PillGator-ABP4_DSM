# Roteiro de Testes pelo Swagger

Use este roteiro em `http://localhost:3000/docs`.

## Antes de Comecar

1. Suba o banco e o backend.
2. Rode as migrations:

```bash
cd backend
npm run migration:run
```

3. Se precisar de usuario administrador, use o que criamos no banco local:

```text
email: admin@admin.com
senha: 12345678
```

4. No Swagger, faca login em `POST /auth/login`, copie o `token` retornado e clique em `Authorize`.

Se o Swagger mostrar o campo `bearerAuth`, cole apenas o token. Se estiver testando fora do Swagger e precisar montar o header manualmente, use:

```text
Authorization: Bearer SEU_TOKEN_AQUI
```

## Variaveis que Voce Vai Copiar Durante o Teste

Durante o roteiro, copie os IDs retornados e substitua nos exemplos:

```text
TOKEN_RESPONSAVEL=
RESPONSAVEL_ID=
PACIENTE_ID=
BASE_MEDICAMENTO_ID=
MEDICAMENTO_ID=
AGENDAMENTO_ID=
DISPOSITIVO_ID=
COMPARTIMENTO_ID=
IDENTIFICADOR_DISPOSITIVO=pillgator-teste-01
```

## 1. Criar Conta de Responsavel

Rota:

```text
POST /usuarios
```

Body:

```json
{
  "nome": "Maria Responsavel Teste",
  "cpf": "52998224725",
  "telefone": "11999999999",
  "email": "maria.teste@example.com",
  "dataNascimento": "1990-01-01",
  "enderecoRua": "Rua Teste",
  "enderecoEstado": "SP",
  "enderecoCidade": "Sao Paulo",
  "enderecoCep": "01001000",
  "enderecoComplemento": "Casa",
  "senha": "12345678",
  "confirmarSenha": "12345678",
  "recebeNotificacoes": true
}
```

Copie o `id` retornado como `RESPONSAVEL_ID`.

## 2. Fazer Login do Responsavel

Rota:

```text
POST /auth/login
```

Body:

```json
{
  "email": "maria.teste@example.com",
  "senha": "12345678"
}
```

Copie o `token`, clique em `Authorize` e cole o token.

## 3. Criar Paciente

Rota:

```text
POST /pacientes
```

Body para cadastrar outra pessoa:

```json
{
  "nome": "Joao Paciente Teste",
  "dataNascimento": "1950-01-01",
  "observacoes": "Paciente criado para teste completo."
}
```

Copie o `id` retornado como `PACIENTE_ID`.

Opcional: se o responsavel tambem for o paciente:

```json
{
  "souEuMesmo": true,
  "observacoes": "Responsavel tambem e paciente."
}
```

## 4. Conferir Pacientes do Responsavel

Rota:

```text
GET /pacientes
```

Resultado esperado: deve aparecer o paciente criado.

## 5. Buscar Medicamento na Base CSV

Rota:

```text
GET /base-medicamentos?busca=dipirona
```

Copie o `id` de algum item retornado como `BASE_MEDICAMENTO_ID`.

## 6. Cadastrar Medicamento do Paciente

Rota:

```text
POST /medicamentos
```

Body usando item da base:

```json
{
  "pacienteId": "PACIENTE_ID",
  "baseMedicamentoId": "BASE_MEDICAMENTO_ID",
  "quantidadeAdministrada": "1",
  "unidadeAdministracao": "comprimido",
  "observacoes": "Tomar com agua."
}
```

Se a base nao preencher a dosagem, use cadastro manual:

```json
{
  "pacienteId": "PACIENTE_ID",
  "nome": "Dipirona",
  "dosagem": "500mg",
  "quantidadeAdministrada": "20",
  "unidadeAdministracao": "gotas",
  "observacoes": "Tomar se houver dor."
}
```

Copie o `id` retornado como `MEDICAMENTO_ID`.

## 7. Criar Agendamento

Rota:

```text
POST /agendamentos
```

Body com horarios fixos todos os dias:

```json
{
  "medicamentoId": "MEDICAMENTO_ID",
  "tipo": "horarios_fixos",
  "diasSemana": [0, 1, 2, 3, 4, 5, 6],
  "horarios": ["08:00", "20:00"],
  "inicioEm": "2026-05-19",
  "fimEm": null,
  "toleranciaMinutos": 30,
  "cuidados": "Nao tomar junto com leite."
}
```

Copie o `id` retornado como `AGENDAMENTO_ID`.

## 8. Ver Proximas Administracoes

Rota:

```text
GET /agendamentos/proximas-administracoes?pacienteId=PACIENTE_ID&data=2026-05-19
```

Resultado esperado: devem aparecer os horarios `08:00` e `20:00`.

## 9. Registrar Token Push

Rota:

```text
POST /notificacoes/tokens-push
```

Body para testar cadastro do token:

```json
{
  "token": "ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]",
  "plataforma": "android",
  "dispositivoNome": "Celular de teste"
}
```

Observacao: esse token falso serve para testar o cadastro. Para envio real com sucesso, use um token gerado pelo app Expo.

## 10. Processar Notificacao Antes do Horario

Rota:

```text
POST /notificacoes/processar-proximas
```

Body:

```json
{
  "referenciaEm": "2026-05-19T07:50:00.000Z",
  "antecedenciaMinutos": 15,
  "janelaMinutos": 5
}
```

Resultado esperado:

- `notificacoesCriadas` maior que `0`.
- Com token falso, pode aparecer `notificacoesComErro`.
- Com token real do Expo, deve aparecer `notificacoesEnviadas`.

## 11. Verificar Atraso

Rota:

```text
POST /notificacoes/verificar-atrasos
```

Body:

```json
{
  "referenciaEm": "2026-05-19T08:40:00.000Z"
}
```

Resultado esperado: se ainda nao existir evento de retirada para o horario das `08:00`, o backend cria atraso.

## 12. Listar Historico de Notificacoes

Rota:

```text
GET /notificacoes?pacienteId=PACIENTE_ID
```

Resultado esperado: notificacoes de antes do horario, horario ou atraso.

## 13. Criar Dispositivo do Paciente

Rota:

```text
POST /dispositivos
```

Body:

```json
{
  "pacienteId": "PACIENTE_ID",
  "nome": "PillGator Teste",
  "identificador": "pillgator-teste-01",
  "modelo": "Protótipo DSM"
}
```

Copie o `id` retornado como `DISPOSITIVO_ID`.

## 14. Criar Gaveta/Compartimento

Rota:

```text
POST /dispositivos/DISPOSITIVO_ID/compartimentos
```

Body:

```json
{
  "numero": 1,
  "medicamentoId": "MEDICAMENTO_ID",
  "status": "bloqueado",
  "observacoes": "Gaveta principal"
}
```

Copie o `id` retornado como `COMPARTIMENTO_ID`.

## 15. Liberar Gaveta pelo App

Rota:

```text
POST /dispositivos/DISPOSITIVO_ID/compartimentos/COMPARTIMENTO_ID/liberar
```

Body:

```json
{
  "motivo": "Administrar medicamento",
  "agendamentoId": "AGENDAMENTO_ID"
}
```

Resultado esperado: cria um comando `liberar_gaveta`.

## 16. Simular IoT Buscando Comandos

Rota publica para o dispositivo:

```text
GET /iot/dispositivos/pillgator-teste-01/comandos-pendentes
```

Resultado esperado: retorna comandos pendentes e muda o status deles para `enviado`.

## 17. Simular IoT Informando Gaveta Aberta

Rota:

```text
POST /iot/dispositivos/pillgator-teste-01/eventos
```

Body:

```json
{
  "chaveEvento": "pillgator-teste-01-evt-001",
  "tipo": "compartimento_aberto",
  "compartimentoNumero": 1,
  "ocorridoEm": "2026-05-19T08:00:00.000Z",
  "dados": {
    "distanciaCm": 18
  }
}
```

Resultado esperado:

- Cria evento com `origem: iot`.
- Atualiza status da gaveta para `aberto`.

## 18. Simular Retirada do Medicamento

Rota:

```text
POST /iot/dispositivos/pillgator-teste-01/eventos
```

Body:

```json
{
  "chaveEvento": "pillgator-teste-01-evt-002",
  "tipo": "medicamento_retirado",
  "compartimentoNumero": 1,
  "agendamentoId": "AGENDAMENTO_ID",
  "ocorridoEm": "2026-05-19T08:05:00.000Z",
  "dados": {
    "observacao": "Medicamento retirado no horario"
  }
}
```

Resultado esperado:

- Cria evento de retirada.
- A gaveta volta para `bloqueado`.
- Se rodar `POST /notificacoes/verificar-atrasos` para esse mesmo horario, nao deve gerar atraso.

## 19. Travar Gaveta pelo App

Rota:

```text
POST /dispositivos/DISPOSITIVO_ID/compartimentos/COMPARTIMENTO_ID/travar
```

Body:

```json
{
  "motivo": "Reposicao concluida"
}
```

Depois, rode novamente:

```text
GET /iot/dispositivos/pillgator-teste-01/comandos-pendentes
```

Resultado esperado: comando `travar_gaveta`.

## 20. Ver Status Online/Offline

Rota:

```text
GET /dispositivos/DISPOSITIVO_ID/status
```

Resultado esperado:

- `online: true` se o IoT consultou comandos ou enviou evento nos ultimos 5 minutos.
- `online: false` se passou mais tempo sem sinal.

## 21. Teste de Seguranca Basico

1. Crie outro responsavel com outro email e CPF.
2. Faca login com ele.
3. Tente listar/alterar medicamento, dispositivo ou paciente do primeiro responsavel.

Resultado esperado:

```json
{
  "mensagem": "Usuario sem permissao ..."
}
```

## Ordem Resumida

1. Criar responsavel.
2. Login.
3. Criar paciente.
4. Buscar medicamento na base.
5. Criar medicamento do paciente.
6. Criar agendamento.
7. Registrar token push.
8. Processar notificacoes.
9. Criar dispositivo.
10. Criar gaveta.
11. Liberar gaveta.
12. Simular IoT buscando comando.
13. Simular IoT enviando evento.
14. Travar gaveta.
15. Conferir historico/status.
