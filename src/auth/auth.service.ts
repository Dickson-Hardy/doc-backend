import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './entities/admin-user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.adminUserRepository.findOne({
      where: { email, isActive: true },
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    // Update last login
    await this.adminUserRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async createAdminUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string = 'admin',
  ): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.adminUserRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    return this.adminUserRepository.save(user);
  }

  async findById(id: string): Promise<AdminUser | null> {
    return this.adminUserRepository.findOne({ where: { id } });
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.adminUserRepository.update(userId, {
      password: hashedPassword,
    });
  }
}
