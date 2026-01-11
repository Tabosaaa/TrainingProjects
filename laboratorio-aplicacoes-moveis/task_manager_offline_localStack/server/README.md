# Task Manager API

API REST para o aplicativo Task Manager Offline-First.

## Arquitetura MVC

```
src/
├── server.js              # Entry point
├── app.js                 # Configuração Express
├── config/
│   └── database.js        # Configuração SQLite
├── models/
│   └── Task.js            # Model de Tarefa
├── controllers/
│   ├── healthController.js
│   ├── taskController.js
│   └── syncController.js
└── routes/
    ├── healthRoutes.js
    ├── taskRoutes.js
    └── syncRoutes.js
```

## Instalação

```bash
npm install
```

## Execução

```bash
npm start
```

Servidor rodará em `http://localhost:3000`

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | Lista tarefas |
| POST | `/api/tasks` | Criar tarefa |
| PUT | `/api/tasks/:id` | Atualizar tarefa |
| DELETE | `/api/tasks/:id` | Deletar tarefa |
| POST | `/api/sync/batch` | Sincronização em lote |

## Banco de Dados

O banco SQLite é armazenado em `data/tasks.db` e é criado automaticamente na primeira execução.

## Query Parameters

### GET /api/tasks

- `userId` - ID do usuário (default: 'user1')
- `modifiedSince` - Timestamp para sync incremental

## Corpo das Requisições

### POST /api/tasks

```json
{
  "title": "Título da tarefa",
  "description": "Descrição opcional",
  "priority": "low|medium|high|urgent",
  "userId": "user1"
}
```

### PUT /api/tasks/:id

```json
{
  "title": "Novo título",
  "description": "Nova descrição",
  "completed": true,
  "priority": "high",
  "version": 1
}
```

### POST /api/sync/batch

```json
{
  "operations": [
    {
      "type": "create",
      "taskId": "uuid",
      "data": { ... }
    },
    {
      "type": "update",
      "taskId": "uuid",
      "data": { ... }
    },
    {
      "type": "delete",
      "taskId": "uuid"
    }
  ]
}
```

## Conflitos

Ao atualizar uma tarefa, se a versão do cliente for menor que a do servidor, retorna status 409 (Conflict) com a tarefa do servidor para resolução LWW.

