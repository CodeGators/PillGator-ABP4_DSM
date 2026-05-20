import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

export type TipoUsuario = 'responsavel' | 'administrador';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 11, unique: true, nullable: true })
  cpf!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefone!: string | null;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento!: string | null;

  @Column({ name: 'endereco_rua', type: 'varchar', length: 160, nullable: true })
  enderecoRua!: string | null;

  @Column({ name: 'endereco_estado', type: 'varchar', length: 2, nullable: true })
  enderecoEstado!: string | null;

  @Column({ name: 'endereco_cidade', type: 'varchar', length: 120, nullable: true })
  enderecoCidade!: string | null;

  @Column({ name: 'endereco_cep', type: 'varchar', length: 8, nullable: true })
  enderecoCep!: string | null;

  @Column({
    name: 'endereco_complemento',
    type: 'varchar',
    length: 120,
    nullable: true
  })
  enderecoComplemento!: string | null;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255, nullable: true })
  senhaHash!: string | null;

  @Column({ type: 'varchar', length: 30 })
  tipo!: TipoUsuario;

  @Column({ name: 'recebe_notificacoes', type: 'boolean', default: false })
  recebeNotificacoes!: boolean;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;

  public toJSON() {
    const { senhaHash: _senhaHash, ...usuarioSemSenha } = this;
    void _senhaHash;

    return usuarioSemSenha;
  }
}
