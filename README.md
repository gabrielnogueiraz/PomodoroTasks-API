# PomodoroTasks API

Um sistema backend para gerenciar tarefas e sessões Pomodoro, desenvolvido para ajudar no controle de foco, produtividade e rastreamento de compromissos.

## 📌 Visão Geral

Este projeto implementa uma API RESTful para gerenciar tarefas e sessões Pomodoro. O sistema permite:

- 📋 Criar, editar, listar e excluir tarefas
- ⏳ Iniciar, interromper e completar sessões Pomodoro
- 🔗 Associar sessões Pomodoro a tarefas específicas
- 📊 Acompanhar o progresso e estatísticas de produtividade

## 🛠 Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript
- **TypeScript**: Superset tipado de JavaScript
- **Express**: Framework web para Node.js
- **TypeORM**: ORM (Object-Relational Mapping) para bancos de dados
- **SQLite**: Banco de dados leve e embarcado
- **Jest**: Framework de testes

## 📋 Pré-requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (normalmente vem com o Node.js)

## 🚀 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/pomodoroTasks-backend.git
cd pomodoroTasks-backend
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
DATABASE_URL="file:./database.sqlite"
PORT=8080
```

4. Crie a pasta para o banco de dados e execute as migrações:

```bash
npx typeorm migration:run
```

## 🎯 Executando o Projeto

### 🔥 Modo Desenvolvimento

Para executar o projeto em modo de desenvolvimento com hot reload:

```bash
npm run dev
```

O servidor estará disponível em **http://localhost:3000**

### 📦 Build e Produção

Para compilar o projeto e executá-lo em modo de produção:

```bash
npm run build
npm start
```

## 📂 Estrutura do Projeto

### **📝 Entidades**

#### **Task (Tarefa)**

Representa uma tarefa que precisa ser realizada.

**Atributos:**
- `id`: Identificador único (UUID)
- `title`: Título da tarefa
- `description`: Descrição detalhada (opcional)
- `status`: Estado atual (`pending`, `in_progress`, `completed`, `cancelled`)
- `priority`: Prioridade (`low`, `medium`, `high`)
- `dueDate`: Data limite (opcional)
- `estimatedPomodoros`: Número estimado de pomodoros para conclusão
- `completedPomodoros`: Número de pomodoros concluídos para esta tarefa
- `createdAt`: Data de criação
- `updatedAt`: Data da última atualização

#### **Pomodoro**

Representa uma sessão de foco usando a técnica Pomodoro.

**Atributos:**
- `id`: Identificador único (UUID)
- `duration`: Duração em segundos (padrão: 25 minutos)
- `startTime`: Momento de início da sessão
- `endTime`: Momento de término da sessão
- `status`: Estado (`in_progress`, `completed`, `interrupted`)
- `notes`: Anotações sobre a sessão (opcional)
- `task`: Relação com a tarefa associada
- `createdAt`: Data de criação

## 📡 API Endpoints

### **📝 Tarefas**

| Método  | Endpoint               | Descrição                              |
|---------|------------------------|----------------------------------------|
| GET     | `/api/tasks`           | Lista todas as tarefas                |
| GET     | `/api/tasks?status=pending` | Lista tarefas filtradas por status    |
| GET     | `/api/tasks/:id`       | Obtém detalhes de uma tarefa específica |
| POST    | `/api/tasks`           | Cria uma nova tarefa                  |
| PUT     | `/api/tasks/:id`       | Atualiza uma tarefa existente         |
| DELETE  | `/api/tasks/:id`       | Remove uma tarefa                     |
| PATCH   | `/api/tasks/:id/status` | Atualiza apenas o status de uma tarefa |

### **⏳ Pomodoros**

| Método  | Endpoint                     | Descrição                               |
|---------|------------------------------|-----------------------------------------|
| GET     | `/api/pomodoros`             | Lista todos os pomodoros               |
| GET     | `/api/pomodoros?taskId=:taskId` | Lista pomodoros de uma tarefa específica |
| GET     | `/api/pomodoros/:id`         | Obtém detalhes de um pomodoro específico |
| POST    | `/api/pomodoros`             | Cria um novo pomodoro                  |
| POST    | `/api/pomodoros/:id/start`   | Inicia uma sessão pomodoro             |
| POST    | `/api/pomodoros/:id/complete` | Marca uma sessão como concluída        |
| POST    | `/api/pomodoros/:id/interrupt` | Interrompe uma sessão em andamento     |
| POST    | `/api/pomodoros/:id/notes`   | Adiciona anotações a uma sessão        |

## 🔄 Fluxo de Trabalho Típico

1. Criar uma tarefa (**POST `/api/tasks`**)
2. Criar um pomodoro associado à tarefa (**POST `/api/pomodoros`**)
3. Iniciar o pomodoro (**POST `/api/pomodoros/:id/start`**)
4. Quando concluído, marcar como completo (**POST `/api/pomodoros/:id/complete`**)
5. Ou interromper antes de terminar (**POST `/api/pomodoros/:id/interrupt`**)
6. Quando todos os pomodoros estimados forem concluídos, marcar a tarefa como concluída (**PATCH `/api/tasks/:id/status`**)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/nova-feature`)
3. Commit suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

