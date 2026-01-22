import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  surname: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  otherNames: string;

  @Column()
  age: number;

  @Column()
  sex: string;

  @Column()
  phone: string;

  @Column()
  chapter: string;

  @Column({ default: false })
  isCmdaMember: boolean;

  @Column({ nullable: true })
  currentLeadershipPost: string;

  @Column({ nullable: true })
  previousLeadershipPost: string;

  @Column()
  category: string; // 'student' | 'doctor' | 'doctor-with-spouse'

  @Column({ nullable: true })
  chapterOfGraduation: string;

  @Column({ nullable: true })
  yearsInPractice: string; // 'less-than-5' | '5-and-above'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
