# Data Model: Chess Live

**Feature**: Chess Live | **Date**: 2026-06-11 | **Plan**: [plan.md](plan.md)

---

## Domain Entities (Java — sem dependência de framework)

### Game

Representa uma partida de xadrez (iniciada ou encerrada).

| Campo | Tipo | Restrições |
|---|---|---|
| id | `GameId` (value object sobre UUID) | required, immutable |
| whitePlayer | `Player` | required |
| blackPlayer | `Player` | required |
| mode | `GameMode` (CASUAL \| RANKED) | required |
| timeControlSeconds | int | required; 600 para 10+0 |
| status | `GameStatus` | required; inicial: IN_PROGRESS |
| result | `GameResult` (nullable) | null enquanto em andamento |
| resultReason | `ResultReason` (nullable) | null enquanto em andamento |
| moves | `List<Move>` | ordenada, imutável após jogo |
| startedAt | `Instant` | required |
| finishedAt | `Instant` (nullable) | preenchido ao encerrar |

**GameStatus**: `IN_PROGRESS`, `FINISHED`

**GameMode**: `CASUAL`, `RANKED`, `BOT`

**PlayerType**: `HUMAN`, `BOT` — partidas BOT são sempre HUMAN vs BOT. O bot é representado
pelo usuário de sistema `chessbot` (UUID fixo `0b070000-0000-0000-0000-000000000001`,
criado pela migração `V6__create_bot_user.sql`, hash de senha inválido — não logável).
O `GameSession` em Redis ganha os campos `whitePlayerType`, `blackPlayerType` (default
HUMAN) e `botLevel` (0–10, nullable). Partidas BOT não afetam rating (apenas RANKED).

**GameResult**: `WHITE_WINS`, `BLACK_WINS`, `DRAW`

**ResultReason**: `CHECKMATE`, `TIME_FORFEIT`, `RESIGNATION`, `DRAW_AGREEMENT`, `STALEMATE`,
`THREEFOLD_REPETITION`, `FIFTY_MOVE_RULE`, `INSUFFICIENT_MATERIAL`, `ABANDONMENT`,
`MUTUAL_ABANDONMENT` (empate quando ambos abandonam)

---

### Board

Encapsula o estado do tabuleiro em uma posição.

| Campo | Tipo | Notas |
|---|---|---|
| fen | String | FEN notation da posição atual |
| currentTurn | `Color` (WHITE \| BLACK) | de quem é a vez |
| halfMoveClock | int | contador regra dos 50 movimentos |
| fullMoveNumber | int | número do movimento completo |
| positionHistory | `List<String>` | FEN strings para detecção de repetição |

---

### Move

Representa uma jogada individual dentro de uma partida.

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | gerado pelo sistema |
| gameId | `GameId` | FK para Game |
| playerId | `PlayerId` | quem fez a jogada |
| moveNumber | int | ordem sequencial (1-based) |
| from | String | casa de origem (e.g., "e2") |
| to | String | casa de destino (e.g., "e4") |
| promotionPiece | `PieceType` (nullable) | Q, R, B, N — só para promoções |
| algebraicNotation | String | notação algébrica padrão (e.g., "e4", "Nf3", "O-O") |
| fenAfter | String | FEN após a jogada |
| timeRemainingMs | long | tempo restante do jogador após a jogada |
| timestamp | `Instant` | momento em que a jogada foi confirmada |

---

### Player

| Campo | Tipo | Notas |
|---|---|---|
| id | `PlayerId` (value object sobre UUID) | immutable |
| username | String | único no sistema |
| rating | int | rating Elo atual |

---

### Clock (Domain Service)

Responsável pelo cálculo de tempo restante. Não persiste estado diretamente — lê do `GameSession`
(Redis) e calcula com base em `lastMoveTimestamp`.

**Inputs**: `timeRemainingMs`, `lastMoveTimestamp`, `currentTurn`
**Output**: tempo efetivo restante no momento da consulta

---

### MatchmakingEntry

