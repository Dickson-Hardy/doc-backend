import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MemberDocument = Member & Document;

@Schema({ collection: 'users', timestamps: true })
export class Member {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  middleName?: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  fullName?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  role: string; // 'Student' | 'Doctor' | 'GlobalNetwork'

  @Prop({ required: true })
  region: string; // Chapter/Region

  @Prop()
  membershipId?: string; // e.g., CM100000026

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  subscribed: boolean;

  @Prop()
  subscriptionExpiry?: Date;

  // Student-specific fields
  @Prop()
  admissionYear?: number;

  @Prop()
  yearOfStudy?: string;

  // Doctor-specific fields
  @Prop()
  licenseNumber?: string;

  @Prop()
  specialty?: string;

  @Prop()
  yearsOfExperience?: string; // '0 - 5 Years' or '5 Years and Above'

  @Prop()
  avatarUrl?: string;

  @Prop()
  eventsRegistered?: string[];
}

export const MemberSchema = SchemaFactory.createForClass(Member);
