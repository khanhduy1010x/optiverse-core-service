import { IsNumber, IsString, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { PackageLevel } from '../membership-package.schema';

export class CreateMembershipPackageDto {
//   @IsNumber()
//   @Min(0)
//   @Max(2)
  level: PackageLevel;

//   @IsOptional()
//   @IsString()
  description?: string;

//   @IsNumber()
//   @Min(0)
  price: number;

//   @IsNumber()
//   @Min(1)
  duration_days: number;

//   @IsOptional()
//   @IsNumber()
//   @Min(0)
  opBonusCredits?: number;

//   @IsOptional()
//   @IsBoolean()
  is_active?: boolean;
}

export class UpdateMembershipPackageDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration_days?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  opBonusCredits?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class MembershipPackageResponseDto {
  _id: string;
  name: string;
  level: PackageLevel;
  description: string;
  price: number;
  duration_days: number;
  opBonusCredits: number;
  is_active: boolean;
  createdAt: Date;
}
