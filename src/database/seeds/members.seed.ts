import { DataSource } from 'typeorm';
import { Member } from '../../members/entities/member.entity';

/**
 * Sample seed data for testing
 * In production, import actual member data from your existing database
 */
export async function seedMembers(dataSource: DataSource) {
  const memberRepository = dataSource.getRepository(Member);

  const sampleMembers = [
    {
      email: 'john.doe@example.com',
      surname: 'Doe',
      firstName: 'John',
      otherNames: 'Michael',
      age: 35,
      sex: 'male',
      phone: '08012345678',
      chapter: 'Lagos',
      isCmdaMember: true,
      currentLeadershipPost: 'Chapter Secretary',
      category: 'doctor',
      chapterOfGraduation: 'University of Lagos',
      yearsInPractice: '5-and-above',
    },
    {
      email: 'jane.smith@example.com',
      surname: 'Smith',
      firstName: 'Jane',
      otherNames: 'Elizabeth',
      age: 28,
      sex: 'female',
      phone: '08098765432',
      chapter: 'Abuja',
      isCmdaMember: true,
      currentLeadershipPost: '',
      previousLeadershipPost: 'Welfare Officer',
      category: 'doctor',
      chapterOfGraduation: 'University of Ibadan',
      yearsInPractice: 'less-than-5',
    },
    {
      email: 'student@example.com',
      surname: 'Johnson',
      firstName: 'David',
      age: 23,
      sex: 'male',
      phone: '08011112222',
      chapter: 'Ile-Ife',
      isCmdaMember: true,
      category: 'student',
    },
  ];

  for (const memberData of sampleMembers) {
    const existingMember = await memberRepository.findOne({
      where: { email: memberData.email },
    });

    if (!existingMember) {
      const member = memberRepository.create(memberData);
      await memberRepository.save(member);
      console.log(`Created member: ${memberData.email}`);
    } else {
      console.log(`Member already exists: ${memberData.email}`);
    }
  }

  console.log('Member seeding completed!');
}
