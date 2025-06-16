# 📖 Documentação Técnica - Toivo Backend

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Configuração e Setup](#3-configuração-e-setup)
4. [Modelos de Dados](#4-modelos-de-dados)
5. [Serviços e Lógica de Negócio](#5-serviços-e-lógica-de-negócio)
6. [Sistema de Autenticação](#6-sistema-de-autenticação)
7. [Sistema Lumi (IA)](#7-sistema-lumi-ia)
8. [Sistema de Gamificação](#8-sistema-de-gamificação)
9. [Performance e Otimizações](#9-performance-e-otimizações)
10. [Logging e Monitoramento](#10-logging-e-monitoramento)
11. [Segurança](#11-segurança)
12. [Deploy e Produção](#12-deploy-e-produção)

---

## 1. Visão Geral da Arquitetura

### 1.1 Padrão Arquitetural

O Toivo segue uma **arquitetura em camadas** (Layered Architecture) com separação clara de responsabilidades:

```
┌─────────────────────────────────────┐
│           PRESENTATION              │
│     (Routes + Controllers)          │
├─────────────────────────────────────┤
│            BUSINESS                 │
│           (Services)                │
├─────────────────────────────────────┤
│          PERSISTENCE                │
│     (Entities + Repositories)       │
├─────────────────────────────────────┤
│           DATABASE                  │
│         (PostgreSQL)                │
└─────────────────────────────────────┘
```

### 1.2 Fluxo de Dados

```mermaid
graph TD
    A[Cliente] --> B[Routes]
    B --> C[Controller]
    C --> D[Service]
    D --> E[Repository]
    E --> F[Database]
    F --> E
    E --> D
    D --> C
    C --> B
    B --> A
```

### 1.3 Tecnologias Core

| Componente | Tecnologia | Versão | Responsabilidade |
|------------|------------|---------|------------------|
| **Runtime** | Node.js | 18.x | Ambiente de execução JavaScript |
| **Framework** | Express.js | 4.x | Servidor HTTP e roteamento |
| **Linguagem** | TypeScript | 5.x | Tipagem estática e transpilação |
| **ORM** | TypeORM | 0.3.x | Mapeamento objeto-relacional |
| **Database** | PostgreSQL | 15.x | Persistência de dados |
| **Validation** | class-validator | 0.14.x | Validação de dados |

---

## 2. Estrutura do Projeto

### 2.1 Organização de Diretórios

```
src/
├── app.ts                    # Configuração do Express
├── server.ts                 # Entry point da aplicação
├── data-source.ts           # Configuração do TypeORM
├── config/                  # Configurações da aplicação
│   ├── database.ts          # Config específicas do banco
│   └── database-manager.ts  # Gerenciador de conexões
├── controllers/             # Controladores HTTP
│   ├── TaskController.ts
│   ├── PomodoroController.ts
│   ├── UserController.ts
│   ├── FlowerController.ts
│   └── LumiController.ts
├── entities/                # Modelos de dados (TypeORM)
│   ├── User.ts
│   ├── Task.ts
│   ├── Pomodoro.ts
│   ├── Flower.ts
│   ├── Garden.ts
│   └── LumiMemory.ts
├── services/                # Lógica de negócio
│   ├── UserService.ts
│   ├── TaskService.ts
│   ├── PomodoroService.ts
│   ├── FlowerService.ts
│   └── LumiService.ts
├── middleware/              # Middlewares customizados
│   └── auth.ts             # Autenticação JWT
├── routes/                  # Definições de rotas
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── task.routes.ts
│   ├── pomodoro.routes.ts
│   ├── flower.routes.ts
│   └── lumi.routes.ts
├── types/                   # Definições de tipos
│   ├── express.d.ts
│   └── lumi.types.ts
└── utils/                   # Utilitários
    └── logger.ts           # Sistema de logging
```

### 2.2 Scripts e Ferramentas

```
scripts/                     # Scripts utilitários
├── setup-db.ts            # Setup inicial do banco
├── reset-db.ts             # Reset do banco
├── migrate-data.ts         # Migração de dados
├── validate-config.ts      # Validação de configuração
├── validate-production.ts  # Validação de produção
├── railway-check.js        # Verificação Railway
├── test-lumi-integration.ts # Testes do Lumi
└── test-lumi-task-management.ts
```

---

## 3. Configuração e Setup

### 3.1 Variáveis de Ambiente

#### Desenvolvimento (.env)
```bash
# Banco de Dados
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=toivo_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# Segurança
JWT_SECRET=development_jwt_secret_32_chars_min
BCRYPT_ROUNDS=12

# Servidor
NODE_ENV=development
PORT=3000

# Logging
LOG_LEVEL=DEBUG

# Serviços Externos
LUMI_AI_URL=http://localhost:5000
```

#### Produção
```bash
# Banco (Railway fornece automaticamente)
DATABASE_URL=postgresql://user:pass@host:port/db

# Segurança (obrigatórias)
NODE_ENV=production
JWT_SECRET=super_secure_production_secret_min_32_chars
BCRYPT_ROUNDS=12

# Configurações
PORT=8080
LOG_LEVEL=INFO
CORS_ORIGIN=https://your-frontend-domain.com
```

### 3.2 Configuração do TypeORM

```typescript
// src/data-source.ts
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  
  // Configurações de Produção
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  
  // Otimizações
  entities: [User, Task, Pomodoro, Flower, Garden, LumiMemory],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
```

### 3.3 Configuração do Express

```typescript
// src/app.ts
const app = express();

// Middlewares de Segurança
app.use(helmet({
  contentSecurityPolicy: false,
  xFrameOptions: { action: 'deny' }
}));

// CORS configurado por ambiente
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : true,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Headers de segurança customizados
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

## 4. Modelos de Dados

### 4.1 Entidade User

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  password: string; // Hash bcrypt

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => Task, task => task.user, { cascade: true })
  tasks: Task[];

  @OneToMany(() => Pomodoro, pomodoro => pomodoro.user)
  pomodoros: Pomodoro[];

  @OneToOne(() => Garden, garden => garden.user, { cascade: true })
  garden: Garden;

  @OneToMany(() => Flower, flower => flower.user)
  flowers: Flower[];

  @OneToOne(() => LumiMemory, memory => memory.user, { cascade: true })
  lumiMemory: LumiMemory;
}
```

### 4.2 Entidade Task

```typescript
@Entity()
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  status: TaskStatus;

  @Column({
    type: "enum", 
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @Column({ type: "timestamp", nullable: true })
  dueDate?: Date;

  @Column({ type: "int", default: 1 })
  estimatedPomodoros: number;

  @Column({ type: "int", default: 0 })
  completedPomodoros: number;

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User, user => user.tasks, { onDelete: "CASCADE" })
  user: User;

  @OneToMany(() => Pomodoro, pomodoro => pomodoro.task, { cascade: true })
  pomodoros: Pomodoro[];

  @OneToMany(() => Flower, flower => flower.task)
  flowers: Flower[];
}

// Enums
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress", 
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}
```

### 4.3 Sistema de Gamificação

#### Garden (Jardim do Usuário)
```typescript
@Entity()
export class Garden {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int", default: 0 })
  totalFlowers: number;

  @Column({ type: "int", default: 0 })
  greenFlowers: number; // Tarefas baixa prioridade

  @Column({ type: "int", default: 0 })
  orangeFlowers: number; // Tarefas média prioridade

  @Column({ type: "int", default: 0 })
  redFlowers: number; // Tarefas alta prioridade

  @Column({ type: "int", default: 0 })
  rareFlowers: number; // Flores especiais

  @Column({ type: "int", default: 0 })
  consecutiveHighPriorityPomodoros: number;

  @OneToOne(() => User, user => user.garden)
  @JoinColumn()
  user: User;
}
```

#### Flower (Flores Conquistadas)
```typescript
@Entity()
export class Flower {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: FlowerType,
    default: FlowerType.COMMON
  })
  type: FlowerType;

  @Column({
    type: "enum",
    enum: FlowerColor
  })
  color: FlowerColor;

  @Column({ length: 255, nullable: true })
  earnedFromTaskTitle?: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relacionamentos
  @ManyToOne(() => User, user => user.flowers)
  user: User;

  @ManyToOne(() => Task, task => task.flowers, { nullable: true })
  task?: Task;
}

export enum FlowerType {
  COMMON = "common",
  RARE = "rare"
}

export enum FlowerColor {
  GREEN = "green",   // Baixa prioridade
  ORANGE = "orange", // Média prioridade
  RED = "red",       // Alta prioridade
  PURPLE = "purple"  // Flores raras
}
```

### 4.4 Sistema Lumi (IA)

```typescript
@Entity()
export class LumiMemory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Perfil de Personalidade
  @Column({ type: "json", default: {} })
  personalityProfile: {
    userPreferences: string[];
    communicationStyle: string;
    motivationTriggers: string[];
    goals: string[];
    challenges: string[];
  };

  // Padrões de Comportamento
  @Column({ type: "json", default: {} })
  behaviorPatterns: {
    mostProductiveHours: number[];
    averageTaskDuration: number;
    preferredTaskTypes: string[];
    procrastinationTriggers: string[];
    completionRate: number;
  };

  // Histórico de Conversações
  @Column({ type: "json", default: [] })
  conversationHistory: ConversationEntry[];

  // Sistema de Conquistas
  @Column({ type: "json", default: {} })
  achievements: {
    totalTasksCompleted: number;
    longestStreak: number;
    currentStreak: number;
    favoriteFlowerColors: string[];
    milestones: string[];
  };

  // Memória Contextual
  @Column({ type: "json", default: {} })
  contextualMemory: {
    recentTasks: any[];
    recentFlowers: any[];
    recentInterruptions: any[];
    lastInteraction: Date;
    currentFocus: string;
  };

  @Column({ type: "text", default: "Olá! Sou a Lumi, sua assistente de produtividade." })
  personalNotes: string;

  @Column({
    type: "enum",
    enum: LumiMoodType,
    default: LumiMoodType.ENCOURAGING
  })
  currentMood: LumiMoodType;

  @Column({ type: "int", default: 0 })
  interactionCount: number;

  @Column({ type: "int", default: 0 })
  helpfulnessScore: number;

  @OneToOne(() => User, user => user.lumiMemory)
  @JoinColumn()
  user: User;
}

export enum LumiMoodType {
  ENCOURAGING = "encouraging",
  CELEBRATORY = "celebratory", 
  MOTIVATIONAL = "motivational",
  SUPPORTIVE = "supportive",
  ANALYTICAL = "analytical"
}
```

---

## 5. Serviços e Lógica de Negócio

### 5.1 TaskService

#### Funcionalidades Core
```typescript
export class TaskService {
  private taskRepository: Repository<Task>;

  // CRUD Operations
  async create(taskData: CreateTaskDTO): Promise<Task>
  async findAll(userId: string): Promise<Task[]>
  async findById(id: string): Promise<Task | null>
  async update(id: string, updateData: UpdateTaskDTO): Promise<Task>
  async delete(id: string): Promise<void>

  // Business Logic
  async markAsCompleted(id: string): Promise<Task>
  async updateCompletedPomodoros(id: string, count: number): Promise<Task>
  async findByStatus(userId: string, status: TaskStatus): Promise<Task[]>
}
```

#### Implementação com Otimizações
```typescript
async findAll(userId: string): Promise<Task[]> {
  return this.taskRepository.find({
    where: { user: { id: userId } },
    // Otimização: selecionar apenas campos necessários
    select: [
      "id", "title", "description", "status", "priority",
      "estimatedPomodoros", "completedPomodoros", 
      "dueDate", "completedAt", "createdAt", "updatedAt"
    ],
    order: { updatedAt: "DESC" }
  });
}

// Exclusão em cascata para resolver FK constraints
async delete(id: string): Promise<void> {
  const queryRunner = this.taskRepository.manager.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const task = await queryRunner.manager.findOne(Task, {
      where: { id },
      relations: ["pomodoros", "flowers"]
    });

    if (!task) throw new Error("Task not found");

    // Deletar pomodoros relacionados
    if (task.pomodoros?.length > 0) {
      await queryRunner.manager.delete(Pomodoro, 
        task.pomodoros.map(p => p.id)
      );
    }

    // Deletar flores relacionadas  
    if (task.flowers?.length > 0) {
      await queryRunner.manager.delete(Flower,
        task.flowers.map(f => f.id)
      );
    }

    // Deletar a tarefa
    await queryRunner.manager.delete(Task, id);
    
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### 5.2 PomodoroService

```typescript
export class PomodoroService {
  private pomodoroRepository: Repository<Pomodoro>;

  async create(pomodoroData: CreatePomodoroDTO): Promise<Pomodoro>
  async start(id: string): Promise<Pomodoro>
  async complete(id: string, userId: string): Promise<Pomodoro>
  async interrupt(id: string, notes?: string): Promise<Pomodoro>

  // Integração com sistema de gamificação
  async complete(id: string, userId: string): Promise<Pomodoro> {
    const pomodoro = await this.findById(id);
    if (!pomodoro) throw new Error("Pomodoro not found");

    pomodoro.endTime = new Date();
    pomodoro.status = PomodoroStatus.COMPLETED;
    
    const savedPomodoro = await this.pomodoroRepository.save(pomodoro);
    
    // Atualizar contador na tarefa
    if (pomodoro.task) {
      await this.taskService.updateCompletedPomodoros(
        pomodoro.task.id, 
        (pomodoro.task.completedPomodoros || 0) + 1
      );

      // Trigger criação de flor (gamificação)
      try {
        await this.flowerService.createFlowerForPomodoroCompletion(
          userId, 
          pomodoro.task.id
        );
      } catch (error) {
        logger.error('Erro ao criar flor para pomodoro:', error);
      }
    }
    
    return savedPomodoro;
  }
}
```

### 5.3 FlowerService (Gamificação)

```typescript
export class FlowerService {
  // Criação de flores por conclusão de pomodoro
  async createFlowerForPomodoroCompletion(
    userId: string, 
    taskId: string
  ): Promise<Flower | null> {
    const task = await this.getTaskWithUser(taskId);
    if (!task) return null;

    const garden = await this.getOrCreateGarden(userId);
    const flowerColor = this.getFlowerColorByPriority(task.priority);

    // Lógica para flores raras
    let flowerType = FlowerType.COMMON;
    let finalColor = flowerColor;

    const shouldCreateRareFlower = await this.checkForRareFlower(
      userId, 
      flowerColor
    );
    
    if (shouldCreateRareFlower || garden.consecutiveHighPriorityPomodoros >= 3) {
      flowerType = FlowerType.RARE;
      finalColor = FlowerColor.PURPLE;
      garden.rareFlowers += 1;
      garden.consecutiveHighPriorityPomodoros = 0;
    } else {
      this.updateGardenFlowerCount(garden, flowerColor);
    }

    garden.totalFlowers += 1;
    await this.gardenRepository.save(garden);

    const flower = this.flowerRepository.create({
      type: flowerType,
      color: finalColor,
      earnedFromTaskTitle: task.title,
      user: { id: userId } as User,
      task: { id: taskId } as Task,
    });
    
    return this.flowerRepository.save(flower);
  }

  // Algoritmo para flores raras
  private async checkForRareFlower(
    userId: string, 
    flowerColor: FlowerColor
  ): Promise<boolean> {
    // 3 flores vermelhas consecutivas = flor rara
    if (flowerColor === FlowerColor.RED) {
      const recentFlowers = await this.flowerRepository.find({
        where: { user: { id: userId } },
        select: ["color"],
        order: { createdAt: "DESC" },
        take: 3,
      });

      if (recentFlowers.length >= 3 && 
          recentFlowers.every(f => f.color === FlowerColor.RED)) {
        return true;
      }
    }

    // 10% chance para primeira flor do dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const flowersToday = await this.flowerRepository.count({
      where: {
        user: { id: userId },
        createdAt: MoreThanOrEqual(today)
      }
    });

    return flowersToday === 0 && Math.random() < 0.1;
  }
}
```

---

## 6. Sistema de Autenticação

### 6.1 Middleware de Autenticação

```typescript
// src/middleware/auth.ts
export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      message: 'Token de acesso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Verificar se usuário ainda existe
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { id: decoded.userId } 
    });
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Usuário não encontrado' 
      });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: 'Token expirado', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Token inválido', 
        code: 'INVALID_TOKEN' 
      });
    }

    logger.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
};
```

### 6.2 UserService - Autenticação

```typescript
export class UserService {
  async register(userData: RegisterDTO): Promise<{ user: User; token: string }> {
    // Validação de senha
    if (userData.password.length < 8) {
      throw new Error('Senha deve ter pelo menos 8 caracteres');
    }

    // Hash da senha com bcrypt (12 rounds para produção)
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const user = this.userRepository.create({
      email: userData.email,
      name: userData.name,
      password: hashedPassword
    });

    const savedUser = await this.userRepository.save(user);
    const token = this.generateToken(savedUser);

    // Remover senha do objeto retornado
    const { password, ...userWithoutPassword } = savedUser;
    
    return { user: userWithoutPassword as User, token };
  }

