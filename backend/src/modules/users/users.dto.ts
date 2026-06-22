import { IsString, IsOptional, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { Gender } from '../../entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsString()
  birthdate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateLocationDto {
  @IsOptional()
  latitude: number;

  @IsOptional()
  longitude: number;

  @IsOptional()
  accuracyMeters?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
