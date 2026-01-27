import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberMongoId: string; // MongoDB ObjectId as string

  @Column()
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

  @Column({ nullable: true })
  currentLeadershipPost: string;

  @Column({ nullable: true })
  previousLeadershipPost: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  chapterOfGraduation: string;

  // Spouse details (for doctor-with-spouse category)
  @Column({ nullable: true })
  spouseSurname: string;

  @Column({ nullable: true })
  spouseFirstName: string;

  @Column({ nullable: true })
  spouseOtherNames: string;

  @Column({ nullable: true })
  spouseEmail: string;

  // Logistics
  @Column({ type: 'date' })
  dateOfArrival: Date;

  // Accommodation Details
  @Column({ nullable: true })
  accommodationType: string;

  @Column({ nullable: true })
  covenantRoomType: string;

  @Column({ nullable: true })
  temperanceRoomType: string;

  @Column({ nullable: true })
  roomSharing: string;

  @Column({ nullable: true })
  roommateName: string;

  // Abstract submission
  @Column({ default: false })
  hasAbstract: boolean;

  @Column({ nullable: true })
  presentationTitle: string;

  @Column({ nullable: true })
  abstractFileUrl: string;

  // Payment details
  @Column({ default: 0 })
  baseFee: number;

  @Column({ default: 0 })
  lateFee: number;

  @Column({ default: 0 })
  totalAmount: number;

  @Column({ default: 'pending' })
  paymentStatus: string; // 'pending' | 'paid' | 'failed'

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true, type: 'timestamp' })
  paidAt: Date;

  // Attendance verification
  @Column({ default: false })
  attendanceVerified: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
