# Configuração da Conta WABA

## Pré-requisitos

Antes de começar, você precisará:

- Uma conta Business no Facebook
- Um número de telefone dedicado para WhatsApp Business
- Documentos da empresa para verificação

## Passo a Passo

### 1. Criar Conta no Facebook Business

1. Acesse [business.facebook.com](https://business.facebook.com)
2. Clique em "Criar Conta"
3. Preencha os dados da empresa
4. Verifique o e-mail de confirmação

### 2. Configurar WhatsApp Business API

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um novo aplicativo do tipo "Business"
3. Adicione o produto "WhatsApp" ao seu aplicativo
4. Complete a verificação do negócio

### 3. Obter Credenciais

Você precisará das seguintes credenciais:

```json
{
  "appId": "seu-app-id",
  "appSecret": "seu-app-secret",
  "phoneNumberId": "seu-phone-number-id",
  "wabaId": "seu-waba-id",
  "accessToken": "seu-access-token"
}
```

### 4. Registrar Empresa na API

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies</span>
  </div>
  <div class="endpoint-body">
    
```json
{
  "name": "Nome da Empresa",
  "document": "CNPJ",
  "waba": {
    "appId": "seu-app-id",
    "appSecret": "seu-app-secret",
    "wabaId": "seu-waba-id"
  }
}
```

  </div>
</div>

### 5. Configurar Webhook

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies/{companyId}/webhook</span>
  </div>
  <div class="endpoint-body">
    
```json
{
  "verifyToken": "seu-token-de-verificacao",
  "callbackUrl": "https://sua-api.com/webhook/{companyId}"
}
```

  </div>
</div>

## Fluxo de Verificação do Webhook

<div class="mermaid">
sequenceDiagram
participant W as WhatsApp
participant A as API
participant D as Database
W->>A: GET /webhook (verify_token)
A->>D: Buscar token da empresa
D-->>A: Token encontrado
A-->>W: hub.challenge
W->>A: POST /webhook (update)
A->>D: Processar atualização
A-->>W: 200 OK
</div>

## Campos do Webhook

Configure os seguintes campos no webhook:

- `messages`
- `message_status`
- `conversations`

## Verificação e Testes

1. **Teste de Conexão**
   ```bash
   curl -X GET "https://sua-api.com/webhook/{companyId}?hub.mode=subscribe&hub.verify_token=seu-token&hub.challenge=challenge_code"
   ```

2. **Teste de Recebimento**
   ```bash
   curl -X POST "https://sua-api.com/webhook/{companyId}" \
   -H "Content-Type: application/json" \
   -d '{"object": "whatsapp_business_account"}'
   ```

## Solução de Problemas

### Webhook não Recebe Atualizações

1. Verifique se o `verifyToken` está correto
2. Confirme se a URL do webhook está acessível
3. Verifique os campos configurados no Facebook Developers

### Erro de Autenticação

1. Verifique se o token de acesso não expirou
2. Confirme se as permissões do aplicativo estão corretas
3. Verifique se o número está verificado

## Próximos Passos

- [Configuração de Canais](./channel-setup.md)
- [Tipos de Mensagens](./message-types.md)
- [Gestão de Conversas](./conversation-management.md) 