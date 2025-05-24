# Fluxo de Canais - Synertalk WhatsApp API

A Synertalk WhatsApp API é uma solução robusta e escalável para integração com o WhatsApp Business API (WABA). Este documento detalha a arquitetura, fluxos e componentes do sistema, fornecendo uma visão completa da implementação.

## Arquitetura de Canais

A arquitetura foi projetada seguindo os princípios SOLID e padrões de design modernos, garantindo flexibilidade e manutenibilidade. O sistema utiliza uma abordagem modular, onde cada componente tem uma responsabilidade única e bem definida.

A estrutura principal é composta por controladores que gerenciam as requisições HTTP, serviços que implementam a lógica de negócio, e uma camada de abstração para diferentes provedores de mensageria. Atualmente, o foco principal é a integração com WhatsApp Business API, com suporte planejado para futuras integrações com outros canais de comunicação.

<div class="mermaid">
flowchart TB
    Client([Cliente API]) --> Controller[Channel Controller]
    Controller --> Service[Channel Service]
    Service --> Factory[Channel Factory]
    Factory --> WhatsAppAPI[WhatsApp API Service]
    Factory --> SMS[SMS Service]
    Factory --> Telegram[Telegram Service]
    Factory --> Messenger[Messenger Service]
    Service --> DB[(Database)]
    classDef default fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#e0e0e0;
    classDef controller fill:#3a3a3a,stroke:#505050,stroke-width:2px,color:#4CAF50;
    classDef service fill:#2d2d2d,stroke:#404040,stroke-width:1px,color:#64B5F6;
    class Controller controller;
    class Service,Factory,WhatsAppAPI,SMS,Telegram,Messenger service;
</div>

## Rotas de Canais

O sistema implementa uma API RESTful completa para gerenciamento de canais de comunicação. Cada rota foi cuidadosamente projetada para fornecer uma interface intuitiva e consistente, seguindo as melhores práticas de design de API.

As operações principais incluem criação de canais, envio de mensagens e gerenciamento de conexões. Todas as rotas são versionadas, documentadas via Swagger/OpenAPI, e incluem validações robustas de entrada.

### Principais Características das Rotas:
- Autenticação via JWT
- Rate limiting configurável
- Validação de payload
- Respostas padronizadas
- Documentação automática
- Logs detalhados de todas as operações

<div class="mermaid">
sequenceDiagram
    participant C as Cliente
    participant API as Channel Controller
    participant S as Channel Service
    participant DB as Database
    participant WA as WhatsApp API
    Note over C,WA: Fluxo de Criação e Gestão de Canais
    C->>+API: POST /whatsapp/channels
    Note over API: Criar novo canal
    API->>S: create(channelDto)
    S->>DB: Salvar canal
    DB-->>S: Canal criado
    S-->>API: Retorna canal
    API-->>-C: Canal criado
    C->>+API: POST /channels/:id/messages
    Note over API: Enviar mensagem
    API->>S: sendMessage(id, data)
    S->>WA: Enviar para WhatsApp
    WA-->>S: Confirmação
    S->>DB: Atualizar status
    S-->>API: Resposta
    API-->>-C: Mensagem enviada
    C->>+API: POST /channels/:id/connect
    Note over API: Conectar canal
    API->>S: connect(id)
    S->>WA: Autenticar
    WA-->>S: Conectado
    S->>DB: Atualizar status
    S-->>API: Status atualizado
    API-->>-C: Canal conectado
</div>

## Estados do Canal

O gerenciamento de estado é um aspecto crítico do sistema. Implementamos uma máquina de estados finitos (FSM) robusta que controla todo o ciclo de vida dos canais de comunicação. Este design permite um controle preciso sobre o estado de cada canal e facilita a recuperação de falhas.

### Características do Gerenciamento de Estado:
- Transições atômicas entre estados
- Persistência de estado
- Recuperação automática de falhas
- Notificações de mudança de estado
- Histórico de transições
- Métricas por estado

<div class="mermaid">
stateDiagram-v2
    [*] --> DISCONNECTED: Criar Canal
    DISCONNECTED --> CONNECTING: Iniciar Conexão
    CONNECTING --> CONNECTED: Autenticação OK
    CONNECTING --> DISCONNECTED: Falha
    CONNECTED --> DISCONNECTED: Desconectar
    CONNECTED --> ERROR: Erro de Comunicação
    ERROR --> CONNECTING: Reconectar
    note right of DISCONNECTED
        Canal criado<br>
        Aguardando conexão<br>
        Configurações pendentes
    end note
    note right of CONNECTED
        Autenticado<br>
        Pronto para mensagens<br>
        Webhooks ativos
    end note
    note right of ERROR
        Falha de conexão<br>
        Erro de autenticação<br>
        Retry automático
    end note
</div>

## Tipos de Canais Suportados

O sistema foi projetado com foco principal no WhatsApp Business API (WABA), oferecendo suporte completo a todas as funcionalidades da plataforma. A arquitetura permite a adição futura de novos canais de forma modular.

### Recursos do Canal WhatsApp:
- Suporte completo à API oficial do WhatsApp Business
- Gerenciamento de templates de mensagens
- Processamento de webhooks
- Métricas e análises
- Gestão de mídia
- Controle de taxa de envio
- Validação automática de números
- Gestão de opt-in/opt-out

