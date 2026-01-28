import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member, MemberDocument } from './schemas/member.schema';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name)
    private memberModel: Model<MemberDocument>,
  ) {}

  /**
   * Map MongoDB role to conference registration category
   */
  private mapRoleToCategory(role: string, yearsOfExperience?: string): string {
    switch (role) {
      case 'Student':
        return 'student';
      case 'Doctor':
      case 'GlobalNetwork':
        // Check years of experience to determine junior vs senior
        if (yearsOfExperience) {
          if (yearsOfExperience === '0 - 5 Years') {
            return 'junior-doctor';
          } else if (yearsOfExperience === '5 Years and Above') {
            return 'senior-doctor';
          }
        }
        // Default to junior-doctor if no experience data
        return 'junior-doctor';
      default:
        return 'junior-doctor';
    }
  }

  /**
   * Calculate years in practice from license date or other fields
   * This is a placeholder - adjust based on actual data structure
   */
  private calculateYearsInPractice(member: Member): string | undefined {
    // If we have createdAt and role is Doctor, we could estimate
    // For now, return undefined and let user select
    return undefined;
  }

  async findByEmail(email: string): Promise<any | null> {
    const member = await this.memberModel.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } // Case-insensitive search
    }).lean().exec();

    if (!member) {
      return null;
    }

    // Calculate age from dateOfBirth if available
    let age = 25; // Default age
    if (member.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(member.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Transform MongoDB user document to expected frontend format
    return {
      email: member.email,
      
      // Map MongoDB fields to frontend expected fields
      surname: member.lastName,
      firstName: member.firstName,
      otherNames: member.middleName || '',
      
      age: age,
      sex: member.gender.toLowerCase(), // 'Male' -> 'male', 'Female' -> 'female'
      phone: member.phone,
      
      // CMDA Information
      chapter: member.region, // region is the chapter
      isCmdaMember: true, // All users in this DB are members
      currentLeadershipPost: '',
      previousLeadershipPost: '',
      
      // Category & Professional Details
      category: this.mapRoleToCategory(member.role, member.yearsOfExperience),
      chapterOfGraduation: member.region, // Use region as chapter of graduation
      yearsInPractice: this.calculateYearsInPractice(member),
      
      // Additional metadata (not in frontend form but useful)
      _metadata: {
        membershipId: member.membershipId,
        role: member.role,
        emailVerified: member.emailVerified,
        subscribed: member.subscribed,
        subscriptionExpiry: member.subscriptionExpiry,
        admissionYear: member.admissionYear,
        yearOfStudy: member.yearOfStudy,
        licenseNumber: member.licenseNumber,
        specialty: member.specialty,
        avatarUrl: member.avatarUrl,
      }
    };
  }

  async findById(id: string): Promise<Member | null> {
    return this.memberModel.findById(id).lean().exec();
  }
}
