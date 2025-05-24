import { Test, TestingModule } from '@nestjs/testing';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { ChannelType } from '../enums/channel-type.enum';
import { CreateChannelDto } from './dto/create-channel.dto';

describe('ChannelController', () => {
  let controller: ChannelController;
  let service: ChannelService;

  const mockChannelService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getStatus: jest.fn(),
  };

  const mockChannel = {
    id: 1,
    name: 'Test Channel',
    number: '5511999999999',
    status: 'DISCONNECTED',
    type: ChannelType.WHATSAPP_CLOUD,
    companyId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createChannelDto: CreateChannelDto = {
    name: 'Test Channel',
    number: '5511999999999',
    type: ChannelType.WHATSAPP_CLOUD,
    companyId: 1,
    whatsappCredentialId: 1,
    fbNumberPhoneId: '123456',
    accountWBId: '789012',
    departmentId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelController],
      providers: [
        {
          provide: ChannelService,
          useValue: mockChannelService,
        },
      ],
    }).compile();

    controller = module.get<ChannelController>(ChannelController);
    service = module.get<ChannelService>(ChannelService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of channels', async () => {
      const channels = [mockChannel];
      mockChannelService.findAll.mockResolvedValue(channels);

      const result = await controller.findAll(1);
      expect(result).toEqual(channels);
      expect(mockChannelService.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a single channel', async () => {
      mockChannelService.findOne.mockResolvedValue(mockChannel);

      const result = await controller.findOne('1', 1);
      expect(result).toEqual(mockChannel);
      expect(mockChannelService.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('connect', () => {
    it('should connect a channel', async () => {
      const connectedChannel = { ...mockChannel, status: 'CONNECTED' };
      mockChannelService.connect.mockResolvedValue(connectedChannel);

      const result = await controller.connect('1', 1);
      expect(result).toEqual(connectedChannel);
      expect(mockChannelService.connect).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect a channel', async () => {
      const disconnectedChannel = { ...mockChannel, status: 'DISCONNECTED' };
      mockChannelService.disconnect.mockResolvedValue(disconnectedChannel);

      const result = await controller.disconnect('1', 1);
      expect(result).toEqual(disconnectedChannel);
      expect(mockChannelService.disconnect).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('getStatus', () => {
    it('should return channel status', async () => {
      const status = {
        status: 'CONNECTED',
        fbNumberPhoneId: '123456',
        accountWBId: '789012',
      };
      mockChannelService.getStatus.mockResolvedValue(status);

      const result = await controller.getStatus('1', 1);
      expect(result).toEqual(status);
      expect(mockChannelService.getStatus).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('create', () => {
    it('should create a new channel', async () => {
      mockChannelService.create.mockResolvedValue(mockChannel);

      const result = await controller.create(createChannelDto);
      expect(result).toEqual(mockChannel);
      expect(mockChannelService.create).toHaveBeenCalledWith(createChannelDto);
    });
  });

  describe('remove', () => {
    it('should remove a channel', async () => {
      mockChannelService.remove.mockResolvedValue(mockChannel);

      const result = await controller.remove('1', 1);
      expect(result).toEqual(mockChannel);
      expect(mockChannelService.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
