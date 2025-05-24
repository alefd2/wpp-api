# Documentação do Webhook WhatsApp

Este documento descreve o fluxo completo de processamento de webhooks do WhatsApp na aplicação, desde o recebimento da notificação até o processamento final da mensagem. O webhook é responsável por receber atualizações em tempo real do WhatsApp, incluindo novas mensagens, atualizações de status e outras notificações.

## Índice
1. [Visão Geral](#visão-geral)
2. [Configuração do Webhook](#configuração-do-webhook)
3. [Tipos de Notificações](#tipos-de-notificações)
4. [Fluxo de Processamento](#fluxo-de-processamento)
5. [Estrutura das Mensagens](#estrutura-das-mensagens)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Exemplos](#exemplos)

## Visão Geral

O webhook do WhatsApp é um endpoint HTTP que recebe notificações do WhatsApp Cloud API quando eventos ocorrem (novas mensagens, atualizações de status, etc). Cada notificação é processada e armazenada no banco de dados, podendo também disparar ações específicas como criação de tickets ou notificações para usuários.

### Principais Funcionalidades
- Recebimento de mensagens em tempo real
- Processamento de diferentes tipos de mídia
- Atualização de status de mensagens
- Criação automática de tickets
- Formatação de números de telefone
- Gerenciamento de contatos

## Configuração do Webhook

### Endpoint
```
POST /api/v1/whatsapp/webhook
```

### Headers Necessários
```
X-Hub-Signature: SHA256-HASH
Content-Type: application/json
```

### Verificação de Segurança
```typescript
// Exemplo de verificação do token
if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.send(req.query['hub.challenge']);
}
```

## Tipos de Notificações

### 1. Mensagens Recebidas (messages)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "PHONE_NUMBER",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "messages": [{
          "id": "MESSAGE_ID",
          "from": "SENDER_PHONE",
          "timestamp": "TIMESTAMP",
          "type": "text",
          "text": {
            "body": "MESSAGE_CONTENT"
          }
        }]
      }
    }]
  }]
}
```

### 2. Status de Mensagens (statuses)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "statuses": [{
          "id": "MESSAGE_ID",
          "status": "sent|delivered|read",
          "timestamp": "TIMESTAMP",
          "recipient_id": "RECIPIENT_PHONE"
        }]
      }
    }]
  }]
}
```

## Fluxo de Processamento

1. **Recebimento da Notificação**
```typescript
@Post('webhook')
async handleWebhook(@Body() data: any) {
  if (data.object === 'whatsapp_business_account') {
    for (const entry of data.entry) {
      await this.processEntry(entry);
    }
  }
}
```

2. **Formatação do Número**
```typescript
private formatPhoneNumber(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  const withCountry = numbers.startsWith('55') ? numbers : `55${numbers}`;
  const ddd = withCountry.substring(2, 4);
  const rest = withCountry.substring(4);
  
  if (rest.length === 8) {
    return `55${ddd}9${rest}`;
  }
  
  if (rest.length === 9 && rest.startsWith('9')) {
    return `55${ddd}${rest}`;
  }
  
  return withCountry;
}
```

3. **Processamento da Mensagem**
```typescript
async processInboundMessage(message: any, channelId: number) {
  const content = message.text?.body || JSON.stringify(message);
  const formattedPhone = this.formatPhoneNumber(message.from);

  const savedMessage = await this.prisma.message.create({
    data: {
      messageId: message.id,
      channelId,
      from: formattedPhone,
      type: message.type,
      content,
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      status: 'RECEIVED',
      direction: 'INBOUND',
    },
  });

  return savedMessage;
}
```

4. **Criação/Atualização de Ticket**
```typescript
async handleNewMessage(message: Message) {
  if (message.ticketId) return;

  const contact = await this.findOrCreateContact(message);
  const activeTicket = await this.findActiveTicket(contact, message);

  if (!activeTicket) {
    await this.createNewTicket(contact, message);
  } else {
    await this.updateExistingTicket(activeTicket, message);
  }
}
```

## Estrutura das Mensagens

### Tipos de Mensagens Suportadas
1. **Texto**
```json
{
  "type": "text",
  "text": {
    "body": "Olá, como posso ajudar?"
  }
}
```

2. **Imagem**
```json
{
  "type": "image",
  "image": {
    "url": "https://example.com/image.jpg",
    "caption": "Descrição da imagem"
  }
}
```

3. **Documento**
```json
{
  "type": "document",
  "document": {
    "url": "https://example.com/doc.pdf",
    "filename": "documento.pdf",
    "caption": "Contrato"
  }
}
```

4. **Áudio**
```json
{
  "type": "audio",
  "audio": {
    "url": "https://example.com/audio.mp3"
  }
}
```

## Tratamento de Erros

### 1. Validação de Assinatura
```typescript
if (!this.isValidSignature(signature, rawBody)) {
  throw new UnauthorizedException('Invalid signature');
}
```

### 2. Retry em Caso de Falha
```typescript
@OnQueueFailed()
async handleFailure(job: Job, error: Error) {
  this.logger.error(
    `Failed to process message ${job.data.messageId}: ${error.message}`,
  );
  if (job.attemptsMade < 3) {
    await job.retry();
  }
}
```

## Exemplos

### 1. Recebendo uma Nova Mensagem
<div class="mermaid">
sequenceDiagram
    WhatsApp->>+Webhook: Nova mensagem
    Webhook->>+Validador: Verifica assinatura
    Validador->>+Processador: Processa mensagem
    Processador->>+DB: Salva mensagem
    Processador->>+TicketService: Cria/atualiza ticket
    TicketService->>+DB: Salva ticket
    DB->>-TicketService: Confirma
    TicketService->>-Processador: Sucesso
    Processador->>-Webhook: Sucesso
    Webhook->>-WhatsApp: 200 OK
</div>

### 2. Atualizando Status de Mensagem
<div class="mermaid">
  sequenceDiagram
      WhatsApp->>+Webhook: Status update
      Webhook->>+MessageService: Atualiza status
      MessageService->>+DB: Update message
      DB->>-MessageService: Confirma
      MessageService->>-Webhook: Sucesso
      Webhook->>-WhatsApp: 200 OK
</div>

## Considerações de Segurança

1. **Validação de Assinatura**
   - Sempre verificar a assinatura SHA256 do payload
   - Usar constantes de tempo para comparação

2. **Rate Limiting**
   - Implementar limites de requisições
   - Usar filas para processamento assíncrono

3. **Logs e Monitoramento**
   - Registrar todas as requisições
   - Monitorar erros e padrões suspeitos

## Troubleshooting

### Problemas Comuns

1. **Mensagem não processada**
   - Verificar logs de erro
   - Confirmar formato do payload
   - Validar assinatura

2. **Número incorreto**
   - Verificar formatação do número
   - Confirmar país de origem
   - Validar DDD

3. **Ticket não criado**
   - Verificar regras de negócio
   - Confirmar departamento padrão
   - Validar dados do contato 