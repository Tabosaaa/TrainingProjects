# WebSocket (STOMP) Contracts: Chess Live

**Protocol**: STOMP over SockJS
**Endpoint**: `http://localhost:8080/ws`
**Auth**: JWT token enviado no header STOMP `Authorization: Bearer <token>` durante o handshake

---

## Visão Geral dos Canais

| Tipo | Canal | Descrição |
|---|---|---|
| Subscribe | `/topic/game/{gameId}` | Eventos de partida (broadcast para os dois jogadores) |
| Subscribe | `/user/queue/notifications` | Notificações pessoais (matchmaking encontrado, etc.) |
| Send | `/app/matchmaking/join` | Entrar na fila de matchmaking |
| Send | `/app/matchmaking/leave` | Sair da fila de matchmaking |
| Send | `/app/game/{gameId}/move` | Fazer uma jogada |
| Send | `/app/game/{gameId}/resign` | Desistir da partida |
| Send | `/app/game/{gameId}/draw-offer` | Oferecer empate |
| Send | `/app/game/{gameId}/draw-response` | Aceitar ou recusar oferta de empate |

---

## Mensagens Enviadas pelo Cliente (Client → Server)

### Entrar na fila de matchmaking

**Destino**: `/app/matchmaking/join`

```json
{
  "mode": "CASUAL"
}
```

| Campo | Tipo | Valores |
|---|---|---|
| mode | string | `"CASUAL"` \| `"RANKED"` |

---

### Sair da fila de matchmaking

**Destino**: `/app/matchmaking/leave`

```json
{}
```

Mensagem vazia — o servidor identifica o jogador pela sessão autenticada.

---

### Fazer uma jogada

**Destino**: `/app/game/{gameId}/move`

```json
{
  "from": "e2",
  "to": "e4",
  "promotionPiece": null
}
```

| Campo | Tipo | Notas |
|---|---|---|
| from | string | Casa de origem em notação algébrica (e.g., `"e2"`) |
| to | string | Casa de destino (e.g., `"e4"`) |
| promotionPiece | string \| null | `"Q"`, `"R"`, `"B"` ou `"N"` — obrigatório apenas em promoções |

---

### Desistir da partida

**Destino**: `/app/game/{gameId}/resign`

```json
{}
```

---

### Oferecer empate

**Destino**: `/app/game/{gameId}/draw-offer`

```json
{}
```

---

### Responder à oferta de empate

**Destino**: `/app/game/{gameId}/draw-response`

```json
{
  "accept": true
}
```

| Campo | Tipo | Notas |
|---|---|---|
| accept | boolean | `true` aceita e encerra o jogo; `false` recusa |

---

## Mensagens Recebidas pelo Cliente (Server → Client)

### Canal de partida: `/topic/game/{gameId}`

Todos os jogadores inscritos neste canal recebem os eventos abaixo. Cada mensagem
inclui um campo `type` para facilitar o roteamento no frontend.

---

#### MOVE_MADE

Publicado após cada jogada validada e aplicada.

```json
{
  "type": "MOVE_MADE",
  "gameId": "uuid",
  "move": {
    "from": "e2",
    "to": "e4",
    "algebraicNotation": "e4",
    "promotionPiece": null
  },
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "currentTurn": "BLACK",
  "whiteTimeRemainingMs": 598200,
  "blackTimeRemainingMs": 600000,
  "inCheck": false
}
```

---

#### MOVE_REJECTED

Publicado **apenas para o jogador que submeteu** a jogada inválida.
Enviado via `/user/queue/notifications`.

```json
{
  "type": "MOVE_REJECTED",
  "gameId": "uuid",
  "reason": "ILLEGAL_MOVE",
  "originalFrom": "e2",
  "originalTo": "e5"
}
```

| `reason` | Significado |
|---|---|
| `ILLEGAL_MOVE` | Jogada inválida pelas regras do xadrez |
| `NOT_YOUR_TURN` | Não é a vez deste jogador |
| `GAME_FINISHED` | Partida já encerrada |

---

#### BOT_THINKING

Publicado em partidas contra bot quando é a vez do bot, antes de a jogada ser
calculada no servidor. O MOVE_MADE correspondente segue em instantes.

