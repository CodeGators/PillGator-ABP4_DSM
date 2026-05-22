# Requisitos do Desafio 4DSM 2026-1

Este documento resume o PDF do desafio e transforma os requisitos em frentes de trabalho do PillGator.

Fonte analisada: `Desafio 4DSM - 2026-1.pdf`, versao de 23/03/2026.

## Escopo Considerado

Vamos implementar:

- Backend Node.js, Express e TypeScript.
- API REST.
- Banco de dados.
- Aplicativo mobile.
- Integracao backend com dispositivo IoT.
- Notificacoes.
- CI/CD, testes, deploy, documentacao e conteinerizacao.

Fica fora deste escopo do nosso grupo de software:

- Implementacao do firmware/codigo C++ do dispositivo IoT.

Mesmo sem implementar o firmware, precisamos fornecer contratos, endpoints e documentacao para o dispositivo se integrar ao backend.

## Requisitos Funcionais

| Codigo | Requisito | Situacao | Tarefas relacionadas |
|---|---|---|---|
| RF01 | Cadastro e configuracao de medicamentos com nome, dosagem, horarios e compartimento associado | Parcial | CRUD de medicamentos, agendamentos e compartimentos feito; falta mobile e integracao final |
| RF02 | Programacao de multiplos horarios, frequencia diaria e intervalos especificos | Parcial | Agendamentos feito; falta validar com banco real e mobile |
| RF03 | Controle de compartimentos IoT | Parcial | Backend modelou dispositivos/compartimentos e contratos IoT; falta firmware |
| RF04 | Bloqueio de compartimentos indevidos | Parcial | Backend cria comandos de liberar/travar gaveta; firmware executa |
| RF05 | Alerta sonoro | Fora do firmware, pendente no contrato | Backend deve registrar/enviar eventos/comandos; firmware executa |
| RF06 | Registro de retirada de medicamento | Parcial | Backend recebe eventos IoT de retirada; falta firmware enviar |
| RF07 | Monitoramento de atraso na administracao | Parcial | Backend verifica atrasos e registra eventos; falta job em producao |
| RF08 | Notificacao ao responsavel | Parcial | Backend registra tokens e envia Expo Push; falta mobile registrar token real |
| RF09 | App mobile para programacao, historico e notificacoes | Pendente | Base do mobile |
| RF10 | Integracao com servidor em nuvem para programacoes, registros e eventos | Parcial | Contratos backend prontos; falta deploy/cloud e firmware |
| RF11 | Sincronizacao de dados entre dispositivo, servidor e app | Parcial | Comandos pendentes, eventos idempotentes e status online/offline no backend |
| RF12 | Cadastro de responsaveis | Parcial | Backend criou usuarios, pacientes e vinculos; falta autenticacao e mobile |

## Requisitos Nao Funcionais

| Codigo | Requisito | Situacao | Tarefas relacionadas |
|---|---|---|---|
| RNF01 | Arquitetura com IoT, backend Node/TS, API REST e mobile | Parcial | Backend iniciado; mobile e integracao IoT pendentes |
| RNF02 | Autenticacao, protecao de dados e comunicacao segura | Parcial | Backend tem login, hash de senha, JWT e permissoes; falta reforcar HTTPS/deploy e mobile |
| RNF03 | Confiabilidade, retry e funcionamento com falhas temporarias | Pendente | Sincronizacao e retry |
| RNF04 | Usabilidade acessivel para idosos | Pendente | Base do mobile e design acessivel |
| RNF05 | Manutenibilidade | Em andamento | Estrutura modular ja iniciada |
| RNF06 | Persistencia em banco de dados em nuvem | Parcial | TypeORM/Postgres configurado; falta validar banco local e deploy |
| RNF07 | Eficiencia energetica do dispositivo IoT | Fora do firmware | Nao implementaremos firmware; pode ser citado na documentacao IoT |
| RNF08 | CI com build, testes e qualidade | Parcial | Backend tem CI; mobile ainda precisa scripts reais |
| RNF09 | CD para homologacao/producao | Parcial | CD backend existe; falta validar ambiente/deploy |
| RNF10 | Testes automatizados no CI | Parcial | Backend tem testes; mobile pendente |
| RNF11 | Git com branches, commits e estrategia definida | Feito | Git Flow simplificado em uso |
| RNF12 | Feedback de build/deploy | Parcial | GitHub Actions existe; falta amadurecer deploy |

## Restricoes de Projeto

| Codigo | Restricao | Situacao | Tarefas relacionadas |
|---|---|---|---|
| RP01 | Backend em Node.js, Express e TypeScript | Feito | Backend atual segue esta stack |
| RP02 | Integracao com dispositivo fisico com sensores/atuadores | Parcial | Backend modelou contratos; falta firmware |
| RP03 | Comunicacao IoT por HTTP/MQTT ou equivalente | Parcial | Backend definiu endpoints HTTP para comandos e eventos |
| RP04 | Aplicativo movel | Pendente | Base do mobile |
| RP05 | Arquitetura cliente-servidor | Parcial | Backend iniciado; falta mobile e IoT integrados |
| RP06 | Desenvolvimento incremental por sprints | Em andamento | Roadmap e PRs pequenos |
| RP07 | Documentacao tecnica e diagramas | Pendente | Arquitetura, diagramas e comunicacao |
| RP08 | Escopo viavel com simulacoes fisicas | Em andamento | IoT pode ser simulado, mas contratos precisam existir |
| RP09 | Pipeline CI/CD | Parcial | GitHub Actions existe |
| RP10 | Testes automatizados no pipeline | Parcial | Backend feito; mobile pendente |
| RP11 | Deploy backend automatizado | Parcial | CD backend existe; falta validar destino/ambiente |
| RP12 | Conteinerizacao | Parcial | Dockerfile e Compose existem; falta validar execucao completa |

## Pendencias Principais

1. Validar banco local com Docker e migrations.
2. Integrar autenticacao, usuarios, pacientes e responsaveis ao mobile.
3. Modelar dispositivos e compartimentos.
4. Adaptar firmware IoT para consumir contratos HTTP do backend.
5. Integrar eventos reais de abertura, retirada, alerta, atraso e falha.
6. Colocar monitoramento de atraso e notificacoes em job no ambiente real.
7. Implementar aplicativo mobile real.
8. Configurar Swagger/OpenAPI.
9. Documentar arquitetura, diagramas e comunicacao.
10. Validar deploy/CD em ambiente real.
