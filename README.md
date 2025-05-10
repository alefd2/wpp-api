# WhatsApp API - Sistema de Atendimento

Sistema de atendimento via WhatsApp com gerenciamento de tickets e departamentos.

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
    departmentId: number
  }
  ```

### 2. Departamentos (Department)
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
    departmentId: number
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
   - Atendente vê tickets do departamento
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
  "departmentId": 1,
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

### Departamentos
```http
GET /whatsapp/departments
```

```http
GET /whatsapp/departments/:id
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
- Proteção de rotas por departamento

## Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request
