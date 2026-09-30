# REST API Contracts: Chess Live

**Base URL**: `http://localhost:8080/api`
**Auth**: Bearer JWT token no header `Authorization: Bearer <token>` (exceto rotas de auth)
**Content-Type**: `application/json`

---

## Auth

### POST /api/auth/register

Cria uma nova conta de usuário.

**Request**:
```json
{
  "username": "jogador123",
  "email": "jogador@example.com",
  "password": "minhasenha123"
}
```

**Response 201 Created**:
```json
{
  "id": "uuid",
  "username": "jogador123",
  "email": "jogador@example.com",
  "rating": 1200,
  "createdAt": "2026-06-11T10:00:00Z"
}
```

**Errors**:
- `400` — validação falhou (email inválido, senha < 8 chars, username vazio)
- `409` — email ou username já existente

---

### POST /api/auth/login

Autentica e retorna JWT.

**Request**:
```json
{
  "email": "jogador@example.com",
  "password": "minhasenha123"
}
```

**Response 200 OK**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 86400,
  "user": {
    "id": "uuid",
    "username": "jogador123",
    "rating": 1200
  }
}
```

**Errors**:
- `401` — credenciais inválidas (mensagem genérica, sem indicar qual campo está errado)

---

### POST /api/auth/logout

Revoga o token atual. Requer autenticação.

**Response 204 No Content**

---

### POST /api/auth/refresh

Renova a sessão (FR-048): troca um token ainda válido por um novo com validade completa.
O token anterior é revogado imediatamente (rotação). Requer autenticação.

**Response 200 OK**: mesmo formato de `POST /api/auth/login`.

**Errors**:
- `401` — token ausente, expirado ou já revogado (exige novo login)

---

## Profile & Ranking

### GET /api/users/{username}

Retorna perfil público de um jogador.

**Response 200 OK**:
```json
{
  "id": "uuid",
  "username": "jogador123",
  "rating": 1250,
  "gamesPlayed": 42,
  "wins": 20,
  "losses": 15,
  "draws": 7,
  "createdAt": "2026-06-11T10:00:00Z"
}
```

**Errors**:
- `404` — usuário não encontrado

---

### GET /api/ranking

Tabela de classificação paginada, ordenada por rating decrescente.

**Query params**: `page` (default 0), `size` (default 50, max 100)

**Response 200 OK**:
```json
{
  "page": 0,
  "size": 50,
  "total": 340,
  "entries": [
    {
      "position": 1,
      "username": "topplayer",
      "rating": 1850,
      "gamesPlayed": 210
    }
  ]
}
```

---

## Game History

### GET /api/games/history

Histórico de partidas do usuário autenticado. Requer autenticação.

**Query params**: `page` (default 0), `size` (default 20, max 50)

**Response 200 OK**:
```json
{
  "page": 0,
  "size": 20,
  "total": 42,
  "games": [
    {
      "id": "uuid",
      "opponent": {
        "username": "adversario",
        "rating": 1230
      },
      "mode": "RANKED",
      "result": "WHITE_WINS",
      "resultReason": "CHECKMATE",
      "playedAs": "WHITE",
      "ratingChange": 12,
      "timeControlSeconds": 600,
      "finishedAt": "2026-06-11T10:30:00Z"
    }
  ]
}
```

---

### GET /api/games/{gameId}

Detalhes de uma partida, incluindo movimentos em PGN. Requer autenticação.

**Response 200 OK**:
```json
{
  "id": "uuid",
  "white": { "username": "jogador123", "rating": 1250 },
  "black": { "username": "adversario", "rating": 1230 },
  "mode": "RANKED",
  "result": "WHITE_WINS",
  "resultReason": "CHECKMATE",
  "timeControlSeconds": 600,
  "pgn": "[Event \"Chess Live\"]\n[White \"jogador123\"]\n...\n1. e4 e5 2. Nf3 Nc6 *",
  "moves": [
    {
      "moveNumber": 1,
      "algebraicNotation": "e4",
      "from": "e2",
      "to": "e4",
      "timeRemainingMs": 598200
    }
  ],
  "startedAt": "2026-06-11T10:00:00Z",
  "finishedAt": "2026-06-11T10:30:00Z"
}
```

**Errors**:
- `404` — partida não encontrada
- `403` — partida não pertence ao usuário autenticado

---

## Bot Game

### POST /api/games/bot

Inicia uma partida contra o bot. Requer autenticação. As jogadas do bot são calculadas
exclusivamente no servidor e publicadas no mesmo tópico WebSocket do modo online.

**Request**:
```json
{
  "color": "WHITE",
  "level": 5
}
```

| Campo | Tipo | Valores |
|---|---|---|
| color | string | `"WHITE"` \| `"BLACK"` — cor das peças do humano |
| level | int | 0–10 (0 = aleatório … 8–10 = Stockfish/adapter com fallback) |

**Response 201 Created**:
```json
{
  "gameId": "uuid",
  "color": "WHITE",
  "opponentUsername": "Bot (nível 5)",
  "opponentRating": 1200,
  "timeControlSeconds": 600,
  "mode": "BOT",
  "botLevel": 5
}
```

Se `color` for `"BLACK"`, o bot (de brancas) faz o primeiro lance automaticamente —
o cliente recebe `BOT_THINKING` e `MOVE_MADE` ao se inscrever em `/topic/game/{gameId}`.

**Errors**:
- `400` — `level` fora de 0–10 ou `color` inválida

---

## Private Room (Invites)

### POST /api/invites

Cria uma sala privada e retorna código de convite. Requer autenticação.

**Request**:
```json
{
  "mode": "CASUAL"
}
```

**Response 201 Created**:
```json
{
  "id": "uuid",
  "code": "X7K3M2PQ",
  "mode": "CASUAL",
  "expiresAt": "2026-06-12T10:00:00Z",
  "createdAt": "2026-06-11T10:00:00Z"
}
```

**Errors**:
- `409` — jogador já tem um convite pendente ativo

---

### GET /api/invites/{code}

Valida um código de convite antes de entrar.

**Response 200 OK**:
```json
{
  "code": "X7K3M2PQ",
  "mode": "CASUAL",
  "createdBy": "jogador123",
  "expiresAt": "2026-06-12T10:00:00Z",
  "valid": true
}
```

**Errors**:
- `404` — código não encontrado
- `410 Gone` — código expirado ou já utilizado

---

### POST /api/invites/{code}/join

Entra na sala privada. Inicia a partida imediatamente. Requer autenticação.

**Response 200 OK**:
```json
{
  "gameId": "uuid",
  "color": "BLACK",
  "opponentUsername": "jogador123",
  "opponentRating": 1250,
  "timeControlSeconds": 600,
  "mode": "CASUAL"
}
```

**Errors**:
- `404` — código não encontrado
- `410 Gone` — código expirado ou já utilizado
- `409` — jogador já está em uma partida ativa

---

### DELETE /api/invites/{code}

Cancela um convite criado pelo usuário autenticado.

**Response 204 No Content**

**Errors**:
- `403` — convite não pertence ao usuário autenticado
- `404` — convite não encontrado

---

## Error Response Format

Todos os erros seguem o formato:

```json
{
  "error": "VALIDATION_FAILED",
  "message": "Descrição legível do erro",
  "timestamp": "2026-06-11T10:00:00Z"
}
```

**Error codes**: `VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `GONE`,
`CONFLICT`, `INTERNAL_ERROR`
