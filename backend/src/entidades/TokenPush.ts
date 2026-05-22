import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Usuario } from './Usuario.js';

export type PlataformaPush = 'android' | 'ios' | 'web' | 'desconhecida';

@Entity('tokens_push')
export class TokenPush {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'responsavel_id', type: 'uuid' })
  responsavelId!: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel!: Usuario;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ type: 'varchar', length: 20, default: 'desconhecida' })
  plataforma!: PlataformaPush;

  @Column({
    name: 'dispositivo_nome',
    type: 'varchar',
    length: 120,
    nullable: true
  })
  dispositivoNome!: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @Column({
    name: 'ultimo_registro_em',
    type: 'timestamp with time zone',
    nullable: true
  })
  ultimoRegistroEm!: Date | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
