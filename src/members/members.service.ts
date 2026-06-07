import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
  ) {}

  async findByEmail(email: string): Promise<any | null> {
    const member = await this.membersRepository.findOne({
      where: { email },
    });

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

  async findById(id: string): Promise<Member | null> {
    return this.membersRepository.findOne({ where: { id } });
  }
}
