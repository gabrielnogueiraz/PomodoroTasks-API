# 🔗 Toivo API Guide

<div align="center">

![API Version](https://img.shields.io/badge/API%20Version-1.0-blue?style=for-the-badge)
![RESTful API](https://img.shields.io/badge/REST-API-green?style=for-the-badge)
![Authentication](https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge)

**Documentação completa da API REST do Toivo**

[🏠 Voltar ao README](../README.md) • [📖 Documentação Técnica](./TECHNICAL_DOCUMENTATION.md) • [🚀 Deploy Guide](./RAILWAY_DEPLOY.md)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Autenticação](#-autenticação)
- [Formato de Resposta](#-formato-de-resposta)
- [Endpoints](#-endpoints)
  - [Autenticação](#autenticação-endpoints)
  - [Tarefas](#tarefas-endpoints)
  - [Pomodoros](#pomodoros-endpoints)
  - [Flores & Jardim](#flores--jardim-endpoints)
  - [Assistente Lumi](#assistente-lumi-endpoints)
- [Códigos de Status](#-códigos-de-status)
- [Exemplos Práticos](#-exemplos-práticos)
- [Postman Collection](#-postman-collection)

---

## 🌐 Visão Geral

### Base URL
```
Produção:  https://toivo-production.railway.app
Local:     http://localhost:3000
```

### Content-Type
Todas as requisições devem usar:
```
Content-Type: application/json
```

### Rate Limiting
- **Limite**: 100 requisições por minuto por IP
- **Headers de resposta**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## 🔐 Autenticação

### JWT Token
A API utiliza autenticação JWT (JSON Web Token). Para acessar endpoints protegidos, inclua o token no header:

```http
Authorization: Bearer <seu_jwt_token>
```

### Token Expiration
- **Duração**: 24 horas
- **Renovação**: Necessário fazer login novamente após expiração

---

## 📦 Formato de Resposta

### Resposta de Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": ["Email é obrigatório", "Senha deve ter pelo menos 6 caracteres"]
  }
}
```

---

## 🛡️ Endpoints

## Autenticação Endpoints

### POST /api/auth/register
Registra um novo usuário no sistema.

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "name": "João Silva",
      "email": "joao@email.com",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Usuário criado com sucesso"
}
```

**Possíveis Erros:**
- `400`: Email já cadastrado
- `400`: Dados de validação inválidos

---

### POST /api/auth/login
Autentica um usuário existente.

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login realizado com sucesso"
}
```

**Possíveis Erros:**
- `401`: Email ou senha inválidos
- `400`: Dados de validação inválidos

---

## Tarefas Endpoints

### GET /api/tasks
Lista todas as tarefas do usuário autenticado.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters (opcionais):**
```http
?status=pending&priority=high&limit=10&offset=0
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid-v4",
        "title": "Estudar TypeScript",
        "description": "Revisar conceitos avançados",
        "status": "pending",
        "priority": "high",
        "estimatedPomodoros": 4,
        "completedPomodoros": 1,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T14:20:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

### GET /api/tasks/:id
Recupera uma tarefa específica por ID.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid-v4",
      "title": "Estudar TypeScript",
      "description": "Revisar conceitos avançados",
      "status": "pending",
      "priority": "high",
      "estimatedPomodoros": 4,
      "completedPomodoros": 1,
      "pomodoros": [
        {
          "id": "uuid-v4",
          "duration": 25,
          "status": "completed",
          "startedAt": "2024-01-15T10:00:00Z",
          "completedAt": "2024-01-15T10:25:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:20:00Z"
    }
  }
}
```

**Possíveis Erros:**
- `404`: Tarefa não encontrada
- `403`: Acesso negado (tarefa não pertence ao usuário)

---

### POST /api/tasks
Cria uma nova tarefa.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Nova tarefa",
  "description": "Descrição detalhada da tarefa",
  "priority": "medium",
  "estimatedPomodoros": 3
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid-v4",
      "title": "Nova tarefa",
      "description": "Descrição detalhada da tarefa",
      "status": "pending",
      "priority": "medium",
      "estimatedPomodoros": 3,
      "completedPomodoros": 0,
      "createdAt": "2024-01-15T15:30:00Z",
      "updatedAt": "2024-01-15T15:30:00Z"
    }
  },
  "message": "Tarefa criada com sucesso"
}
```

**Validações:**
- `title`: obrigatório, mínimo 1 caractere
- `priority`: opcional, valores válidos: "low", "medium", "high"
- `estimatedPomodoros`: opcional, número inteiro positivo

---

### PUT /api/tasks/:id
Atualiza uma tarefa existente.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Tarefa atualizada",
  "description": "Nova descrição",
  "priority": "high",
  "estimatedPomodoros": 5
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid-v4",
      "title": "Tarefa atualizada",
      "description": "Nova descrição",
      "status": "pending",
      "priority": "high",
      "estimatedPomodoros": 5,
      "completedPomodoros": 0,
      "updatedAt": "2024-01-15T16:00:00Z"
    }
  },
  "message": "Tarefa atualizada com sucesso"
}
```

---

### DELETE /api/tasks/:id
Remove uma tarefa permanentemente.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Tarefa removida com sucesso"
}
```

**Possíveis Erros:**
- `404`: Tarefa não encontrada
- `403`: Acesso negado

---

### PATCH /api/tasks/:id/status
Atualiza apenas o status de uma tarefa.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "in_progress"
}
```

**Status válidos:**
- `pending`: Pendente
- `in_progress`: Em progresso
- `completed`: Concluída
- `cancelled`: Cancelada

---

### PATCH /api/tasks/:id/complete
Marca uma tarefa como concluída.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid-v4",
      "status": "completed",
      "completedAt": "2024-01-15T17:00:00Z"
    },
    "flowerAwarded": {
      "id": "uuid-v4",
      "type": "lotus",
      "color": "purple",
      "rarity": "common"
    }
  },
  "message": "Tarefa concluída! Você ganhou uma flor!"
}
```

---

### PATCH /api/tasks/:id/incomplete
Marca uma tarefa como incompleta (reverte conclusão).

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

---

## Pomodoros Endpoints

### GET /api/pomodoros
Lista todos os pomodoros do usuário.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```http
?taskId=uuid&status=completed&date=2024-01-15&limit=20&offset=0
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "pomodoros": [
      {
        "id": "uuid-v4",
        "duration": 25,
        "status": "completed",
        "startedAt": "2024-01-15T10:00:00Z",
        "completedAt": "2024-01-15T10:25:00Z",
        "task": {
          "id": "uuid-v4",
          "title": "Estudar TypeScript"
        }
      }
    ],
    "total": 15,
    "todayCount": 5,
    "weekCount": 28
  }
}
```

---

### GET /api/pomodoros/:id
Recupera um pomodoro específico.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

---

### POST /api/pomodoros
Cria uma nova sessão pomodoro.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "taskId": "uuid-v4",
  "duration": 25
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "pomodoro": {
      "id": "uuid-v4",
      "duration": 25,
      "status": "created",
      "task": {
        "id": "uuid-v4",
        "title": "Estudar TypeScript"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  },
  "message": "Sessão pomodoro criada"
}
```

---

### POST /api/pomodoros/:id/start
Inicia uma sessão pomodoro.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "pomodoro": {
      "id": "uuid-v4",
      "status": "active",
      "startedAt": "2024-01-15T10:00:00Z",
      "expectedEndTime": "2024-01-15T10:25:00Z"
    }
  },
  "message": "Pomodoro iniciado! Foque na sua tarefa."
}
```

---

### POST /api/pomodoros/:id/complete
Completa uma sessão pomodoro.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "pomodoro": {
      "id": "uuid-v4",
      "status": "completed",
      "startedAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:25:00Z",
      "actualDuration": 25
    },
    "taskUpdated": true,
    "flowerAwarded": {
      "id": "uuid-v4",
      "type": "sunflower",
      "color": "yellow"
    }
  },
  "message": "Pomodoro concluído! Parabéns pela produtividade!"
}
```

---

### POST /api/pomodoros/:id/interrupt
Interrompe uma sessão pomodoro ativa.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body (opcional):**
```json
{
  "reason": "Interrupção externa"
}
```

---

## Flores & Jardim Endpoints

### GET /api/flowers
Lista todas as flores do usuário.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```http
?type=lotus&color=purple&rarity=rare&limit=20&offset=0
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "flowers": [
      {
        "id": "uuid-v4",
        "type": "lotus",
        "color": "purple",
        "rarity": "rare",
        "earnedFrom": "task_completion",
        "task": {
          "id": "uuid-v4",
          "title": "Tarefa importante"
        },
        "createdAt": "2024-01-15T17:00:00Z"
      }
    ],
    "total": 25,
    "rarityCount": {
      "common": 15,
      "rare": 8,
      "legendary": 2
    }
  }
}
```

---

### GET /api/flowers/garden
Visualiza o jardim completo do usuário.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "garden": {
      "id": "uuid-v4",
      "level": 3,
      "experience": 1250,
      "nextLevelXp": 2000,
      "theme": "zen_garden",
      "flowers": [
        {
          "id": "uuid-v4",
          "type": "lotus",
          "color": "purple",
          "position": { "x": 2, "y": 3 },
          "isRare": true
        }
      ],
      "stats": {
        "totalFlowers": 25,
        "rareFlowers": 8,
        "legendaryFlowers": 2,
        "completedTasks": 50,
        "totalPomodoros": 120
      }
    }
  }
}
```

