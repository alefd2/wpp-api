import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ChannelType {
  WHATSAPP_CLOUD = 'WHATSAPP_CLOUD',
  WHATSAPP_ON_PREMISE = 'WHATSAPP_ON_PREMISE',
  SMS = 'SMS',
  TELEGRAM = 'TELEGRAM',
  MESSENGER = 'MESSENGER',
}

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  companyId: number;

  @IsNumber()
  @IsOptional()
  departmentId?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @IsNotEmpty()
  whatsappCredentialId: number;

  @IsString()
  @IsNotEmpty()
  fbNumberPhoneId: string;

  @IsString()
  @IsNotEmpty()
  accountWBId: string;

  @IsEnum(ChannelType)
  @IsNotEmpty()
  type: ChannelType;
}
