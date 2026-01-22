import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member, MemberDocument } from './schemas/member.schema';

/**
 * Flexible Member Service
 * 
 * This service handles different field name variations in your MongoDB database.
 * It normalizes the data to a consistent format for the frontend.
 */

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name)
    private memberModel: Model<MemberDocument>,
  ) {}

  /**
   * Find member by email (handles multiple email field variations)
   */
  async findByEmail(email: string): Promise<any | null> {
    const normalizedEmail = email.toLowerCase().trim();

    // Try different email field variations
    const member = await this.memberModel.findOne({
      $or: [
        { email: normalizedEmail },
        { Email: normalizedEmail },
        { emailAddress: normalizedEmail },
      ]
    }).lean().exec();

    if (!member) {
      return null;
    }

    // Normalize the member data to expected format
    return this.normalizeMemberData(member);
  }

  /**
   * Find member by ID
   */
  async findById(id: string): Promise<any | null> {
    const member = await this.memberModel.findById(id).lean().exec();
    
    if (!member) {
      return null;
    }

    return this.normalizeMemberData(member);
  }

  /**
   * Normalize member data to consistent format
   * Maps various field name variations to expected field names
   */
  private normalizeMemberData(member: any): any {
    return {
      // Email
      email: member.email || member.Email || member.emailAddress || '',

      // Name fields
      surname: member.surname || member.lastName || member.last_name || '',
      firstName: member.firstName || member.first_name || member.fname || '',
      otherNames: member.otherNames || member.middleName || member.middle_name || '',

      // If full name is stored as single field, try to split it
      ...(member.fullName || member.name ? this.splitFullName(member.fullName || member.name) : {}),

      // Age (calculate from DOB if age not directly available)
      age: member.age || this.calculateAge(member.dateOfBirth || member.dob) || 0,

      // Sex/Gender
      sex: (member.sex || member.gender || '').toLowerCase(),

      // Phone
      phone: member.phone || member.phoneNumber || member.phone_number || member.mobile || '',

      // Chapter
      chapter: member.chapter || member.branch || member.location || '',

      // CMDA Membership
      isCmdaMember: member.isCmdaMember || member.is_cmda_member || member.memberStatus || false,

      // Leadership
      currentLeadershipPost: member.currentLeadershipPost || member.current_leadership_post || member.leadershipPosition || '',
      previousLeadershipPost: member.previousLeadershipPost || member.previous_leadership_post || '',

      // Category
      category: this.normalizeCategory(
        member.category || member.memberType || member.member_type || member.type || member.userType || ''
      ),

      // Professional details
      chapterOfGraduation: member.chapterOfGraduation || member.chapter_of_graduation || member.graduationChapter || member.schoolOfGraduation || '',
      
      yearsInPractice: this.normalizeYearsInPractice(
        member.yearsInPractice || member.years_in_practice || member.practiceYears || member.experienceYears
      ),

      // Additional fields (pass through as-is)
      address: member.address,
      state: member.state,
      country: member.country,
      specialty: member.specialty,
      qualification: member.qualification,
      registrationNumber: member.registrationNumber,
      mdcnNumber: member.mdcnNumber,
    };
  }

  /**
   * Split full name into parts
   */
  private splitFullName(fullName: string): { surname?: string; firstName?: string; otherNames?: string } {
    if (!fullName) return {};

    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return { firstName: parts[0] };
    } else if (parts.length === 2) {
      return { firstName: parts[0], surname: parts[1] };
    } else {
      return {
        firstName: parts[0],
        otherNames: parts.slice(1, -1).join(' '),
        surname: parts[parts.length - 1],
      };
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dob: Date | string | null): number | null {
    if (!dob) return null;

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Normalize category to expected values
   */
  private normalizeCategory(category: string): string {
    if (!category) return '';

    const normalized = category.toLowerCase().trim();

    // Map various category formats to standard format
    if (normalized.includes('student')) {
      return 'student';
    }
    if (normalized.includes('doctor') && (normalized.includes('spouse') || normalized.includes('partner'))) {
      return 'doctor-with-spouse';
    }
    if (normalized.includes('doctor') || normalized.includes('physician')) {
      return 'doctor';
    }

    // Return as-is if no match
    return category;
  }

  /**
   * Normalize years in practice to expected format
   */
  private normalizeYearsInPractice(years: string | number | null): string | undefined {
    if (!years) return undefined;

    // If it's a number, convert to string format
    if (typeof years === 'number') {
      return years < 5 ? 'less-than-5' : '5-and-above';
    }

    const normalized = years.toString().toLowerCase().trim();

    // Map various formats
    if (normalized.includes('<5') || normalized.includes('less than 5') || normalized === 'less-than-5') {
      return 'less-than-5';
    }
    if (normalized.includes('5+') || normalized.includes('5 and above') || normalized === '5-and-above') {
      return '5-and-above';
    }

    // Try to parse as number
    const numYears = parseInt(normalized);
    if (!isNaN(numYears)) {
      return numYears < 5 ? 'less-than-5' : '5-and-above';
    }

    return undefined;
  }
}
