import { IsNumber, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateDonationDto {
  @IsNumber()
  @Min(1, { message: 'Donation amount must be at least 1' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string; // Education, Healthcare, Nutrition, General

  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: string; // UPI, Credit Card, Bank Transfer, NetBanking

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  orphanageId?: string;
}