---

### GET /api/flowers/stats
Estatísticas detalhadas do jardim.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalFlowers": 25,
      "flowersByType": {
        "lotus": 8,
        "rose": 6,
        "sunflower": 5,
        "tulip": 4,
        "cherry_blossom": 2
      },
      "flowersByColor": {
        "purple": 6,
        "red": 5,
        "yellow": 5,
        "pink": 4,
        "white": 3,
        "blue": 2
      },
      "flowersByRarity": {
        "common": 15,
        "rare": 8,
        "legendary": 2
      },
      "gardenLevel": 3,
      "weeklyProgress": {
        "flowersThisWeek": 5,
        "pomodorosThisWeek": 28,
        "tasksThisWeek": 12
      }
    }
  }
}
```

---

### GET /api/flowers/check-rare
Verifica se o usuário pode ganhar uma flor rara.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "canEarnRare": true,
    "requirements": {
      "consecutiveDays": 7,
      "currentStreak": 7,
      "pomodorosToday": 5,
      "requiredPomodoros": 5
    },
    "nextRareFlower": {
      "type": "cherry_blossom",
      "color": "pink",
      "description": "Flor especial por 7 dias consecutivos de produtividade"
    }
  }
}
```

---

## Assistente Lumi Endpoints

### POST /api/lumi/chat
Conversa com o assistente Lumi.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Como posso melhorar minha produtividade?",
  "context": {
    "currentTask": "uuid-v4",
    "pomodorosToday": 3,
    "mood": "focused"
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "response": "Ótima pergunta! Com base no seu padrão de 3 pomodoros hoje, vejo que você está mantendo um bom ritmo. Para melhorar ainda mais, sugiro...",
    "personality": {
      "tone": "encouraging",
      "style": "coach"
    },
    "suggestions": [
      {
        "type": "break_reminder",
        "message": "Que tal fazer uma pausa de 5 minutos?"
      }
    ],
    "contextUpdated": true
  }
}
```

---

### GET /api/lumi/memory
Recupera a memória/histórico do Lumi para o usuário.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "memory": {
      "preferences": {
        "communicationStyle": "friendly",
        "motivationType": "encouraging",
        "focusAreas": ["productivity", "time_management"]
      },
      "patterns": {
        "mostProductiveTime": "morning",
        "averagePomodoros": 6,
        "preferredBreakDuration": 10
      },
      "recentTopics": [
        "time management techniques",
        "dealing with distractions",
        "work-life balance"
      ]
    }
  }
}
```

