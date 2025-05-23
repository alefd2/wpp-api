# Tipos de Mensagens - Synertalk WhatsApp Business API

Esta documentação fornece uma visão completa do sistema de mensagens WhatsApp da Synertalk, incluindo sua arquitetura, tipos de mensagens suportados, fluxos de processamento e boas práticas. O objetivo é auxiliar desenvolvedores e equipes técnicas na integração e uso eficiente da API Synertalk.

## Arquitetura do Sistema

A arquitetura do sistema Synertalk foi projetada para garantir escalabilidade, confiabilidade e rastreabilidade das mensagens. O diagrama abaixo ilustra como os diferentes componentes se comunicam, desde o frontend até o armazenamento dos dados.

<div class="mermaid">
flowchart LR
    FE[Synertalk UI\nInterface do Usuário] --> CS[Channel Service\nGerenciamento de Canais]
    CS --> MS[Message Service\nProcessamento de Mensagens]
    MS --> WA[WhatsApp API\nIntegração WhatsApp]
    WA --> MA[Meta API\nPlataforma Meta]
    MA --> DB[(Database\nArmazenamento)]
    classDef default fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#e0e0e0;
    classDef database fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#e0e0e0;
    class DB database;
</div>

## Estrutura de Dados

O modelo de dados foi desenvolvido para suportar múltiplas empresas, canais e agentes, permitindo uma gestão eficiente das conversas e mensagens. Este diagrama ER mostra os relacionamentos entre as principais entidades do sistema.

