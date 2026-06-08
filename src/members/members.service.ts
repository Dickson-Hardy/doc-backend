import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { Member as MongoMember, MemberDocument } from './schemas/member.schema';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
    @InjectModel(MongoMember.name)
    private mongoMemberModel: Model<MemberDocument>,
  ) {}

  async findByEmail(email: string): Promise<any | null> {
    // Primary: MongoDB Atlas (member lookups)
    const mongoMember = await this.mongoMemberModel.findOne({ email }).exec();
    if (mongoMember) {
      return {
        id: mongoMember._id?.toString(),
        email: mongoMember.email,
        surname: mongoMember.surname,
        firstName: mongoMember.firstName,
        otherNames: mongoMember.otherNames || '',
        age: mongoMember.age,
        sex: mongoMember.sex,
        phone: mongoMember.phone,
        chapter: mongoMember.chapter,
        state: mongoMember.state || mongoMember.chapter,
        isCmdaMember: mongoMember.isCmdaMember,
        currentLeadershipPost: mongoMember.currentLeadershipPost || '',
        previousLeadershipPost: mongoMember.previousLeadershipPost || '',
        category: mongoMember.category,
        chapterOfGraduation: mongoMember.chapterOfGraduation || mongoMember.chapter,
        yearsInPractice: mongoMember.yearsInPractice,
        _metadata: {
          membershipId: mongoMember.membershipId,
          role: mongoMember.role,
          licenseNumber: mongoMember.licenseNumber,
          specialty: mongoMember.specialty,
        },
      };
    }

    // Fallback: PostgreSQL (Supabase) for migrated members
    const member = await this.membersRepository.findOne({ where: { email } });
    if (!member) {
      return null;
    }

    return {
      id: member.id,
      email: member.email,
      surname: member.surname,
      firstName: member.firstName,
      otherNames: member.otherNames || '',
      age: member.age,
      sex: member.sex,
      phone: member.phone,
      chapter: member.chapter,
      state: member.state || member.chapter,
      isCmdaMember: member.isCmdaMember,
      currentLeadershipPost: member.currentLeadershipPost || '',
      previousLeadershipPost: member.previousLeadershipPost || '',
      category: member.category,
      chapterOfGraduation: member.chapterOfGraduation || member.chapter,
      yearsInPractice: member.yearsInPractice,
      _metadata: {
        membershipId: member.membershipId,
        role: member.role,
        licenseNumber: member.licenseNumber,
        specialty: member.specialty,
      },
    };
  }

  async findById(id: string): Promise<any | null> {
    // Try MongoDB first
    const mongoMember = await this.mongoMemberModel.findById(id).exec();
    if (mongoMember) {
      return {
        id: mongoMember._id?.toString(),
        email: mongoMember.email,
        surname: mongoMember.surname,
        firstName: mongoMember.firstName,
        otherNames: mongoMember.otherNames || '',
        age: mongoMember.age,
        sex: mongoMember.sex,
        phone: mongoMember.phone,
        chapter: mongoMember.chapter,
        state: mongoMember.state || mongoMember.chapter,
        isCmdaMember: mongoMember.isCmdaMember,
        category: mongoMember.category,
      };
    }
    // Fallback to TypeORM
    return this.membersRepository.findOne({ where: { id } });
  }
}
