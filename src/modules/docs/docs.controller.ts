import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocsService } from './docs.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Documentation')
@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get('whatsapp')
  @Public()
  @ApiOperation({ summary: 'Obter documentação inicial do WhatsApp em HTML' })
  @Header('Content-Type', 'text/html')
  async getWhatsAppDocs(): Promise<string> {
    return this.docsService.getDocs();
  }

  @Get('whatsapp/:pageId')
  @Public()
  @ApiOperation({
    summary: 'Obter página específica da documentação do WhatsApp em HTML',
  })
  @Header('Content-Type', 'text/html')
  async getWhatsAppDocsPage(@Param('pageId') pageId: string): Promise<string> {
    return this.docsService.getDocs('v1', pageId);
  }
}
