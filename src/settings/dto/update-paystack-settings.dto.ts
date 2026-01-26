import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdatePaystackSettingsDto {
  @IsString()
  @MinLength(10)
  publicKey: string;

  @IsString()
  @MinLength(10)
  secretKey: string;

  @IsOptional()
  @IsString()
  splitCode?: string;
}