| Campo | Tipo | Notas |
|---|---|---|
| playerId | `PlayerId` | quem entrou na fila |
| mode | `GameMode` | CASUAL ou RANKED |
| enqueuedAt | `Instant` | timestamp de entrada na fila |

---

## Domain Events

| Evento | Payload | Publicado quando |
|---|---|---|
| `GameStartedEvent` | gameId, whitePlayerId, blackPlayerId, mode | partida iniciada pelo matchmaking ou convite |
| `MoveMadeEvent` | gameId, move, fenAfter, whiteTimeMs, blackTimeMs | jogada validada e aplicada |
| `GameFinishedEvent` | gameId, result, resultReason, pgn | jogo encerrado por qualquer motivo |
| `PlayerDisconnectedEvent` | gameId, playerId, color, disconnectedAt | WebSocket session fechada durante partida |
| `PlayerReconnectedEvent` | gameId, playerId, color | jogador reconectou antes do período de graça |

---

## Persistent Storage: PostgreSQL

### Tabela `users`

| Coluna | Tipo | Constraints |
|---|---|---|
| id | UUID | PK |
| username | VARCHAR(30) | UNIQUE, NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| rating | INTEGER | NOT NULL, DEFAULT 1200 |
| games_played | INTEGER | NOT NULL, DEFAULT 0 |
| wins | INTEGER | NOT NULL, DEFAULT 0 |
| losses | INTEGER | NOT NULL, DEFAULT 0 |
| draws | INTEGER | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Tabela `games`

| Coluna | Tipo | Constraints |
|---|---|---|
| id | UUID | PK |
| white_player_id | UUID | FK → users(id), NOT NULL |
| black_player_id | UUID | FK → users(id), NOT NULL |
| mode | VARCHAR(10) | NOT NULL — 'CASUAL' \| 'RANKED' |
| time_control_seconds | INTEGER | NOT NULL, DEFAULT 600 |
| status | VARCHAR(15) | NOT NULL — 'IN_PROGRESS' \| 'FINISHED' |
| result | VARCHAR(15) | NULLABLE — 'WHITE_WINS' \| 'BLACK_WINS' \| 'DRAW' |
| result_reason | VARCHAR(30) | NULLABLE |
| pgn | TEXT | NULLABLE — preenchido ao encerrar |
| started_at | TIMESTAMPTZ | NULLABLE |
| finished_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Tabela `moves`

| Coluna | Tipo | Constraints |
|---|---|---|
| id | UUID | PK |
| game_id | UUID | FK → games(id), NOT NULL |
| player_id | UUID | FK → users(id), NOT NULL |
| move_number | INTEGER | NOT NULL |
| from_square | VARCHAR(2) | NOT NULL — e.g., "e2" |
| to_square | VARCHAR(2) | NOT NULL — e.g., "e4" |
| promotion_piece | VARCHAR(1) | NULLABLE — "Q", "R", "B", "N" |
| algebraic_notation | VARCHAR(10) | NOT NULL |
| fen_after | TEXT | NOT NULL |
| time_remaining_ms | BIGINT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Index**: `(game_id, move_number)` para leitura ordenada eficiente.

### Tabela `rating_history`

| Coluna | Tipo | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users(id), NOT NULL |
| game_id | UUID | FK → games(id), NOT NULL |
| rating_before | INTEGER | NOT NULL |
| rating_after | INTEGER | NOT NULL |
| rating_change | INTEGER | NOT NULL (positivo, negativo ou zero) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Tabela `game_invites`

| Coluna | Tipo | Constraints |
|---|---|---|
| id | UUID | PK |
| creator_id | UUID | FK → users(id), NOT NULL |
| code | VARCHAR(8) | UNIQUE, NOT NULL — gerado aleatoriamente |
| mode | VARCHAR(10) | NOT NULL |
| status | VARCHAR(10) | NOT NULL — 'PENDING' \| 'USED' \| 'CANCELLED' \| 'EXPIRED' |
| expires_at | TIMESTAMPTZ | NOT NULL — created_at + 24h |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## Live State Storage: Redis

