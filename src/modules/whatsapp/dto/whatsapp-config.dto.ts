import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { WhatsappStatus } from '../enums/whatsapp-status.enum';
import { ChannelType } from '../enums/channel-type.enum';

export class WhatsappConfigDto {
  @IsString()
  name: string;

  @IsString()
  number: string;

  @IsEnum(ChannelType)
  type: ChannelType;

  @IsNumber()
  companyId: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsEnum(WhatsappStatus)
  @IsOptional()
  status?: WhatsappStatus;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsString()
  @IsOptional()
  session?: string;

  @IsString()
  @IsOptional()
  qrcode?: string;
} 