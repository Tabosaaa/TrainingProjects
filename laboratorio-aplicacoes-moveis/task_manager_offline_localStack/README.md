# 📱 Task Manager Offline-First

Um aplicativo Flutter demonstrando arquitetura **Offline-First** com sincronização automática e resolução de conflitos.

---

## 🎯 Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| ✅ **Persistência Local** | SQLite para armazenamento offline |
| ✅ **Detector de Conectividade** | Indicadores visuais Online/Offline |
| ✅ **Fila de Sincronização** | Queue de operações pendentes |
| ✅ **Resolução de Conflitos** | Last-Write-Wins (LWW) |
| ✅ **Sync Automático** | Sincroniza ao recuperar conexão |
| ✅ **Ícones de Status** | Visualização clara do estado de sync |

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências Flutter
flutter pub get

# 2. Iniciar servidor API (Terminal 1)
cd server && npm install && npm start

# 3. Rodar o app (Terminal 2)
flutter run
```

📖 Veja [INICIO_RAPIDO.md](./INICIO_RAPIDO.md) para instruções detalhadas.

---

## 🎬 Demonstração

O roteiro completo para demonstração em sala de aula está em [DEMONSTRACAO.md](./DEMONSTRACAO.md), incluindo:

1. **Prova de Vida Offline** - Criar/editar sem internet
2. **Persistência** - Fechar e reabrir o app
3. **Sincronização** - Recuperar conexão
4. **Conflitos** - Simulação de LWW

---

## 📊 Arquitetura

### Frontend (Flutter)

```
┌─────────────────────────────────────────────────────────────┐
│                         Flutter App                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │  UI/     │ ←→ │  TaskProvider │ ←→ │   SyncService      │ │
│  │  Screens │    │  (State)     │    │   (Motor Sync)     │ │
│  └──────────┘    └──────────────┘    └────────────────────┘ │
│                                               │              │
│                         ┌─────────────────────┼──────────┐   │
│                         │                     │          │   │
│              ┌──────────▼────┐    ┌──────────▼────────┐  │   │
│              │ DatabaseService│    │ ConnectivityService│ │   │
│              │ (SQLite)      │    │ (Network Monitor) │  │   │
│              └───────────────┘    └───────────────────┘  │   │
│                         │                     │          │   │
│                         └─────────────────────┼──────────┘   │
│                                               │              │
│                                    ┌──────────▼────────┐     │
│                                    │   ApiService      │     │
│                                    │   (HTTP Client)   │     │
│                                    └───────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Backend (Node.js - MVC)

```
server/
├── src/
│   ├── server.js              # Entry point
│   ├── app.js                 # Configuração Express
│   ├── config/
│   │   └── database.js        # Configuração SQLite
│   ├── models/
│   │   └── Task.js            # Model de Tarefa
│   ├── controllers/
│   │   ├── healthController.js
│   │   ├── taskController.js
│   │   └── syncController.js
│   └── routes/
│       ├── healthRoutes.js
│       ├── taskRoutes.js
│       └── syncRoutes.js
└── data/
    └── tasks.db               # Banco SQLite (criado automaticamente)
```

---

## 🗄️ Estrutura de Dados

### Tabela `tasks` (Flutter - SQLite local)
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  syncStatus TEXT NOT NULL,    -- synced, pending, conflict, error
  localUpdatedAt INTEGER        -- para LWW
);
```

### Tabela `sync_queue` (Flutter - SQLite local)
```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,          -- create, update, delete
  taskId TEXT NOT NULL,
  data TEXT NOT NULL,          -- JSON serializado
  timestamp INTEGER NOT NULL,
  retries INTEGER DEFAULT 0,
  status TEXT NOT NULL,        -- pending, processing, completed, failed
  error TEXT
);
```

---

## 🔄 Fluxo de Sincronização

### Criação de Tarefa (Offline-First)

```
1. Usuário cria tarefa
          │
          ▼
2. Salva no SQLite local
   syncStatus = "pending"
          │
          ▼
3. Adiciona à sync_queue
   type = "create"
          │
          ▼
4. Se ONLINE:
   └── Envia para API
       └── Atualiza syncStatus = "synced"
   
   Se OFFLINE:
   └── Fica na fila
   └── UI mostra ícone "pendente"
```

### Resolução de Conflitos (LWW)

```
Conflito detectado no UPDATE:
          │
          ▼
Comparar timestamps:
          │
          ├── localUpdatedAt > serverUpdatedAt
          │   └── Versão LOCAL vence
          │       └── Envia local para servidor
          │
          └── serverUpdatedAt > localUpdatedAt
              └── Versão SERVIDOR vence
                  └── Sobrescreve local
```

---

## 📝 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | Lista tarefas (com modifiedSince) |
| POST | `/api/tasks` | Criar tarefa |
| PUT | `/api/tasks/:id` | Atualizar tarefa |
| DELETE | `/api/tasks/:id` | Deletar tarefa |
| POST | `/api/sync/batch` | Sync em lote |

---

## 📦 Tecnologias

### Frontend (Flutter)

| Pacote | Versão | Uso |
|--------|--------|-----|
| `sqflite` | ^2.3.0 | Banco SQLite local |
| `connectivity_plus` | ^5.0.0 | Detecção de rede |
| `provider` | ^6.1.0 | Gerenciamento de estado |
| `http` | ^1.1.0 | Cliente HTTP |
| `uuid` | ^4.0.0 | Geração de IDs únicos |

### Backend (Node.js)

| Pacote | Uso |
|--------|-----|
| `express` | Framework web |
| `cors` | CORS middleware |
| `uuid` | Geração de IDs |
| `sql.js` | SQLite em JavaScript |

---

## 🎓 Contexto Acadêmico

Este projeto foi desenvolvido como parte do laboratório de **Aplicações Móveis** para demonstrar:

- Arquitetura Offline-First
- Persistência local com SQLite
- Sincronização bidirecional
- Resolução de conflitos (Last-Write-Wins)
- Experiência do usuário offline
- Arquitetura MVC no backend

---

## 📄 Licença

Projeto acadêmico - Uso educacional
