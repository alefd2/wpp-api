# Fluxo de Mensagens WhatsApp

Este documento detalha o fluxo completo de recebimento e processamento de mensagens do WhatsApp, desde o webhook até o armazenamento no banco de dados.

## Tecnologias Utilizadas

### 1. NestJS
- **O que é**: Framework Node.js progressivo para construir aplicações server-side eficientes e escaláveis
- **Por que usar**: 
  - Arquitetura modular baseada em decorators
  - Injeção de dependência nativa
  - Suporte TypeScript de primeira classe
  - Excelente integração com outras bibliotecas
  - Facilidade na criação de webhooks e APIs RESTful

### 2. Bull
- **O que é**: Biblioteca de filas de mensagens baseada em Redis
- **Por que usar**:
  - Processamento assíncrono robusto
  - Retry automático com backoff exponencial
  - Monitoramento via UI (Bull Board)
  - Persistência via Redis
  - Escalabilidade horizontal
- **Como configuramos**:
```typescript
// app.module.ts
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // manter por 24 horas
      count: 1000,    // manter últimos 1000
    },
    removeOnFail: {
      age: 24 * 3600,
      count: 1000,
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
})
```

### 3. Redis
- **O que é**: Banco de dados em memória, usado como message broker
- **Por que usar**:
  - Alta performance
  - Persistência configurável
  - Excelente para filas de mensagens
  - Baixa latência

### 4. Prisma
- **O que é**: ORM (Object-Relational Mapping) moderno para TypeScript/Node.js
- **Por que usar**:
  - Type safety completo
  - Migrations automáticas
  - Query builder poderoso
  - Excelente DX (Developer Experience)
- **Schema relevante**:
```prisma
model Message {
  id         Int       @id @default(autoincrement())
  messageId  String    @unique // ID da mensagem no WhatsApp
  channelId  Int       @map("channel_id")
  channel    Channel   @relation(fields: [channelId], references: [id])
  from       String    // Número do remetente
  type       String    // Tipo da mensagem (text, image, document, etc)
  content    String    // Conteúdo da mensagem
  timestamp  DateTime  // Timestamp da mensagem
  status     String    // Status da mensagem (RECEIVED, SENT, DELIVERED, READ)
  direction  String    // Direção da mensagem (INBOUND, OUTBOUND)
  metadata   Json?     @default("{}")
}
```

## Fluxo de Processamento

### 1. Recebimento do Webhook
- **Endpoint**: `POST /whatsapp/:id/webhook`
- **Controller**: `WhatsappController`
```typescript
@Post(':id/webhook')
@Public()
@HttpCode(200)
async webhookPost(
  @Param('id') companyId: string,
  @Body() data: WhatsappWebhookDto,
) {
  this.logger.log(`[WEBHOOK] Recebido webhook POST para company ${companyId}`);
  return await this.webhookService.processWebhook(data, parseInt(companyId));
}
```

### 2. Processamento Inicial (WhatsappWebhookService)
- Verifica a existência da company
- Valida os dados do webhook
- Separa mensagens e atualizações de status
- Adiciona à fila do Bull
```typescript
async processWebhook(data: WhatsappWebhookDto, companyId: number) {
  // Verifica company
  const company = await this.prisma.company.findUnique({
    where: { id: companyId },
  });

  // Processa mensagens
  for (const entry of data.entry) {
    for (const change of entry.changes) {
      if (change.value.messages) {
        await this.processMessages(change.value.messages);
      }
    }
  }
}
```

### 3. Enfileiramento (Bull Queue)
- Adiciona mensagem à fila com configurações de retry
- Mantém histórico de jobs por 24h ou últimos 1000
```typescript
const job = await this.messageQueue.add(
  'receive',
  {
    message,
    channelId: channel.id,
    metadata: message.metadata,
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
  },
);
```

### 4. Processamento da Mensagem (WhatsappMessageProcessor)
- Consome mensagens da fila
- Processa e salva no banco via Prisma
- Cria/atualiza tickets se necessário
```typescript
@Process('receive')
async handleReceiveMessage(
  job: Job<{ message: any; channelId: number; metadata: any }>,
) {
  const { message, channelId } = job.data;
  
  // Salva a mensagem
  const savedMessage = await this.whatsappMessageService
    .processInboundMessage(message, channelId);

  // Processa ticket/contato
  await this.messageService.handleNewMessage(savedMessage);
}
```

### 5. Salvamento no Banco (WhatsappMessageService)
- Formata dados da mensagem
- Salva via Prisma
- Retorna mensagem salva
```typescript
async processInboundMessage(message: any, channelId: number) {
  const formattedPhone = this.formatPhoneNumber(message.from);
  
  return await this.prisma.message.create({
    data: {
      messageId: message.id,
      channelId,
      from: formattedPhone,
      type: message.type,
      content: message.text?.body || JSON.stringify(message),
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      status: 'RECEIVED',
      direction: 'INBOUND',
    },
  });
}
```

## Monitoramento e Debug

### Bull Board
- Interface web para monitoramento de filas
- Disponível em `/queues`
- Mostra jobs:
  - Completed
  - Failed
  - Waiting
  - Active

### Logging
- Logs estruturados em cada etapa
- Prefixos para fácil identificação:
  - `[WEBHOOK]` - Eventos do webhook
  - `[PROCESSOR]` - Eventos do processador
- Informações detalhadas de erro com stack trace

## Tratamento de Erros

### Retry Automático
- 3 tentativas por default
- Backoff exponencial começando em 1s
- Jobs falhos mantidos por 24h

### Persistência
- Jobs completados mantidos por 24h
- Limite de 1000 jobs no histórico
- Logs detalhados para debug

## Escalabilidade

O sistema foi projetado para ser altamente escalável:

1. **Horizontal**
   - Múltiplos workers podem processar a mesma fila
   - Redis como message broker centralizado
   - Stateless por design

2. **Vertical**
   - Configuração de concorrência por worker
   - Ajuste fino de timeouts e delays
   - Otimização de recursos por job

## Considerações de Segurança

1. **Autenticação**
   - Verificação de token no webhook
   - Rota pública apenas para webhook
   - Demais rotas protegidas por JWT

2. **Validação**
   - DTO para validação de payload
   - Verificação de company
   - Sanitização de dados

## Próximos Passos e Melhorias

1. **Monitoramento**
   - Implementar métricas com Prometheus
   - Dashboard com Grafana
   - Alertas para falhas

2. **Performance**
   - Otimização de queries
   - Caching de dados frequentes
   - Análise de gargalos

3. **Resiliência**
   - Circuit breaker para APIs externas
   - Fallback para erros comuns
   - Melhor tratamento de edge cases

## FLUXO

<div class="mermaid">
sequenceDiagram
    participant WA as WhatsApp Cloud API
    participant WH as Webhook Controller
    participant WS as Webhook Service
    participant BQ as Bull Queue
    participant PR as Message Processor
    participant DB as Database
    WA->>WH: POST /whatsapp/:id/webhook
    Note over WH: Valida payload
    WH->>WS: processWebhook()
    Note over WS: Verifica company
    Note over WS: Processa mensagens
    WS->>BQ: Adiciona à fila
    Note over BQ: Configura retry e TTL
    BQ->>PR: Consome mensagem
    PR->>DB: Salva mensagem
    Note over PR: Processa ticket/contato
    PR->>DB: Atualiza relacionamentos
    Note over PR: Em caso de erro
    PR-->>BQ: Retry com backoff
    BQ-->>PR: Tenta novamente
    PR->>BQ: Confirma processamento
    Note over BQ: Remove após 24h
</div>