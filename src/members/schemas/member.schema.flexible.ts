import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MemberDocument = Member & Document;

/**
 * Flexible Member Schema
 * 
 * This schema uses optional fields to accommodate different database structures.
 * Update the collection name and field names based on your actual MongoDB structure.
 * 
 * To find your structure, run: node backend/scripts/inspect-mongodb.js
 */

@Schema({ 
  collection: 'members',  // ← UPDATE THIS: Could be 'users', 'doctors', etc.
  timestamps: true,
  strict: false  // Allow additional fields not defined in schema
})
export class Member {
  // Email field (check your database for exact field name)
  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  Email?: string;  // Some databases use capital E

  @Prop({ required: false })
  emailAddress?: string;

  // Name fields (various possible formats)
  @Prop({ required: false })
  surname?: string;

  @Prop({ required: false })
  lastName?: string;

  @Prop({ required: false })
  last_name?: string;

  @Prop({ required: false })
  firstName?: string;

  @Prop({ required: false })
  first_name?: string;

  @Prop({ required: false })
  fname?: string;

  @Prop({ required: false })
  otherNames?: string;

  @Prop({ required: false })
  middleName?: string;

  @Prop({ required: false })
  middle_name?: string;

  // Full name (if stored as single field)
  @Prop({ required: false })
  fullName?: string;

  @Prop({ required: false })
  name?: string;

  // Age
  @Prop({ required: false })
  age?: number;

  @Prop({ required: false })
  dateOfBirth?: Date;

  @Prop({ required: false })
  dob?: Date;

  // Sex/Gender
  @Prop({ required: false })
  sex?: string;

  @Prop({ required: false })
  gender?: string;

  // Phone
  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  phoneNumber?: string;

  @Prop({ required: false })
  phone_number?: string;

  @Prop({ required: false })
  mobile?: string;

  // Chapter
  @Prop({ required: false })
  chapter?: string;

  @Prop({ required: false })
  branch?: string;

  @Prop({ required: false })
  location?: string;

  // CMDA Membership
  @Prop({ required: false, default: false })
  isCmdaMember?: boolean;

  @Prop({ required: false, default: false })
  is_cmda_member?: boolean;

  @Prop({ required: false, default: false })
  memberStatus?: boolean;

  @Prop({ required: false })
  membershipStatus?: string;

  @Prop({ required: false })
  currentLeadershipPost?: string;

  @Prop({ required: false })
  current_leadership_post?: string;

  @Prop({ required: false })
  leadershipPosition?: string;

  @Prop({ required: false })
  previousLeadershipPost?: string;

  @Prop({ required: false })
  previous_leadership_post?: string;

  // Category
  @Prop({ required: false })
  category?: string;

  @Prop({ required: false })
  memberType?: string;

  @Prop({ required: false })
  member_type?: string;

  @Prop({ required: false })
  type?: string;

  @Prop({ required: false })
  userType?: string;

  // Professional details
  @Prop({ required: false })
  chapterOfGraduation?: string;

  @Prop({ required: false })
  chapter_of_graduation?: string;

  @Prop({ required: false })
  graduationChapter?: string;

  @Prop({ required: false })
  schoolOfGraduation?: string;

  @Prop({ required: false })
  yearsInPractice?: string;

  @Prop({ required: false })
  years_in_practice?: string;

  @Prop({ required: false })
  experienceYears?: number;

  @Prop({ required: false })
  practiceYears?: string;

  // Additional common fields
  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  state?: string;

  @Prop({ required: false })
  country?: string;

  @Prop({ required: false })
  specialty?: string;

  @Prop({ required: false })
  qualification?: string;

  @Prop({ required: false })
  registrationNumber?: string;

  @Prop({ required: false })
  mdcnNumber?: string;

  @Prop({ required: false })
  createdAt?: Date;

  @Prop({ required: false })
  updatedAt?: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

// Add indexes for common query fields
MemberSchema.index({ email: 1 });
MemberSchema.index({ Email: 1 });
MemberSchema.index({ emailAddress: 1 });
