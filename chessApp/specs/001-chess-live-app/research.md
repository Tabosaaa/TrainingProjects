# Research: Chess Live — Decisões Técnicas

**Feature**: Chess Live | **Date**: 2026-06-11 | **Plan**: [plan.md](plan.md)

Todas as decisões abaixo foram derivadas dos requisitos do usuário, das restrições da constituição
e de boas práticas documentadas. Não há NEEDS CLARIFICATION abertos — o usuário forneceu o stack
completo. Este arquivo documenta as escolhas e suas justificativas para referência futura.

---

## 1. Biblioteca de Validação de Xadrez

**Decision**: Usar `com.github.bhlangonijr:chesslib` (Maven/Gradle) como adapter de validação de
jogadas no backend.

**Rationale**: Implementação Java comprovada com cobertura completa das regras FIDE — en passant,
roque (incluindo invalidades), promoção, todas as condições de empate (afogamento, repetição,
50 movimentos, material insuficiente). Elimina risco de bugs em regras de borda antes do MVP.
Expostos via `MoveValidatorPort` na camada application — substitução futura sem impacto no domínio.

**Alternatives considered**:
- Implementar from scratch: risco alto de bugs em casos de borda (castling rights, en passant
  window); inviável para MVP com qualidade.
- Stockfish via UCI: overkill para validação, adiciona dependência de processo externo,
  latência desnecessária.

---

## 2. Autenticação: JWT Bearer Token

**Decision**: JWT stateless com `spring-security-oauth2-resource-server` (ou implementação própria
com `io.jsonwebtoken:jjwt`). Token enviado como `Authorization: Bearer <token>` em REST e no header
WebSocket na conexão STOMP.

**Rationale**: Stateless — sem necessidade de session store. Funciona naturalmente com WebSocket:
o token é validado no handshake HTTP do STOMP antes de estabelecer a conexão. Spring Security
intercepta o token via `JwtAuthenticationFilter`.

**Token lifetime**: Access token 24h para MVP (pode ser reduzido com refresh token em versão
futura). Logout invalida o token via lista de revogação em Redis (simples Set `revoked_tokens`).

**Alternatives considered**:
- Spring Session com Redis: adiciona sessão server-side, complica revogação e escalonamento.
- Cookie-based: CSRF mais complexo com WebSocket; não idiomático para SPA + mobile-first.

---

## 3. STOMP Broker: In-Memory (Spring SimpleBroker)

**Decision**: Usar o broker in-memory do Spring WebSocket (`enableSimpleBroker`).

**Rationale**: Zero dependências externas para MVP. Suficiente para instância única. Topics:
`/topic/game/{gameId}` para broadcast; `/user/queue/...` para mensagens pessoais via
`convertAndSendToUser`.

**Limitations (known)**: Não persiste mensagens nem suporta multiple server instances. Aceitável
para MVP monolítico. Migração para RabbitMQ/Redis Pub-Sub é possível sem mudança nos clients.

**Alternatives considered**:
- RabbitMQ: adiciona operações extras (broker externo), overkill para single-server MVP.
- Redis Pub-Sub: viável como próximo passo de escala, mas complexidade desnecessária agora.

---

## 4. Redis: Estrutura do GameSession

**Decision**: Armazenar `GameSession` como string JSON sob a chave `game:{gameId}`, com TTL de
25 horas (>24h do convite mais longo). Usar `RedisTemplate<String, String>` com Jackson serialization.

**GameSession campos**:
```
gameId, fen, currentTurn (WHITE|BLACK), whiteTimeRemainingMs, blackTimeRemainingMs,
lastMoveTimestamp (epoch ms), status (IN_PROGRESS|FINISHED),
whiteConnected, blackConnected,
whiteDisconnectedAt (epoch ms | null), blackDisconnectedAt (epoch ms | null),
drawOfferedBy (WHITE|BLACK|null), halfMoveClock, positionHistory (List<String>)
```

