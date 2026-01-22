import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipientEmail: string;

  @Column()
  subject: string;

  @Column()
  status: string; // 'sent' | 'failed'

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  registrationId: string;

  @CreateDateColumn()
  sentAt: Date;
}
