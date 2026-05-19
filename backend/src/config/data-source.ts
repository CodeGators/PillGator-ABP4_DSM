import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { AgendamentoMedicamento } from '../entidades/AgendamentoMedicamento.js';
import { Compartimento } from '../entidades/Compartimento.js';
import { Dispositivo } from '../entidades/Dispositivo.js';
import { EventoMedicamento } from '../entidades/EventoMedicamento.js';
import { Medicamento } from '../entidades/Medicamento.js';
import { Notificacao } from '../entidades/Notificacao.js';
import { Paciente } from '../entidades/Paciente.js';
import { PacienteResponsavel } from '../entidades/PacienteResponsavel.js';
import { Usuario } from '../entidades/Usuario.js';
import { AdicionarDadosCadastroUsuarios1780000000000 } from '../database/migrations/1780000000000-AdicionarDadosCadastroUsuarios.js';
import { CriarTabelaNotificacoes1770000000000 } from '../database/migrations/1770000000000-CriarTabelaNotificacoes.js';
import { CriarTabelasDispositivosCompartimentos1760000000000 } from '../database/migrations/1760000000000-CriarTabelasDispositivosCompartimentos.js';
import { AdicionarSenhaHashUsuarios1750000000000 } from '../database/migrations/1750000000000-AdicionarSenhaHashUsuarios.js';
import { CriarTabelasUsuariosPacientes1740000000000 } from '../database/migrations/1740000000000-CriarTabelasUsuariosPacientes.js';
import { CriarTabelaEventosMedicamentos1730000000000 } from '../database/migrations/1730000000000-CriarTabelaEventosMedicamentos.js';
import { CriarTabelaAgendamentosMedicamentos1720000000000 } from '../database/migrations/1720000000000-CriarTabelaAgendamentosMedicamentos.js';
import { CriarTabelaMedicamentos1710000000000 } from '../database/migrations/1710000000000-CriarTabelaMedicamentos.js';
import { env } from './env.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.bancoUrl,
  synchronize: false,
  logging: false,
  entities: [
    Medicamento,
    AgendamentoMedicamento,
    EventoMedicamento,
    Usuario,
    Paciente,
    PacienteResponsavel,
    Dispositivo,
    Compartimento,
    Notificacao
  ],
  migrations: [
    CriarTabelaMedicamentos1710000000000,
    CriarTabelaAgendamentosMedicamentos1720000000000,
    CriarTabelaEventosMedicamentos1730000000000,
    CriarTabelasUsuariosPacientes1740000000000,
    AdicionarSenhaHashUsuarios1750000000000,
    CriarTabelasDispositivosCompartimentos1760000000000,
    CriarTabelaNotificacoes1770000000000,
    AdicionarDadosCadastroUsuarios1780000000000
  ]
});
