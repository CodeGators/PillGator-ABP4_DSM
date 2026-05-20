import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { AgendamentoMedicamento } from './AgendamentoMedicamento.js';
import { Medicamento } from './Medicamento.js';

export type TipoEventoMedicamento =
  | 'alerta_emitido'
  | 'compartimento_aberto'
  | 'compartimento_fechado'
  | 'medicamento_retirado'
  | 'atraso'
  | 'falha';

export type OrigemEventoMedicamento = 'backend' | 'mobile' | 'iot';

@Entity('eventos_medicamentos')
export class EventoMedicamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ name: 'dispositivo_id', type: 'varchar', length: 120, nullable: true })
  dispositivoId!: string | null;

  @Column({ type: 'varchar', length: 40 })
  tipo!: TipoEventoMedicamento;

  @Column({ type: 'varchar', length: 20 })
  origem!: OrigemEventoMedicamento;

  @Column({ name: 'ocorrido_em', type: 'timestamp with time zone' })
  ocorridoEm!: Date;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  dados!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;
}