---

### GET /api/lumi/context
Contexto atual do usuário para personalização do Lumi.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "context": {
      "currentSession": {
        "tasksToday": 5,
        "pomodorosToday": 12,
        "completedTasks": 3,
        "currentStreak": 7
      },
      "weeklyStats": {
        "totalPomodoros": 35,
        "completedTasks": 18,
        "averageDaily": 5
      },
      "preferences": {
        "workingHours": "09:00-17:00",
        "breakPreference": "short",
        "notificationStyle": "gentle"
      }
    }
  }
}
```

---

### PATCH /api/lumi/personality
Atualiza preferências de personalidade do Lumi.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "communicationStyle": "professional",
  "motivationType": "challenging",
  "responseLength": "concise",
  "humorLevel": "light"
}
```

---

### GET /api/lumi/history
Histórico de conversas com o Lumi.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```http
?limit=20&offset=0&date=2024-01-15
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid-v4",
        "userMessage": "Como posso melhorar minha produtividade?",
        "lumiResponse": "Ótima pergunta! Com base no seu padrão...",
        "timestamp": "2024-01-15T14:30:00Z",
        "context": {
          "pomodorosToday": 3,
          "currentTask": "Estudar TypeScript"
        }
      }
    ],
    "total": 150,
    "page": 1
  }
}
```

