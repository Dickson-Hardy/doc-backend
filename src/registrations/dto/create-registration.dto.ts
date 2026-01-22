import { IsEmail, IsString, IsNumber, IsBoolean, IsEnum, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateRegistrationDto {
  @IsEmail()
  email: string;

  @IsString()
  surname: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  otherNames?: string;

  @IsNumber()
  @Min(18)
  @Max(100)
  age: number;

  @IsEnum(['male', 'female'])
  sex: string;

  @IsString()
  phone: string;

  @IsString()
  chapter: string;

  @IsBoolean()
  isCmdaMember: boolean;

  @IsOptional()
  @IsString()
  currentLeadershipPost?: string;

  @IsOptional()
  @IsString()
  previousLeadershipPost?: string;

  @IsEnum(['student', 'doctor', 'doctor-with-spouse'])
  category: string;

  @IsOptional()
  @IsString()
  chapterOfGraduation?: string;

  @IsOptional()
  @IsEnum(['less-than-5', '5-and-above'])
  yearsInPractice?: string;

  // Spouse details
  @IsOptional()
  @IsString()
  spouseSurname?: string;

  @IsOptional()
  @IsString()
  spouseFirstName?: string;

  @IsOptional()
  @IsString()
  spouseOtherNames?: string;

  @IsOptional()
  @IsEmail()
  spouseEmail?: string;

  // Logistics
  @IsDateString()
  dateOfArrival: string;

  @IsEnum(['on-campus', 'off-campus', 'no-accommodation'])
  accommodationOption: string;

  // Abstract
  @IsBoolean()
  hasAbstract: boolean;

  @IsOptional()
  @IsString()
  presentationTitle?: string;

  @IsOptional()
  @IsString()
  abstractFileUrl?: string;
}
