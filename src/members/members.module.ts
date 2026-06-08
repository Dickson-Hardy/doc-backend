import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Member } from './entities/member.entity';
import { Member as MongoMember, MemberSchema } from './schemas/member.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member]),
    MongooseModule.forFeature([{ name: MongoMember.name, schema: MemberSchema }]),
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