<div class="mermaid">
erDiagram
COMPANY ||--o{ CHANNEL : has
CHANNEL ||--o{ MESSAGE : contains
CHANNEL ||--o{ AGENT : manages
MESSAGE ||--o{ TEMPLATE : uses
MESSAGE ||--o{ MEDIA : contains
AGENT ||--o{ CONVERSATION : handles
COMPANY {
string id
string name
string status
datetime created_at
}
CHANNEL {
string id
string company_id
string phone_number
string provider
string status
}
MESSAGE {
string id
string channel_id
string type
string status
string direction
string content
datetime sent_at
}
AGENT {
string id
string channel_id
string name
string role
string status
}
</div>

## Fluxo de Mensagens

Para garantir a entrega confiável e o rastreamento adequado, cada mensagem passa por um fluxo bem definido de estados e validações. Esta seção detalha cada etapa do processo, desde a criação até a confirmação de leitura.

O sistema implementa um fluxo robusto para o processamento de mensagens, garantindo confiabilidade e rastreabilidade em cada etapa.

### Envio de Mensagens

<div class="mermaid">
sequenceDiagram
    participant F as Frontend UI
    participant C as Channel Service
    participant M as Message Service
    participant W as WhatsApp API
    participant D as Database
    Note over F,D: Fluxo de Envio de Mensagem
    F->>+C: 1. Enviar mensagem
    Note over F,C: Usuário inicia envio via interface
    C->>+M: 2. Processar mensagem
    Note over C,M: Validação de formato e destino
    M->>D: 3. Salvar (PENDING)
    Note over M,D: Registro inicial com ID único
    M->>+W: 4. Enviar para WhatsApp
    Note over M,W: Autenticação e envio
    W-->>-M: 5. Confirmação
    Note over W,M: Resposta com messageId
    M->>D: 6. Atualizar (SENT)
    Note over M,D: Status atualizado com timestamp
    Note over W,D: Atualizações Assíncronas
    W->>M: 7. Status (DELIVERED)
    M->>D: 8. Atualizar DB
    Note over M,D: Registro de entrega
    W->>M: 9. Status (READ)
    M->>D: 10. Atualizar final
    Note over M,D: Confirmação de leitura
</div>

### Estados da Mensagem

<div class="mermaid">
stateDiagram-v2
    [*] --> PENDING: 1. Nova mensagem
    PENDING --> SENT: 2. Enviada
    SENT --> DELIVERED: 3. Entregue
    DELIVERED --> READ: 4. Lida
    PENDING --> FAILED: Erro no envio
    [*] --> RECEIVED: Webhook recebido
    RECEIVED --> READ: Visualizada
    note right of PENDING
        Estado Inicial:
        - Mensagem validada
        - ID gerado
        - Mídia processada
        - Aguardando envio
    end note
    note right of SENT
        Confirmação WhatsApp:
        - messageId recebido
        - Timestamp registrado
        - Retry configurado
        - Webhook aguardado
    end note
    note right of DELIVERED
        Entrega Confirmada:
        - Chegou ao destinatário
        - Timestamp atualizado
        - Métricas registradas
        - Aguardando leitura
    end note
    note right of READ
        Leitura Confirmada:
        - Mensagem visualizada
        - Timestamp final
        - Métricas atualizadas
        - Ciclo completado
    end note
    note left of FAILED
        Tratamento de Erro:
        - Causa identificada
        - Retry esgotado
        - Erro registrado
        - Notificação enviada
    end note
    note left of RECEIVED
        Mensagem Recebida:
        - Webhook processado
        - Canal identificado
        - Conteúdo salvo
        - Agente notificado
    end note
</div>

### Processo Detalhado

1. **Criação da Mensagem**
   - Validação do formato e conteúdo
   - Verificação do destinatário
   - Atribuição de ID único

2. **Processamento**
   - Análise do tipo de mensagem
   - Preparação de mídia (se necessário)
   - Validação de templates

3. **Envio ao WhatsApp**
   - Autenticação com a API
   - Envio da mensagem
   - Recebimento de confirmação

4. **Acompanhamento de Status**
   - Monitoramento via webhooks
   - Atualização em tempo real
   - Registro de timestamps

5. **Finalização**
   - Confirmação de leitura
   - Arquivamento
   - Métricas e analytics

## Estrutura do Sistema

<div class="mermaid">
erDiagram
    Company ||--o{ Channel : has
    Channel ||--o{ Message : contains
    Channel ||--o{ Agent : manages
    Message ||--o{ Template : uses
    Message ||--o{ MediaFile : contains
    Agent ||--o{ Conversation : handles
    Company {
        string id
        string name
        string status
    }
    Channel {
        string id
        string phoneNumber
        string status
        string provider
    }
    Message {
        string id
        string type
        string status
        string direction
        string content
    }
    Agent {
        string id
        string name
        string role
    }
</div>

## Visão Geral

O sistema suporta diversos tipos de mensagens do WhatsApp, permitindo uma comunicação rica e interativa com os clientes.

## Tipos Suportados

O WhatsApp oferece diversos tipos de mensagens para atender diferentes necessidades de comunicação. Cada tipo tem suas próprias características, limitações e casos de uso ideais. Abaixo detalhamos cada um deles com exemplos práticos de implementação.

### 1. Texto

Mensagens de texto simples, ideais para comunicação direta e rápida através da plataforma Synertalk.

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies/{companyId}/channels/{channelId}/messages</span>
    <a href="/api/swagger#/Messages/MessagesController_sendMessage" class="swagger-link" target="_blank">Testar no Swagger →</a>
  </div>
  <div class="endpoint-body">
    
```json
{
  "to": "5511999999999",
  "type": "text",
  "text": {
    "body": "Olá! Bem-vindo à Synertalk. Como posso ajudar?"
  }
}
```
  </div>
</div>

### 2. Imagem

Envio de imagens com suporte a legendas. Ideal para catálogos, demonstrações visuais e marketing da sua empresa na plataforma Synertalk.

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies/{companyId}/channels/{channelId}/messages</span>
    <a href="/api/swagger#/Messages/MessagesController_sendMessage" class="swagger-link" target="_blank">Testar no Swagger →</a>
  </div>
  <div class="endpoint-body">

```json
{
  "to": "5511999999999",
  "type": "image",
  "image": {
    "link": "https://synertalk.com/images/produto.jpg",
    "caption": "Conheça nossa solução de atendimento!"
  }
}
```
  </div>
</div>

### 3. Documento

Compartilhamento de arquivos com nome e descrição. Perfeito para manuais, contratos e documentação.

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies/{companyId}/channels/{channelId}/messages</span>
    <a href="/api/swagger#/Messages/MessagesController_sendMessage" class="swagger-link" target="_blank">Testar no Swagger →</a>
  </div>
  <div class="endpoint-body">

```json
{
  "to": "5511999999999",
  "type": "document",
  "document": {
    "link": "https://exemplo.com/doc.pdf",
    "filename": "manual.pdf",
    "caption": "Manual do usuário"
  }
}
```
  </div>
</div>

### 4. Áudio

Mensagens de voz ou áudio, excelentes para instruções detalhadas ou comunicação mais pessoal.

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies/{companyId}/channels/{channelId}/messages</span>
    <a href="/api/swagger#/Messages/MessagesController_sendMessage" class="swagger-link" target="_blank">Testar no Swagger →</a>
  </div>
  <div class="endpoint-body">

```json
{
  "to": "5511999999999",
  "type": "audio",
  "audio": {
    "link": "https://exemplo.com/audio.mp3"
  }
}
```
  </div>
</div>

### 5. Vídeo

Compartilhamento de vídeos com legendas. Ótimo para tutoriais, demonstrações e conteúdo promocional.

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies/{companyId}/channels/{channelId}/messages</span>
    <a href="/api/swagger#/Messages/MessagesController_sendMessage" class="swagger-link" target="_blank">Testar no Swagger →</a>
  </div>
  <div class="endpoint-body">

```json
{
  "to": "5511999999999",
  "type": "video",
  "video": {
    "link": "https://exemplo.com/video.mp4",
    "caption": "Demonstração do produto"
  }
}
```
  </div>
</div>

### 6. Template

Mensagens pré-aprovadas pelo WhatsApp, permitindo personalização. Essencial para mensagens iniciais e comunicações em massa através da Synertalk.

<div class="endpoint-container">
  <div class="endpoint-header">
    <span class="method-badge method-post">POST</span>
    <span class="api-url">/companies/{companyId}/channels/{channelId}/messages</span>
    <a href="/api/swagger#/Messages/MessagesController_sendMessage" class="swagger-link" target="_blank">Testar no Swagger →</a>
  </div>
  <div class="endpoint-body">

```json
{
  "to": "5511999999999",
  "type": "template",
  "template": {
    "name": "synertalk_welcome",
    "language": {
      "code": "pt_BR"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "João"
          }
        ]
      }
    ]
  }
}
```
  </div>
</div>

## Status das Mensagens

| Status | Descrição |
|--------|-----------|
| PENDING | Mensagem aguardando envio |
| SENT | Mensagem enviada ao WhatsApp |
| DELIVERED | Mensagem entregue ao destinatário |
| READ | Mensagem lida pelo destinatário |
| FAILED | Falha no envio da mensagem |

## Sistema de Webhooks

O sistema Synertalk utiliza webhooks para manter o estado das mensagens atualizado em tempo real.

### Webhooks de Status

Recebe atualizações de status das mensagens enviadas através da plataforma Synertalk:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "SYNERTALK_WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "5511999999999",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "statuses": [{
          "id": "wamid.ID",
          "status": "read",
          "timestamp": "1674138947",
          "recipient_id": "5511999999999"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Webhooks de Recebimento

Notifica sobre novas mensagens recebidas dos clientes:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "5511999999999",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.ID",
          "timestamp": "1674138947",
          "text": {
            "body": "Olá, preciso de ajuda!"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Processamento de Webhooks

1. **Recebimento**
   - Validação da assinatura
   - Verificação do tipo de evento
   - Identificação do canal

2. **Processamento**
   - Atualização de status
   - Registro de timestamps
   - Notificação de agentes

3. **Resposta**
   - Confirmação de recebimento
   - Processamento assíncrono
   - Garantia de entrega

## Limitações e Boas Práticas

Para garantir uma integração bem-sucedida e evitar problemas comuns, é importante entender as limitações da API do WhatsApp e seguir as melhores práticas recomendadas. Esta seção fornece diretrizes detalhadas para diferentes aspectos da implementação.

### Templates

#### Requisitos
- Aprovação prévia pelo WhatsApp através da Synertalk
- Conteúdo não promocional alinhado com diretrizes
- Mensagens claras e objetivas

#### Limites
- 500 templates por dia por número
- Uso restrito para mensagens iniciais
- Tempo de aprovação: 24-48h

#### Boas Práticas
- Manter alta taxa de engajamento
- Evitar spam e conteúdo promocional
- Personalizar variáveis adequadamente

### Mídia

#### Limites de Tamanho
- Imagens: até 5MB
- Áudio: até 16MB
- Vídeo: até 16MB
- Documentos: até 100MB

#### Formatos Suportados
- **Imagens**: JPG, PNG
- **Áudio**: MP3, OGG, M4A
- **Vídeo**: MP4, 3GPP
- **Documentos**: PDF, DOC(X), XLS(X), PPT(X)

#### Recomendações
- Otimizar arquivos antes do envio
- Usar formatos comprimidos
- Verificar qualidade após compressão

### Rate Limits

#### Por Número
- 250 mensagens/segundo
- 500 templates/dia
- 1000 sessões ativas

#### Janela de Resposta
- 24 horas após última mensagem do cliente
- Reset com nova mensagem do cliente
- Templates não têm restrição de janela

#### Boas Práticas
- Implementar filas de mensagens
- Monitorar limites de uso
- Planejar fallbacks

### Segurança

#### Autenticação
- Token de acesso seguro
- Rotação periódica de tokens
- Monitoramento de uso

#### Webhooks
- Validação de assinatura
- HTTPS obrigatório
- Retry em falhas

#### Dados Sensíveis
- Não enviar dados pessoais
- Criptografar armazenamento
- Seguir LGPD/GDPR

### Monitoramento

#### Métricas Importantes
- Taxa de entrega
- Tempo de resposta
- Engajamento

#### Alertas
- Falhas de envio
- Limites próximos
- Expiração de tokens

#### Logs
- Detalhes de cada mensagem
- Histórico de status
- Erros e exceções

## Próximos Passos

Para aprofundar seu conhecimento e implementar funcionalidades adicionais, recomendamos explorar os seguintes tópicos em nossa documentação. Cada link fornece informações detalhadas sobre aspectos específicos do sistema.

- [Gestão de Templates Synertalk](./template-management.md)
  - Criação e aprovação de templates
  - Variáveis e personalização
  - Métricas de uso

- [Webhooks Synertalk](./webhooks.md)
  - Configuração de endpoints
  - Tratamento de eventos
  - Resiliência e retry

- [Relatórios de Mensagens](./message-reports.md)
  - Análise de desempenho
  - Métricas de engajamento
  - Exportação de dados da sua conta

## Fluxo do Sistema

Este diagrama oferece uma visão de alto nível do fluxo de dados no sistema, mostrando como as mensagens são processadas desde o frontend até o armazenamento no banco de dados. É útil para entender o caminho que cada mensagem percorre.

<div class="mermaid">
flowchart LR
    FE[Frontend UI\nInterface do Usuário] --> CS[Channel Service\nGerenciamento de Canais]
    CS --> MS[Message Service\nProcessamento de Mensagens]
    MS --> WA[WhatsApp API\nIntegração WhatsApp]
    WA --> MA[Meta API\nPlataforma Meta]
    MA --> DB[(Database\nArmazenamento)]
    classDef default fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#e0e0e0;
    classDef database fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#e0e0e0;
    class DB database;
</div>

## Fluxo de Processamento

O processamento de mensagens varia de acordo com o tipo de conteúdo. Este fluxograma detalha as diferentes rotas de processamento para cada tipo de mensagem, desde a validação inicial até o envio final.

<div class="mermaid">
graph LR
    A[Nova Mensagem\nInício do Processo] --> B{Tipo de\nMensagem?}
    B -->|Texto| C[Processar Texto\nValidar Conteúdo]
    B -->|Mídia| D[Upload Mídia\nValidar Formato]
    B -->|Template| E[Validar Template\nVerificar Aprovação]
    C --> F[Salvar no\nBanco de Dados]
    D --> F
    E --> F
    F --> G[Enviar para\nWhatsApp]
    G --> H{Status do\nEnvio}
    H -->|Sucesso| I[Marcar como\nEnviado]
    H -->|Erro| J[Marcar como\nFalha]
    classDef default fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#e0e0e0;
    classDef decision fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#e0e0e0;
    class B,H decision;
</div>
