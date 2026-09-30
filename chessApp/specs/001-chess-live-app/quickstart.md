# Quickstart & Validation Guide: Chess Live

**Feature**: Chess Live | **Date**: 2026-06-11
**Contracts**: [rest.md](contracts/rest.md) | [websocket.md](contracts/websocket.md)
**Data Model**: [data-model.md](data-model.md)

Este guia documenta os cenários de validação end-to-end que provam que cada user story
funciona corretamente. Execute-os na ordem — cada grupo depende dos anteriores.

---

## Pré-requisitos

```bash
# Backend rodando (porta 8080)
cd backend && ./mvnw spring-boot:run

# Frontend rodando (porta 3000)
cd frontend && npm run dev

# PostgreSQL e Redis disponíveis (docker-compose ou local)
docker compose up -d postgres redis
```

Ferramentas recomendadas para validação manual: `curl` ou Postman (REST), STOMP client
(e.g., `@stomp/stompjs` no console do browser ou `wscat` com STOMP payload).

---

## Grupo 1: Autenticação (US1 — P1)

**Goal**: Confirmar que cadastro, login e proteção de rotas funcionam.

### VAL-001 — Cadastro de novo usuário

```bash
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"senha12345"}'
```

**Esperado**: HTTP 201, body com `id`, `username: "alice"`, `rating: 1200`.

### VAL-002 — Login e obtenção de JWT

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"senha12345"}'
```

**Esperado**: HTTP 200, body com `token` (JWT), `user.username: "alice"`.
Salvar `TOKEN_ALICE` para os próximos passos.

### VAL-003 — Rota protegida sem token

```bash
curl -s http://localhost:8080/api/games/history
```

**Esperado**: HTTP 401.

### VAL-004 — Senha incorreta não revela qual campo falhou

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"errada"}'
```

**Esperado**: HTTP 401, mensagem genérica (não indica "email correto, senha errada").

---

## Grupo 2: Matchmaking e Início de Partida (US2 — P1)

**Goal**: Confirmar que dois jogadores se emparelham e a partida inicia.

**Setup**: Cadastrar segundo usuário `bob` e obter `TOKEN_BOB`.

### VAL-005 — Dois jogadores entram na fila e são emparelhados

1. Alice conecta via WebSocket com `TOKEN_ALICE`, subscribe em `/user/queue/notifications`.
2. Bob conecta via WebSocket com `TOKEN_BOB`, subscribe em `/user/queue/notifications`.
3. Alice envia: `SEND /app/matchmaking/join {"mode":"CASUAL"}`
4. Bob envia: `SEND /app/matchmaking/join {"mode":"CASUAL"}`

**Esperado**: Ambos recebem `MATCH_FOUND` em `/user/queue/notifications` com o mesmo `gameId`,
cores opostas (um `WHITE`, outro `BLACK`), `timeControlSeconds: 600`.

### VAL-006 — Cancelar a fila antes de emparelhar

1. Alice entra na fila: `SEND /app/matchmaking/join {"mode":"RANKED"}`
2. Alice cancela: `SEND /app/matchmaking/leave {}`
3. Bob entra na fila: `SEND /app/matchmaking/join {"mode":"RANKED"}`

**Esperado**: Bob aguarda na fila sem receber `MATCH_FOUND` (nenhum oponente disponível).

---

## Grupo 3: Jogo em Tempo Real (US3 — P1)

**Goal**: Validar jogadas legais, rejeição de ilegais, relógio e detecção de fim de jogo.

**Setup**: Alice e Bob emparelhados em `GAME_ID`. Alice = WHITE.

Subscribe: ambos em `/topic/game/{GAME_ID}`.

### VAL-007 — Jogada legal é aceita e tabuleiro atualizado

```
Alice SEND /app/game/{GAME_ID}/move {"from":"e2","to":"e4","promotionPiece":null}
```

**Esperado**: Ambos recebem `MOVE_MADE` com `fen` atualizado, `currentTurn: "BLACK"`,
`whiteTimeRemainingMs` decrementado, `inCheck: false`.

### VAL-008 — Jogada ilegal é rejeitada

```
Alice SEND /app/game/{GAME_ID}/move {"from":"e2","to":"e5","promotionPiece":null}
```

**Esperado**: Apenas Alice recebe `MOVE_REJECTED` em `/user/queue/notifications`,
`reason: "ILLEGAL_MOVE"`. Tabuleiro não muda. Bob não recebe nada.

### VAL-009 — Jogada na vez do oponente é rejeitada

```
Bob SEND /app/game/{GAME_ID}/move {"from":"e7","to":"e5","promotionPiece":null}
  (enquanto ainda é a vez de Alice)
```

**Esperado**: Bob recebe `MOVE_REJECTED` com `reason: "NOT_YOUR_TURN"`.

### VAL-010 — Desistência encerra o jogo

```
Bob SEND /app/game/{GAME_ID}/resign {}
```

**Esperado**: Ambos recebem `GAME_OVER` com `result: "WHITE_WINS"`,
`resultReason: "RESIGNATION"`. PGN incluído.

### VAL-011 — Oferta e aceitação de empate

1. Alice faz jogada legal (e4).
2. Bob faz jogada legal (e5).
3. `Alice SEND /app/game/{GAME_ID}/draw-offer {}`
4. Ambos recebem `DRAW_OFFERED {"offeredBy":"WHITE"}`.
5. `Bob SEND /app/game/{GAME_ID}/draw-response {"accept":true}`