<div class="mermaid">
classDiagram
    class Channel {
        +id: number
        +name: string
        +type: ChannelType
        +status: string
        +connect()
        +disconnect()
        +sendMessage()
    }
    class ChannelType {
        WHATSAPP_CLOUD
        WHATSAPP_ON_PREMISE
        SMS
        TELEGRAM
        MESSENGER
    }
    Channel --> ChannelType
</div>

## 1. Criação de Canal

### Fluxo de Código
<div class="mermaid">
flowchart TB
    subgraph Controller[channel.controller.ts]
        A[POST /whatsapp/channels]
        B[createChannelDto]
    end
    subgraph Service[channel.service.ts]
        C[createChannelDto]
        D[findFirst - credential]
        E[updateMany - isDefault]
        F[create channel]
    end
    subgraph Database[Prisma]
        G[WhatsappCredential]
        H[Channel]
    end
    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    D --> G
    E --> H
    F --> H
</div>

### Detalhes do Fluxo
1. **Controller (channel.controller.ts)**
   - Rota: `POST /whatsapp/channels`
   - Decoradores: `@ApiTags('Channels'), @ApiBearerAuth()`
   - Validação: `CreateChannelDto`

2. **Service (channel.service.ts)**
   - Método: `create(createChannelDto)`
   - Validações:
     - Verifica credenciais ativas
     - Atualiza canais default
     - Prepara dados do canal

3. **Database**
   - Tabelas: `Channel, WhatsappCredential`
   - Operações:
     - `findFirst` (credencial)
     - `updateMany` (canais default)
     - `create` (novo canal)

## 2. Envio de Mensagem

### Fluxo de Código

<div class="mermaid">
flowchart TB
    subgraph Controller[channel.controller.ts]
        A[POST /whatsapp/channels/:id/messages]
        B[SendMessageDto]
    end
    subgraph Service[channel.service.ts]
        C[sendMessage]
        D[findOne - channel]
        E[validateChannel]
    end
    subgraph WhatsappMessageService[whatsapp-message.service.ts]
        F[sendMessage]
        G[processMessage]
        H[saveMessage]
    end
    subgraph Database[Prisma]
        I[Channel]
        J[Message]
    end
    A --> B
    B --> C
    C --> D
    D --> I
    C --> E
    E --> F
    F --> G
    G --> H
    H --> J
</div>

### Detalhes do Fluxo
1. **Controller (channel.controller.ts)**
   - Rota: `POST /channels/:id/messages`
   - Parâmetros: `id, companyId, SendMessageDto`
   - Retorno: Status da mensagem

2. **Service (channel.service.ts)**
   - Método: `sendMessage(id, companyId, data)`
   - Validações:
     - Canal existe e está conectado
     - Credenciais válidas
     - Status ativo

3. **WhatsappService (whatsapp-message.service.ts)**
   - Método: `sendMessage(channelId, messageData)`
   - Processamento:
     - Prepara mensagem
     - Envia para API
     - Salva resultado

4. **Database**
   - Tabelas: `Channel, Message`
   - Operações:
     - `findFirst` (canal)
     - `create` (mensagem)
     - `update` (status)

## 3. Conexão de Canal

### Fluxo de Código
<div class="mermaid">
    flowchart TB
    subgraph Controller[channel.controller.ts]
    A[POST /channels/:id/connect]
    end
    subgraph Service[channel.service.ts]
    B[connect]
    C[findOne]
    D[validateCredentials]
    E[updateStatus]
    end
    subgraph WhatsappAuth[whatsapp-auth.service.ts]
    F[authenticate]
    G[validateToken]
    end
    subgraph Database[Prisma]
    H[Channel]
    I[WhatsappCredential]
    end
    A-->B
    B-->C
    C-->H
    B-->D
    D-->I
    B-->E
    E-->F
    F-->G
    G-->H
</div>

### Detalhes do Fluxo
1. **Controller (channel.controller.ts)**
   - Rota: `POST /channels/:id/connect`
   - Parâmetros: `id, companyId`
   - Retorno: Canal atualizado

2. **Service (channel.service.ts)**
   - Método: `connect(id, companyId)`
   - Validações:
     - Canal existe
     - Credencial configurada
     - Credencial ativa
     - Configurações WhatsApp válidas

3. **WhatsappAuth (whatsapp-auth.service.ts)**
   - Método: `authenticate()`
   - Processamento:
     - Valida token
     - Registra webhook
     - Atualiza status

4. **Database**
   - Tabelas: `Channel, WhatsappCredential`
   - Operações:
     - `findFirst` (canal e credencial)
     - `update` (status do canal)

## Interfaces e DTOs

### CreateChannelDto
```typescript
export class CreateChannelDto {
    name: string;
    number: string;
    description?: string;
    companyId: number;
    departmentId?: number;
    isDefault?: boolean;
    whatsappCredentialId: number;
    fbNumberPhoneId: string;
    accountWBId: string;
    type: ChannelType;
}
```

### SendMessageDto
```typescript
export class SendMessageDto {
    to: string;
    type: MessageType;
    text?: TextMessage;
    image?: MediaMessage;
    document?: DocumentMessage;
    template?: TemplateMessage;
}
```

### Channel Status
```typescript
export type ChannelStatus = 
    | 'DISCONNECTED'
    | 'CONNECTING'
    | 'CONNECTED'
    | 'ERROR';
``` 