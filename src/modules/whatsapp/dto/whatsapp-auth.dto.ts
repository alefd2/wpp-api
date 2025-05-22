import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class WhatsappAuthDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsString()
  @IsNotEmpty()
  fbExchangeToken: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  tokenType?: string;

  @IsNumber()
  @IsOptional()
  expiresIn?: number;
} 