---

### GET /api/lumi/info
Informações sobre o assistente Lumi.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "lumi": {
      "version": "1.0",
      "capabilities": [
        "productivity_coaching",
        "task_analysis",
        "motivation_support",
        "pattern_recognition"
      ],
      "personalityTraits": [
        "encouraging",
        "analytical",
        "supportive"
      ],
      "lastInteraction": "2024-01-15T14:30:00Z",
      "totalConversations": 150,
      "userRelationshipLevel": "trusted_companion"
    }
  }
}
```

---

## 📊 Códigos de Status

### Códigos de Sucesso
| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Operação bem-sucedida |
| `201` | Created | Recurso criado com sucesso |
| `204` | No Content | Operação bem-sucedida sem conteúdo |

### Códigos de Erro do Cliente
| Código | Significado | Descrição |
|--------|-------------|-----------|
| `400` | Bad Request | Dados inválidos ou malformados |
| `401` | Unauthorized | Token ausente ou inválido |
| `403` | Forbidden | Acesso negado ao recurso |
| `404` | Not Found | Recurso não encontrado |
| `409` | Conflict | Conflito (ex: email já existe) |
| `422` | Unprocessable Entity | Dados válidos mas não processáveis |
| `429` | Too Many Requests | Rate limit excedido |

### Códigos de Erro do Servidor
| Código | Significado | Descrição |
|--------|-------------|-----------|
| `500` | Internal Server Error | Erro interno do servidor |
| `503` | Service Unavailable | Serviço temporariamente indisponível |

---

## 🚀 Exemplos Práticos

### Fluxo Completo: Criar e Completar uma Tarefa

#### 1. Registrar usuário
```bash
curl -X POST https://toivo-production.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "email": "maria@email.com",
    "password": "senha123"
  }'
```

#### 2. Criar tarefa
```bash
curl -X POST https://toivo-production.railway.app/api/tasks \
  -H "Authorization: Bearer <TOKEN_DO_PASSO_1>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Estudar TypeScript",
    "description": "Revisar conceitos avançados",
    "priority": "high",
    "estimatedPomodoros": 4
  }'
```

#### 3. Criar sessão pomodoro
```bash
curl -X POST https://toivo-production.railway.app/api/pomodoros \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<ID_DA_TAREFA>",
    "duration": 25
  }'
```

#### 4. Iniciar pomodoro
```bash
curl -X POST https://toivo-production.railway.app/api/pomodoros/<ID_POMODORO>/start \
  -H "Authorization: Bearer <TOKEN>"
