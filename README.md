# WhatsApp API - Sistema de Atendimento

Sistema de atendimento via WhatsApp com gerenciamento de tickets e setores.

## Estrutura do Sistema

### 1. Usuários (User)
- **Roles**: ADMIN, ATTENDANT, SUPERVISOR
- **Campos**:
  ```typescript
  {
    id: number
    name: string
    email: string
    phone: string
    role: UserRole
    sectorId: number
  }
  ```

### 2. Setores (Sector)
- Agrupam usuários e tickets
- **Campos**:
  ```typescript
  {
    id: number
    name: string
    description: string
    users: User[]
    tickets: Ticket[]
  }
  ```

### 3. Tickets (Ticket)
- Representam uma conversa/atendimento
- **Status**: NEW → ASSIGNED → IN_PROGRESS → WAITING_CUSTOMER → RESOLVED → CLOSED
- **Prioridades**: LOW, MEDIUM, HIGH, URGENT
- **Campos**:
  ```typescript
  {
    id: number
    title: string
    description: string
    status: TicketStatus
    priority: TicketPriority
    sectorId: number
    assignedToId: number
    createdById: number
    customerPhone: string
    messages: Message[]
  }
  ```

### 4. Mensagens (Message)
- Pertencem a um ticket
- **Campos**:
  ```typescript
  {
    id: number
    content: string
    ticketId: number
    isFromUser: boolean
  }
  ```

## Fluxo de Atendimento

1. **Recebimento de Mensagem**
   - Cliente envia mensagem via WhatsApp
   - Sistema cria/atualiza usuário
   - Sistema cria/atualiza ticket
   - Mensagem é salva no ticket

2. **Atendimento**
   - Atendente vê tickets do setor
   - Atendente se atribui ao ticket
   - Atendente atualiza status e prioridade
   - Atendente responde mensagens

## API Endpoints

### Tickets
```http
POST /whatsapp/tickets
Content-Type: application/json

{
  "title": "Assunto do atendimento",
  "description": "Descrição detalhada",
  "sectorId": 1,
  "customerPhone": "5511999999999"
}
```

```http
POST /whatsapp/tickets/:id/assign
Content-Type: application/json

{
  "assignedToId": 1
}
```

```http
PUT /whatsapp/tickets/:id/status
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

```http
GET /whatsapp/tickets/my-tickets
```

### Setores
```http
GET /whatsapp/sectors
```

```http
GET /whatsapp/sectors/:id
```

### Mensagens
```http
POST /whatsapp/tickets/:id/messages
Content-Type: application/json

{
  "content": "Mensagem do atendente",
  "isFromUser": false
}
```

```http
GET /whatsapp/tickets/:id/messages
```

## Configuração do Ambiente

1. **Variáveis de Ambiente**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_api"
   WHATSAPP_ACCESS_TOKEN="seu_token_aqui"
   WHATSAPP_PHONE_NUMBER_ID="seu_phone_id_aqui"
   WHATSAPP_VERIFY_TOKEN="seu_verify_token_aqui"
   ```

2. **Instalação**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Execução**
   ```bash
   npm run start:dev
   ```

## Exemplo de Fluxo Completo

1. **Cliente envia mensagem**
   ```typescript
   // Sistema cria ticket
   {
     title: "Chat with 5511999999999",
     description: "New conversation started",
     status: "NEW",
     priority: "MEDIUM",
     customerPhone: "5511999999999"
   }
   ```

2. **Atendente recebe notificação**
   - Vê ticket novo no dashboard
   - Se atribui ao ticket
   - Atualiza status para "IN_PROGRESS"

3. **Atendimento**
   - Atendente responde mensagens
   - Atualiza status conforme necessário
   - Finaliza atendimento com status "RESOLVED"

## Segurança

- Autenticação via JWT
- Roles baseadas em permissões
- Validação de tokens WhatsApp
- Proteção de rotas por setor

## Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Configuração do Webhook no Meta Developer Portal

1. **Acesse o Meta Developer Portal**
   - Entre em [Meta for Developers](https://developers.facebook.com)
   - Vá para seu aplicativo WhatsApp Business

2. **Configure o Webhook**
   - No menu lateral, vá em "WhatsApp" > "Configuration"
   - Em "Webhooks", clique em "Configure Webhook"
   - Preencha os campos:
     ```
     Callback URL: https://seu-dominio.com/whatsapp/webhook
     Verify Token: seu_verify_token_aqui (mesmo do .env)
     ```
   - Selecione os eventos que deseja receber:
     - messages
     - message_status
     - message_template_status

3. **Teste Local**
   - Para desenvolvimento local, use ngrok:
     ```bash
     npx ngrok http 3000
     ```
   - Use a URL gerada pelo ngrok como Callback URL
   - Exemplo: `https://abc123.ngrok.io/whatsapp/webhook`

4. **Verificação**
   - O Meta enviará uma requisição GET para verificar o webhook
   - O sistema responderá automaticamente se o token estiver correto
   - Após verificação, o Meta começará a enviar eventos

5. **Monitoramento**
   - No Meta Developer Portal, vá em "Webhooks" > "Debug"
   - Aqui você pode ver todos os eventos recebidos
   - Útil para debug e verificação do funcionamento

# Banco de Dados

## Migrações

Para criar e aplicar novas migrações no banco de dados, siga os passos abaixo:

1. Faça as alterações necessárias no arquivo `prisma/schema.prisma`

2. Crie uma nova migração:
```bash
npx prisma migrate dev --name nome_da_migracao
```

Este comando irá:
- Detectar as alterações no schema
- Criar um novo arquivo de migração em `prisma/migrations`
- Aplicar a migração no banco de dados
- Regenerar o cliente Prisma

3. Para ambientes de produção, use:
```bash
npx prisma migrate deploy
```

Este comando irá aplicar todas as migrações pendentes de forma segura.

## Seed

Para popular o banco com dados iniciais:

```bash
npx prisma db seed
```

Este comando irá criar:
- Uma empresa demo
- Um setor de atendimento
- Um usuário administrador
- Um template de mensagem de boas-vindas

## Comandos Úteis

- Visualizar o banco de dados: `npx prisma studio`
- Verificar status das migrações: `npx prisma migrate status`
- Resetar o banco de dados: `npx prisma migrate reset`
- Validar o schema: `npx prisma validate`
- Formatar o schema: `npx prisma format`

# WhatsApp Calendar API

## Description

API para gerenciamento de atendimentos via WhatsApp com integração com calendário.

## Instalação

```bash
$ npm install
```

## Configuração do Banco de Dados

```bash
# Gerar o cliente do Prisma
$ npm run prisma:generate

# Executar as migrações
$ npm run prisma:migrate

# Popular o banco de dados
$ npm run prisma:seed
```

## Executando a aplicação

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testes

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Documentação da API

A documentação da API está disponível em `/api/docs` quando a aplicação estiver em execução.

## Licença

[MIT licensed](LICENSE).