  async login(credentials: LoginDTO): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({
      where: { email: credentials.email }
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const validPassword = await bcrypt.compare(
      credentials.password, 
      user.password
    );

    if (!validPassword) {
      throw new Error('Credenciais inválidas');
    }

    const token = this.generateToken(user);
    const { password, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword as User, token };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '24h',
        issuer: 'toivo-backend',
        audience: 'toivo-frontend'
      }
    );
  }
}
```

---

## 7. Sistema Lumi (IA)

### 7.1 Arquitetura do Lumi

```typescript
export class LumiService {
  // Criar ou obter memória do usuário
  async getOrCreateLumiMemory(userId: string): Promise<LumiMemory>
  
  // Executar ações (criar, atualizar, deletar tarefas)
  async executeLumiAction(userId: string, action: LumiActionData): Promise<LumiActionResult>
  
  // Comunicação com backend de IA
  async sendToLumiAI(request: LumiAIRequest): Promise<LumiAIResponse>
  
  // Obter contexto completo do usuário
  async getFullUserContext(userId: string): Promise<LumiContextData>
}
```

### 7.2 Contexto de Usuário

```typescript
async getFullUserContext(userId: string): Promise<LumiContextData> {
  // Otimização: executar queries em paralelo
  const [user, recentTasks, recentFlowers, memory] = await Promise.all([
    this.userRepository.findOne({
      where: { id: userId },
      relations: ["garden"],
      select: ["id", "name", "email", "createdAt"]
    }),
    this.taskRepository.find({
      where: { user: { id: userId } },
      select: ["id", "title", "status", "priority", "completedAt"],
      order: { updatedAt: "DESC" },
      take: 10
    }),
    this.flowerRepository.find({
      where: { user: { id: userId } },
      select: ["id", "color", "type", "createdAt"],
      order: { createdAt: "DESC" },
      take: 5
    }),
    this.getOrCreateLumiMemory(userId)
  ]);

  const completedTasks = recentTasks.filter(task => task.status === "completed");
  const completionRate = recentTasks.length > 0 ? 
    (completedTasks.length / recentTasks.length) * 100 : 0;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      memberSince: user.createdAt
    },
    recentTasks: recentTasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      completedAt: task.completedAt
    })),
    garden: {
      totalFlowers: user.garden?.totalFlowers || 0,
      recentFlowers: recentFlowers.map(flower => ({
        color: flower.color,
        type: flower.type,
        earnedAt: flower.createdAt
      }))
    },
    statistics: {
      totalTasksCompleted: completedTasks.length,
      currentStreak: memory.achievements.currentStreak,
      averageCompletionRate: completionRate,
      mostProductiveTimeOfDay: this.calculateMostProductiveTime(recentTasks)
    },
    conversationHistory: memory.conversationHistory.slice(-5)
  };
}
```

### 7.3 Ações do Lumi

```typescript
async executeLumiAction(
  userId: string, 
  action: LumiActionData
): Promise<LumiActionResult> {
  try {
    switch (action.type) {
      case 'create':
        const newTask = await this.taskService.create({
          title: action.taskData.title,
          description: action.taskData.description || '',
          priority: action.taskData.priority,
          estimatedPomodoros: action.taskData.estimatedPomodoros || 1,
          user: { id: userId } as User
        });

        await this.updateLumiMemoryWithAction(userId, 'task_created', { 
          taskId: newTask.id 
        });
        
        return {
          success: true,
          message: "Tarefa criada com sucesso",
          data: newTask
        };

      case 'start_pomodoro':
        const pomodoro = await this.pomodoroService.create({
          taskId: action.taskId,
          duration: action.pomodoroData?.duration || 25 * 60,
          notes: action.pomodoroData?.notes || ''
        });

        await this.pomodoroService.start(pomodoro.id);
        
        await this.updateLumiMemoryWithAction(userId, 'pomodoro_started', {
          taskId: action.taskId,
          pomodoroId: pomodoro.id
        });
        
        return {
          success: true,
          message: "Pomodoro iniciado com sucesso",
          data: pomodoro
        };

      // ... outros casos
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao executar ação: ${error.message}`
    };
  }
}
```

### 7.4 Comunicação com IA Externa

```typescript
async sendToLumiAI(request: LumiAIRequest): Promise<LumiAIResponse> {
  const lumiUrl = this.getLumiAIUrl();
  
  // Resposta de fallback para desenvolvimento
  const fallbackResponse: LumiAIResponse = {
    response: this.generateFallbackResponse(request.message, request.action),
    mood: "encouraging",
    suggestions: this.generateFallbackSuggestions(request.context)
  };

  try {
    const response = await fetch(`${lumiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (response.ok) {
      const aiResponse = await response.json();
      
      await this.updateLumiMemoryWithAction(request.userId, 'ai_interaction', {
        message: request.message,
        response: aiResponse.response
      });
      
      return aiResponse;
    }
  } catch (networkError) {
    logger.warn('Backend de IA não disponível, usando fallback:', networkError.message);
  }

  // Usar fallback e registrar interação
  await this.updateLumiMemoryWithAction(request.userId, 'ai_interaction', {
    message: request.message,
    response: fallbackResponse.response
  });

  return fallbackResponse;
}
```

---

## 8. Sistema de Gamificação

### 8.1 Algoritmo de Flores

#### Cores por Prioridade
```typescript
private getFlowerColorByPriority(priority: TaskPriority): FlowerColor {
  switch (priority) {
    case TaskPriority.LOW:    return FlowerColor.GREEN;
    case TaskPriority.MEDIUM: return FlowerColor.ORANGE;
    case TaskPriority.HIGH:   return FlowerColor.RED;
    default:                  return FlowerColor.GREEN;
  }
}
```

#### Flores Raras
```typescript
private async checkForRareFlower(
  userId: string, 
  flowerColor: FlowerColor
): Promise<boolean> {
  // Regra 1: 3 flores vermelhas consecutivas
  if (flowerColor === FlowerColor.RED) {
    const last3Flowers = await this.flowerRepository.find({
      where: { user: { id: userId } },
      select: ["color"],
      order: { createdAt: "DESC" },
      take: 3
    });

    if (last3Flowers.length >= 3 && 
        last3Flowers.every(f => f.color === FlowerColor.RED)) {
      return true;
    }
  }

  // Regra 2: 10% chance para primeira flor do dia
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const flowersToday = await this.flowerRepository.count({
    where: {
      user: { id: userId },
      createdAt: MoreThanOrEqual(today)
    }
  });

  return flowersToday === 0 && Math.random() < 0.1;
}
```

### 8.2 Estatísticas do Jardim

```typescript
async getGardenStats(userId: string): Promise<GardenStats> {
  // Query otimizada com agregação SQL
  const stats = await this.flowerRepository
    .createQueryBuilder("flower")
    .select([
      "COUNT(*) as totalFlowers",
      "SUM(CASE WHEN flower.color = 'GREEN' THEN 1 ELSE 0 END) as greenFlowers",
      "SUM(CASE WHEN flower.color = 'ORANGE' THEN 1 ELSE 0 END) as orangeFlowers",
      "SUM(CASE WHEN flower.color = 'RED' THEN 1 ELSE 0 END) as redFlowers",
      "SUM(CASE WHEN flower.color = 'PURPLE' THEN 1 ELSE 0 END) as purpleFlowers",
      "SUM(CASE WHEN flower.type = 'RARE' THEN 1 ELSE 0 END) as rareFlowersCount"
    ])
    .where("flower.user.id = :userId", { userId })
    .getRawOne();

  return {
    totalFlowers: parseInt(stats.totalFlowers) || 0,
    flowersByType: {
      GREEN: parseInt(stats.greenFlowers) || 0,
      ORANGE: parseInt(stats.orangeFlowers) || 0,
      RED: parseInt(stats.redFlowers) || 0,
      PURPLE: parseInt(stats.purpleFlowers) || 0,
    },
    rareFlowersCount: parseInt(stats.rareFlowersCount) || 0,
    totalPomodorosCompleted: parseInt(stats.totalFlowers) || 0
  };
}
```

---

## 9. Performance e Otimizações

### 9.1 Otimizações de Query

#### Seleção de Campos Específicos
```typescript
// ❌ Antes: carrega todos os campos
const tasks = await this.taskRepository.find({
  where: { user: { id: userId } }
});

// ✅ Depois: carrega apenas campos necessários
const tasks = await this.taskRepository.find({
  where: { user: { id: userId } },
  select: ["id", "title", "status", "priority", "updatedAt"],
  order: { updatedAt: "DESC" }
});
```

#### Queries Paralelas
```typescript
// ❌ Antes: queries sequenciais
const user = await this.userRepository.findOne({ where: { id: userId } });
const tasks = await this.taskRepository.find({ where: { user: { id: userId } } });
const flowers = await this.flowerRepository.find({ where: { user: { id: userId } } });

// ✅ Depois: queries paralelas
const [user, tasks, flowers] = await Promise.all([
  this.userRepository.findOne({ where: { id: userId } }),
  this.taskRepository.find({ where: { user: { id: userId } } }),
  this.flowerRepository.find({ where: { user: { id: userId } } })
]);
```

#### Agregação SQL
```typescript
// ❌ Antes: buscar todas as flores e contar no JavaScript
const flowers = await this.flowerRepository.find({
  where: { user: { id: userId } }
});
const greenCount = flowers.filter(f => f.color === 'GREEN').length;

// ✅ Depois: agregação direto no SQL
const stats = await this.flowerRepository
  .createQueryBuilder("flower")
  .select("SUM(CASE WHEN flower.color = 'GREEN' THEN 1 ELSE 0 END)", "greenFlowers")
  .where("flower.user.id = :userId", { userId })
  .getRawOne();
```

### 9.2 Connection Pooling

```typescript
// src/data-source.ts
export const AppDataSource = new DataSource({
  // ... outras configurações
  
  // Pool de conexões otimizado
  extra: {
    connectionLimit: 10,        // Máximo de conexões
    acquireTimeout: 60000,      // Timeout para obter conexão
    timeout: 60000,             // Timeout de query
    reconnect: true,            // Reconectar automaticamente
    pool: {
      min: 2,                   // Mínimo de conexões
      max: 10                   // Máximo de conexões
    }
  }
});
```

### 9.3 Caching (Futuro)

```typescript
// Exemplo de implementação futura com Redis
class CacheService {
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 10. Logging e Monitoramento

### 10.1 Sistema de Logging

```typescript
// src/utils/logger.ts
export class Logger {
  private formatLog(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const formattedMeta = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedMeta}`;
  }

  error(message: string, meta?: any): void {
    const formattedLog = this.formatLog('ERROR', message, meta);
    
    if (process.env.NODE_ENV === 'production') {
      console.error(formattedLog);
      // Em produção, pode integrar com serviços como Sentry
    } else {
      console.error(`🔴 ${formattedLog}`);
    }
  }

  warn(message: string, meta?: any): void {
    const formattedLog = this.formatLog('WARN', message, meta);
    
    if (process.env.NODE_ENV === 'production') {
      console.warn(formattedLog);
    } else {
      console.warn(`🟡 ${formattedLog}`);
    }
  }

  info(message: string, meta?: any): void {
    const formattedLog = this.formatLog('INFO', message, meta);
    
    if (process.env.NODE_ENV === 'production') {
      console.log(formattedLog);
    } else {
      console.log(`🔵 ${formattedLog}`);
    }
  }
}

export const logger = new Logger();
```

### 10.2 Error Handling Global

```typescript
// src/app.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
});
```

### 10.3 Health Check

```typescript
// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Verificar conexão com banco
    await AppDataSource.query('SELECT 1');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'connected',
        type: 'postgresql'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});
