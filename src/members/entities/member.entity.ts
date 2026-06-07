import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  surname: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  otherNames: string;

  @Column({ default: 25 })
  age: number;

  @Column()
  sex: string;

  @Column()
  phone: string;

  @Column()
  chapter: string;

  @Column({ nullable: true })
  state: string;

  @Column({ default: false })
  isCmdaMember: boolean;

  @Column({ nullable: true })
  currentLeadershipPost: string;

  @Column({ nullable: true })
  previousLeadershipPost: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  chapterOfGraduation: string;

  @Column({ nullable: true })
  yearsInPractice: string;

  @Column({ nullable: true })
  membershipId: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  specialty: string;

  @Column({ nullable: true })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