**Esperado**: Ambos recebem `GAME_OVER` com `result: "DRAW"`,
`resultReason: "DRAW_AGREEMENT"`.

### VAL-012 — Promoção de peão

Avançar peão até a última fileira via sequência de jogadas e enviar:

```
Alice SEND /app/game/{GAME_ID}/move {"from":"a7","to":"a8","promotionPiece":"Q"}
```

**Esperado**: `MOVE_MADE` com `algebraicNotation: "a8=Q"`, FEN atualizado com rainha.

---

## Grupo 4: Reconexão (US4 — P2)

**Goal**: Confirmar que jogador reconecta dentro de 60s e perde por abandono após.

### VAL-013 — Reconexão bem-sucedida dentro de 60s

1. Alice e Bob em partida ativa.
2. Alice fecha a conexão WebSocket.
3. Bob recebe `PLAYER_DISCONNECTED {"color":"WHITE","reconnectionDeadlineMs":60000}`.
4. Alice reconecta (nova sessão WebSocket), subscribe em `/topic/game/{GAME_ID}`.
5. Alice recebe `GAME_STATE_ON_RECONNECT` em `/user/queue/notifications`.
6. Bob recebe `PLAYER_RECONNECTED {"color":"WHITE"}`.

**Esperado**: Partida continua. Relógio de Alice reflete o tempo real decorrido.

### VAL-014 — Abandono por não reconectar em 60s

1. Alice fecha conexão WebSocket.
2. Aguardar > 60 segundos.

**Esperado**: Bob recebe `GAME_OVER` com `result: "BLACK_WINS"`,
`resultReason: "ABANDONMENT"`.

### VAL-015 — Verificar rating após abandono (ranqueado)

Via REST após VAL-014 (se for partida ranqueada):

```bash
curl -s http://localhost:8080/api/users/alice
curl -s http://localhost:8080/api/users/bob
```

**Esperado**: Rating de Bob aumentou ~20 pts, rating de Alice diminuiu ~20 pts.

---

## Grupo 5: Sala Privada (US5 — P2)

### VAL-016 — Criar e entrar em sala privada

1. Alice cria convite:
```bash
curl -s -X POST http://localhost:8080/api/invites \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{"mode":"CASUAL"}'
```

**Esperado**: HTTP 201 com `code` de 8 caracteres, `expiresAt` em ~24h.

2. Bob entra na sala:
```bash
curl -s -X POST http://localhost:8080/api/invites/{CODE}/join \
  -H "Authorization: Bearer $TOKEN_BOB"
```

**Esperado**: HTTP 200 com `gameId`, `color`, `opponentUsername: "alice"`.

### VAL-017 — Código expirado é rejeitado

Usar código com data passada no banco (ou aguardar expiração em teste de integração).

**Esperado**: HTTP 410 Gone.

---

## Grupo 6: Histórico e PGN (US6 — P3)

### VAL-018 — Histórico após partida concluída

```bash
curl -s -H "Authorization: Bearer $TOKEN_ALICE" \
  http://localhost:8080/api/games/history
```

**Esperado**: Lista com ao menos uma partida. Campos: `opponent`, `result`, `finishedAt`.

### VAL-019 — PGN disponível para partida finalizada

```bash
curl -s -H "Authorization: Bearer $TOKEN_ALICE" \
  http://localhost:8080/api/games/{GAME_ID}
```

**Esperado**: Campo `pgn` preenchido com notação válida incluindo header `[White "alice"]`.

---

## Grupo 7: Ranking e Rating (US7 — P3)

### VAL-020 — Ranking público acessível sem autenticação

```bash
curl -s http://localhost:8080/api/ranking
```

**Esperado**: HTTP 200, lista com `position`, `username`, `rating`. Ordenada por rating desc.

### VAL-021 — Rating atualizado após partida ranqueada

Após partida ranqueada concluída entre Alice (1200) e Bob (1200), Alice vence:

```bash
curl -s http://localhost:8080/api/users/alice
curl -s http://localhost:8080/api/users/bob
```

**Esperado**: `alice.rating ≈ 1210` (+10 com Elo K=20 entre ratings iguais),
`bob.rating ≈ 1190` (-10).

---

## Critérios de Aprovação

Todos os cenários VAL-001 a VAL-021 devem passar para considerar o MVP aprovado.
Critérios de sucesso do spec mapeados:

| SC | Validado por |
|---|---|
| SC-001 (5 min first game) | VAL-001 + VAL-002 + VAL-005 + tempo manual |
| SC-002 (matchmaking ≤ 60s) | VAL-005 (medir tempo) |
| SC-003 (< 500ms board update) | VAL-007 (medir latência) |
| SC-004 (100% illegal moves rejected) | VAL-008 + VAL-009 |
| SC-005 (reconnect ≤ 60s) | VAL-013 |
| SC-006 (all end conditions) | VAL-010 + VAL-011 + testes de integração |
| SC-007 (rating ≤ 5s) | VAL-015 + VAL-021 |
| SC-008 (PGN accessible) | VAL-019 |
| SC-009 (ranking ≤ 10s) | VAL-020 (comparar timestamps) |
