import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Compartimento } from './Compartimento.js';
import { Dispositivo } from './Dispositivo.js';

export type TipoComandoDispositivo = 'liberar_gaveta' | 'travar_gaveta';
export type StatusComandoDispositivo =
  | 'pendente'
  | 'enviado'
  | 'confirmado'
  | 'cancelado';

@Entity('comandos_dispositivos')
export class ComandoDispositivo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dispositivo_id', type: 'uuid' })
  dispositivoId!: string;

  @ManyToOne(() => Dispositivo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dispositivo_id' })
  dispositivo!: Dispositivo;

  @Column({ name: 'compartimento_id', type: 'uuid', nullable: true })
  compartimentoId!: string | null;

  @ManyToOne(() => Compartimento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'compartimento_id' })
  compartimento!: Compartimento | null;

  @Column({ type: 'varchar', length: 40 })
  tipo!: TipoComandoDispositivo;

  @Column({ type: 'varchar', length: 30 })
  status!: StatusComandoDispositivo;

  @Column({ name: 'enviado_em', type: 'timestamp with time zone', nullable: true })
  enviadoEm!: Date | null;

  @Column({
    name: 'confirmado_em',
    type: 'timestamp with time zone',
    nullable: true
  })
  confirmadoEm!: Date | null;

  @Column({ name: 'expira_em', type: 'timestamp with time zone', nullable: true })
  expiraEm!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  dados!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
