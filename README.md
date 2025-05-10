<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

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
