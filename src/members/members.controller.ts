import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Public()
  @Get('lookup')
  async lookupByEmail(@Query('email') email: string) {
    if (!email) {
      throw new NotFoundException('Email parameter is required');
    }

    const member = await this.membersService.findByEmail(email);
    
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }
}