```

#### 5. Completar pomodoro
```bash
curl -X POST https://toivo-production.railway.app/api/pomodoros/<ID_POMODORO>/complete \
  -H "Authorization: Bearer <TOKEN>"
```

#### 6. Conversar com Lumi
```bash
curl -X POST https://toivo-production.railway.app/api/lumi/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Como foi meu desempenho hoje?",
    "context": {
      "pomodorosToday": 1,
      "completedTasks": 0
    }
  }'
```

---

### JavaScript/TypeScript SDK Example

```typescript
class ToivoAPI {
  private baseURL = 'https://toivo-production.railway.app';
  private token: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    this.token = data.data.token;
    return data;
  }

  async createTask(task: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    estimatedPomodoros?: number;
  }) {
    return await this.request('POST', '/api/tasks', task);
  }

  async startPomodoro(taskId: string) {
    const pomodoro = await this.request('POST', '/api/pomodoros', {
      taskId,
      duration: 25
    });
    
    return await this.request('POST', `/api/pomodoros/${pomodoro.data.pomodoro.id}/start`);
  }

  async chatWithLumi(message: string, context?: any) {
    return await this.request('POST', '/api/lumi/chat', {
      message,
      context
    });
  }

  private async request(method: string, endpoint: string, body?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      ...(body && { body: JSON.stringify(body) })
    });

    return await response.json();
  }
}

// Uso
const api = new ToivoAPI();
await api.login('maria@email.com', 'senha123');
const task = await api.createTask({
  title: 'Estudar TypeScript',
  priority: 'high',
  estimatedPomodoros: 4
});
```

---

## 📮 Postman Collection

### Importar Collection
Copie e salve o JSON abaixo como `toivo-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Toivo API",
    "description": "API completa do sistema de produtividade Toivo",
    "version": "1.0.0"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://toivo-production.railway.app"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}"
      }
    ]
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Maria Silva\",\n  \"email\": \"maria@email.com\",\n  \"password\": \"senha123\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/login",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"maria@email.com\",\n  \"password\": \"senha123\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🔍 Health Check

### GET /health
Verifica o status da API.

**Resposta de Sucesso (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T16:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "uptime": "2d 14h 32m"
}
```

---

## 🚨 Tratamento de Erros

### Padrão de Erro Global
```json
{
  "success": false,
  "error": {
    "code": "SPECIFIC_ERROR_CODE",
    "message": "Mensagem amigável para o usuário",
    "details": ["Lista de detalhes específicos"],
    "timestamp": "2024-01-15T16:00:00Z",
    "path": "/api/tasks",
    "method": "POST"
  }
}
```

### Códigos de Erro Específicos

| Código | Significado |
|--------|-------------|
| `VALIDATION_ERROR` | Dados de entrada inválidos |
| `AUTHENTICATION_FAILED` | Falha na autenticação |
| `AUTHORIZATION_DENIED` | Acesso negado |
| `RESOURCE_NOT_FOUND` | Recurso não encontrado |
| `RESOURCE_CONFLICT` | Conflito de recursos |
| `RATE_LIMIT_EXCEEDED` | Limite de requisições excedido |
| `DATABASE_ERROR` | Erro no banco de dados |
| `INTERNAL_ERROR` | Erro interno do servidor |

---

## 📚 Recursos Adicionais

- **Swagger/OpenAPI**: Em desenvolvimento
- **SDK oficial**: Em desenvolvimento
- **WebSocket**: Notificações em tempo real (em desenvolvimento)
- **GraphQL**: Endpoint alternativo (roadmap)

---

## 🆘 Suporte

Para dúvidas ou problemas com a API:

1. **Documentação Técnica**: [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)
2. **Issues no GitHub**: Para reportar bugs
3. **Discussions**: Para dúvidas gerais

---

<div align="center">

**📖 Documentação atualizada em 15/01/2024**

[🏠 Voltar ao README](../README.md) • [📖 Documentação Técnica](./TECHNICAL_DOCUMENTATION.md) • [🚀 Deploy Guide](./RAILWAY_DEPLOY.md)

</div>
