import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { AgendamentoMedicamento } from './AgendamentoMedicamento.js';
import { EventoMedicamento } from './EventoMedicamento.js';
import { Medicamento } from './Medicamento.js';
import { Paciente } from './Paciente.js';
import { Usuario } from './Usuario.js';

export type TipoNotificacao =
  | 'antes_horario_medicamento'
  | 'horario_medicamento'
  | 'atraso_medicamento';
export type StatusNotificacao = 'pendente' | 'enviada' | 'erro';
export type CanalNotificacao = 'interno' | 'push';

@Entity('notificacoes')
export class Notificacao {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId!: string;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente!: Paciente;

  @Column({ name: 'responsavel_id', type: 'uuid' })
  responsavelId!: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel!: Usuario;

  @Column({ name: 'medicamento_id', type: 'uuid', nullable: true })
  medicamentoId!: string | null;

  @ManyToOne(() => Medicamento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'medicamento_id' })
  medicamento!: Medicamento | null;

  @Column({ name: 'agendamento_id', type: 'uuid', nullable: true })
  agendamentoId!: string | null;

  @ManyToOne(() => AgendamentoMedicamento, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'agendamento_id' })
  agendamento!: AgendamentoMedicamento | null;

  @Column({ name: 'evento_id', type: 'uuid', nullable: true })
  eventoId!: string | null;

  @ManyToOne(() => EventoMedicamento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evento_id' })
  evento!: EventoMedicamento | null;

  @Column({ type: 'varchar', length: 40 })
  tipo!: TipoNotificacao;

  @Column({ type: 'varchar', length: 20 })
  canal!: CanalNotificacao;

  @Column({ type: 'varchar', length: 20 })
  status!: StatusNotificacao;

  @Column({ type: 'varchar', length: 160 })
  titulo!: string;

  @Column({ type: 'text' })
  mensagem!: string;

  @Column({ name: 'enviada_em', type: 'timestamp with time zone', nullable: true })
  enviadaEm!: Date | null;

  @Column({ name: 'lida_em', type: 'timestamp with time zone', nullable: true })
  lidaEm!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  dados!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