**Rationale**: JSON string é simples, debuggável e elimina dependência do Redis JSON module.
Clock calculado a partir de `lastMoveTimestamp` no momento de cada acesso — sem drift.

**Alternatives considered**:
- Redis Hash: update granular mas lógica de deserialização mais complexa.
- Redis JSON module: mais ergonômico mas requer módulo adicional no servidor Redis.

---

## 5. Matchmaking Queue: Redis List (FIFO)

**Decision**: Usar Redis List por modo: chaves `matchmaking:queue:CASUAL` e
`matchmaking:queue:RANKED`. Push com `LPUSH`, pop com `RPOP`.

**Rationale**: Atômico, O(1), persiste entre restarts do servidor. `RPOP` de dois elementos em
transação `MULTI/EXEC` garante emparelhamento sem race condition.

**Matchmaking algorithm**: FIFO simples por modo para MVP. `MatchmakingStrategy` encapsula a
lógica — trocar por nearest-rating sem mudança no use case.

**Alternatives considered**:
- In-memory Java queue: perde fila em restart, race condition sem sincronização explícita.
- Database queue: overhead de I/O relacional para operação de alta frequência.

---

## 6. Elo K-Factor

**Decision**: K = 20 para todos os jogadores no MVP.

**Rationale**: Simples, consistente, sem necessidade de rastrear classificação do jogador.
`EloRatingStrategy` encapsula o cálculo — K configurável sem mudança na interface.

**Formula**: `Δrating = K × (score - expectedScore)`
onde `expectedScore = 1 / (1 + 10^((opponentRating - playerRating) / 400))`.

**Alternatives considered**:
- K=32 novatos / K=16 estabelecidos: requer rastrear "número de partidas ranqueadas" como
  critério de transição — complexidade desnecessária para MVP.
- Glicko-2: mais preciso mas requer variance tracking; out of scope para MVP.

---

## 7. Reconexão: Scheduler + Redis TTL

**Decision**: `@Scheduled(fixedDelay = 5000)` Spring task verifica `GameSession.whiteDisconnectedAt`
e `blackDisconnectedAt`. Se `now - disconnectedAt > 60_000ms`, encerra a partida via
`AbandonGameUseCase`.

**Rationale**: Simples, sem dependência de scheduler externo. Precisão de ±5s aceitável para
uma janela de 60s de reconexão.

**Alternatives considered**:
- Redis keyspace notifications (TTL expirado): requer configuração `notify-keyspace-events Kx`
  no Redis; menos portável e mais difícil de testar.
- Quartz scheduler: overkill para MVP.

---

## 8. Geração de PGN

**Decision**: Gerar PGN a partir da lista de `Move` persistida no PostgreSQL ao encerrar a partida.
Usar `chesslib` para reconstruir a notação algébrica padronizada.

**Rationale**: Não duplica dados — movimentos já estão no banco. PGN gerado uma vez no evento
`GameFinishedEvent` e persistido no campo `Game.pgn`.

**PGN headers mínimos**: `[Event]`, `[White]`, `[Black]`, `[Result]`, `[Date]`, `[TimeControl]`.

---

## 9. Frontend: Gerenciamento de Estado do Jogo

**Decision**: Estado local no componente `game/[id]/page.tsx` via React `useState` + `useReducer`.
`useGame` hook gerencia a conexão WebSocket STOMP e despacha actions ao reducer.

**Rationale**: Sem necessidade de estado global (Redux/Zustand) para o jogo — o estado vive
apenas enquanto a partida está ativa. Server Components não têm estado mutável; Client Components
ficam apenas na feature `game/`.

**Alternatives considered**:
- Zustand global: útil para estado cross-feature mas desnecessário para estado de uma partida
  isolada.
- React Query para WebSocket: padrão REST-first; não idiomático para streams bidirecional.

---

## 10. Segurança: Rate Limiting de Jogadas

