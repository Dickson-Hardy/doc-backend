import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from './entities/registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { MembersService } from '../members/members.service';
import { EmailService } from '../email/email.service';
import { EmailLog } from '../email/entities/email-log.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private registrationsRepository: Repository<Registration>,
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
    private membersService: MembersService,
    private emailService: EmailService,
  ) {}

  async create(createRegistrationDto: CreateRegistrationDto): Promise<Registration> {
    // Find member by email from MongoDB
    const member = await this.membersService.findByEmail(createRegistrationDto.email);
    
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Calculate pricing
    const pricing = this.calculatePricing(
      createRegistrationDto.category,
      createRegistrationDto.yearsInPractice,
    );

    const registration = this.registrationsRepository.create({
      ...createRegistrationDto,
      memberMongoId: member['_id']?.toString() || '', // Store MongoDB ObjectId as string
      baseFee: pricing.baseFee,
      lateFee: pricing.lateFee,
      totalAmount: pricing.total,
      paymentStatus: 'pending',
    });

    return this.registrationsRepository.save(registration);
  }

  async findByPaymentReference(reference: string): Promise<Registration | null> {
    return this.registrationsRepository.findOne({
      where: { paymentReference: reference },
    });
  }

  async updatePaymentStatus(
    registrationId: string,
    status: string,
    reference: string,
    paidAt?: Date,
  ): Promise<Registration> {
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    registration.paymentStatus = status;
    registration.paymentReference = reference;
    if (paidAt) {
      registration.paidAt = paidAt;
    }

    const updatedRegistration = await this.registrationsRepository.save(registration);

    // Send confirmation email with barcode if payment is successful
    if (status === 'paid') {
      try {
        await this.emailService.sendRegistrationConfirmation(
          registration.email,
          {
            id: registration.id,
            firstName: registration.firstName,
            surname: registration.surname,
            category: registration.category,
            totalAmount: registration.totalAmount,
            paymentReference: reference,
          },
        );

        // Log successful email
        await this.emailLogRepository.save({
          recipientEmail: registration.email,
          subject: 'CMDA Conference 2026 - Registration Confirmed',
          status: 'sent',
          registrationId: registration.id,
        });
      } catch (error) {
        // Log failed email
        await this.emailLogRepository.save({
          recipientEmail: registration.email,
          subject: 'CMDA Conference 2026 - Registration Confirmed',
          status: 'failed',
          errorMessage: error.message,
          registrationId: registration.id,
        });
      }
    }

    return updatedRegistration;
  }

  async findAll(filters?: {
    paymentStatus?: string;
    category?: string;
    search?: string;
  }): Promise<Registration[]> {
    const query = this.registrationsRepository.createQueryBuilder('registration');

    if (filters?.paymentStatus) {
      query.andWhere('registration.paymentStatus = :status', {
        status: filters.paymentStatus,
      });
    }

    if (filters?.category) {
      query.andWhere('registration.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(registration.email LIKE :search OR registration.firstName LIKE :search OR registration.surname LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('registration.createdAt', 'DESC');

    return query.getMany();
  }

  async getStats() {
    const total = await this.registrationsRepository.count();
    const paid = await this.registrationsRepository.count({
      where: { paymentStatus: 'paid' },
    });
    const pending = await this.registrationsRepository.count({
      where: { paymentStatus: 'pending' },
    });
    const abandoned = await this.registrationsRepository.count({
      where: { paymentStatus: 'abandoned' },
    });

    const totalRevenue = await this.registrationsRepository
      .createQueryBuilder('registration')
      .select('SUM(registration.totalAmount)', 'total')
      .where('registration.paymentStatus = :status', { status: 'paid' })
      .getRawOne();

    return {
      total,
      paid,
      pending,
      abandoned,
      revenue: totalRevenue?.total || 0,
    };
  }

  async verifyAttendance(registrationId: string): Promise<Registration> {
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.paymentStatus !== 'paid') {
      throw new NotFoundException('Registration payment not confirmed');
    }

    registration.attendanceVerified = true;
    registration.verifiedAt = new Date();

    return this.registrationsRepository.save(registration);
  }

  async getEmailLogs(registrationId?: string): Promise<EmailLog[]> {
    if (registrationId) {
      return this.emailLogRepository.find({
        where: { registrationId },
        order: { sentAt: 'DESC' },
      });
    }
    return this.emailLogRepository.find({
      order: { sentAt: 'DESC' },
      take: 100,
    });
  }

  private calculatePricing(category: string, yearsInPractice?: string) {
    const EARLY_REGISTRATION_DEADLINE = new Date('2026-04-30T23:59:59');
    const LATE_FEE = 10000;
    const BASE_FEES = {
      student: 11000,
      'junior-doctor': 30000,
      'senior-doctor': 50000,
      'doctor-with-spouse': 85000,
    };

    const isLateRegistration = new Date() > EARLY_REGISTRATION_DEADLINE;
    let baseFee = 0;

    switch (category) {
      case 'student':
        baseFee = BASE_FEES.student;
        break;
      case 'doctor':
        baseFee = yearsInPractice === 'less-than-5' 
          ? BASE_FEES['junior-doctor'] 
          : BASE_FEES['senior-doctor'];
        break;
      case 'doctor-with-spouse':
        baseFee = BASE_FEES['doctor-with-spouse'];
        break;
    }

    const lateFee = isLateRegistration ? LATE_FEE : 0;
    const total = baseFee + lateFee;

    return { baseFee, lateFee, total };
  }
}
