import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('base_medicamentos')
export class BaseMedicamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nome_produto', type: 'varchar', length: 180 })
  nomeProduto!: string;

  @Column({ name: 'categoria_produto', type: 'varchar', length: 180, nullable: true })
  categoriaProduto!: string | null;

  @Column({ name: 'principio_ativo', type: 'varchar', length: 240, nullable: true })
  principioAtivo!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  concentracao!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  destinacao!: string | null;

  @Column({ name: 'forma_fisica', type: 'varchar', length: 180, nullable: true })
  formaFisica!: string | null;

  @Column({
    name: 'restricao_prescricao',
    type: 'varchar',
    length: 180,
    nullable: true
  })
  restricaoPrescricao!: string | null;

  @Column({ name: 'restrito_hospitalar', type: 'boolean', default: false })
  restritoHospitalar!: boolean;

  @Column({ name: 'restricao_uso', type: 'varchar', length: 180, nullable: true })
  restricaoUso!: string | null;

  @Column({ type: 'varchar', length: 80, default: 'TA_RESTRICAO_MEDICAMENTO' })
  fonte!: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