```

---

## 11. Segurança

### 11.1 Headers de Segurança

```typescript
// src/app.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  xXssProtection: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Headers customizados adicionais
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### 11.2 CORS Configurado

```typescript
const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // Em produção, permitir apenas origens específicas
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por política CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));
```

### 11.3 Validação de Input

```typescript
// Exemplo com class-validator
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class CreateTaskDTO {
  @IsString()
  @MinLength(1, { message: 'Título é obrigatório' })
  title: string;

  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsNumber()
  @Min(1)
  estimatedPomodoros: number;
}

// Middleware de validação
export const validateDTO = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToClass(dtoClass, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errorMessages
      });
    }

    req.body = dto;
    next();
  };
};
```

### 11.4 Rate Limiting (Futuro)

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiting para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por IP por minuto
  message: {
    error: 'Muitas requisições. Tente novamente em 1 minuto.'
  }
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);
```

---

## 12. Deploy e Produção

### 12.1 Configuração Railway

#### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

#### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]  
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### 12.2 Environment Variables

#### Obrigatórias em Produção
```bash
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_required
BCRYPT_ROUNDS=12
DATABASE_URL=postgresql://... # Railway fornece automaticamente
```

#### Opcionais
```bash
CORS_ORIGIN=https://your-frontend-domain.com
LUMI_AI_URL=https://your-ai-backend.com
LOG_LEVEL=INFO
```

### 12.3 Scripts de Validação

#### Validação de Produção
```typescript
// scripts/validate-production.ts
const validations = [
  {
    name: "Node.js engine",
    check: () => packageJson.engines?.node !== undefined,
    message: "Versão do Node.js especificada no package.json"
  },
  {
    name: "Build script",
    check: () => packageJson.scripts?.build !== undefined,
    message: "Script de build definido"
  },
  {
    name: "Start script", 
    check: () => packageJson.scripts?.start !== undefined,
    message: "Script de start definido"
  },
  {
    name: "Production dependencies",
    check: () => {
      const prodDeps = ['express', 'typeorm', 'pg', 'bcryptjs', 'jsonwebtoken'];
      return prodDeps.every(dep => packageJson.dependencies?.[dep]);
    },
    message: "Dependências de produção instaladas"
  }
];