**Decision**: Usar Spring interceptor (ou `HandlerInterceptor`) para limitar a 2 mensagens
WebSocket por segundo por sessão. Implementado como middleware STOMP antes do controller.

**Rationale**: Previne spam de jogadas (anti-cheat básico conforme spec Assumptions). Simples de
implementar sem biblioteca externa. Limite de 2/s é conservador mas adequado: uma jogada de xadrez
legal leva tempo de seleção humano.

---

## 11. Redis Cache: Ranking e Perfil de Usuário

**Decision**: Spring Cache abstraction (`@EnableCaching`) com Redis como cache store.
Dois caches configurados em `CacheConfig`:
- `rankings`: TTL 30s — resultado paginado de `GET /api/ranking`
- `userProfiles`: TTL 60s — resposta de `GET /api/users/{username}`

`@CacheEvict(allEntries = true)` em ambos os caches após `RatingUpdateService` completar.

**Rationale**: Leituras de ranking e perfil são muito mais frequentes que escritas (apenas ao
término de partidas ranqueadas). Cache elimina queries repetidas ao PostgreSQL para requests
concorrentes da mesma página. Satisfaz SC-009 (ranking reflete atualizações em até 10s, TTL 30s).

**Alternatives considered**:
- Caffeine (in-memory): mais rápido mas não compartilhado entre instâncias futuras e sem
  operações de invalidação remotas.
- Sem cache: aceitável para MVP com poucos usuários, mas TTL 30s é trivial de implementar
  com Spring Cache e paga dividendos imediatos.

---

## 12. Redis Streams: Fila de Processamento de Fim de Partida

**Decision**: Ao encerrar uma partida, `GameFinishedQueueProducer` (`ApplicationEventListener
@Order(3)`) empurra um registro para o Redis Stream `game-finished-events`. O consumer group
`game-processors` tem um único consumer `GameFinishedQueueConsumer` que processa cada evento:
(1) atualiza `wins`/`losses`/`draws`/`games_played` do usuário, (2) chama
`PgnGeneratorService.generateAndPersist()`.

`GAME_OVER` ainda é enviado sincronamente por `GameEventPublisher` (`@Order(2)`) após
`RatingUpdateService` (`@Order(1)`) enriquecer o evento com `ratingChanges`. O stream apenas
decouples o trabalho assíncrono (PGN, contadores) do fluxo principal.

**Rationale**: PGN generation envolve reconstrução de sequência completa de movimentos com chesslib
— I/O de banco + CPU. Mover para fila async elimina latência no broadcast de `GAME_OVER`.
Contadores de estatísticas do usuário também não precisam bloquear o fluxo de jogo.
ACK explícito no consumer garante pelo menos uma execução; sem perda em restart.

**Alternatives considered**:
- Spring `@Async` + `CompletableFuture`: sem garantia de execução em crash; sem replay.
- `@Order` apenas nos listeners síncronos: funciona para rating + GAME_OVER mas PGN heavy
  continua bloqueando o thread do event publisher.
- RabbitMQ: correto mas adiciona infraestrutura extra; Redis já está no stack.

---

## Resumo das Decisões

| Área | Decisão |
|---|---|
| Chess validation | `chesslib` via `MoveValidatorPort` |
| Auth | JWT stateless, revogação em Redis |
| WebSocket broker | Spring in-memory SimpleBroker |
| Game state (Redis) | JSON string, TTL 25h |
| Matchmaking queue | Redis List FIFO por modo |
| Rating | Elo K=20 universal |
| Reconexão timer | `@Scheduled` cada 5s |
| PGN | Gerado async via Redis Stream consumer |
| Frontend state | `useReducer` + `useGame` hook |
| Rate limiting | STOMP interceptor 2/s por sessão |
| Cache (Redis) | Spring `@Cacheable` — rankings TTL 30s, perfis TTL 60s |
| Queue (Redis Streams) | `game-finished-events` — PGN + user stats async |