### Chave `game:{gameId}` (JSON string, TTL 25h)

```json
{
  "gameId": "uuid",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "currentTurn": "BLACK",
  "whiteTimeRemainingMs": 598200,
  "blackTimeRemainingMs": 600000,
  "lastMoveTimestamp": 1749600000000,
  "status": "IN_PROGRESS",
  "whiteConnected": true,
  "blackConnected": true,
  "whiteDisconnectedAt": null,
  "blackDisconnectedAt": null,
  "drawOfferedBy": null,
  "halfMoveClock": 0,
  "positionHistory": [
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ]
}
```

### Chave `matchmaking:queue:CASUAL` e `matchmaking:queue:RANKED`

Redis List de player IDs (UUID strings). `LPUSH` ao entrar, `RPOP` de dois ao emparelhar.
Cada entry: `"{playerId}:{enqueuedAtEpochMs}"`.

### Chave `session:{sessionId}` (string, TTL 24h)

Mapeia WebSocket session ID para player ID. Usado para identificar o jogador na desconexão.
Value: `"{playerId}:{gameId}"` (gameId nullable se não estiver em jogo).

### Chave `revoked_tokens` (Set)

JWT tokens revogados (logout). Verificado no filter de autenticação. TTL individual por entrada
até expiração natural do token.

### Chave `ranking:page:{page}:{size}` (JSON string, TTL 30s)

Resultado paginado de `GET /api/ranking` em cache. Gerenciado via Spring `@Cacheable("rankings")`.
Invalidado em `@CacheEvict` após `RatingUpdateService` completar a atualização. Satisfaz SC-009.

### Chave `user:profile:{username}` (JSON string, TTL 60s)

Perfil público do usuário (`wins`, `losses`, `draws`, `rating`, `gamesPlayed`). Gerenciado via
Spring `@Cacheable("userProfiles")`. Invalidado após atualização de rating do usuário.

### Stream `game-finished-events` (Redis Streams)

Chave do stream: `game-finished-events`. Consumer group: `game-processors`.
Consumer: `GameFinishedQueueConsumer`.

Cada entry contém os campos:
```
gameId, result, resultReason, mode, whitePlayerId, blackPlayerId
```

Garante processamento **ordenado e assíncrono** após o encerramento de cada partida:
1. `RatingUpdateService.updateRatings()` — calcula Elo, atualiza `User.rating` + `RatingHistory`
2. Atualiza `User.wins` / `losses` / `draws` / `games_played`
3. `PgnGeneratorService.generateAndPersist()` — gera e persiste PGN no PostgreSQL
4. Broadcast `GAME_OVER` via WebSocket com `ratingChanges` completos

O `GameEventPublisher` (`@Order(2)`) usa os dados enriquecidos pelo `RatingUpdateService`
(`@Order(1)`) para incluir `ratingChanges` no evento GAME_OVER. O stream desacopla o trabalho
pesado (PGN, stats) do fluxo síncrono do jogo.

---

## State Transitions

### Game Status

```
(criado) → IN_PROGRESS → FINISHED
```

Transições para FINISHED via: CHECKMATE, TIME_FORFEIT, RESIGNATION, DRAW_AGREEMENT,
STALEMATE, THREEFOLD_REPETITION, FIFTY_MOVE_RULE, INSUFFICIENT_MATERIAL, ABANDONMENT,
MUTUAL_ABANDONMENT.

### GameInvite Status

```
PENDING → USED       (segundo jogador entrou)
PENDING → CANCELLED  (criador cancelou)
PENDING → EXPIRED    (24h sem uso, verificado por @Scheduled)
```

### Draw Offer Flow

```
drawOfferedBy = null
  → drawOfferedBy = WHITE | BLACK  (oferta enviada)
  → drawOfferedBy = null           (aceita → game FINISHED em DRAW_AGREEMENT
                                    OU recusada → volta a null)
```