```json
{
  "type": "BOT_THINKING",
  "gameId": "uuid"
}
```

---

#### DRAW_OFFERED

Publicado quando um jogador oferece empate.

```json
{
  "type": "DRAW_OFFERED",
  "gameId": "uuid",
  "offeredBy": "WHITE"
}
```

---

#### DRAW_REJECTED

Publicado quando a oferta de empate é recusada.

```json
{
  "type": "DRAW_REJECTED",
  "gameId": "uuid"
}
```

---

#### PLAYER_DISCONNECTED

Publicado quando o WebSocket de um jogador é fechado durante uma partida ativa.

```json
{
  "type": "PLAYER_DISCONNECTED",
  "gameId": "uuid",
  "color": "BLACK",
  "reconnectionDeadlineMs": 60000
}
```

---

#### PLAYER_RECONNECTED

Publicado quando o jogador desconectado reconecta dentro do período de graça.

```json
{
  "type": "PLAYER_RECONNECTED",
  "gameId": "uuid",
  "color": "BLACK",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "whiteTimeRemainingMs": 580000,
  "blackTimeRemainingMs": 545000,
  "currentTurn": "BLACK"
}
```

O payload de reconexão inclui o estado completo para sincronizar o cliente reconectado.

---

#### GAME_OVER

Publicado quando a partida encerra por qualquer motivo.

```json
{
  "type": "GAME_OVER",
  "gameId": "uuid",
  "result": "WHITE_WINS",
  "resultReason": "CHECKMATE",
  "pgn": "[Event \"Chess Live\"]\n[White \"jogador123\"]\n...",
  "ratingChanges": {
    "WHITE": { "before": 1250, "after": 1270, "change": 20 },
    "BLACK": { "before": 1230, "after": 1210, "change": -20 }
  }
}
```

`ratingChanges` é `null` para partidas casuais.

---

### Canal pessoal: `/user/queue/notifications`

Mensagens enviadas apenas para o jogador autenticado.

---

#### MATCH_FOUND

Publicado quando o matchmaking encontra um adversário.

```json
{
  "type": "MATCH_FOUND",
  "gameId": "uuid",
  "color": "WHITE",
  "opponent": {
    "username": "adversario",
    "rating": 1230
  },
  "mode": "RANKED",
  "timeControlSeconds": 600
}
```

---

#### GAME_STATE_ON_RECONNECT

Publicado para o jogador que reconecta, com o estado completo da partida.
Enviado adicionalmente ao `PLAYER_RECONNECTED` em `/topic/game/{gameId}`.

```json
{
  "type": "GAME_STATE_ON_RECONNECT",
  "gameId": "uuid",
  "fen": "...",
  "currentTurn": "BLACK",
  "whiteTimeRemainingMs": 580000,
  "blackTimeRemainingMs": 545000,
  "drawOfferedBy": null,
  "yourColor": "BLACK"
}
```

---

## Fluxo de Conexão

```
1. Cliente faz HTTP GET /ws → SockJS handshake
2. STOMP CONNECT com header: Authorization: Bearer <jwt>
3. Servidor valida JWT → CONNECTED ou ERROR (401)
4. Cliente subscribe em /topic/game/{gameId} e /user/queue/notifications
5. Comunicação bidirecional via SEND/MESSAGE
6. STOMP DISCONNECT ou WebSocket close → PlayerDisconnectedEvent (se em jogo)
```

---

## Erros STOMP

Se uma mensagem enviada pelo cliente for inválida (JSON malformado, campo obrigatório ausente,
partida não encontrada), o servidor responde via `/user/queue/errors`:

```json
{
  "type": "ERROR",
  "code": "GAME_NOT_FOUND",
  "message": "Partida não encontrada ou não pertence ao usuário"
}
```

| Código | Motivo |
|---|---|
| `GAME_NOT_FOUND` | gameId inválido ou não pertence ao usuário |
| `INVALID_MESSAGE` | payload com formato inválido |
| `RATE_LIMIT_EXCEEDED` | mais de 2 mensagens por segundo |
| `UNAUTHORIZED` | token JWT ausente ou expirado |
