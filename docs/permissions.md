# Estratégia de Permissões

## Visão Geral

O sistema de permissões do ZapTalk Central é baseado no conceito de CASL (Capability-based Access Control), onde as permissões são definidas através de ações (`actions`) e recursos (`subjects`).

### Tipos de Permissão

```typescript
// Types de permissão disponíveis
type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
type Subject =
  | 'contact'  // Contatos
  | 'report'   // Relatórios
  | 'message'  // Mensagens
  | 'user'     // Usuários
  | 'conversation' // Conversas
  | 'chatbot' // Chatbot  
  | 'message_template' // Modelos de mensagens
  | 'settings' // Configurações
  | 'ticket' // Tickets
  | 'channel' // Canais
  | 'department' // Departamentos
  | 'tags' // Tags
  | 'user_role' // Papéis de usuário
  | 'all';    ;
```

## Backend

### Configuração

O backend utiliza um sistema de roles e permissions baseado em JSON:

```json
{
  "roles": {
    "admin": {
      "permissions": ["*:*"]
    },
    "manager": {
      "permissions": [
        "create:contact",
        "read:contact",
        "update:contact",
        "delete:contact",
        "read:report"
      ]
    },
    "user": {
      "permissions": [
        "read:contact",
        "create:message",
        "read:message"
      ]
    }
  }
}
```

### Middleware de Verificação

```typescript
// Middleware de verificação de permissão
const checkPermission = (action: Action, subject: Subject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user.permissions;
    if (hasPermission(userPermissions, action, subject)) {
      next();
    } else {
      res.status(403).json({ error: 'Permission denied' });
    }
  };
};
```

## Frontend

### Hook useAbilities

O hook `useAbilities` é o coração do sistema de permissões no frontend:

```typescript
import { useAbilities } from '@/hooks/use-abilities';

function MyComponent() {
  const { can } = useAbilities();
  
  // Verificação direta de permissão
  const canCreateContact = can('create', 'contact');
}
```

### Componentes de Permissão

#### 1. PermissionButton

Botão que se auto-desabilita baseado em permissões:

```typescript
import { PermissionButton } from '@/components/ui/permission-button';

// Uso básico
<PermissionButton
  action="create"
  subject="contact"
  onClick={handleCreate}
>
  Novo Contato
</PermissionButton>

// Com mensagem customizada
<PermissionButton
  action="delete"
  subject="contact"
  tooltipMessage="Você precisa ser administrador para deletar contatos"
  onClick={handleDelete}
>
  Deletar Contato
</PermissionButton>
```

#### 2. PermissionLink

Link que pode se auto-desabilitar ou mostrar modal de permissão negada:

```typescript
import { PermissionLink } from '@/components/ui/permission-link';

// Uso básico - mostra modal quando clicado sem permissão
<PermissionLink
  action="read"
  subject="report"
  to="/reports"
>
  Ver Relatórios
</PermissionLink>

// Com disabled - desabilita visualmente e mostra tooltip
<PermissionLink
  action="read"
  subject="report"
  to="/reports"
  disabled
>
  Ver Relatórios
</PermissionLink>

// Com mensagem customizada no tooltip
<PermissionLink
  action="read"
  subject="report"
  to="/reports"
  disabled
  tooltipMessage="Você precisa ser gerente para acessar relatórios"
>
  Ver Relatórios
</PermissionLink>

// Com estilização customizada
<PermissionLink
  action="read"
  subject="report"
  to="/reports"
  disabled
  className="text-blue-500 hover:text-blue-700"
>
  Ver Relatórios
</PermissionLink>
```

#### 3. PermissionRoute

Componente para proteger rotas baseado em permissões:

```typescript
import { PermissionRoute } from '@/components/auth/PermissionRoute';

<PermissionRoute
  action="read"
  subject="report"
  element={<ReportsPage />}
/>
```

### Uso Direto do Hook

Para casos mais complexos ou verificações condicionais:

```typescript
function ComplexComponent() {
  const { can } = useAbilities();

  // Verificações múltiplas
  const canManageUsers = can('manage', 'user');
  const canDeleteReports = can('delete', 'report');

  // Lógica condicional
  const handleAction = () => {
    if (can('update', 'contact')) {
      // Executar ação
    } else {
      // Mostrar mensagem de erro
    }
  };

  // Renderização condicional
  return (
    <div>
      {can('read', 'report') && <ReportsList />}
      {can('create', 'contact') && <ContactForm />}
    </div>
  );
}
```

## Exemplos de Uso

### 1. Proteção de Rota

```typescript
// App.tsx
<Routes>
  <Route
    path="/reports"
    element={
      <PermissionRoute
        action="read"
        subject="report"
        element={<ReportsPage />}
      />
    }
  />
</Routes>
```

### 2. Botão de Ação

```typescript
// ContactsList.tsx
<PermissionButton
  action="create"
  subject="contact"
  onClick={handleCreateContact}
>
  Novo Contato
  <Plus className="h-4 w-4" />
</PermissionButton>
```

### 3. Menu Condicional

```typescript
// Sidebar.tsx
function Sidebar() {
  const { can } = useAbilities();

  return (
    <nav>
      <PermissionLink
        action="read"
        subject="contact"
        to="/contacts"
      >
        Contatos
      </PermissionLink>

      {can('read', 'report') && (
        <PermissionLink
          action="read"
          subject="report"
          to="/reports"
        >
          Relatórios
        </PermissionLink>
      )}
    </nav>
  );
}
```

### 4. Formulário com Múltiplas Permissões

```typescript
function ContactForm() {
  const { can } = useAbilities();
  const isReadOnly = !can('update', 'contact');

  return (
    <form>
      <input
        type="text"
        disabled={isReadOnly}
      />
      
      {can('update', 'contact') && (
        <PermissionButton
          action="update"
          subject="contact"
          type="submit"
        >
          Salvar
        </PermissionButton>
      )}
    </form>
  );
}
```

## Boas Práticas

1. **Sempre use os componentes de permissão** quando possível, pois eles já incluem feedback visual e UX apropriados.
2. **Evite verificações aninhadas** de permissão para manter o código limpo.
3. **Centralize as definições** de permissões em tipos TypeScript.
4. **Mantenha consistência** no uso dos componentes de permissão em toda a aplicação.
5. **Documente novas permissões** ao adicioná-las ao sistema. 