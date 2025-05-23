# Instalação

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- Node.js (v18 ou superior)
- npm ou yarn
- PostgreSQL (v14 ou superior)
- Git

## Clonando o Repositório

```bash
git clone https://github.com/seu-usuario/wpp-api.git
cd wpp-api
```

## Instalação das Dependências

```bash
# Usando npm
npm install

# Ou usando yarn
yarn install
```

## Configuração do Ambiente

1. **Crie o arquivo de ambiente**

```bash
cp .env.example .env
```

2. **Configure as variáveis de ambiente**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wpp_api"

# JWT
JWT_SECRET="seu-secret-aqui"
JWT_EXPIRATION="1d"

# WhatsApp
WHATSAPP_API_VERSION="v18.0"
```

## Configuração do Banco de Dados

1. **Crie o banco de dados**

```bash
# Via psql
createdb wpp_api

# Ou via PostgreSQL
psql -U postgres
CREATE DATABASE wpp_api;
```

2. **Execute as migrações**

```bash
# Usando npm
npm run prisma:migrate

# Ou usando yarn
yarn prisma:migrate
```

## Executando o Projeto

### Em Desenvolvimento

```bash
# Usando npm
npm run start:dev

# Ou usando yarn
yarn start:dev
```

### Em Produção

```bash
# Build
npm run build
# ou
yarn build

# Start
npm run start:prod
# ou
yarn start:prod
```

## Estrutura do Projeto

```
wpp-api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── company/
│   │   ├── channel/
│   │   ├── message/
│   │   └── whatsapp/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   └── interfaces/
│   └── config/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── test/
├── docs/
└── package.json
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Inicia o servidor em modo desenvolvimento |
| `npm run build` | Compila o projeto |
| `npm run start:prod` | Inicia o servidor em modo produção |
| `npm run test` | Executa os testes |
| `npm run prisma:migrate` | Executa as migrações do banco de dados |
| `npm run prisma:generate` | Gera o cliente Prisma |

## Próximos Passos

- [Configuração WABA](./waba-setup.md)
- [Gestão de Empresas](./company-management.md)
- [Configuração de Canais](./channel-setup.md)

## Configuração do WhatsApp Business

### 1. Crie uma Conta Business

1. Acesse [Facebook Developers](https://developers.facebook.com)
2. Crie um novo aplicativo
3. Selecione "WhatsApp Business" como tipo

### 2. Configure o Webhook

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/whatsapp/auth</span>
  </div>
  <div class="endpoint-body">
    <p>Configure suas credenciais do WhatsApp:</p>

```json
{
  "clientId": "seu-client-id",
  "clientSecret": "seu-client-secret",
  "fbExchangeToken": "token-longo-aqui"
}
```
  </div>
</div>

### 3. Teste a Conexão

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/whatsapp/channels/1/messages</span>
  </div>
  <div class="endpoint-body">
    <p>Envie uma mensagem de teste:</p>

```json
{
  "to": "5511999999999",
  "type": "text",
  "text": "Olá, mundo!"
}
```
  </div>
</div>

## Solução de Problemas

### Erro de Conexão com Redis

Se você encontrar erros de conexão com Redis:

1. Verifique se o Redis está rodando:
```bash
redis-cli ping
```

2. Verifique as configurações no `.env`
3. Certifique-se de que a porta 6379 está acessível

### Erro de Conexão com Banco de Dados

1. Verifique a string de conexão no `.env`
2. Certifique-se de que o PostgreSQL está rodando
3. Verifique as permissões do usuário

### Erro de Autenticação WhatsApp

1. Verifique se as credenciais estão corretas
2. Certifique-se de que o token não expirou
3. Verifique os logs para mais detalhes:

```bash
# Ver logs em tempo real
tail -f logs/error.log
``` 