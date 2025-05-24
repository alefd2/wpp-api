import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { PrismaService } from '../../../prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ChannelType } from '../enums/channel-type.enum';
import { WhatsappAuthService } from '../services/whatsapp-auth.service';
import { WhatsappApiService } from '../services/whatsapp-api.service';
import { WhatsappMessageService } from '../messages/whatsapp-message.service';

describe('ChannelService', () => {
  let service: ChannelService;
  let prisma: PrismaService;

  const mockPrismaService = {
    channel: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    whatsappCredential: {
      findFirst: jest.fn(),
    },
  };

  const mockWhatsappAuthService = {
    authenticate: jest.fn(),
  };

  const mockWhatsappApiService = {
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockWhatsappMessageService = {
    sendMessage: jest.fn(),
  };

  const mockChannel = {
    id: 1,
    name: 'Test Channel',
    number: '5511999999999',
    status: 'DISCONNECTED',
    type: ChannelType.WHATSAPP_CLOUD,
    companyId: 1,
    whatsappCredentialId: 1,
    fbNumberPhoneId: '123456',
    accountWBId: '789012',
    isDefault: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WhatsappAuthService,
          useValue: mockWhatsappAuthService,
        },
        {
          provide: WhatsappApiService,
          useValue: mockWhatsappApiService,
        },
        {
          provide: WhatsappMessageService,
          useValue: mockWhatsappMessageService,
        },
      ],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of channels', async () => {
      const channels = [mockChannel];
      mockPrismaService.channel.findMany.mockResolvedValue(channels);

      const result = await service.findAll(1);
      expect(result).toEqual(channels);
      expect(mockPrismaService.channel.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 1,
          type: 'WHATSAPP_CLOUD',
        },
        include: {
          department: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single channel', async () => {
      mockPrismaService.channel.findFirst.mockResolvedValue(mockChannel);

      const result = await service.findOne(1, 1);
      expect(result).toEqual(mockChannel);
    });

    it('should throw NotFoundException when channel not found', async () => {
      mockPrismaService.channel.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('connect', () => {
    it('should connect a channel', async () => {
      const channelWithCredential = {
        ...mockChannel,
        credential: { id: 1, active: true },
        status: 'DISCONNECTED',
      };
      const connectedChannel = {
        ...channelWithCredential,
        status: 'CONNECTED',
      };

      mockPrismaService.channel.findFirst.mockResolvedValue(
        channelWithCredential,
      );
      mockPrismaService.channel.update.mockResolvedValue(connectedChannel);
      mockWhatsappAuthService.authenticate.mockResolvedValue(true);
      mockWhatsappApiService.connect.mockResolvedValue(true);

      const result = await service.connect(1, 1);
      expect(result).toEqual(connectedChannel);
    });

    it('should throw NotFoundException when channel has no credential', async () => {
      const channelWithoutCredential = { ...mockChannel, credential: null };
      mockPrismaService.channel.findFirst.mockResolvedValue(
        channelWithoutCredential,
      );

      await expect(service.connect(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('disconnect', () => {
    it('should disconnect a channel', async () => {
      const disconnectedChannel = { ...mockChannel, status: 'DISCONNECTED' };
      mockPrismaService.channel.findFirst.mockResolvedValue(mockChannel);
      mockPrismaService.channel.update.mockResolvedValue(disconnectedChannel);

      const result = await service.disconnect(1, 1);
      expect(result).toEqual(disconnectedChannel);
    });
  });

  describe('getStatus', () => {
    it('should return channel status', async () => {
      const channelWithCredential = {
        ...mockChannel,
        credential: { id: 1, active: true },
      };
      mockPrismaService.channel.findFirst.mockResolvedValue(
        channelWithCredential,
      );

      const result = await service.getStatus(1, 1);
      expect(result).toEqual({
        status: channelWithCredential.status,
        fbNumberPhoneId: channelWithCredential.fbNumberPhoneId,
        accountWBId: channelWithCredential.accountWBId,
        credential: {
          id: channelWithCredential.credential.id,
          active: channelWithCredential.credential.active,
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new channel', async () => {
      const createChannelDto = {
        name: 'Test Channel',
        number: '5511999999999',
        type: ChannelType.WHATSAPP_CLOUD,
        companyId: 1,
        whatsappCredentialId: 1,
        fbNumberPhoneId: '123456',
        accountWBId: '789012',
        departmentId: 1,
        isDefault: false,
        description: 'Test Channel Description',
      };

      const mockCredential = {
        id: 1,
        active: true,
        companyId: 1,
      };

      mockPrismaService.whatsappCredential.findFirst.mockResolvedValue(
        mockCredential,
      );
      mockPrismaService.channel.create.mockResolvedValue({
        ...mockChannel,
        department: { id: 1, name: 'Test Department' },
      });

      const result = await service.create(createChannelDto);
      expect(result).toEqual({
        ...mockChannel,
        department: { id: 1, name: 'Test Department' },
      });
      expect(mockPrismaService.channel.create).toHaveBeenCalledWith({
        data: {
          ...createChannelDto,
          status: 'DISCONNECTED',
          active: true,
        },
        include: {
          department: true,
          credential: false,
        },
      });
    });

    it('should throw NotFoundException when credential not found', async () => {
      const createChannelDto = {
        name: 'Test Channel',
        number: '5511999999999',
        type: ChannelType.WHATSAPP_CLOUD,
        companyId: 1,
        whatsappCredentialId: 1,
        fbNumberPhoneId: '123456',
        accountWBId: '789012',
        departmentId: 1,
        isDefault: false,
        description: 'Test Channel Description',
      };

      mockPrismaService.whatsappCredential.findFirst.mockResolvedValue(null);

      await expect(service.create(createChannelDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a deactivated channel', async () => {
      const deactivatedChannel = {
        ...mockChannel,
        active: false,
        status: 'DISCONNECTED',
      };
      mockPrismaService.channel.findFirst.mockResolvedValue(deactivatedChannel);
      mockPrismaService.channel.delete.mockResolvedValue(deactivatedChannel);

      const result = await service.remove(1, 1);
      expect(result).toEqual(deactivatedChannel);
      expect(mockPrismaService.channel.delete).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          department: false,
          credential: false,
        },
      });
    });

    it('should throw error when trying to remove an active channel', async () => {
      const activeChannel = {
        ...mockChannel,
        active: true,
        status: 'DISCONNECTED',
      };
      mockPrismaService.channel.findFirst.mockResolvedValue(activeChannel);

      await expect(service.remove(1, 1)).rejects.toThrow(
        'Não é possível remover um canal ativo',
      );
    });

    it('should throw NotFoundException when channel not found', async () => {
      mockPrismaService.channel.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
