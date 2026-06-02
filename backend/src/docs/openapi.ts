export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'PillGator API',
    version: '1.0.0',
    description:
      'Documentacao da API do PillGator. Use esta pagina para testar as rotas do backend. Primeiro suba o PostgreSQL, rode as migrations e inicie a API. Campos com asterisco nos exemplos sao obrigatorios no cadastro.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Ambiente local de desenvolvimento'
    }
  ],
  security: [{ bearerAuth: [] }],
  tags: [
    {
      name: 'Saude',
      description:
        'Rotas simples para verificar se a API esta ligada e respondendo.'
    },
    {
      name: 'Autenticacao',
      description:
        'Login e uso do token JWT. Primeiro faca login, copie o token retornado e clique em Authorize no Swagger usando Bearer token.'
    },
    {
      name: 'Usuarios',
      description:
        'Cadastro de contas que acessam o sistema: responsavel ou administrador. O cadastro de pacientes fica em Pacientes.'
    },
    {
      name: 'Pacientes',
      description:
        'Cadastro do paciente e vinculo com um ou mais responsaveis que poderao acompanhar historico e receber notificacoes.'
    },
    {
      name: 'Dispositivos',
      description:
        'Cadastro do dispositivo PillGator e dos compartimentos onde os medicamentos ficam organizados.'
    },
    {
      name: 'Notificacoes',
      description:
        'Historico de notificacoes para responsaveis e verificacao de atrasos dos medicamentos.'
    },
    {
      name: 'Medicamentos',
      description:
        'Cadastro dos medicamentos do paciente. Aqui ficam dados como nome, dosagem e observacoes. O horario de uso fica em Agendamentos.'
    },
    {
      name: 'Base de Medicamentos',
      description:
        'Consulta da base CSV de medicamentos. Responsaveis usam esta base para encontrar um remedio antes de adicionar ao tratamento do paciente.'
    },
    {
      name: 'Agendamentos',
      description:
        'Programacao de quando um medicamento deve ser tomado. Pode ser por horarios fixos ou por intervalo, como de 8 em 8 horas.'
    },
    {
      name: 'Eventos',
      description:
        'Historico do que aconteceu com os medicamentos: alerta emitido, compartimento aberto, medicamento retirado, atraso ou falha.'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Saude'],
        security: [],
        summary: 'Verifica se a API esta online',
        description:
          'Use esta rota para confirmar rapidamente se o backend subiu. Se retornar status 200 com `{ "status": "ok" }`, a API esta respondendo.',
        responses: {
          '200': {
            description: 'API online',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaudeResposta' },
                example: { status: 'ok' }
              }
            }
          }
        }
      }
    },
    '/saude': {
      get: {
        tags: ['Saude'],
        security: [],
        summary: 'Verifica se a API esta online em rota em portugues',
        description:
          'Tem o mesmo objetivo de `/health`, mas usando nome em portugues. Pode ser usada pelo app e pelo time durante testes.',
        responses: {
          '200': {
            description: 'API online',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaudeResposta' },
                example: { status: 'ok' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Autenticacao'],
        security: [],
        summary: 'Realiza login',
        description:
          'Envia email e senha de um usuario ativo. Se estiver correto, o Swagger mostra uma resposta com o campo `token`. Copie somente o valor desse campo, clique em Authorize no topo da pagina e cole no campo de autorizacao. Depois disso, as rotas protegidas poderao ser testadas.',
        requestBody: {
          required: true,
          description:
            '`email` e `senha` sao obrigatorios. A senha precisa ter sido cadastrada no usuario.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Login' },
              example: {
                email: 'admin@example.com',
                senha: 'senha-segura'
              }
            }
          }
        },
        responses: {
          '200': {
            description:
              'Login realizado com sucesso. Copie o valor de `token` mostrado na resposta e cole no Authorize do Swagger.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResposta' },
                example: {
                  token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo_de_token_jwt.assinatura',
                  tipoToken: 'Bearer',
                  expiraEm: '8h',
                  usuario: {
                    id: '9b8f2c60-1f6f-4f23-9f5a-9bb2b1110001',
                    nome: 'Maria Responsavel',
                    email: 'maria@example.com',
                    dataNascimento: '20/05/1990',
                    tipo: 'responsavel'
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '401': { $ref: '#/components/responses/ErroNaoAutorizado' }
        }
      }
    },
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Lista usuarios ativos',
        description:
          'Retorna usuarios ativos. Use o filtro `tipo` quando quiser listar apenas responsaveis ou administradores. Pacientes ficam em /pacientes.',
        parameters: [
          {
            name: 'tipo',
            in: 'query',
            required: false,
            description:
              'Opcional. Valores aceitos: responsavel ou administrador.',
            schema: {
              type: 'string',
              enum: ['responsavel', 'administrador']
            },
            example: 'responsavel'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Usuario' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      },
      post: {
        tags: ['Usuarios'],
        security: [],
        summary: 'Cadastra uma conta pelo app',
        description:
          'Rota publica para o fluxo inicial do app: baixar o app, clicar em criar conta e preencher os dados. Esta rota cadastra apenas contas de `responsavel` ou `administrador`. No cadastro publico use `responsavel`; `administrador` deve ser criado por outro administrador autenticado. O paciente deve ser cadastrado depois em `/pacientes`.',
        requestBody: {
          required: true,
          description:
            '`nome`, `cpf`, `telefone`, `email`, `dataNascimento`, endereco, `senha`, `confirmarSenha` e `tipo` sao obrigatorios. `enderecoComplemento` e `recebeNotificacoes` sao opcionais. Use `responsavel` para quem vai acessar o app e cuidar de um paciente. Use `administrador` apenas em cadastro feito por administrador autenticado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarUsuario' },
              examples: {
                responsavel: {
                  summary: 'Responsavel com acesso ao sistema',
                  value: {
                    nome: 'Maria Responsavel',
                    cpf: '935.411.347-80',
                    email: 'maria@example.com',
                    telefone: '11999999999',
                    dataNascimento: '20/05/1990',
                    enderecoRua: 'Rua das Flores',
                    enderecoEstado: 'SP',
                    enderecoCidade: 'Jacarei',
                    enderecoCep: '12345-678',
                    enderecoComplemento: 'Casa 2',
                    senha: 'senha-segura',
                    confirmarSenha: 'senha-segura',
                    tipo: 'responsavel',
                    recebeNotificacoes: true
                  }
                },
                administrador: {
                  summary: 'Administrador criado por outro admin',
                  value: {
                    nome: 'Admin PillGator',
                    cpf: '529.982.247-25',
                    email: 'admin@example.com',
                    telefone: '11999999999',
                    dataNascimento: '10/02/1988',
                    enderecoRua: 'Rua Central',
                    enderecoEstado: 'SP',
                    enderecoCidade: 'Jacarei',
                    enderecoCep: '12345-678',
                    senha: 'senha-segura',
                    confirmarSenha: 'senha-segura',
                    tipo: 'administrador',
                    recebeNotificacoes: false
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Usuario criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Usuario' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      }
    },
    '/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Busca um usuario pelo id',
        description:
          'Use esta rota para carregar os dados de um usuario especifico.',
        parameters: [{ $ref: '#/components/parameters/UsuarioId' }],
        responses: {
          '200': {
            description: 'Usuario encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Usuario' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Atualiza um usuario',
        description:
          'Atualiza dados cadastrais. Envie apenas os campos que deseja alterar. Use `ativo: false` para desativar.',
        parameters: [{ $ref: '#/components/parameters/UsuarioId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarUsuario' },
              example: {
                nome: 'Maria Silva',
                telefone: '11888888888',
                recebeNotificacoes: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Usuario atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Usuario' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Remove um usuario',
        description:
          'Faz remocao logica do usuario, alterando `ativo` para false.',
        parameters: [{ $ref: '#/components/parameters/UsuarioId' }],
        responses: {
          '204': { description: 'Usuario removido sem corpo de resposta' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/pacientes': {
      get: {
        tags: ['Pacientes'],
        summary: 'Lista pacientes ativos',
        description:
          'Retorna pacientes ativos. Administrador ve todos. Responsavel ve apenas pacientes vinculados a ele pela tabela de vinculos paciente-responsavel.',
        responses: {
          '200': {
            description: 'Lista de pacientes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Paciente' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Pacientes'],
        summary: 'Cadastra um paciente',
        description:
          'Cria o cadastro do paciente que recebera os medicamentos. Paciente nao e criado em /usuarios. Se quem criou for um usuario responsavel, o backend vincula automaticamente esse paciente ao responsavel logado. Quando o responsavel tambem for o paciente, envie `souEuMesmo: true`; o backend usa o nome do responsavel logado e vincula esse usuario ao cadastro de paciente.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarPaciente' },
              examples: {
                outroPaciente: {
                  summary: 'Paciente acompanhado pelo responsavel',
                  value: {
                    nome: 'Joao Paciente',
                    dataNascimento: '01/01/1950',
                    observacoes: 'Prefere alertas sonoros.'
                  }
                },
                proprioResponsavel: {
                  summary: 'Responsavel tambem e o paciente',
                  value: {
                    souEuMesmo: true,
                    dataNascimento: '15/04/1980',
                    observacoes: 'Responsavel cuida dos proprios medicamentos.'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Paciente criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Paciente' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      }
    },
    '/pacientes/meus': {
      get: {
        tags: ['Pacientes'],
        summary: 'Lista meus pacientes',
        description:
          'Rota principal para o app do responsavel. Retorna somente os pacientes vinculados ao usuario logado. Exemplo: uma mae responsavel por tres filhos ve apenas esses tres pacientes. Administrador pode usar GET /pacientes para ver todos.',
        responses: {
          '200': {
            description: 'Lista de pacientes vinculados ao usuario logado',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Paciente' }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/ErroNaoAutorizado' },
          '403': { $ref: '#/components/responses/ErroPermissao' }
        }
      }
    },
    '/pacientes/{id}': {
      get: {
        tags: ['Pacientes'],
        summary: 'Busca um paciente pelo id',
        description:
          'Administrador pode buscar qualquer paciente ativo. Responsavel so consegue buscar paciente vinculado a ele.',
        parameters: [{ $ref: '#/components/parameters/PacienteId' }],
        responses: {
          '200': {
            description: 'Paciente encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Paciente' }
              }
            }
          },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      put: {
        tags: ['Pacientes'],
        summary: 'Atualiza um paciente',
        description:
          'Atualiza dados cadastrais do paciente. Envie apenas os campos que deseja alterar. Responsavel so consegue atualizar paciente vinculado a ele.',
        parameters: [{ $ref: '#/components/parameters/PacienteId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarPaciente' },
              example: {
                observacoes: 'Paciente prefere receber ajuda da filha.',
                ativo: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Paciente atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Paciente' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      },
      delete: {
        tags: ['Pacientes'],
        summary: 'Remove um paciente',
        description:
          'Faz remocao logica do paciente, alterando `ativo` para false. Responsavel so consegue remover paciente vinculado a ele.',
        parameters: [{ $ref: '#/components/parameters/PacienteId' }],
        responses: {
          '204': { description: 'Paciente removido sem corpo de resposta' },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/pacientes/{pacienteId}/responsaveis': {
      get: {
        tags: ['Pacientes'],
        summary: 'Lista responsaveis de um paciente',
        description:
          'Mostra quais usuarios do tipo responsavel estao vinculados ao paciente. Responsavel so consegue consultar vinculos de paciente que tambem esteja vinculado a ele.',
        parameters: [{ $ref: '#/components/parameters/PacienteIdNaRota' }],
        responses: {
          '200': {
            description: 'Lista de vinculos com responsaveis',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PacienteResponsavel' }
                }
              }
            }
          },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      post: {
        tags: ['Pacientes'],
        summary: 'Vincula responsavel ao paciente',
        description:
          'Liga um usuario do tipo `responsavel` ao paciente. Esse vinculo define quais responsaveis podem acompanhar o paciente e receber notificacoes. Responsavel so consegue adicionar vinculo em paciente que ja esteja vinculado a ele.',
        parameters: [{ $ref: '#/components/parameters/PacienteIdNaRota' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VincularResponsavel' },
              example: {
                responsavelId: '4a0c9282-5fa8-4bb7-a03a-60d9c8a45555',
                parentesco: 'Filha',
                recebeNotificacoes: true
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Responsavel vinculado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PacienteResponsavel' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/pacientes/{pacienteId}/responsaveis/{responsavelId}': {
      delete: {
        tags: ['Pacientes'],
        summary: 'Remove responsavel do paciente',
        description:
          'Remove logicamente o vinculo entre paciente e responsavel. O usuario responsavel nao e apagado. Responsavel so consegue remover vinculo em paciente que ja esteja vinculado a ele.',
        parameters: [
          { $ref: '#/components/parameters/PacienteIdNaRota' },
          { $ref: '#/components/parameters/ResponsavelId' }
        ],
        responses: {
          '204': { description: 'Vinculo removido sem corpo de resposta' },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/iot/dispositivos/{identificador}/comandos-pendentes': {
      get: {
        tags: ['Dispositivos'],
        summary: 'IoT consulta comandos pendentes',
        description:
          'Contrato para o dispositivo fisico consultar comandos criados pelo app/backend. Ao consultar, o backend atualiza o ultimo sinal do dispositivo e marca comandos pendentes como enviados.',
        parameters: [
          {
            name: 'identificador',
            in: 'path',
            required: true,
            description:
              'Identificador unico cadastrado no dispositivo, por exemplo pillgator-01.',
            schema: { type: 'string' },
            example: 'pillgator-01'
          }
        ],
        responses: {
          '200': {
            description: 'Comandos pendentes para o dispositivo',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ComandoDispositivo' }
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/iot/dispositivos/{identificador}/eventos': {
      post: {
        tags: ['Dispositivos'],
        summary: 'IoT registra evento do dispositivo',
        description:
          'Contrato para o dispositivo informar que uma gaveta abriu, fechou, houve retirada de medicamento ou falha. Envie `chaveEvento` unica para evitar duplicidade.',
        parameters: [
          {
            name: 'identificador',
            in: 'path',
            required: true,
            description: 'Identificador unico do dispositivo.',
            schema: { type: 'string' },
            example: 'pillgator-01'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegistrarEventoDispositivo' },
              example: {
                chaveEvento: 'pillgator-01-0001',
                tipo: 'compartimento_aberto',
                compartimentoNumero: 1,
                ocorridoEm: '2026-05-12T08:00:00.000Z',
                dados: { distanciaCm: 18 }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Evento registrado ou retornado se ja existia',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Evento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/dispositivos': {
      get: {
        tags: ['Dispositivos'],
        summary: 'Lista dispositivos ativos',
        description:
          'Retorna os dispositivos cadastrados. Use `pacienteId` para listar apenas os dispositivos de um paciente.',
        parameters: [
          {
            name: 'pacienteId',
            in: 'query',
            required: false,
            description: 'Opcional. UUID do paciente dono do dispositivo.',
            schema: { type: 'string', format: 'uuid' },
            example: '0d4e6e5a-7c55-4f68-b0f7-65a8660d4444'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de dispositivos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dispositivo' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      },
      post: {
        tags: ['Dispositivos'],
        summary: 'Cadastra um dispositivo',
        description:
          'Cria o cadastro do dispositivo fisico do paciente. O firmware IoT sera feito por outro grupo, mas este cadastro prepara o backend para integracao.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarDispositivo' },
              example: {
                pacienteId: '0d4e6e5a-7c55-4f68-b0f7-65a8660d4444',
                nome: 'PillGator Quarto',
                identificador: 'pillgator-01',
                modelo: 'Prototipo DSM'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Dispositivo criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dispositivo' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      }
    },
    '/dispositivos/{id}/status': {
      get: {
        tags: ['Dispositivos'],
        summary: 'Consulta status online/offline do dispositivo',
        description:
          'Retorna se o dispositivo esta online com base no ultimo sinal recebido nos ultimos 5 minutos.',
        parameters: [{ $ref: '#/components/parameters/DispositivoId' }],
        responses: {
          '200': {
            description: 'Status do dispositivo',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StatusDispositivo' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/dispositivos/{id}': {
      get: {
        tags: ['Dispositivos'],
        summary: 'Busca um dispositivo pelo id',
        parameters: [{ $ref: '#/components/parameters/DispositivoId' }],
        responses: {
          '200': {
            description: 'Dispositivo encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dispositivo' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      put: {
        tags: ['Dispositivos'],
        summary: 'Atualiza um dispositivo',
        description:
          'Atualiza dados do dispositivo. Envie apenas os campos que deseja alterar.',
        parameters: [{ $ref: '#/components/parameters/DispositivoId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarDispositivo' },
              example: {
                nome: 'PillGator Sala',
                modelo: 'Prototipo DSM v2',
                ativo: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Dispositivo atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dispositivo' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      },
      delete: {
        tags: ['Dispositivos'],
        summary: 'Remove um dispositivo',
        description:
          'Faz remocao logica do dispositivo, alterando `ativo` para false.',
        parameters: [{ $ref: '#/components/parameters/DispositivoId' }],
        responses: {
          '204': { description: 'Dispositivo removido sem corpo de resposta' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/dispositivos/{dispositivoId}/compartimentos': {
      get: {
        tags: ['Dispositivos'],
        summary: 'Lista compartimentos do dispositivo',
        description:
          'Mostra os compartimentos ativos do dispositivo e qual medicamento esta associado a cada um.',
        parameters: [{ $ref: '#/components/parameters/DispositivoIdNaRota' }],
        responses: {
          '200': {
            description: 'Lista de compartimentos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Compartimento' }
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      post: {
        tags: ['Dispositivos'],
        summary: 'Cadastra um compartimento',
        description:
          'Cria um compartimento dentro de um dispositivo. O campo `numero` deve ser unico dentro do mesmo dispositivo.',
        parameters: [{ $ref: '#/components/parameters/DispositivoIdNaRota' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarCompartimento' },
              examples: {
                comMedicamento: {
                  summary: 'Compartimento com medicamento',
                  value: {
                    numero: 1,
                    medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    status: 'bloqueado',
                    observacoes: 'Uso pela manha.'
                  }
                },
                vazio: {
                  summary: 'Compartimento vazio',
                  value: {
                    numero: 2,
                    status: 'bloqueado'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Compartimento criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Compartimento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      }
    },
    '/dispositivos/{dispositivoId}/compartimentos/{compartimentoId}': {
      put: {
        tags: ['Dispositivos'],
        summary: 'Atualiza um compartimento',
        description:
          'Atualiza status, medicamento associado, numero ou observacoes do compartimento.',
        parameters: [
          { $ref: '#/components/parameters/DispositivoIdNaRota' },
          { $ref: '#/components/parameters/CompartimentoId' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarCompartimento' },
              example: {
                status: 'liberado',
                medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Compartimento atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Compartimento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' },
          '409': { $ref: '#/components/responses/ErroConflito' }
        }
      },
      delete: {
        tags: ['Dispositivos'],
        summary: 'Remove um compartimento',
        description:
          'Faz remocao logica do compartimento, alterando `ativo` para false.',
        parameters: [
          { $ref: '#/components/parameters/DispositivoIdNaRota' },
          { $ref: '#/components/parameters/CompartimentoId' }
        ],
        responses: {
          '204': { description: 'Compartimento removido sem corpo de resposta' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/dispositivos/{dispositivoId}/compartimentos/{compartimentoId}/liberar': {
      post: {
        tags: ['Dispositivos'],
        summary: 'Cria comando para liberar gaveta',
        description:
          'Usado pelo app quando o responsavel quer abrir uma gaveta. O backend cria um comando pendente para o IoT buscar e muda o status do compartimento para liberado.',
        parameters: [
          { $ref: '#/components/parameters/DispositivoIdNaRota' },
          { $ref: '#/components/parameters/CompartimentoId' }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarComandoCompartimento' },
              example: {
                motivo: 'Administrar medicamento',
                agendamentoId: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Comando criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ComandoDispositivo' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/dispositivos/{dispositivoId}/compartimentos/{compartimentoId}/travar': {
      post: {
        tags: ['Dispositivos'],
        summary: 'Cria comando para travar gaveta',
        description:
          'Usado pelo app quando o responsavel quer travar uma gaveta. O backend cria um comando pendente para o IoT buscar e muda o status do compartimento para bloqueado.',
        parameters: [
          { $ref: '#/components/parameters/DispositivoIdNaRota' },
          { $ref: '#/components/parameters/CompartimentoId' }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarComandoCompartimento' },
              example: {
                motivo: 'Reposicao concluida'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Comando criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ComandoDispositivo' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/base-medicamentos': {
      get: {
        tags: ['Base de Medicamentos'],
        summary: 'Consulta medicamentos da base CSV',
        description:
          'Busca medicamentos importados do CSV da Anvisa usado no projeto. Esta base e somente consulta: responsavel nao altera nem remove registros daqui.',
        parameters: [
          {
            name: 'busca',
            in: 'query',
            required: false,
            description:
              'Texto para pesquisar por nome do produto, principio ativo, categoria ou forma fisica.',
            schema: { type: 'string' },
            example: 'dipirona'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de medicamentos encontrados',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BaseMedicamento' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '401': { $ref: '#/components/responses/ErroNaoAutorizado' },
          '403': { $ref: '#/components/responses/ErroPermissao' }
        }
      }
    },
    '/base-medicamentos/{id}': {
      get: {
        tags: ['Base de Medicamentos'],
        summary: 'Busca medicamento da base pelo id',
        description:
          'Retorna os detalhes de um medicamento da base CSV. Use este id futuramente para criar um medicamento no tratamento do paciente.',
        parameters: [{ $ref: '#/components/parameters/BaseMedicamentoId' }],
        responses: {
          '200': {
            description: 'Medicamento da base encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BaseMedicamento' }
              }
            }
          },
          '401': { $ref: '#/components/responses/ErroNaoAutorizado' },
          '403': { $ref: '#/components/responses/ErroPermissao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/notificacoes': {
      get: {
        tags: ['Notificacoes'],
        summary: 'Lista notificacoes',
        description:
          'Retorna o historico de notificacoes geradas para os responsaveis. Use filtros para ver notificacoes de um paciente, responsavel ou status especifico.',
        parameters: [
          {
            name: 'pacienteId',
            in: 'query',
            required: false,
            description: 'Opcional. UUID do paciente.',
            schema: { type: 'string', format: 'uuid' },
            example: '0d4e6e5a-7c55-4f68-b0f7-65a8660d4444'
          },
          {
            name: 'responsavelId',
            in: 'query',
            required: false,
            description: 'Opcional. UUID do usuario responsavel.',
            schema: { type: 'string', format: 'uuid' },
            example: '4a0c9282-5fa8-4bb7-a03a-60d9c8a45555'
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            description:
              'Opcional. Status da notificacao: pendente, enviada ou erro.',
            schema: {
              type: 'string',
              enum: ['pendente', 'enviada', 'erro']
            },
            example: 'enviada'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de notificacoes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Notificacao' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      }
    },
    '/notificacoes/tokens-push': {
      post: {
        tags: ['Notificacoes'],
        summary: 'Registra token push do app',
        description:
          'Use esta rota quando o app Expo obter o token de notificacao do celular. O responsavel logado fica vinculado ao token e passa a receber avisos push. Em testes sem autenticacao, envie `responsavelId` no corpo.',
        requestBody: {
          required: true,
          description:
            'Envie o token retornado pelo Expo no app mobile. O formato esperado e parecido com `ExpoPushToken[...]`.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegistrarTokenPush' },
              example: {
                token: 'ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]',
                plataforma: 'android',
                dispositivoNome: 'Celular da Maria'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Token registrado ou atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TokenPush' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      }
    },
    '/notificacoes/processar-proximas': {
      post: {
        tags: ['Notificacoes'],
        summary: 'Processa notificacoes proximas do horario',
        description:
          'Rotina para ser chamada periodicamente pelo backend, por cron/job ou manualmente no Swagger. Ela cria notificacoes push antes do horario e exatamente na hora do medicamento, evitando duplicidade pelo horario previsto.',
        requestBody: {
          required: false,
          description:
            '`referenciaEm` e opcional. `antecedenciaMinutos` define quantos minutos antes avisar. `janelaMinutos` define por quanto tempo a rotina considera que ainda esta na hora de enviar o aviso do horario.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProcessarNotificacoes' },
              example: {
                referenciaEm: '2026-05-11T07:50:00.000Z',
                antecedenciaMinutos: 15,
                janelaMinutos: 5
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resultado do processamento',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResultadoProcessamentoNotificacoes'
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      }
    },
    '/notificacoes/verificar-atrasos': {
      post: {
        tags: ['Notificacoes'],
        summary: 'Verifica medicamentos em atraso',
        description:
          'Analisa os agendamentos ativos, usa a tolerancia configurada em cada agendamento e registra atraso quando nao existe evento de retirada dentro do periodo esperado. Para cada atraso, cria evento `atraso` e notificacoes push para responsaveis ativos do paciente.',
        requestBody: {
          required: false,
          description:
            '`referenciaEm` e opcional. Se nao enviar, o backend usa a data/hora atual. Em testes, envie uma data fixa em ISO 8601.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerificarAtrasos' },
              example: {
                referenciaEm: '2026-05-11T09:00:00.000Z'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resultado da verificacao',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResultadoVerificacaoAtrasos'
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      }
    },
    '/medicamentos': {
      get: {
        tags: ['Medicamentos'],
        summary: 'Lista medicamentos ativos dos pacientes',
        description:
          'Retorna medicamentos cadastrados para os pacientes. Responsavel ve apenas medicamentos dos pacientes vinculados a ele. Use `pacienteId` para filtrar um paciente especifico.',
        parameters: [
          {
            name: 'pacienteId',
            in: 'query',
            required: false,
            description:
              'UUID do paciente. Quando enviado, lista apenas os medicamentos desse paciente.',
            schema: { type: 'string', format: 'uuid' },
            example: '3fd35f96-0e71-4b08-9101-123456789abc'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de medicamentos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Medicamento' }
                },
                example: [
                  {
                    id: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    pacienteId: '3fd35f96-0e71-4b08-9101-123456789abc',
                    baseMedicamentoId: '6a02ecf1-0a2d-447c-9956-2c8fe5104444',
                    nome: 'Losartana',
                    dosagem: '50mg',
                    quantidadeAdministrada: '1',
                    unidadeAdministracao: 'comprimido',
                    observacoes: 'Tomar pela manha com agua.',
                    ativo: true,
                    criadoEm: '2026-05-12T12:00:00.000Z',
                    atualizadoEm: '2026-05-12T12:00:00.000Z'
                  }
                ]
              }
            }
          }
        }
      },
      post: {
        tags: ['Medicamentos'],
        summary: 'Cadastra medicamento para um paciente',
        description:
          'Cria o medicamento que um paciente vai tomar. Este cadastro nao altera a base de medicamentos: ele apenas copia ou referencia um item da base para o tratamento do paciente. Responsavel so pode cadastrar para pacientes vinculados a ele.',
        requestBody: {
          required: true,
          description:
            'Envie `pacienteId`, `quantidadeAdministrada` e `unidadeAdministracao`. Se enviar `baseMedicamentoId`, o backend pode preencher `nome` e `dosagem` usando a base CSV; ainda assim voce pode enviar `nome` e `dosagem` manualmente quando precisar ajustar a prescricao.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarMedicamento' },
              examples: {
                usandoBase: {
                  summary: 'Usando medicamento da base',
                  value: {
                    pacienteId: '3fd35f96-0e71-4b08-9101-123456789abc',
                    baseMedicamentoId: '6a02ecf1-0a2d-447c-9956-2c8fe5104444',
                    quantidadeAdministrada: '1',
                    unidadeAdministracao: 'comprimido',
                    observacoes: 'Tomar pela manha com agua.'
                  }
                },
                manual: {
                  summary: 'Cadastro manual',
                  value: {
                    pacienteId: '3fd35f96-0e71-4b08-9101-123456789abc',
                    nome: 'Dipirona',
                    dosagem: '500mg',
                    quantidadeAdministrada: '20',
                    unidadeAdministracao: 'gotas'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Medicamento criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Medicamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      }
    },
    '/medicamentos/{id}': {
      get: {
        tags: ['Medicamentos'],
        summary: 'Busca um medicamento pelo id',
        description:
          'Use esta rota quando precisar carregar os detalhes de um medicamento especifico. O `id` deve ser o UUID retornado ao criar ou listar medicamentos.',
        parameters: [{ $ref: '#/components/parameters/MedicamentoId' }],
        responses: {
          '200': {
            description: 'Medicamento encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Medicamento' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      put: {
        tags: ['Medicamentos'],
        summary: 'Atualiza medicamento do paciente',
        description:
          'Atualiza o cadastro do medicamento daquele paciente. Isso nao edita a base CSV. Responsavel so consegue alterar medicamento de paciente vinculado.',
        parameters: [{ $ref: '#/components/parameters/MedicamentoId' }],
        requestBody: {
          required: true,
          description:
            'Campos que podem ser alterados. Todos sao opcionais, mas envie pelo menos um campo.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarMedicamento' },
              example: {
                nome: 'Losartana Potassica',
                dosagem: '50mg',
                quantidadeAdministrada: '1',
                unidadeAdministracao: 'comprimido',
                observacoes: 'Tomar sempre no mesmo horario.',
                ativo: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Medicamento atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Medicamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      delete: {
        tags: ['Medicamentos'],
        summary: 'Remove medicamento do paciente',
        description:
          'Remove o medicamento do tratamento do paciente usando remocao logica. A base CSV nao e alterada. Responsavel so remove medicamento de paciente vinculado.',
        parameters: [{ $ref: '#/components/parameters/MedicamentoId' }],
        responses: {
          '204': { description: 'Medicamento removido sem corpo de resposta' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/agendamentos': {
      get: {
        tags: ['Agendamentos'],
        summary: 'Lista agendamentos ativos',
        description:
          'Lista os agendamentos cadastrados. Responsavel ve apenas agendamentos de medicamentos dos pacientes vinculados a ele. Use `medicamentoId` ou `pacienteId` para filtrar.',
        parameters: [
          {
            name: 'medicamentoId',
            in: 'query',
            required: false,
            description:
              'Opcional. UUID do medicamento para filtrar apenas os agendamentos dele.',
            schema: { type: 'string', format: 'uuid' },
            example: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111'
          },
          {
            name: 'pacienteId',
            in: 'query',
            required: false,
            description:
              'Opcional. UUID do paciente para listar agendamentos dos medicamentos dele.',
            schema: { type: 'string', format: 'uuid' },
            example: '3fd35f96-0e71-4b08-9101-123456789abc'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de agendamentos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Agendamento' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      },
      post: {
        tags: ['Agendamentos'],
        summary: 'Cria um agendamento para um medicamento',
        description:
          'Cria a regra de horario de um medicamento do paciente. Primeiro cadastre o medicamento em `POST /medicamentos`, copie o `id` retornado e use esse valor em `medicamentoId` aqui. Responsavel so agenda medicamentos de pacientes vinculados a ele.',
        requestBody: {
          required: true,
          description:
            'Existem dois tipos: `horarios_fixos` para horarios exatos, e `intervalo` para frequencia como de 8 em 8 horas. Veja os exemplos antes de testar.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarAgendamento' },
              examples: {
                horariosFixos: {
                  summary: 'Tomar em horarios fixos',
                  description:
                    'Use quando o paciente toma em horarios especificos, por exemplo 08:00 e 20:00.',
                  value: {
                    medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    tipo: 'horarios_fixos',
                    diasSemana: [1, 2, 3, 4, 5],
                    horarios: ['08:00', '20:00'],
                    inicioEm: '12/05/2026',
                    fimEm: null,
                    toleranciaMinutos: 30,
                    cuidados: 'Nao tomar junto com leite.'
                  }
                },
                intervalo: {
                  summary: 'Tomar de 8 em 8 horas',
                  description:
                    'Use quando a frequencia e por intervalo. Neste exemplo, o primeiro horario e 06:00 e depois repete a cada 8 horas.',
                  value: {
                    medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    tipo: 'intervalo',
                    diasSemana: [0, 1, 2, 3, 4, 5, 6],
                    intervaloHoras: 8,
                    horarioInicio: '06:00',
                    inicioEm: '12/05/2026',
                    fimEm: '20/05/2026',
                    toleranciaMinutos: 30,
                    cuidados: 'Manter intervalo regular.'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Agendamento criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Agendamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/agendamentos/proximas-administracoes': {
      get: {
        tags: ['Agendamentos'],
        summary: 'Lista proximas administracoes do dia',
        description:
          'Mostra os horarios previstos de administracao para uma data. Use para o app montar a agenda do responsavel ou de um paciente especifico.',
        parameters: [
          {
            name: 'pacienteId',
            in: 'query',
            required: false,
            description:
              'Opcional. UUID do paciente. Responsavel so consegue consultar pacientes vinculados.',
            schema: { type: 'string', format: 'uuid' },
            example: '3fd35f96-0e71-4b08-9101-123456789abc'
          },
          {
            name: 'data',
            in: 'query',
            required: false,
            description:
              'Opcional. Data no formato DD/MM/AAAA. Se nao enviar, o backend usa a data atual.',
            schema: { type: 'string' },
            example: '12/05/2026'
          }
        ],
        responses: {
          '200': {
            description: 'Horarios previstos encontrados',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ProximaAdministracao'
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      }
    },
    '/agendamentos/{id}': {
      get: {
        tags: ['Agendamentos'],
        summary: 'Busca um agendamento pelo id',
        description:
          'Carrega um agendamento especifico. Use o `id` retornado na criacao ou listagem de agendamentos.',
        parameters: [{ $ref: '#/components/parameters/AgendamentoId' }],
        responses: {
          '200': {
            description: 'Agendamento encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Agendamento' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      put: {
        tags: ['Agendamentos'],
        summary: 'Atualiza um agendamento',
        description:
          'Atualiza a regra de horario. Pode trocar de `horarios_fixos` para `intervalo` ou atualizar apenas dias, horarios, tolerancia ou cuidados.',
        parameters: [{ $ref: '#/components/parameters/AgendamentoId' }],
        requestBody: {
          required: true,
          description:
            'Envie os campos que deseja alterar. Se `tipo` for `horarios_fixos`, envie `horarios`. Se `tipo` for `intervalo`, envie `intervaloHoras` e `horarioInicio`.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarAgendamento' },
              example: {
                tipo: 'horarios_fixos',
                diasSemana: [1, 3, 5],
                horarios: ['09:00'],
                toleranciaMinutos: 20,
                cuidados: 'Tomar apos o cafe da manha.',
                ativo: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Agendamento atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Agendamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      delete: {
        tags: ['Agendamentos'],
        summary: 'Remove um agendamento',
        description:
          'Faz remocao logica do agendamento, alterando `ativo` para false. O registro fica no banco para historico e auditoria futura.',
        parameters: [{ $ref: '#/components/parameters/AgendamentoId' }],
        responses: {
          '204': { description: 'Agendamento removido sem corpo de resposta' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/eventos': {
      get: {
        tags: ['Eventos'],
        summary: 'Lista historico de eventos',
        description:
          'Retorna o historico de eventos registrados. Use os filtros para ver apenas eventos de um medicamento, agendamento, dispositivo, tipo ou origem.',
        parameters: [
          {
            name: 'medicamentoId',
            in: 'query',
            required: false,
            description:
              'Opcional. UUID do medicamento para ver apenas eventos dele.',
            schema: { type: 'string', format: 'uuid' },
            example: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111'
          },
          {
            name: 'agendamentoId',
            in: 'query',
            required: false,
            description:
              'Opcional. UUID do agendamento para ver apenas eventos dessa programacao.',
            schema: { type: 'string', format: 'uuid' },
            example: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222'
          },
          {
            name: 'dispositivoId',
            in: 'query',
            required: false,
            description:
              'Opcional. Identificador do dispositivo IoT quando o evento veio ou sera usado por um dispositivo.',
            schema: { type: 'string' },
            example: 'pillgator-01'
          },
          {
            name: 'tipo',
            in: 'query',
            required: false,
            description:
              'Opcional. Tipo do evento. Valores aceitos: alerta_emitido, compartimento_aberto, medicamento_retirado, atraso, falha.',
            schema: {
              type: 'string',
              enum: [
                'alerta_emitido',
                'compartimento_aberto',
                'medicamento_retirado',
                'atraso',
                'falha'
              ]
            },
            example: 'medicamento_retirado'
          },
          {
            name: 'origem',
            in: 'query',
            required: false,
            description:
              'Opcional. De onde veio o evento: backend, mobile ou iot.',
            schema: {
              type: 'string',
              enum: ['backend', 'mobile', 'iot']
            },
            example: 'iot'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de eventos do historico',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Evento' }
                },
                example: [
                  {
                    id: '8d8c74d7-2bd5-4db8-bb20-27b844c83333',
                    medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    agendamentoId: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222',
                    dispositivoId: 'pillgator-01',
                    tipo: 'medicamento_retirado',
                    origem: 'iot',
                    ocorridoEm: '2026-05-12T10:00:00.000Z',
                    descricao: 'Paciente retirou o medicamento.',
                    dados: { compartimento: 1 },
                    criadoEm: '2026-05-12T10:00:01.000Z'
                  }
                ]
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      },
      post: {
        tags: ['Eventos'],
        summary: 'Registra um evento no historico',
        description:
          'Use esta rota para registrar algo que aconteceu com o tratamento. Exemplos: a API gerou um alerta, o dispositivo informou que um compartimento abriu, o paciente retirou o remedio, houve atraso ou aconteceu uma falha.',
        requestBody: {
          required: true,
          description:
            '`tipo` e obrigatorio. `origem` e opcional e, se nao for enviada, o backend assume `backend`. Informe `medicamentoId` ou `agendamentoId` quando o evento estiver ligado a um tratamento. Se enviar `agendamentoId`, o backend consegue descobrir o medicamento.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarEvento' },
              examples: {
                alertaEmitido: {
                  summary: 'Alerta emitido pelo backend',
                  value: {
                    agendamentoId: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222',
                    dispositivoId: 'pillgator-01',
                    tipo: 'alerta_emitido',
                    origem: 'backend',
                    descricao: 'Alerta enviado ao dispositivo.'
                  }
                },
                retiradaIot: {
                  summary: 'Retirada registrada pelo dispositivo',
                  value: {
                    agendamentoId: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222',
                    dispositivoId: 'pillgator-01',
                    tipo: 'medicamento_retirado',
                    origem: 'iot',
                    ocorridoEm: '2026-05-12T10:00:00.000Z',
                    descricao: 'Paciente retirou o medicamento.',
                    dados: {
                      compartimento: 1,
                      sensorConfirmouAbertura: true
                    }
                  }
                },
                atraso: {
                  summary: 'Atraso identificado pelo backend',
                  value: {
                    medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    agendamentoId: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222',
                    tipo: 'atraso',
                    origem: 'backend',
                    descricao: 'Medicamento nao retirado dentro da tolerancia.',
                    dados: {
                      toleranciaMinutos: 30,
                      horarioPrevisto: '08:00'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Evento registrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Evento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/eventos/{id}': {
      get: {
        tags: ['Eventos'],
        summary: 'Busca um evento pelo id',
        description:
          'Carrega os detalhes de um evento especifico do historico. Use o `id` retornado ao listar ou registrar eventos.',
        parameters: [{ $ref: '#/components/parameters/EventoId' }],
        responses: {
          '200': {
            description: 'Evento encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Evento' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Use o token retornado em POST /auth/login. No Swagger, clique em Authorize e cole apenas o valor do campo token, sem escrever Bearer antes.'
      }
    },
    parameters: {
      UsuarioId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do usuario.',
        schema: { type: 'string', format: 'uuid' },
        example: '4a0c9282-5fa8-4bb7-a03a-60d9c8a45555'
      },
      PacienteId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do paciente.',
        schema: { type: 'string', format: 'uuid' },
        example: '0d4e6e5a-7c55-4f68-b0f7-65a8660d4444'
      },
      PacienteIdNaRota: {
        name: 'pacienteId',
        in: 'path',
        required: true,
        description: 'UUID do paciente.',
        schema: { type: 'string', format: 'uuid' },
        example: '0d4e6e5a-7c55-4f68-b0f7-65a8660d4444'
      },
      ResponsavelId: {
        name: 'responsavelId',
        in: 'path',
        required: true,
        description: 'UUID do usuario responsavel.',
        schema: { type: 'string', format: 'uuid' },
        example: '4a0c9282-5fa8-4bb7-a03a-60d9c8a45555'
      },
      DispositivoId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do dispositivo.',
        schema: { type: 'string', format: 'uuid' },
        example: '5d9c345f-41b6-4e6d-a4b7-d95fdb236666'
      },
      DispositivoIdNaRota: {
        name: 'dispositivoId',
        in: 'path',
        required: true,
        description: 'UUID do dispositivo.',
        schema: { type: 'string', format: 'uuid' },
        example: '5d9c345f-41b6-4e6d-a4b7-d95fdb236666'
      },
      CompartimentoId: {
        name: 'compartimentoId',
        in: 'path',
        required: true,
        description: 'UUID do compartimento.',
        schema: { type: 'string', format: 'uuid' },
        example: 'a807792e-24cf-4946-bf99-29ee6fa27777'
      },
      MedicamentoId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do medicamento.',
        schema: { type: 'string', format: 'uuid' },
        example: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111'
      },
      BaseMedicamentoId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do medicamento na base de consulta.',
        schema: { type: 'string', format: 'uuid' },
        example: '6a02ecf1-0a2d-447c-9956-2c8fe5104444'
      },
      AgendamentoId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do agendamento.',
        schema: { type: 'string', format: 'uuid' },
        example: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222'
      },
      EventoId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do evento.',
        schema: { type: 'string', format: 'uuid' },
        example: '8d8c74d7-2bd5-4db8-bb20-27b844c83333'
      }
    },
    responses: {
      ErroValidacao: {
        description: 'Erro de validacao. Algum campo foi enviado vazio, errado ou fora do formato esperado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { mensagem: 'Campo nome e obrigatorio' }
          }
        }
      },
      ErroNaoEncontrado: {
        description: 'Registro nao encontrado ou inativo.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { mensagem: 'Medicamento nao encontrado' }
          }
        }
      },
      ErroNaoAutorizado: {
        description:
          'Usuario nao autenticado, token ausente, token invalido ou credenciais incorretas.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { mensagem: 'Email ou senha invalidos' }
          }
        }
      },
      ErroPermissao: {
        description:
          'Usuario autenticado sem permissao ou tentativa de fazer uma acao nao permitida no cadastro publico.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: {
              mensagem: 'Cadastro publico nao pode criar usuario administrador'
            }
          }
        }
      },
      ErroConflito: {
        description:
          'Conflito com um registro existente, como email ja cadastrado ou usuario ja vinculado a outro paciente.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { mensagem: 'Email ja cadastrado' }
          }
        }
      }
    },
    schemas: {
      SaudeResposta: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Indica que a API esta respondendo.',
            example: 'ok'
          }
        }
      },
      Erro: {
        type: 'object',
        properties: {
          mensagem: {
            type: 'string',
            description: 'Texto explicando o erro em portugues.',
            example: 'Campo nome e obrigatorio'
          }
        }
      },
      Login: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email do usuario cadastrado.',
            example: 'admin@example.com'
          },
          senha: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description: 'Senha do usuario. Nunca envie ou salve senha em texto fora do login.',
            example: 'senha-segura'
          }
        }
      },
      LoginResposta: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description:
              'Token JWT gerado pelo login. Copie este valor inteiro para o Authorize do Swagger ou envie no header Authorization como Bearer token.',
            example:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo_de_token_jwt.assinatura'
          },
          tipoToken: {
            type: 'string',
            example: 'Bearer'
          },
          expiraEm: {
            type: 'string',
            description: 'Tempo de validade configurado para o token.',
            example: '8h'
          },
          usuario: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              nome: { type: 'string', example: 'Admin' },
              email: { type: 'string', format: 'email' },
              dataNascimento: {
                type: 'string',
                nullable: true,
                example: '20/05/1990'
              },
              tipo: {
                type: 'string',
                enum: ['responsavel', 'administrador']
              }
            }
          }
        }
      },
      Usuario: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico do usuario.'
          },
          nome: {
            type: 'string',
            description: 'Nome da pessoa.',
            example: 'Maria Responsavel'
          },
          email: {
            type: 'string',
            format: 'email',
            description:
              'Email unico do usuario. Sera usado no login quando o usuario tiver senha cadastrada.',
            example: 'maria@example.com'
          },
          cpf: {
            type: 'string',
            nullable: true,
            description:
              'CPF do usuario com 11 digitos. Pode aparecer com ou sem pontuacao na entrada.',
            example: '93541134780'
          },
          telefone: {
            type: 'string',
            nullable: true,
            description: 'Telefone para contato.',
            example: '11999999999'
          },
          dataNascimento: {
            type: 'string',
            nullable: true,
            description: 'Data de nascimento no formato DD/MM/AAAA.',
            example: '20/05/1990'
          },
          enderecoRua: {
            type: 'string',
            nullable: true,
            description: 'Rua, avenida ou logradouro.',
            example: 'Rua das Flores'
          },
          enderecoEstado: {
            type: 'string',
            nullable: true,
            description: 'UF com 2 letras.',
            example: 'SP'
          },
          enderecoCidade: {
            type: 'string',
            nullable: true,
            description: 'Cidade do endereco.',
            example: 'Jacarei'
          },
          enderecoCep: {
            type: 'string',
            nullable: true,
            description: 'CEP com 8 digitos.',
            example: '12345678'
          },
          enderecoComplemento: {
            type: 'string',
            nullable: true,
            description: 'Complemento do endereco.',
            example: 'Casa 2'
          },
          tipo: {
            type: 'string',
            enum: ['responsavel', 'administrador'],
            description:
              'Papel da conta dentro do sistema. Pacientes sao cadastrados em /pacientes.'
          },
          recebeNotificacoes: {
            type: 'boolean',
            description:
              'Indica se esse usuario deve receber notificacoes quando estiver vinculado a um paciente.'
          },
          ativo: { type: 'boolean' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      CriarUsuario: {
        type: 'object',
        required: [
          'nome',
          'cpf',
          'telefone',
          'email',
          'dataNascimento',
          'enderecoRua',
          'enderecoEstado',
          'enderecoCidade',
          'enderecoCep',
          'senha',
          'confirmarSenha',
          'tipo'
        ],
        properties: {
          nome: {
            type: 'string',
            maxLength: 120,
            description: 'Obrigatorio. Nome da pessoa.',
            example: 'Maria Responsavel'
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 160,
            description: 'Obrigatorio. Email unico.',
            example: 'maria@example.com'
          },
          cpf: {
            type: 'string',
            description:
              'Obrigatorio. CPF do usuario. Pode enviar com ou sem pontuacao; o backend salva apenas os 11 digitos.',
            example: '935.411.347-80'
          },
          telefone: {
            type: 'string',
            maxLength: 30,
            description: 'Obrigatorio. Telefone para contato.',
            example: '11999999999'
          },
          dataNascimento: {
            type: 'string',
            description: 'Obrigatorio. Formato DD/MM/AAAA.',
            example: '20/05/1990'
          },
          enderecoRua: {
            type: 'string',
            maxLength: 160,
            description: 'Obrigatorio. Rua, avenida ou logradouro.',
            example: 'Rua das Flores'
          },
          enderecoEstado: {
            type: 'string',
            maxLength: 2,
            description: 'Obrigatorio. UF com 2 letras.',
            example: 'SP'
          },
          enderecoCidade: {
            type: 'string',
            maxLength: 120,
            description: 'Obrigatorio. Cidade do endereco.',
            example: 'Jacarei'
          },
          enderecoCep: {
            type: 'string',
            description:
              'Obrigatorio. CEP. Pode enviar com ou sem hifen; o backend salva apenas os 8 digitos.',
            example: '12345-678'
          },
          enderecoComplemento: {
            type: 'string',
            nullable: true,
            maxLength: 120,
            description: 'Opcional. Complemento do endereco.',
            example: 'Casa 2'
          },
          senha: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description:
              'Obrigatorio. Senha para login. O backend salva apenas o hash, nunca a senha em texto.'
          },
          confirmarSenha: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description:
              'Obrigatorio. Deve ser igual ao campo senha.'
          },
          tipo: {
            type: 'string',
            enum: ['responsavel', 'administrador'],
            description:
              'Obrigatorio. Use responsavel para cuidador/familiar que acessa o app e administrador para gestao. Pacientes sao cadastrados em /pacientes.'
          },
          recebeNotificacoes: {
            type: 'boolean',
            default: false,
            description:
              'Opcional. Use true quando o usuario puder receber notificacoes.'
          }
        }
      },
      AtualizarUsuario: {
        type: 'object',
        properties: {
          nome: {
            type: 'string',
            maxLength: 120,
            description: 'Opcional. Novo nome.'
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 160,
            description: 'Opcional. Novo email unico.'
          },
          cpf: {
            type: 'string',
            description: 'Opcional. Novo CPF unico.'
          },
          telefone: {
            type: 'string',
            nullable: true,
            maxLength: 30,
            description: 'Opcional. Novo telefone.'
          },
          dataNascimento: {
            type: 'string',
            description: 'Opcional. Nova data de nascimento no formato DD/MM/AAAA.'
          },
          enderecoRua: {
            type: 'string',
            maxLength: 160,
            description: 'Opcional. Nova rua.'
          },
          enderecoEstado: {
            type: 'string',
            maxLength: 2,
            description: 'Opcional. Nova UF.'
          },
          enderecoCidade: {
            type: 'string',
            maxLength: 120,
            description: 'Opcional. Nova cidade.'
          },
          enderecoCep: {
            type: 'string',
            description: 'Opcional. Novo CEP.'
          },
          enderecoComplemento: {
            type: 'string',
            nullable: true,
            maxLength: 120,
            description: 'Opcional. Novo complemento.'
          },
          senha: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description:
              'Opcional. Nova senha. O backend gera um novo hash.'
          },
          confirmarSenha: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description:
              'Obrigatorio quando enviar nova senha. Deve ser igual ao campo senha.'
          },
          tipo: {
            type: 'string',
            enum: ['responsavel', 'administrador'],
            description:
              'Opcional. Novo papel da conta. Pacientes sao alterados em /pacientes.'
          },
          recebeNotificacoes: {
            type: 'boolean',
            description: 'Opcional. Ativa ou desativa notificacoes.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      },
      Paciente: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico do paciente.'
          },
          usuarioId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Usuario responsavel vinculado quando o responsavel logado tambem e o paciente. Na maioria dos pacientes acompanhados por outra pessoa, fica null.'
          },
          nome: {
            type: 'string',
            description: 'Nome do paciente.',
            example: 'Joao Paciente'
          },
          dataNascimento: {
            type: 'string',
            nullable: true,
            description: 'Data de nascimento no formato DD/MM/AAAA.'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            description:
              'Observacoes gerais para cuidado, acessibilidade ou preferencia.'
          },
          ativo: { type: 'boolean' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      CriarPaciente: {
        type: 'object',
        properties: {
          nome: {
            type: 'string',
            maxLength: 120,
            description:
              'Obrigatorio quando `souEuMesmo` nao for true. Nome do paciente acompanhado.',
            example: 'Joao Paciente'
          },
          dataNascimento: {
            type: 'string',
            nullable: true,
            description: 'Opcional. Formato DD/MM/AAAA.',
            example: '01/01/1950'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Observacoes gerais do cuidado.'
          },
          souEuMesmo: {
            type: 'boolean',
            default: false,
            description:
              'Opcional. Use true quando o responsavel logado tambem for o paciente. Nesse caso nao envie nome nem usuarioId; o backend usa os dados do responsavel autenticado.'
          }
        }
      },
      AtualizarPaciente: {
        type: 'object',
        properties: {
          nome: {
            type: 'string',
            maxLength: 120,
            description: 'Opcional. Novo nome do paciente.'
          },
          dataNascimento: {
            type: 'string',
            nullable: true,
            description: 'Opcional. Formato DD/MM/AAAA.'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Novas observacoes.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      },
      PacienteResponsavel: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador do vinculo.'
          },
          pacienteId: {
            type: 'string',
            format: 'uuid',
            description: 'Paciente acompanhado pelo responsavel.'
          },
          responsavelId: {
            type: 'string',
            format: 'uuid',
            description: 'Usuario do tipo responsavel.'
          },
          parentesco: {
            type: 'string',
            nullable: true,
            description: 'Parentesco ou relacao com o paciente.',
            example: 'Filha'
          },
          recebeNotificacoes: {
            type: 'boolean',
            description:
              'Indica se esse responsavel deve receber notificacoes deste paciente.'
          },
          ativo: { type: 'boolean' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      VincularResponsavel: {
        type: 'object',
        required: ['responsavelId'],
        properties: {
          responsavelId: {
            type: 'string',
            format: 'uuid',
            description:
              'Obrigatorio. UUID de um usuario ativo do tipo responsavel.'
          },
          parentesco: {
            type: 'string',
            nullable: true,
            maxLength: 80,
            description: 'Opcional. Exemplo: Filha, Filho, Cuidador.'
          },
          recebeNotificacoes: {
            type: 'boolean',
            default: true,
            description:
              'Opcional. Use true para este responsavel receber alertas desse paciente.'
          }
        }
      },
      Dispositivo: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico do dispositivo.'
          },
          pacienteId: {
            type: 'string',
            format: 'uuid',
            description: 'Paciente dono do dispositivo.'
          },
          nome: {
            type: 'string',
            description: 'Nome amigavel para aparecer no app.',
            example: 'PillGator Quarto'
          },
          identificador: {
            type: 'string',
            description:
              'Codigo unico usado para reconhecer o dispositivo na integracao futura.',
            example: 'pillgator-01'
          },
          modelo: {
            type: 'string',
            nullable: true,
            description: 'Modelo, versao ou observacao tecnica do dispositivo.'
          },
          ultimoSinalEm: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            description:
              'Ultima data/hora em que o dispositivo deu sinal. Sera usado melhor na tarefa de sincronizacao.'
          },
          ativo: { type: 'boolean' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      StatusDispositivo: {
        type: 'object',
        properties: {
          dispositivoId: { type: 'string', format: 'uuid' },
          identificador: {
            type: 'string',
            example: 'pillgator-01'
          },
          online: {
            type: 'boolean',
            description:
              'true quando o ultimo sinal do dispositivo aconteceu nos ultimos 5 minutos.'
          },
          ultimoSinalEm: {
            type: 'string',
            nullable: true,
            format: 'date-time'
          }
        }
      },
      CriarDispositivo: {
        type: 'object',
        required: ['pacienteId', 'nome', 'identificador'],
        properties: {
          pacienteId: {
            type: 'string',
            format: 'uuid',
            description:
              'Obrigatorio. UUID de um paciente ativo.'
          },
          nome: {
            type: 'string',
            maxLength: 120,
            description:
              'Obrigatorio. Nome amigavel do dispositivo, como PillGator Quarto.'
          },
          identificador: {
            type: 'string',
            maxLength: 120,
            description:
              'Obrigatorio. Codigo unico do dispositivo, como pillgator-01.'
          },
          modelo: {
            type: 'string',
            nullable: true,
            maxLength: 120,
            description: 'Opcional. Modelo ou versao do prototipo.'
          },
          ultimoSinalEm: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            description:
              'Opcional. Data/hora ISO 8601 do ultimo sinal recebido.'
          }
        }
      },
      AtualizarDispositivo: {
        type: 'object',
        properties: {
          pacienteId: {
            type: 'string',
            format: 'uuid',
            description: 'Opcional. Troca o paciente vinculado ao dispositivo.'
          },
          nome: {
            type: 'string',
            maxLength: 120,
            description: 'Opcional. Novo nome do dispositivo.'
          },
          identificador: {
            type: 'string',
            maxLength: 120,
            description: 'Opcional. Novo identificador unico.'
          },
          modelo: {
            type: 'string',
            nullable: true,
            maxLength: 120,
            description: 'Opcional. Novo modelo ou versao.'
          },
          ultimoSinalEm: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            description: 'Opcional. Atualiza ultimo sinal recebido.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      },
      Compartimento: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico do compartimento.'
          },
          dispositivoId: {
            type: 'string',
            format: 'uuid',
            description: 'Dispositivo ao qual o compartimento pertence.'
          },
          numero: {
            type: 'integer',
            minimum: 1,
            maximum: 99,
            description:
              'Numero fisico/logico do compartimento dentro do dispositivo.'
          },
          medicamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Medicamento associado ao compartimento. Pode ser null se estiver vazio.'
          },
          status: {
            type: 'string',
            enum: ['bloqueado', 'liberado', 'aberto', 'erro'],
            description:
              'Estado atual do compartimento para app/backend/IoT.'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            description: 'Observacoes simples sobre uso ou posicao.'
          },
          ativo: { type: 'boolean' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      CriarCompartimento: {
        type: 'object',
        required: ['numero'],
        properties: {
          numero: {
            type: 'integer',
            minimum: 1,
            maximum: 99,
            description:
              'Obrigatorio. Numero unico dentro do dispositivo.'
          },
          medicamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Opcional. UUID de um medicamento ativo para associar ao compartimento.'
          },
          status: {
            type: 'string',
            enum: ['bloqueado', 'liberado', 'aberto', 'erro'],
            default: 'bloqueado',
            description:
              'Opcional. Se nao enviar, o backend usa bloqueado.'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Observacoes sobre o compartimento.'
          }
        }
      },
      AtualizarCompartimento: {
        type: 'object',
        properties: {
          numero: {
            type: 'integer',
            minimum: 1,
            maximum: 99,
            description: 'Opcional. Novo numero do compartimento.'
          },
          medicamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Opcional. Novo medicamento ou null para deixar vazio.'
          },
          status: {
            type: 'string',
            enum: ['bloqueado', 'liberado', 'aberto', 'erro'],
            description: 'Opcional. Novo status do compartimento.'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Novas observacoes.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      },
      CriarComandoCompartimento: {
        type: 'object',
        properties: {
          motivo: {
            type: 'string',
            nullable: true,
            description:
              'Opcional. Motivo do comando, por exemplo Administrar medicamento ou Reposicao.'
          },
          agendamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Opcional. Agendamento relacionado ao uso da gaveta.'
          }
        }
      },
      ComandoDispositivo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          dispositivoId: {
            type: 'string',
            format: 'uuid',
            description: 'Dispositivo que deve executar o comando.'
          },
          compartimentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description: 'Gaveta relacionada ao comando.'
          },
          tipo: {
            type: 'string',
            enum: ['liberar_gaveta', 'travar_gaveta'],
            description: 'Acao que o IoT deve executar.'
          },
          status: {
            type: 'string',
            enum: ['pendente', 'enviado', 'confirmado', 'cancelado'],
            description: 'Estado do comando.'
          },
          enviadoEm: {
            type: 'string',
            nullable: true,
            format: 'date-time'
          },
          confirmadoEm: {
            type: 'string',
            nullable: true,
            format: 'date-time'
          },
          expiraEm: {
            type: 'string',
            nullable: true,
            format: 'date-time'
          },
          dados: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            description:
              'Dados extras para o IoT, como numeroCompartimento e medicamentoId.'
          },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      RegistrarEventoDispositivo: {
        type: 'object',
        required: ['chaveEvento', 'tipo'],
        properties: {
          chaveEvento: {
            type: 'string',
            description:
              'Obrigatorio. Chave unica gerada pelo dispositivo para evitar eventos duplicados.',
            example: 'pillgator-01-0001'
          },
          tipo: {
            type: 'string',
            enum: [
              'compartimento_aberto',
              'compartimento_fechado',
              'medicamento_retirado',
              'falha'
            ],
            description: 'Tipo do evento enviado pelo IoT.'
          },
          compartimentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Opcional. UUID da gaveta. Pode usar compartimentoNumero no lugar.'
          },
          compartimentoNumero: {
            type: 'integer',
            nullable: true,
            description:
              'Opcional. Numero fisico da gaveta dentro do dispositivo.'
          },
          medicamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Opcional. Se nao enviar, o backend usa o medicamento associado a gaveta.'
          },
          agendamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description: 'Opcional. Agendamento relacionado ao evento.'
          },
          ocorridoEm: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            description:
              'Opcional. Data/hora do evento. Se nao enviar, o backend usa agora.'
          },
          descricao: {
            type: 'string',
            nullable: true,
            description: 'Opcional. Descricao textual do evento.'
          },
          dados: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            description: 'Opcional. Leituras ou detalhes tecnicos do IoT.'
          }
        }
      },
      Notificacao: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico da notificacao.'
          },
          pacienteId: {
            type: 'string',
            format: 'uuid',
            description: 'Paciente relacionado a notificacao.'
          },
          responsavelId: {
            type: 'string',
            format: 'uuid',
            description: 'Responsavel que recebeu a notificacao.'
          },
          medicamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description: 'Medicamento em atraso, quando existir.'
          },
          agendamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description: 'Agendamento que gerou a notificacao.'
          },
          eventoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description: 'Evento de atraso relacionado.'
          },
          tipo: {
            type: 'string',
            enum: [
              'antes_horario_medicamento',
              'horario_medicamento',
              'atraso_medicamento'
            ],
            description: 'Tipo da notificacao.'
          },
          canal: {
            type: 'string',
            enum: ['interno', 'push'],
            description:
              'Canal usado no envio. Para Expo Push Notification, o valor sera push.'
          },
          status: {
            type: 'string',
            enum: ['pendente', 'enviada', 'erro'],
            description: 'Estado do envio da notificacao.'
          },
          titulo: {
            type: 'string',
            example: 'Medicamento em atraso'
          },
          mensagem: {
            type: 'string',
            example:
              'Dipirona 500mg estava previsto para 08:00 e nao foi registrado como retirado.'
          },
          enviadaEm: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            description: 'Data/hora em que o backend marcou a notificacao como enviada.'
          },
          lidaEm: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            description: 'Data/hora de leitura futura pelo app.'
          },
          dados: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            description:
              'Detalhes da notificacao, como horario previsto e limite da tolerancia.'
          },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      VerificarAtrasos: {
        type: 'object',
        properties: {
          referenciaEm: {
            type: 'string',
            format: 'date-time',
            description:
              'Opcional. Data/hora usada como referencia para calcular atrasos. Se nao enviar, usa agora.'
          }
        }
      },
      TokenPush: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          responsavelId: {
            type: 'string',
            format: 'uuid',
            description: 'Usuario responsavel dono do token.'
          },
          token: {
            type: 'string',
            description: 'Token Expo Push salvo pelo backend.',
            example: 'ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]'
          },
          plataforma: {
            type: 'string',
            enum: ['android', 'ios', 'web', 'desconhecida'],
            description: 'Plataforma informada pelo app.'
          },
          dispositivoNome: {
            type: 'string',
            nullable: true,
            description: 'Nome amigavel do aparelho.'
          },
          ativo: {
            type: 'boolean',
            description: 'Indica se o token pode receber notificacoes.'
          },
          ultimoRegistroEm: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            description: 'Data/hora do ultimo registro desse token.'
          },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      RegistrarTokenPush: {
        type: 'object',
        required: ['token'],
        properties: {
          responsavelId: {
            type: 'string',
            format: 'uuid',
            description:
              'Use apenas em testes sem autenticacao. No app real, o backend usa o responsavel logado.'
          },
          token: {
            type: 'string',
            description:
              'Obrigatorio. Token obtido no app com expo-notifications.',
            example: 'ExpoPushToken[aaaaaaaaaaaaaaaaaaaaaa]'
          },
          plataforma: {
            type: 'string',
            enum: ['android', 'ios', 'web', 'desconhecida'],
            description: 'Opcional. Plataforma do aparelho.',
            example: 'android'
          },
          dispositivoNome: {
            type: 'string',
            nullable: true,
            maxLength: 120,
            description: 'Opcional. Nome do aparelho para facilitar suporte.',
            example: 'Celular da Maria'
          }
        }
      },
      ProcessarNotificacoes: {
        type: 'object',
        properties: {
          referenciaEm: {
            type: 'string',
            format: 'date-time',
            description:
              'Opcional. Data/hora usada como referencia. Se nao enviar, usa agora.'
          },
          antecedenciaMinutos: {
            type: 'integer',
            minimum: 1,
            maximum: 240,
            description:
              'Opcional. Quantos minutos antes do horario o backend deve avisar. Padrao: 15.'
          },
          janelaMinutos: {
            type: 'integer',
            minimum: 1,
            maximum: 60,
            description:
              'Opcional. Janela para considerar que ainda esta na hora de disparar o aviso do horario. Padrao: 5.'
          }
        }
      },
      ResultadoVerificacaoAtrasos: {
        type: 'object',
        properties: {
          referenciaEm: {
            type: 'string',
            format: 'date-time',
            description: 'Data/hora usada na verificacao.'
          },
          atrasosDetectados: {
            type: 'integer',
            description:
              'Quantidade de ocorrencias de atraso encontradas e ainda nao registradas.'
          },
          eventosCriados: {
            type: 'integer',
            description: 'Quantidade de eventos de atraso criados.'
          },
          notificacoesCriadas: {
            type: 'integer',
            description: 'Quantidade de notificacoes criadas para responsaveis.'
          }
        }
      },
      ResultadoProcessamentoNotificacoes: {
        type: 'object',
        properties: {
          referenciaEm: {
            type: 'string',
            format: 'date-time',
            description: 'Data/hora usada no processamento.'
          },
          notificacoesCriadas: {
            type: 'integer',
            description: 'Quantidade de notificacoes criadas.'
          },
          notificacoesEnviadas: {
            type: 'integer',
            description: 'Quantidade enviada com sucesso para Expo Push.'
          },
          notificacoesComErro: {
            type: 'integer',
            description:
              'Quantidade que falhou, por exemplo por falta de token push ativo.'
          }
        }
      },
      Medicamento: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico criado pelo backend.'
          },
          pacienteId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description:
              'Paciente que usa este medicamento. Em novos cadastros deve sempre existir.'
          },
          baseMedicamentoId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description:
              'Medicamento da base CSV usado como referencia. Pode ser null em cadastro manual.'
          },
          nome: {
            type: 'string',
            description:
              'Nome do medicamento no tratamento do paciente. Pode vir da base ou ser informado manualmente.',
            example: 'Losartana'
          },
          dosagem: {
            type: 'string',
            description: 'Dosagem prescrita ou cadastrada.',
            example: '50mg'
          },
          quantidadeAdministrada: {
            type: 'string',
            nullable: true,
            description:
              'Quantidade que deve ser administrada em cada horario. Exemplo: 1, 2, 20.',
            example: '1'
          },
          unidadeAdministracao: {
            type: 'string',
            nullable: true,
            description:
              'Unidade da quantidade administrada. Exemplo: comprimido, gotas, ml.',
            example: 'comprimido'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            description: 'Instrucoes adicionais simples.',
            example: 'Tomar pela manha com agua.'
          },
          ativo: {
            type: 'boolean',
            description: 'Indica se o medicamento aparece nas listagens.'
          },
          criadoEm: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criacao.'
          },
          atualizadoEm: {
            type: 'string',
            format: 'date-time',
            description: 'Data da ultima atualizacao.'
          }
        }
      },
      BaseMedicamento: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador do medicamento na base de consulta.'
          },
          nomeProduto: {
            type: 'string',
            description: 'Nome comercial/produto no CSV.',
            example: 'AAS'
          },
          categoriaProduto: {
            type: 'string',
            nullable: true,
            description: 'Categoria do produto.',
            example: 'ANALGESICOS NAO NARCOTICOS'
          },
          principioAtivo: {
            type: 'string',
            nullable: true,
            description: 'Principio ativo.',
            example: 'ACIDO ACETILSALICILICO'
          },
          concentracao: {
            type: 'string',
            nullable: true,
            description: 'Concentracao informada na base.',
            example: '100,000'
          },
          destinacao: {
            type: 'string',
            nullable: true,
            description: 'Destinacao do medicamento.'
          },
          formaFisica: {
            type: 'string',
            nullable: true,
            description: 'Forma fisica/apresentacao.',
            example: 'COMPRIMIDO SIMPLES'
          },
          restricaoPrescricao: {
            type: 'string',
            nullable: true,
            description: 'Restricao de prescricao.',
            example: 'VENDA SOB PRESCRICAO MEDICA'
          },
          restritoHospitalar: {
            type: 'boolean',
            description: 'Indica se e restrito a uso hospitalar.'
          },
          restricaoUso: {
            type: 'string',
            nullable: true,
            description: 'Restricao de uso.',
            example: 'Adulto'
          },
          fonte: {
            type: 'string',
            description: 'Nome da fonte importada.',
            example: 'TA_RESTRICAO_MEDICAMENTO'
          }
        }
      },
      CriarMedicamento: {
        type: 'object',
        required: [
          'pacienteId',
          'quantidadeAdministrada',
          'unidadeAdministracao'
        ],
        properties: {
          pacienteId: {
            type: 'string',
            format: 'uuid',
            description:
              'Obrigatorio. UUID do paciente que vai tomar este medicamento.',
            example: '3fd35f96-0e71-4b08-9101-123456789abc'
          },
          baseMedicamentoId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description:
              'Opcional. UUID retornado em GET /base-medicamentos. Use quando o remedio foi encontrado na base CSV.'
          },
          nome: {
            type: 'string',
            maxLength: 120,
            description:
              'Obrigatorio apenas quando nao usar baseMedicamentoId ou quando quiser sobrescrever o nome da base.',
            example: 'Losartana'
          },
          dosagem: {
            type: 'string',
            maxLength: 60,
            description:
              'Obrigatorio apenas quando a base nao informar concentracao ou quando quiser sobrescrever a dosagem.',
            example: '50mg'
          },
          quantidadeAdministrada: {
            type: 'string',
            maxLength: 80,
            description:
              'Obrigatorio. Quantidade que o paciente deve receber em cada administracao.',
            example: '1'
          },
          unidadeAdministracao: {
            type: 'string',
            maxLength: 40,
            description:
              'Obrigatorio. Unidade da quantidade: comprimido, gotas, ml, capsula etc.',
            example: 'comprimido'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Instrucoes adicionais.',
            example: 'Tomar pela manha com agua.'
          }
        }
      },
      AtualizarMedicamento: {
        type: 'object',
        properties: {
          baseMedicamentoId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description:
              'Opcional. Envie um UUID da base para trocar a referencia, ou null para remover a referencia.'
          },
          nome: {
            type: 'string',
            maxLength: 120,
            description: 'Opcional. Novo nome do medicamento.',
            example: 'Losartana Potassica'
          },
          dosagem: {
            type: 'string',
            maxLength: 60,
            description: 'Opcional. Nova dosagem do medicamento.',
            example: '50mg'
          },
          quantidadeAdministrada: {
            type: 'string',
            maxLength: 80,
            description: 'Opcional. Nova quantidade por administracao.',
            example: '2'
          },
          unidadeAdministracao: {
            type: 'string',
            maxLength: 40,
            description: 'Opcional. Nova unidade da quantidade administrada.',
            example: 'comprimidos'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Novas instrucoes adicionais.',
            example: 'Tomar sempre no mesmo horario.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      },
      Agendamento: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          medicamentoId: { type: 'string', format: 'uuid' },
          tipo: {
            type: 'string',
            enum: ['horarios_fixos', 'intervalo'],
            description: 'Forma de programacao do medicamento.'
          },
          diasSemana: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 6 },
            description:
              'Dias da semana. 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.',
            example: [1, 2, 3, 4, 5]
          },
          horarios: {
            type: 'array',
            nullable: true,
            items: { type: 'string', example: '08:00' },
            description:
              'Obrigatorio quando tipo for horarios_fixos. Use HH:mm.'
          },
          intervaloHoras: {
            type: 'integer',
            nullable: true,
            minimum: 1,
            maximum: 24,
            description:
              'Obrigatorio quando tipo for intervalo. Exemplo: 8 para tomar de 8 em 8 horas.'
          },
          horarioInicio: {
            type: 'string',
            nullable: true,
            description:
              'Obrigatorio quando tipo for intervalo. Primeiro horario do dia no formato HH:mm.',
            example: '06:00'
          },
          inicioEm: {
            type: 'string',
            nullable: true,
            description: 'Data de inicio do tratamento no formato DD/MM/AAAA.'
          },
          fimEm: {
            type: 'string',
            nullable: true,
            description:
              'Data final do tratamento no formato DD/MM/AAAA. Pode ser null para tratamento sem fim definido.'
          },
          toleranciaMinutos: {
            type: 'integer',
            minimum: 0,
            maximum: 240,
            description:
              'Tempo em minutos que o paciente tem para retirar o medicamento depois do alerta.'
          },
          cuidados: {
            type: 'string',
            nullable: true,
            description:
              'Orientacoes simples, como nao tomar com leite ou tomar apos refeicao.'
          },
          ativo: { type: 'boolean' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      ProximaAdministracao: {
        type: 'object',
        properties: {
          agendamentoId: {
            type: 'string',
            format: 'uuid',
            description: 'Agendamento que gerou este horario.'
          },
          medicamentoId: {
            type: 'string',
            format: 'uuid',
            description: 'Medicamento do paciente que deve ser administrado.'
          },
          pacienteId: {
            type: 'string',
            format: 'uuid',
            description: 'Paciente que recebera o medicamento.'
          },
          medicamentoNome: {
            type: 'string',
            description: 'Nome do medicamento para exibir no app.',
            example: 'Losartana'
          },
          horarioPrevisto: {
            type: 'string',
            description:
              'Data e horario previstos no formato DD/MM/AAAA HH:mm.',
            example: '12/05/2026 08:00'
          },
          tipo: {
            type: 'string',
            enum: ['horarios_fixos', 'intervalo'],
            description: 'Tipo de regra que gerou o horario.'
          },
          cuidados: {
            type: 'string',
            nullable: true,
            description:
              'Cuidados cadastrados no agendamento, quando existirem.'
          }
        }
      },
      CriarAgendamento: {
        type: 'object',
        required: ['medicamentoId', 'tipo', 'diasSemana'],
        properties: {
          medicamentoId: {
            type: 'string',
            format: 'uuid',
            description:
              'Obrigatorio. Id do medicamento que sera agendado.'
          },
          tipo: {
            type: 'string',
            enum: ['horarios_fixos', 'intervalo'],
            description:
              'Obrigatorio. Use horarios_fixos para horarios exatos ou intervalo para repeticao de X em X horas.'
          },
          diasSemana: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 6 },
            description:
              'Obrigatorio. 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.'
          },
          horarios: {
            type: 'array',
            items: { type: 'string', example: '08:00' },
            description:
              'Obrigatorio para tipo horarios_fixos. Nao use este campo para tipo intervalo.'
          },
          intervaloHoras: {
            type: 'integer',
            minimum: 1,
            maximum: 24,
            description:
              'Obrigatorio para tipo intervalo. Nao use este campo para tipo horarios_fixos.'
          },
          horarioInicio: {
            type: 'string',
            description:
              'Obrigatorio para tipo intervalo. Primeiro horario do dia no formato HH:mm.'
          },
          inicioEm: {
            type: 'string',
            nullable: true,
            description: 'Opcional. Data de inicio no formato DD/MM/AAAA ou DD/MM/AAAA HH:mm.'
          },
          fimEm: {
            type: 'string',
            nullable: true,
            description: 'Opcional. Data final no formato DD/MM/AAAA ou DD/MM/AAAA HH:mm.'
          },
          toleranciaMinutos: {
            type: 'integer',
            minimum: 0,
            maximum: 240,
            default: 30,
            description:
              'Opcional. Tempo para considerar atraso depois do alerta.'
          },
          cuidados: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Orientacoes de cuidado.'
          }
        }
      },
      AtualizarAgendamento: {
        type: 'object',
        properties: {
          medicamentoId: {
            type: 'string',
            format: 'uuid',
            description:
              'Opcional. Use apenas se precisar trocar o medicamento do agendamento.'
          },
          tipo: {
            type: 'string',
            enum: ['horarios_fixos', 'intervalo'],
            description:
              'Opcional. Se trocar o tipo, ajuste tambem os campos de horario correspondentes.'
          },
          diasSemana: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 6 },
            description:
              'Opcional. Dias da semana. 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.'
          },
          horarios: {
            type: 'array',
            items: { type: 'string', example: '08:00' },
            description:
              'Opcional. Use quando tipo for horarios_fixos. Formato HH:mm.'
          },
          intervaloHoras: {
            type: 'integer',
            minimum: 1,
            maximum: 24,
            description:
              'Opcional. Use quando tipo for intervalo. Exemplo: 8 para de 8 em 8 horas.'
          },
          horarioInicio: {
            type: 'string',
            description:
              'Opcional. Use quando tipo for intervalo. Primeiro horario do dia no formato HH:mm.'
          },
          inicioEm: {
            type: 'string',
            nullable: true,
            description: 'Opcional. Nova data de inicio no formato DD/MM/AAAA ou DD/MM/AAAA HH:mm.'
          },
          fimEm: {
            type: 'string',
            nullable: true,
            description: 'Opcional. Nova data final no formato DD/MM/AAAA ou DD/MM/AAAA HH:mm.'
          },
          toleranciaMinutos: {
            type: 'integer',
            minimum: 0,
            maximum: 240,
            description:
              'Opcional. Novo tempo de tolerancia em minutos.'
          },
          cuidados: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Novas orientacoes de cuidado.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      },
      Evento: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico do evento.'
          },
          medicamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Medicamento relacionado ao evento. Pode ser null em evento geral de dispositivo.'
          },
          agendamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Agendamento relacionado ao evento. Pode ser null quando o evento nao veio de uma programacao.'
          },
          dispositivoId: {
            type: 'string',
            nullable: true,
            description:
              'Identificador do dispositivo IoT. Ainda nao depende de cadastro de dispositivo.'
          },
          tipo: {
            type: 'string',
            enum: [
              'alerta_emitido',
              'compartimento_aberto',
              'medicamento_retirado',
              'atraso',
              'falha'
            ],
            description:
              'Tipo do acontecimento registrado no historico.'
          },
          origem: {
            type: 'string',
            enum: ['backend', 'mobile', 'iot'],
            description: 'Quem registrou ou enviou o evento.'
          },
          ocorridoEm: {
            type: 'string',
            format: 'date-time',
            description:
              'Data e hora em que o evento aconteceu. Se nao enviar no cadastro, o backend usa o momento atual.'
          },
          descricao: {
            type: 'string',
            nullable: true,
            description:
              'Texto curto em portugues explicando o evento para historico.'
          },
          dados: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            description:
              'Objeto JSON opcional com detalhes tecnicos, como compartimento, sensor ou horario previsto.'
          },
          criadoEm: {
            type: 'string',
            format: 'date-time',
            description: 'Data em que o registro foi salvo no banco.'
          }
        }
      },
      CriarEvento: {
        type: 'object',
        required: ['tipo'],
        properties: {
          medicamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Opcional. UUID do medicamento. Se enviar agendamentoId, pode omitir este campo.'
          },
          agendamentoId: {
            type: 'string',
            nullable: true,
            format: 'uuid',
            description:
              'Opcional. UUID do agendamento. Quando enviado, o backend valida se ele existe e esta ativo.'
          },
          dispositivoId: {
            type: 'string',
            nullable: true,
            maxLength: 120,
            description:
              'Opcional. Identificador do dispositivo IoT, por exemplo pillgator-01.'
          },
          tipo: {
            type: 'string',
            enum: [
              'alerta_emitido',
              'compartimento_aberto',
              'medicamento_retirado',
              'atraso',
              'falha'
            ],
            description:
              'Obrigatorio. Escolha o tipo que melhor representa o que aconteceu.'
          },
          origem: {
            type: 'string',
            enum: ['backend', 'mobile', 'iot'],
            default: 'backend',
            description:
              'Opcional. Informe backend, mobile ou iot. Se nao enviar, sera backend.'
          },
          ocorridoEm: {
            type: 'string',
            format: 'date-time',
            description:
              'Opcional. Data/hora ISO 8601. Exemplo: 2026-05-12T10:00:00.000Z.'
          },
          descricao: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description:
              'Opcional. Explicacao simples para o historico do paciente/responsavel.'
          },
          dados: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            description:
              'Opcional. Objeto JSON com detalhes extras. Nao envie lista nem texto solto aqui.'
          }
        }
      }
    }
  }
} as const;
