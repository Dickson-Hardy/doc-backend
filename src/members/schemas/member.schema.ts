import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MemberDocument = Member & Document;

@Schema({ collection: 'members', timestamps: true })
export class Member {
  @Prop({ required: true })
  email: string;

  @Prop()
  surname: string;

  @Prop()
  firstName: string;

  @Prop()
  otherNames: string;

  @Prop()
  age: number;

  @Prop()
  sex: string;

  @Prop()
  phone: string;

  @Prop()
  chapter: string;

  @Prop()
  state: string;

  @Prop({ default: false })
  isCmdaMember: boolean;

  @Prop()
  currentLeadershipPost: string;

  @Prop()
  previousLeadershipPost: string;

  @Prop()
  category: string;

  @Prop()
  chapterOfGraduation: string;

  @Prop()
  yearsInPractice: string;

  @Prop()
  membershipId: string;

  @Prop()
  licenseNumber: string;

  @Prop()
  specialty: string;

  @Prop()
  role: string;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
