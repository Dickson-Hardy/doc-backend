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

  async create(createRegistrationDto: CreateRegistrationDto, paymentReference?: string): Promise<Registration> {
    // Find member by email from MongoDB
    const member = await this.membersService.findByEmail(createRegistrationDto.email);
    
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Calculate pricing
    const pricing = this.calculatePricing(createRegistrationDto.category);

    const registration = this.registrationsRepository.create({
      ...createRegistrationDto,
      memberMongoId: member['_id']?.toString() || '', // Store MongoDB ObjectId as string
      baseFee: pricing.baseFee,
      lateFee: pricing.lateFee,
      totalAmount: pricing.total,
      paymentStatus: 'pending',
      paymentReference: paymentReference, // Save reference immediately
    });

    return this.registrationsRepository.save(registration);
  }

  async findByPaymentReference(reference: string): Promise<Registration | null> {
    return this.registrationsRepository.findOne({
      where: { paymentReference: reference },
    });
  }

  async findById(id: string): Promise<Registration | null> {
    return this.registrationsRepository.findOne({
      where: { id },
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

    // PRIORITY: Send confirmation email immediately if payment is successful
    if (status === 'paid') {
      // Send email synchronously (blocking) to ensure it's sent before response
      await this.sendConfirmationEmailWithRetry(registration, reference);
    }

    return updatedRegistration;
  }

  private async sendConfirmationEmailWithRetry(
    registration: Registration,
    reference: string,
    maxRetries: number = 3,
  ): Promise<void> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`[EMAIL] Attempt ${attempt}/${maxRetries} - Sending to ${registration.email}`);

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

        // Success - log it
        console.log(`[EMAIL] ✅ Successfully sent to ${registration.email}`);
        await this.emailLogRepository.save({
          recipientEmail: registration.email,
          subject: 'CMDA Conference 2026 - Registration Confirmed',
          status: 'sent',
          registrationId: registration.id,
        });

        return; // Exit on success
      } catch (error) {
        lastError = error;
        console.error(`[EMAIL] ❌ Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`[EMAIL] ⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed - log the failure
    console.error(`[EMAIL] ❌ All ${maxRetries} attempts failed for ${registration.email}`);
    await this.emailLogRepository.save({
      recipientEmail: registration.email,
      subject: 'CMDA Conference 2026 - Registration Confirmed',
      status: 'failed',
      errorMessage: lastError?.message || 'Unknown error after retries',
      registrationId: registration.id,
    });

    // Don't throw error - we don't want to fail the payment verification
    // Email can be resent manually from admin dashboard
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

  async resendConfirmationEmail(registrationId: string): Promise<void> {
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.paymentStatus !== 'paid') {
      throw new NotFoundException('Cannot send email - payment not confirmed');
    }

    console.log(`[EMAIL] Manual resend requested for ${registration.email}`);
    
    // Use the retry logic
    await this.sendConfirmationEmailWithRetry(
      registration,
      registration.paymentReference,
    );
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

  private calculatePricing(category: string) {
    const EARLY_REGISTRATION_DEADLINE = new Date('2026-04-30T23:59:59');
    const LATE_FEE = 10000;
    const BASE_FEES = {
      student: 11000,
      doctor: 40000,
      'doctor-with-spouse': 85000,
    };

    const isLateRegistration = new Date() > EARLY_REGISTRATION_DEADLINE;
    let baseFee = 0;

    switch (category) {
      case 'student':
        baseFee = BASE_FEES.student;
        break;
      case 'doctor':
        baseFee = BASE_FEES.doctor;
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
