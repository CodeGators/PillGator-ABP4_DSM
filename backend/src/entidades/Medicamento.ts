import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { BaseMedicamento } from './BaseMedicamento.js';
import { Paciente } from './Paciente.js';

@Entity('medicamentos')
export class Medicamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'paciente_id', type: 'uuid', nullable: true })
  pacienteId!: string | null;

  @ManyToOne(() => Paciente, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente!: Paciente | null;

  @Column({ name: 'base_medicamento_id', type: 'uuid', nullable: true })
  baseMedicamentoId!: string | null;

  @ManyToOne(() => BaseMedicamento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'base_medicamento_id' })
  baseMedicamento!: BaseMedicamento | null;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ type: 'varchar', length: 60 })
  dosagem!: string;

  @Column({
    name: 'quantidade_administrada',
    type: 'varchar',
    length: 80,
    nullable: true
  })
  quantidadeAdministrada!: string | null;

  @Column({
    name: 'unidade_administracao',
    type: 'varchar',
    length: 40,
    nullable: true
  })
  unidadeAdministracao!: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes?: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