// Executar validações
const results = validations.map(validation => ({
  ...validation,
  passed: validation.check()
}));

const passedCount = results.filter(r => r.passed).length;
const successRate = (passedCount / results.length) * 100;

console.log(`🎯 TAXA DE SUCESSO: ${successRate.toFixed(1)}%`);

if (successRate === 100) {
  console.log('🎉 Projeto 100% pronto para produção!');
} else {
  console.log('⚠️ Corrija os problemas antes do deploy');
  process.exit(1);
}
```

### 12.4 Checklist de Deploy

#### Pré-Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] `npm run production:validate` passou
- [ ] `npm run build` executou sem erros
- [ ] Testes automatizados passando
- [ ] Logs de desenvolvimento removidos

#### Deploy
- [ ] Código commitado e pushed para main
- [ ] Deploy automatizado disparado no Railway
- [ ] Health check respondendo `/health`
- [ ] Monitoramento configurado

#### Pós-Deploy
- [ ] Funcionalidades básicas testadas
- [ ] Performance monitorada
- [ ] Logs sendo coletados corretamente
- [ ] Backup de banco configurado

---

## 🎯 Conclusão

O Toivo Backend foi arquitetado com foco em **escalabilidade**, **performance** e **maintainability**. A separação clara de responsabilidades, uso de padrões estabelecidos e otimizações específicas garantem que o sistema possa crescer e evoluir mantendo qualidade de código e performance.

### Principais Destaques Técnicos:

1. **Arquitetura Limpa**: Separação de camadas bem definida
2. **Performance**: Queries otimizadas e uso de agregação SQL
3. **Segurança**: Headers, autenticação robusta e validação de dados
4. **Observabilidade**: Sistema de logging estruturado e health checks
5. **Gamificação**: Sistema inovador de flores e jardim virtual
6. **IA Integrada**: Assistente Lumi com contexto e memória
7. **Production Ready**: Configuração completa para deploy

O sistema está preparado para escalar e pode facilmente incorporar novas funcionalidades como notificações push, integração com calendários, analytics avançados e muito mais.
