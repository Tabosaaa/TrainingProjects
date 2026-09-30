---
description: "Task list for Chess Live — Aplicativo Web de Xadrez ao Vivo"
---

# Tasks: Chess Live — Aplicativo Web de Xadrez ao Vivo

**Input**: Design documents from `/specs/001-chess-live-app/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Included — testes unitários para domínio e strategies, integração para use cases e
endpoints principais (conforme solicitado em plan.md).

**Organization**: Tasks organized by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable — arquivo diferente, sem dependência de tarefa incompleta
- **[Story]**: User story label (US1–US7 conforme spec.md)
- Paths relativos à raiz do repositório

## Path Conventions

- **Backend**: `backend/src/main/java/com/chesslive/` (hexagonal layers: domain, application, infrastructure, presentation)
- **Backend tests**: `backend/src/test/java/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — scaffolding de backend e frontend antes de qualquer feature.

- [X] T001 Create backend/ Spring Boot project with Maven and Java 21 (use Spring Initializr layout)
- [X] T002 Create frontend/ Next.js 14+ TypeScript project with App Router (`npx create-next-app@latest --typescript --app`)
- [X] T003 [P] Add backend Maven dependencies: spring-boot-starter-web, spring-boot-starter-security, spring-boot-starter-data-jpa, spring-boot-starter-websocket, spring-boot-starter-data-redis, spring-boot-starter-cache, flyway-core, `com.github.bhlangonijr:chesslib:1.3.3`, `io.jsonwebtoken:jjwt-api` in `backend/pom.xml`
- [X] T004 [P] Configure `backend/src/main/resources/application.properties` with PostgreSQL datasource, Redis connection, JWT secret placeholder and Flyway settings
- [X] T005 [P] Create `docker-compose.yml` at repository root with PostgreSQL 16 and Redis 7 services, health checks and named volumes
- [X] T006 [P] Configure `frontend/tsconfig.json` with path aliases (`@/*` → `./src/*`) and strict TypeScript; add `eslint.config.js` with `@typescript-eslint/no-explicit-any: "error"` to enforce constitution `any` prohibition at build time in `frontend/eslint.config.js`
- [X] T007 [P] Add frontend npm dependencies: `@stomp/stompjs`, `sockjs-client` and their TypeScript types in `frontend/package.json`
- [X] T008 [P] Create shared API client with `Authorization` header injection and base URL config in `frontend/src/shared/lib/apiClient.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T009 Create hexagonal package structure under `backend/src/main/java/com/chesslive/` with empty packages: `domain/{game,player,matchmaking,events,shared}`, `application/{auth,game,matchmaking,history,ranking,rating,ports/outbound}`, `infrastructure/{persistence,cache,queue,security,chess,websocket,scheduler,config}`, `presentation/{rest,websocket}`
- [X] T010 [P] Create domain shared value objects: `GameId`, `PlayerId`, `Color` (WHITE/BLACK enum) in `backend/src/main/java/com/chesslive/domain/shared/`
- [X] T011 [P] Create domain enums: `GameStatus` (IN_PROGRESS, FINISHED), `GameMode` (CASUAL, RANKED), `GameResult` (WHITE_WINS, BLACK_WINS, DRAW), `ResultReason` (CHECKMATE, TIME_FORFEIT, RESIGNATION, DRAW_AGREEMENT, STALEMATE, THREEFOLD_REPETITION, FIFTY_MOVE_RULE, INSUFFICIENT_MATERIAL, ABANDONMENT, MUTUAL_ABANDONMENT) in `backend/src/main/java/com/chesslive/domain/game/`
- [X] T012 Create Flyway migrations: `V1__create_users.sql`, `V2__create_games.sql`, `V3__create_moves.sql`, `V4__create_rating_history.sql`, `V5__create_game_invites.sql` in `backend/src/main/resources/db/migration/` (schema per data-model.md)
- [X] T013 [P] Create JPA entities: `UserJpaEntity`, `GameJpaEntity`, `MoveJpaEntity`, `RatingHistoryJpaEntity`, `GameInviteJpaEntity` in `backend/src/main/java/com/chesslive/infrastructure/persistence/` with all columns from data-model.md
- [X] T014 [P] Create Spring Data JPA repositories: `UserJpaRepository`, `GameJpaRepository`, `MoveJpaRepository`, `RatingHistoryJpaRepository`, `GameInviteJpaRepository` in `backend/src/main/java/com/chesslive/infrastructure/persistence/`
- [X] T015 [P] Create outbound port interfaces: `UserRepositoryPort`, `GameRepositoryPort`, `MoveRepositoryPort`, `GameSessionPort`, `MatchmakingQueuePort`, `MoveValidatorPort`, `EventPublisherPort`, `GameInviteRepositoryPort` in `backend/src/main/java/com/chesslive/application/ports/outbound/`
- [X] T016 [P] Configure `RedisConfig` (RedisTemplate<String, String> + Jackson serializer) in `backend/src/main/java/com/chesslive/infrastructure/cache/RedisConfig.java`
- [X] T017 [P] Configure Spring WebSocket STOMP with in-memory broker: `/topic` and `/user` destinations, `/app` prefix, SockJS endpoint `/ws` in `backend/src/main/java/com/chesslive/infrastructure/websocket/WebSocketConfig.java`
- [X] T018 [P] Create `GlobalExceptionHandler` (@ControllerAdvice) with error response format `{error, message, timestamp}` in `backend/src/main/java/com/chesslive/presentation/rest/GlobalExceptionHandler.java`
- [X] T019 [P] Create base Spring Security configuration (permitAll for /api/auth/**, /api/ranking, /ws/**, require auth for everything else) in `backend/src/main/java/com/chesslive/infrastructure/security/SecurityConfig.java`
- [X] T020 [P] Create frontend `app/layout.tsx` with root HTML structure, navigation bar shell (lobby, history, ranking links) and auth-aware header
- [X] T021 [P] Create base `useWebSocket` hook (STOMP client connect/disconnect lifecycle, auth header injection) in `frontend/src/shared/hooks/useWebSocket.ts`
- [X] T108 [P] Implement `SessionRegistryInterceptor` (ChannelInterceptor: on STOMP CONNECT write `session:{sessionId}` = `"{playerId}:{gameId_or_null}"` to Redis TTL 24h; on DISCONNECT delete the key — enables `WebSocketDisconnectHandler` to look up player + game from session ID) in `backend/src/main/java/com/chesslive/infrastructure/websocket/SessionRegistryInterceptor.java`; register as inbound channel interceptor in `WebSocketConfig`

**Checkpoint**: Foundation ready — user story implementation can begin in parallel.

---

## Phase 3: User Story 1 — Cadastro e Login (Priority: P1) 🎯 MVP

**Goal**: Users can create an account, log in, and access protected routes.

**Independent Test**: Create account → logout → login again using VAL-001 through VAL-004 in quickstart.md.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T022 [P] [US1] Integration test: `RegisterUseCaseIT` (Testcontainers PostgreSQL) — register persists user with BCrypt hash and rating=1200, rejects duplicate email with 409, rejects duplicate username with 409, rejects password < 8 chars with 400 in `backend/src/test/java/integration/usecases/RegisterUseCaseIT.java`
- [X] T023 [P] [US1] Integration test: `AuthControllerTest` — POST /api/auth/register (201, 400, 409), POST /api/auth/login (200, 401 with generic message), POST /api/auth/logout (204) in `backend/src/test/java/integration/endpoints/AuthControllerTest.java`

### Implementation for User Story 1

- [X] T024 [P] [US1] Create `Player` domain entity (id: PlayerId, username: String, rating: int) in `backend/src/main/java/com/chesslive/domain/player/Player.java`
- [X] T025 [P] [US1] Implement `UserPersistenceAdapter` (UserRepositoryPort) mapping between `Player` and `UserJpaEntity` in `backend/src/main/java/com/chesslive/infrastructure/persistence/UserPersistenceAdapter.java`
- [X] T026 [US1] Implement `RegisterUseCase` (validate email format + min 8-char password, check uniqueness via UserRepositoryPort, hash with BCrypt, set rating=1200) in `backend/src/main/java/com/chesslive/application/auth/RegisterUseCase.java`
- [X] T027 [US1] Implement `LoginUseCase` (verify credentials, generate JWT with 24h expiry) and `JwtService` (sign/validate with HS256) in `backend/src/main/java/com/chesslive/application/auth/LoginUseCase.java` and `backend/src/main/java/com/chesslive/infrastructure/security/JwtService.java`
- [X] T028 [US1] Implement `JwtAuthenticationFilter` (extract Bearer token, validate via JwtService, set SecurityContext) in `backend/src/main/java/com/chesslive/infrastructure/security/JwtAuthenticationFilter.java`
- [X] T029 [US1] Implement `JwtRevocationService` (store revoked JTIs in Redis Set `revoked_tokens`, check on every request) in `backend/src/main/java/com/chesslive/infrastructure/security/JwtRevocationService.java`
- [X] T030 [US1] Implement `AuthController` (POST /api/auth/register → 201, POST /api/auth/login → 200 with token, POST /api/auth/logout → 204) in `backend/src/main/java/com/chesslive/presentation/rest/AuthController.java`
- [X] T031 [P] [US1] Create `LoginForm` component (email + password fields, submit handler, error display) in `frontend/src/features/auth/LoginForm.tsx`
- [X] T032 [P] [US1] Create `RegisterForm` component (username + email + password fields, submit handler) in `frontend/src/features/auth/RegisterForm.tsx`
- [X] T033 [US1] Implement `useAuth` hook (JWT storage in localStorage, session state, login/logout actions, token injection) in `frontend/src/features/auth/useAuth.ts`
- [X] T034 [P] [US1] Create login page (Client Component wrapping LoginForm, redirect to /lobby on success) in `frontend/src/app/(auth)/login/page.tsx`
- [X] T035 [P] [US1] Create register page (Client Component wrapping RegisterForm, redirect to /login on success) in `frontend/src/app/(auth)/register/page.tsx`
- [X] T036 [US1] Add route protection middleware (redirect unauthenticated users from protected routes to /login) in `frontend/src/middleware.ts`

**Checkpoint**: US1 complete — create account, login, logout and route protection all functional.

---

## Phase 4: User Story 2 — Matchmaking e Início de Partida (Priority: P1) 🎯 MVP

**Goal**: Two authenticated players can enter a queue and be matched automatically.

**Independent Test**: Two browser tabs log in as different users, both enter CASUAL queue → both receive MATCH_FOUND → game page loads (VAL-005, VAL-006 in quickstart.md).

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T037 [P] [US2] Unit test: `FifoMatchmakingStrategyTest` — single player enqueues and waits, two players in same mode get paired, players in different modes do NOT get paired in `backend/src/test/java/unit/strategies/FifoMatchmakingStrategyTest.java`

### Implementation for User Story 2

- [X] T038 [P] [US2] Create `MatchmakingEntry` domain entity (playerId, mode, enqueuedAt) in `backend/src/main/java/com/chesslive/domain/matchmaking/MatchmakingEntry.java`
- [X] T039 [P] [US2] Implement `FifoMatchmakingStrategy` (MatchmakingStrategy interface: enqueue, tryMatch → Optional<Pair<PlayerId, PlayerId>>) in `backend/src/main/java/com/chesslive/application/matchmaking/strategy/FifoMatchmakingStrategy.java`
- [X] T040 [P] [US2] Implement `RedisMatchmakingQueueAdapter` (MatchmakingQueuePort: LPUSH to `matchmaking:queue:{MODE}`, RPOP two entries atomically via MULTI/EXEC) in `backend/src/main/java/com/chesslive/infrastructure/cache/RedisMatchmakingQueueAdapter.java`
- [X] T041 [P] [US2] Create domain events `GameStartedEvent` (gameId, whitePlayerId, blackPlayerId, mode) in `backend/src/main/java/com/chesslive/domain/events/GameStartedEvent.java`
- [X] T042 [US2] Implement `JoinQueueUseCase` (add to Redis queue via MatchmakingQueuePort, check for match via FifoMatchmakingStrategy, if matched: create GameSession in Redis, publish GameStartedEvent) in `backend/src/main/java/com/chesslive/application/matchmaking/JoinQueueUseCase.java`
- [X] T043 [P] [US2] Implement `LeaveQueueUseCase` (remove player from Redis queue) in `backend/src/main/java/com/chesslive/application/matchmaking/LeaveQueueUseCase.java`
- [X] T044 [US2] Add `/app/matchmaking/join` and `/app/matchmaking/leave` STOMP message handlers to `GameWebSocketController`; on match, send `MATCH_FOUND` to `/user/queue/notifications` for both players in `backend/src/main/java/com/chesslive/presentation/websocket/GameWebSocketController.java`
- [X] T045 [P] [US2] Create `QueueButton` component (CASUAL / RANKED toggle + Join/Leave queue button, shows searching spinner) in `frontend/src/features/matchmaking/QueueButton.tsx`
- [X] T046 [US2] Implement `useMatchmaking` hook (send join/leave via WebSocket, listen on `/user/queue/notifications` for MATCH_FOUND, redirect to `/game/{gameId}` on match) in `frontend/src/features/matchmaking/useMatchmaking.ts`
- [X] T047 [US2] Create lobby page with `QueueButton` using `useMatchmaking` hook in `frontend/src/app/lobby/page.tsx`

**Checkpoint**: US2 complete — two players can be paired and redirected to a game.

---

## Phase 5: User Story 3 — Jogo em Tempo Real (Priority: P1) 🎯 MVP

**Goal**: Two players play a complete chess game with real-time board updates, clock, and all FIDE end conditions.

**Independent Test**: Alice and Bob play from start to checkmate (or resign/draw) using VAL-007 through VAL-012 in quickstart.md. No history or rating features required.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T048 [P] [US3] Unit test: `ChessRulesTest` — legal moves accepted, illegal moves rejected, check detection, checkmate detection (Scholar's mate), stalemate detection in `backend/src/test/java/unit/domain/ChessRulesTest.java`
- [X] T049 [P] [US3] Unit test: `DrawDetectorTest` — stalemate, threefold repetition (3 identical FENs), 50-move rule (halfMoveClock ≥ 100), insufficient material (K vs K, K+B vs K, K+N vs K) in `backend/src/test/java/unit/domain/DrawDetectorTest.java`
- [X] T050 [US3] Integration test: `MakeMoveUseCaseTest` — legal move updates GameSession, illegal move returns REJECTED, NOT_YOUR_TURN returns REJECTED, game ends on checkmate in `backend/src/test/java/integration/usecases/MakeMoveUseCaseTest.java`

### Implementation for User Story 3

- [X] T051 [P] [US3] Create `Move` domain entity (id, gameId, playerId, moveNumber, from, to, promotionPiece, algebraicNotation, fenAfter, timeRemainingMs, timestamp) in `backend/src/main/java/com/chesslive/domain/game/Move.java`
- [X] T052 [P] [US3] Create `Board` domain entity (fen, currentTurn, halfMoveClock, fullMoveNumber, positionHistory) in `backend/src/main/java/com/chesslive/domain/game/Board.java`
- [X] T053 [P] [US3] Create `Clock` domain service (static `calculateRemainingMs(timeRemainingMs, lastMoveTimestamp, now)` — no state, no Spring dependency) in `backend/src/main/java/com/chesslive/domain/game/Clock.java`
- [X] T054 [P] [US3] Create `ChessRules` domain service (uses MoveValidatorPort result + board state to determine check, checkmate legality) in `backend/src/main/java/com/chesslive/domain/game/rules/ChessRules.java`
- [X] T055 [P] [US3] Create `DrawDetector` domain service (detects stalemate, threefold repetition from positionHistory, 50-move from halfMoveClock, insufficient material from FEN piece counts) in `backend/src/main/java/com/chesslive/domain/game/rules/DrawDetector.java`
- [X] T056 [P] [US3] Create `Game` domain entity (orchestrates Board + moves + status; methods: `applyMove(Move)`, `resign(Color)`, `offerDraw(Color)`, `acceptDraw()`, `detectEndCondition()`) in `backend/src/main/java/com/chesslive/domain/game/Game.java`
- [X] T057 [P] [US3] Implement `ChesslibMoveValidatorAdapter` (MoveValidatorPort: delegates to chesslib for legal move check + algebraic notation generation + FEN after move) in `backend/src/main/java/com/chesslive/infrastructure/chess/ChesslibMoveValidatorAdapter.java`
- [X] T058 [P] [US3] Implement `RedisGameSessionAdapter` (GameSessionPort: read/write `game:{gameId}` JSON, TTL 25h) in `backend/src/main/java/com/chesslive/infrastructure/cache/RedisGameSessionAdapter.java`
- [X] T059 [P] [US3] Implement `GamePersistenceAdapter` (GameRepositoryPort + MoveRepositoryPort: save game, save move, find by id, find moves by gameId ordered) in `backend/src/main/java/com/chesslive/infrastructure/persistence/GamePersistenceAdapter.java`
- [X] T060 [P] [US3] Create domain events `MoveMadeEvent`, `GameFinishedEvent` in `backend/src/main/java/com/chesslive/domain/events/`
- [X] T061 [P] [US3] Create command records `MakeMoveCommand`, `ResignCommand`, `OfferDrawCommand`, `AcceptDrawCommand` in `backend/src/main/java/com/chesslive/application/game/commands/`
- [X] T062 [US3] Implement `MakeMoveUseCase` (validate turn ownership, call MoveValidatorPort, update Clock + Board + GameSession, persist Move, detect end condition, publish MoveMadeEvent or GameFinishedEvent) in `backend/src/main/java/com/chesslive/application/game/MakeMoveUseCase.java`
- [X] T063 [P] [US3] Implement `ResignUseCase` (update GameSession status, persist game result, publish GameFinishedEvent with RESIGNATION) in `backend/src/main/java/com/chesslive/application/game/ResignUseCase.java`
- [X] T064 [P] [US3] Implement `OfferDrawUseCase` (set drawOfferedBy in GameSession) in `backend/src/main/java/com/chesslive/application/game/OfferDrawUseCase.java`
- [X] T065 [P] [US3] Implement `RespondDrawUseCase` (accept: publish GameFinishedEvent with DRAW_AGREEMENT; reject: clear drawOfferedBy) in `backend/src/main/java/com/chesslive/application/game/RespondDrawUseCase.java`
- [X] T066 [US3] Add `/app/game/{gameId}/move`, `/resign`, `/draw-offer`, `/draw-response` STOMP handlers to `GameWebSocketController` in `backend/src/main/java/com/chesslive/presentation/websocket/GameWebSocketController.java` (delegates to use cases; builds and sends MOVE_REJECTED to `/user/queue/notifications` on invalid moves)
- [X] T067 [US3] Implement `GameEventPublisher` (`@Order(2)` Spring ApplicationEventListener for MoveMadeEvent and GameFinishedEvent; broadcasts MOVE_MADE to `/topic/game/{gameId}`; on GameFinishedEvent reads `ratingChanges` populated by `RatingUpdateService` (@Order(1)) and broadcasts GAME_OVER with complete payload; also handles DRAW_OFFERED and DRAW_REJECTED events) in `backend/src/main/java/com/chesslive/infrastructure/websocket/GameEventPublisher.java`
- [X] T068 [P] [US3] Create `Board` frontend component (8×8 CSS grid, highlights selected piece and legal squares from local pre-validation, click-to-move dispatches via WebSocket) in `frontend/src/features/game/Board.tsx`
- [X] T069 [P] [US3] Create `Piece` component (SVG chess pieces keyed by piece type + color) in `frontend/src/features/game/Piece.tsx`
- [X] T070 [P] [US3] Create `Clock` component (countdown display from `timeRemainingMs` prop, client-side interval, stops on GAME_OVER) in `frontend/src/features/game/Clock.tsx`
- [X] T071 [P] [US3] Create `GameActions` component (Resign button with confirmation dialog + Draw offer button; disabled after GAME_OVER) in `frontend/src/features/game/GameActions.tsx`
- [X] T072 [US3] Implement `useGame` hook (`useReducer` state machine: subscribe `/topic/game/{id}`, dispatch moves via STOMP SEND, handle MOVE_MADE / MOVE_REJECTED / DRAW_OFFERED / DRAW_REJECTED / GAME_OVER events) in `frontend/src/features/game/useGame.ts`
- [X] T073 [US3] Create game page (`"use client"` Client Component, mounts `useGame` hook, renders `Board` + `Clock` × 2 + `GameActions` + result overlay) in `frontend/src/app/game/[id]/page.tsx`

**Checkpoint**: US3 complete — full chess game playable end-to-end with all FIDE end conditions.

---

## Phase 6: User Story 4 — Reconexão Durante Partida (Priority: P2)

**Goal**: A player who disconnects can rejoin their game within 60 seconds; clock keeps running.

**Independent Test**: Alice disconnects mid-game → Bob sees PLAYER_DISCONNECTED → Alice reconnects within 60s → game resumes. Alice disconnects and stays away → Bob wins by ABANDONMENT (VAL-013, VAL-014 in quickstart.md).

### Implementation for User Story 4

- [X] T074 [P] [US4] Create domain events `PlayerDisconnectedEvent` and `PlayerReconnectedEvent` (gameId, playerId, color, timestamp) in `backend/src/main/java/com/chesslive/domain/events/`
- [X] T075 [US4] Implement `WebSocketDisconnectHandler` (SessionDisconnectEvent listener: read `session:{sessionId}` Redis key populated by `SessionRegistryInterceptor` (T108) to resolve `playerId:gameId`, update `GameSession.{color}DisconnectedAt = now`, publish PlayerDisconnectedEvent) in `backend/src/main/java/com/chesslive/infrastructure/websocket/WebSocketDisconnectHandler.java`
- [X] T076 [US4] Implement `AbandonGameScheduler` (`@Scheduled(fixedDelay=5000)`: scan active GameSessions in Redis with non-null disconnectedAt; if `now - disconnectedAt > 60_000ms`, call `ResignUseCase` with ABANDONMENT reason; if both disconnected, result is MUTUAL_ABANDONMENT → DRAW) in `backend/src/main/java/com/chesslive/infrastructure/scheduler/AbandonGameScheduler.java`
- [X] T109 [US4] Implement `ClockExpiryScheduler` (`@Scheduled(fixedDelay=5000)`: scan all `IN_PROGRESS` GameSessions in Redis; for each, compute `effectiveRemaining = storedTimeRemainingMs - (now - lastMoveTimestamp)` for the active player; if `effectiveRemaining ≤ 0`, end the game with `ResultReason.TIME_FORFEIT` — except when opponent has insufficient material, in which case result is DRAW with `INSUFFICIENT_MATERIAL`) in `backend/src/main/java/com/chesslive/infrastructure/scheduler/ClockExpiryScheduler.java`
- [X] T077 [US4] Add reconnection handler to `GameWebSocketController`: on STOMP CONNECT for a player with an active game, update `GameSession.{color}Connected = true`, clear `{color}DisconnectedAt`, publish PlayerReconnectedEvent, send `GAME_STATE_ON_RECONNECT` to `/user/queue/notifications` in `backend/src/main/java/com/chesslive/presentation/websocket/GameWebSocketController.java`
- [X] T078 [US4] Add `PLAYER_DISCONNECTED` and `PLAYER_RECONNECTED` event publishing to `GameEventPublisher` (broadcast to `/topic/game/{gameId}` with reconnectionDeadlineMs=60000) in `backend/src/main/java/com/chesslive/infrastructure/websocket/GameEventPublisher.java`
- [X] T079 [US4] Handle `PLAYER_DISCONNECTED` and `PLAYER_RECONNECTED` events in `useGame` hook (show/hide disconnection overlay, update opponent status) in `frontend/src/features/game/useGame.ts`
- [X] T080 [P] [US4] Create `DisconnectionOverlay` component (shows countdown to abandonment when opponent disconnects; shows "reconnecting..." when current player disconnects) in `frontend/src/features/game/DisconnectionOverlay.tsx`

**Checkpoint**: US4 complete — reconnection and abandonment fully functional.

---

## Phase 7: User Story 5 — Sala Privada por Convite (Priority: P2)

**Goal**: A player can create a private room with an invite code and play against a specific opponent.

**Independent Test**: Alice creates invite → shares code → Bob joins → game starts (VAL-016, VAL-017 in quickstart.md).

### Implementation for User Story 5

- [X] T081 [P] [US5] Create `GameInvite` domain entity (id, creatorId, code, mode, status: PENDING/USED/CANCELLED/EXPIRED, expiresAt) in `backend/src/main/java/com/chesslive/domain/matchmaking/GameInvite.java`
- [X] T082 [P] [US5] Implement `GameInvitePersistenceAdapter` (GameInviteRepositoryPort: save, findByCode, updateStatus) in `backend/src/main/java/com/chesslive/infrastructure/persistence/GameInvitePersistenceAdapter.java`
- [X] T083 [US5] Implement `CreateInviteUseCase` (generates random 8-char alphanumeric code, creates GameInvite with expiresAt = now + 24h, persists) in `backend/src/main/java/com/chesslive/application/matchmaking/CreateInviteUseCase.java`
- [X] T084 [US5] Implement `JoinInviteUseCase` (validates code is PENDING + not expired + joiner ≠ creator, marks USED, creates GameSession in Redis, publishes GameStartedEvent) in `backend/src/main/java/com/chesslive/application/matchmaking/JoinInviteUseCase.java`
- [X] T085 [US5] Implement `InviteExpiryScheduler` (`@Scheduled(cron="0 0 * * * *")`: mark PENDING invites with `expires_at < now` as EXPIRED) in `backend/src/main/java/com/chesslive/infrastructure/scheduler/InviteExpiryScheduler.java`
- [X] T086 [US5] Implement invite endpoints in `GameController` (POST /api/invites → 201, GET /api/invites/{code} → 200/404/410, POST /api/invites/{code}/join → 200/410/409, DELETE /api/invites/{code} → 204) in `backend/src/main/java/com/chesslive/presentation/rest/GameController.java`
- [X] T087 [P] [US5] Create `CreateInviteSection` component (button to create invite + displays code with copy-to-clipboard + cancel button) in `frontend/src/features/matchmaking/CreateInviteSection.tsx`
- [X] T088 [P] [US5] Create `JoinInviteForm` component (text input for 8-char code, submit handler calls POST /api/invites/{code}/join, redirects to /game/{id}) in `frontend/src/features/matchmaking/JoinInviteForm.tsx`
- [X] T089 [US5] Add `CreateInviteSection` and `JoinInviteForm` components to lobby page in `frontend/src/app/lobby/page.tsx`

**Checkpoint**: US5 complete — private rooms with invite codes fully functional.

---

## Phase 8: User Story 6 — Histórico de Partidas (Priority: P3)

**Goal**: Players can view their game history and PGN notation for completed games.

**Independent Test**: After completing any game, access /history → see game in list → click to view PGN (VAL-018, VAL-019 in quickstart.md).

### Implementation for User Story 6

- [X] T090 [P] [US6] Implement `PgnGeneratorService` (Spring service with method `generateAndPersist(gameId)`: query ordered moves via MoveRepositoryPort, reconstruct PGN from move list using chesslib with standard headers `[White]`, `[Black]`, `[Result]`, `[Date]`, `[TimeControl]`, persist to `game.pgn` via GameRepositoryPort — called by `GameFinishedQueueConsumer`, not directly as event listener) in `backend/src/main/java/com/chesslive/infrastructure/chess/PgnGeneratorService.java`
- [X] T091 [P] [US6] Implement `GetGameHistoryUseCase` (paginated query of user's completed games via GameRepositoryPort, map to HistoryDTO with opponent, result, ratingChange) in `backend/src/main/java/com/chesslive/application/history/GetGameHistoryUseCase.java`
- [X] T092 [US6] Add history endpoints to `GameController` (GET /api/games/history?page&size → paginated list; GET /api/games/{gameId} → full game with moves + pgn) in `backend/src/main/java/com/chesslive/presentation/rest/GameController.java`
- [X] T093 [P] [US6] Create `GameHistoryList` component (paginated table: opponent, result badge, time control, date) in `frontend/src/features/history/GameHistoryList.tsx`
- [X] T094 [P] [US6] Create `PgnViewer` component (scrollable list of algebraic notation moves, highlighted current move) in `frontend/src/features/history/PgnViewer.tsx`
- [X] T095 [US6] Create history page (Server Component: fetch /api/games/history, render `GameHistoryList`; clicking a game loads detail + `PgnViewer`) in `frontend/src/app/history/page.tsx`
- [X] T113 [P] [US6] Configure Redis Streams: create consumer group `game-processors` on stream `game-finished-events` in `RedisConfig`; implement `GameFinishedQueueProducer` (`@Order(3)` ApplicationEventListener on GameFinishedEvent: serialize `{gameId, result, resultReason, mode, whitePlayerId, blackPlayerId}` and push to stream) in `backend/src/main/java/com/chesslive/infrastructure/queue/GameFinishedQueueProducer.java`
- [X] T114 [US6] Implement `GameFinishedQueueConsumer` (Redis Streams `StreamListener<String, MapRecord<String, String, String>>` in consumer group `game-processors`: (1) call `PgnGeneratorService.generateAndPersist(gameId)`, (2) update `User.wins`/`losses`/`draws`/`games_played` via UserRepositoryPort, (3) ACK message on success; runs async, does not block GAME_OVER broadcast) in `backend/src/main/java/com/chesslive/infrastructure/queue/GameFinishedQueueConsumer.java`

**Checkpoint**: US6 complete — game history and PGN accessible via async queue processing.

---

## Phase 9: User Story 7 — Ranking e Rating (Priority: P3)

**Goal**: Elo rating updates after ranked games; ranking table shows all players sorted by rating.

**Independent Test**: After a ranked game concludes, both players' ratings update (+/-~10 pts for equal 1200 opponents), ranking table reflects new values (VAL-020, VAL-021 in quickstart.md).

### Tests for User Story 7

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T096 [P] [US7] Unit test: `EloRatingStrategyTest` — equal ratings (1200 vs 1200) winner gets +10, loser -10; higher-rated player upset (1400 vs 1200 loser) yields large gain for lower-rated; draw yields small change in `backend/src/test/java/unit/strategies/EloRatingStrategyTest.java`

### Implementation for User Story 7

- [X] T097 [P] [US7] Implement `EloRatingStrategy` (K=20; `expectedScore = 1.0 / (1.0 + Math.pow(10, (opponentRating - playerRating) / 400.0))`; `newRating = Math.round(currentRating + K * (score - expectedScore))`) in `backend/src/main/java/com/chesslive/application/rating/strategy/EloRatingStrategy.java`
- [X] T098 [US7] Implement `RatingUpdateService` (`@Order(1)` Spring ApplicationEventListener on GameFinishedEvent: skip CASUAL games; apply EloRatingStrategy for both players; update `User.rating` via UserRepositoryPort; persist `RatingHistory` for both; set `event.ratingChanges` map so `GameEventPublisher` @Order(2) can include it in GAME_OVER; also triggers `@CacheEvict` on `rankings` and `userProfiles` caches) in `backend/src/main/java/com/chesslive/application/rating/RatingUpdateService.java`
- [X] T099 [P] [US7] Implement `GetRankingUseCase` (`@Cacheable("rankings")` on `execute(page, size)`; paginated users sorted by rating DESC via UserRepositoryPort) in `backend/src/main/java/com/chesslive/application/ranking/GetRankingUseCase.java`
- [X] T100 [US7] Implement `RankingController` (GET /api/ranking?page&size → GetRankingUseCase; GET /api/users/{username} → `@Cacheable("userProfiles")` user profile with rating, wins, losses, draws, gamesPlayed, stats) in `backend/src/main/java/com/chesslive/presentation/rest/RankingController.java`
- [X] T101 [P] [US7] Create `RankingTable` component (table with position, username, rating, gamesPlayed columns) in `frontend/src/features/ranking/RankingTable.tsx`
- [X] T102 [US7] Create ranking page (Server Component: fetch /api/ranking, render `RankingTable`, link to player profiles) in `frontend/src/app/ranking/page.tsx`
- [X] T110 [P] [US7] Configure Spring Cache with Redis backend: `@EnableCaching` + `RedisCacheConfiguration` bean with `rankings` cache (TTL 30s) and `userProfiles` cache (TTL 60s); use `StringRedisSerializer` for keys and `Jackson2JsonRedisSerializer` for values in `backend/src/main/java/com/chesslive/infrastructure/config/CacheConfig.java`

**Checkpoint**: US7 complete — rating calculation, ranking table with Redis cache, and user stats fully functional.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, rate limiting, final validation.

- [X] T103 [P] Implement STOMP `RateLimitingChannelInterceptor` (block sessions exceeding 2 inbound messages/second; send RATE_LIMIT_EXCEEDED error to `/user/queue/errors`) in `backend/src/main/java/com/chesslive/infrastructure/websocket/RateLimitingChannelInterceptor.java` and register in `WebSocketConfig`
- [X] T104 [P] Add `@Valid` bean validation to all REST request DTOs and confirm `GlobalExceptionHandler` returns 400 with `VALIDATION_FAILED` code in `backend/src/main/java/com/chesslive/presentation/rest/`
- [X] T105 [P] Externalize all secrets to environment variables (`CHESS_LIVE_JWT_SECRET`, `SPRING_DATASOURCE_URL`, `SPRING_REDIS_URL`) in `backend/src/main/resources/application.properties` and `application-prod.properties`
- [X] T106 [P] Integration test: full game flow (register two users → matchmaking → 5 moves → resign → verify rating updated via RatingUpdateService → verify PGN persisted by queue consumer → verify ranking cache evicted → verify user stats counters incremented) in `backend/src/test/java/integration/usecases/GameFlowIntegrationTest.java`
- [X] T107 Run quickstart.md validation scenarios VAL-001 through VAL-021 end-to-end and confirm all pass

---

## Phase 11: UI/UX Polish (FR-039, FR-040, FR-041, SC-010)

**Purpose**: Elevar a qualidade visual e de UX do frontend usando as skills `frontend-design` e
`web-design-guidelines`; corrigir o tabuleiro (casas irregulares) e garantir responsividade total.

- [X] T115 Establish design system in `frontend/src/app/globals.css`: refined color palette with proper contrast (WCAG AA), typographic hierarchy (distinctive display font for headings), spacing scale, focus-visible states, button/input/card refinements, reduced-motion support
- [X] T116 Fix `Board` component — perfectly square cells at any viewport: use `aspect-ratio: 1` on the board container with `grid-template-columns: repeat(8, 1fr)` AND `grid-template-rows: repeat(8, 1fr)` (missing rows definition causes irregular squares), file/rank coordinate labels, last-move + check highlights in `frontend/src/features/game/Board.tsx`
- [X] T117 Responsive layout pass: mobile-first nav (collapsible/compact at 360px), game page layout that keeps board + both clocks visible on mobile, fluid type/spacing via clamp(), tables that degrade gracefully on narrow screens in `frontend/src/app/layout.tsx`, `frontend/src/shared/components/Header.tsx`, `frontend/src/app/game/[id]/page.tsx`, history/ranking pages
- [X] T118 Apply Web Interface Guidelines audit fixes: touch targets ≥ 44px, visible focus rings, aria labels on icon-only/board controls, form autocomplete attributes, loading/disabled states, color-independent status badges in all `frontend/src/features/**` components
- [X] T119 Verify: `npm run lint` + `npm run build` pass; manual viewport check at 360/768/1280px confirms no horizontal scroll and square board cells (SC-010)
- [X] T120 Implement client-side legal move generator (FR-042): full FEN parsing (turn, castling rights, en passant target), per-piece pseudo-legal generation, king-safety filtering via attack detection, castling and en passant support in `frontend/src/features/game/moves.ts`; integrate with `Board.tsx` — selecting an own piece highlights all legal destinations (dot for empty squares, ring for captures), clicking a highlighted square submits the move
- [X] T121 Render solid pieces (FR-042): use filled Unicode glyph set (♚♛♜♝♞♟) for BOTH colors with full-body CSS coloring (cream for white, near-black for black) in `frontend/src/features/game/Piece.tsx` + `frontend/src/app/globals.css`

---

## Phase 12: User Story 8 — Partida contra Bot (Priority: P2) — FR-043..FR-047

**Goal**: HUMAN vs BOT pelo mesmo fluxo WebSocket, com backend como fonte da verdade e Strategy Pattern para a escolha de jogadas do bot.

**Independent Test**: Jogador inicia partida contra bot (cor + nível 0–10); lance humano via WS gera resposta automática do bot (BOT_THINKING → MOVE_MADE); de pretas, o bot abre o jogo.

- [X] T122 [US8] Add `BOT` to `GameMode` enum; create `PlayerType` enum (HUMAN, BOT); extend `GameSession` with `whitePlayerType`/`blackPlayerType` (default HUMAN) + `botLevel` (Integer) + `isBot(Color)` helper; create Flyway migration `V6__create_bot_user.sql` inserting system bot user (fixed UUID `0b070000-0000-0000-0000-000000000001`, username `chessbot`, unloggable password hash) in `backend/src/main/java/com/chesslive/domain/` + `backend/src/main/resources/db/migration/`
- [X] T123 [US8] Extend `MoveValidatorPort` with `legalMoves(String fen)` → `List<LegalMove(from, to, promotionPiece, fenAfter)>` and `isCheck(String fen)`; implement in `ChesslibMoveValidatorAdapter` (no chess-rule duplication — chesslib only) in `backend/src/main/java/com/chesslive/infrastructure/chess/ChesslibMoveValidatorAdapter.java`
- [X] T124 [P] [US8] Implement bot strategies in `backend/src/main/java/com/chesslive/application/game/bot/strategy/`: `BotMoveStrategy` interface, `RandomBotStrategy` (optional capture preference), `GreedyBotStrategy` (max immediate material via `MaterialEvaluator`), `MinimaxBotStrategy` (negamax + alpha-beta, depth by level, mate scoring), `StockfishBotStrategy` (UCI adapter via PATH binary, skill level mapping, fallback to random on unavailability/error), and `BotDifficultyResolver` (0→random; 1-2→random+captures; 3-4→greedy; 5-7→minimax; 8-10→stockfish-with-fallback)
- [X] T125 [US8] Implement `StartBotGameUseCase` (validates level 0–10, fixed colors, GameMode BOT, botLevel in session) + `StartGameService.startAssigned(...)` refactor (skip player→game mapping for bot; bot display name "Bot (nível N)") + REST `POST /api/games/bot` {color, level} → 201 in `GameController`
- [X] T126 [US8] Implement `BotMoveService` (@Async: if active game and bot's turn → publish `BotThinkingEvent`, think delay, resolve strategy, choose move, execute via `MakeMoveUseCase` with bot PlayerId); trigger after accepted human move in `GameWebSocketController` and at game start when human plays BLACK; broadcast `BOT_THINKING` in `GameEventPublisher`; auto-decline draw offers against bot in `OfferDrawUseCase`
- [X] T127 [US8] Restrict rating updates to RANKED games only (`RatingUpdateService`: skip CASUAL **and** BOT) — FR-047
- [X] T128 [P] [US8] Frontend: add `BOT` GameMode + `BotThinkingEvent` to types; create `BotGameSection` (color choice Brancas/Pretas, level slider 0–10, POST /api/games/bot, sessionStorage match info, redirect) in lobby in `frontend/src/features/matchmaking/BotGameSection.tsx` + `frontend/src/app/lobby/page.tsx`
- [X] T129 [P] [US8] Frontend: handle `BOT_THINKING` in `useGame` reducer (`botThinking` flag, cleared on MOVE_MADE/GAME_OVER) and show "Bot pensando…" indicator (aria-live) on game page in `frontend/src/features/game/useGame.ts` + `frontend/src/app/game/[id]/page.tsx`
- [X] T130 [US8] Tests: `BotDifficultyResolverTest` (level→strategy mapping), `GreedyBotStrategyTest` (captures hanging queen), `MinimaxBotStrategyTest` (finds mate in 1) in `backend/src/test/java/unit/strategies/`; `BotGameFlowIT` (human WHITE: move → bot auto-replies; human BLACK: bot opens; illegal move rejected without bot reply; rating unchanged after bot game) in `backend/src/test/java/integration/usecases/BotGameFlowIT.java`
- [X] T131 [US8] Verify: full backend test suite green (online mode regression), `npm run lint` + `npm run build` pass; update contracts (`rest.md`: POST /api/games/bot; `websocket.md`: BOT_THINKING) and `data-model.md` (GameMode BOT, playerType/botLevel, bot user)

---

## Phase 13: Qualidade de Código, Bug de Desconexão Fantasma e Força do Bot

**Purpose**: Revisão de código com padrão sênior (clareza/manutenibilidade, controllers finos no
padrão MVC dentro da arquitetura hexagonal), correção do bug de abandono indevido no modo online
e recalibração da dificuldade do bot (nível 10 deve ser de fato forte).

- [X] T132 Code review / MVC alignment: controllers MUST delegate and never build response views inline — extract typed response records + private mappers from `GameController` (history/detail endpoints currently build `LinkedHashMap` views inline); remove inline fully-qualified class names (imports), normalize import order; document the MVC↔hexagonal layer mapping (Model = domain+application, View = DTO records/frontend, Controller = presentation) in `specs/001-chess-live-app/plan.md`
- [X] T133 Fix phantom-disconnect bug (online mode): a stale `SessionDisconnectEvent` from a superseded WebSocket session (e.g., lobby→game navigation or React StrictMode double-mount creates session B while session A's async close lands AFTER B's connect) marks the player as disconnected; no new CONNECT ever clears it, and `AbandonGameScheduler` awards an undeserved ABANDONMENT win ~60s later. Fix: track the player's CURRENT session (`player:ws:{playerId}` written on CONNECT via `SessionRegistryInterceptor`); `WebSocketDisconnectHandler` MUST ignore disconnects whose sessionId differs from the player's current session. Files: `GameSessionPort`, `RedisGameSessionAdapter`, `SessionRegistryInterceptor`, `WebSocketDisconnectHandler` + regression test `PhantomDisconnectIT` in `backend/src/test/java/integration/usecases/`
- [X] T134 Bot strength recalibration (FR-046 update): (a) evaluation upgrade — piece-square tables + material in `PositionEvaluator` (center control, development, king safety-ish), used by minimax leaves and greedy; (b) capture-first move ordering in negamax for much deeper effective alpha-beta search; (c) depth per level: 5→2, 6→3, 7→4; (d) Stockfish levels 8–10 with per-level skill/movetime (8: skill 8/400ms, 9: skill 14/700ms, 10: skill 20/1200ms) and fallback changed from random to the strongest local minimax (depth 4) — a missing Stockfish binary must NOT make level 10 play randomly; update FR-046 in spec.md accordingly + unit tests (PST sanity, ordering keeps mate-in-1, resolver fallback)
- [X] T135 Verify Phase 13: full backend suite green (regression incl. PhantomDisconnectIT), frontend lint+build, manual sanity of bot levels 1 vs 10 (level 10 must consistently beat level 1 material count in fixed-position probes)

---

## Phase 14: Robustez — Concorrência, Sessão, Contratos e CI (FR-048..051)

**Purpose**: Pacote de redução de risco antes de novas features: atomicidade do estado vivo,
renovação de sessão, PGN síncrono no GAME_OVER, bot fora do ranking e pipeline de CI.

- [X] T136 Per-game locking (FR-050): add `withGameLock(gameId, Supplier<T>)` to `GameSessionPort`; Redis impl with `SET game:lock:{id} <token> NX PX 3000`, bounded spin-wait, token-checked release (Lua) and thread reentrancy; wrap the read-modify-write critical sections (`MakeMoveUseCase`, `ResignUseCase`, `OfferDrawUseCase`, `RespondDrawUseCase`, per-session bodies of `AbandonGameScheduler`/`ClockExpiryScheduler`, `WebSocketConnectHandler`/`WebSocketDisconnectHandler` session updates); integration test `GameLockIT` proves serialization (concurrent increments lose no update) and reentrancy
- [X] T137 Session renewal (FR-048): `POST /api/auth/refresh` — valid token in, fresh 24h token out, old jti revoked (rotation), response shape = login; frontend: silent refresh on app load (Header/useAuth) updating the cookie, and `useWebSocket` stops after 3 failed connection attempts → clear token + redirect `/login`; tests in `AuthControllerTest` (refresh 200 + rotation revokes old token; refresh with revoked token → 401); update `contracts/rest.md`
- [X] T138 Synchronous PGN in GAME_OVER (FR-049): introduce `PgnGeneratorPort` (application/ports/outbound) implemented by `PgnGeneratorService`; `FinishGameService` generates+persists the PGN after `gameRepository.finish(...)` and carries it in `GameFinishedEvent`; `GameEventPublisher` broadcasts the real `pgn` in GAME_OVER; `GameFinishedQueueConsumer` keeps only user-stats work; adjust `GameFlowIntegrationTest` expectations (PGN available immediately)
- [X] T139 Exclude bot from ranking (FR-051): `UserPersistenceAdapter` queries exclude `BotPlayer.BOT_PLAYER_ID` in `findAllOrderedByRating`, `countPlayers` and `countByRatingGreaterThan` (profile position); integration assertion that `chessbot` never appears in `GetRankingUseCase` output
- [X] T140 CI pipeline: GitHub Actions workflow at repository root (`.github/workflows/chess-live-ci.yml`, path-filtered to `chessApp/**`): backend job (temurin 21, Maven cache, `mvn -B test` with Testcontainers) + frontend job (Node 20, `npm ci`, `npm run lint`, `npm run build`)
- [X] T141 Verify Phase 14: full backend suite green, frontend lint+build green, manual smoke (refresh endpoint round-trip; GAME_OVER carries pgn)

---

## Phase 15: Production Readiness (FR-052..063)

**Purpose**: Fechar a lacuna entre "roda local" e "pode receber usuários na web".
Cada task tem commit próprio; testes end-to-end onde o comportamento cruza camadas.

### Segurança

- [X] T142 JWT secret fail-fast (FR-052): `JwtService` rejeita segredo ausente, com valor de desenvolvimento ou < 32 bytes, abortando o startup com mensagem acionável; remover default de `application.properties`; `.env.example` documentando as variáveis; teste `JwtSecretValidationTest`
- [X] T143 Cookie de sessão HttpOnly (FR-053): backend passa a emitir/limpar o cookie `chess_token` (`HttpOnly`, `SameSite=Lax`, `Secure` fora de dev) em login/register/refresh/logout; `JwtAuthenticationFilter` aceita cookie **ou** header (compatibilidade com clientes de API/testes); `JwtHandshakeInterceptor` autentica o WebSocket pelo cookie do handshake; frontend deixa de manipular token (fetch com `credentials: 'include'`, estado de auth vindo do Server Component); E2E `CookieAuthIT` (login → cookie flags → rota protegida só com cookie → logout limpa)
- [X] T144 CORS configurável (FR-054): origens vindas de `CHESS_LIVE_CORS_ORIGINS` (default localhost em dev), com `allowCredentials` seguro
- [X] T145 Rate limiting de autenticação (FR-055): filtro por IP em `/api/auth/**` sensíveis (bucket em Redis), resposta 429 com `RATE_LIMIT_EXCEEDED`; teste `AuthRateLimitIT`
- [X] T146 Cabeçalhos de segurança (FR-056): HSTS em produção, `X-Content-Type-Options`, `X-Frame-Options=DENY`, `Referrer-Policy`, `Permissions-Policy` e CSP no backend e no frontend (`next.config.ts`); teste `SecurityHeadersIT`

### Infraestrutura e Operação

- [X] T147 Health e métricas (FR-057): `spring-boot-starter-actuator` com `/actuator/health` (liveness/readiness) e `/actuator/prometheus` públicos apenas para checagem, demais endpoints protegidos; teste `ActuatorHealthIT`
- [X] T148 Containerização (FR-058): `backend/Dockerfile` (multi-stage JRE 21 + Stockfish instalado, usuário não-root), `frontend/Dockerfile` (Next standalone), `.dockerignore`, `docker-compose.yml` completo (db, cache, backend, frontend) e `docker-compose.override` para dev
- [X] T149 Lock distribuído em schedulers (FR-059): ShedLock (Redis) em `AbandonGameScheduler`, `ClockExpiryScheduler` e `InviteExpiryScheduler`, tornando o deploy multi-instância seguro
- [X] T150 README (docs): visão geral, arquitetura, como rodar (docker e local), variáveis de ambiente, testes e deploy

### Produto e Conformidade

- [X] T151 Recuperação de senha (FR-060): tabela `password_reset_tokens` (V7), `RequestPasswordResetUseCase` + `ConfirmPasswordResetUseCase` (token de uso único, 30 min, hash em repouso), endpoints REST com resposta neutra (não revela existência de e-mail), envio via `PasswordResetNotifierPort` (log em dev), páginas `/forgot-password` e `/reset-password`; teste `PasswordResetIT`
- [X] T152 LGPD (FR-061): `DELETE /api/users/me` (anonimiza usuário preservando integridade das partidas), páginas públicas `/terms` e `/privacy`, link no rodapé e aviso no cadastro; teste `AccountDeletionIT`
- [X] T153 Escolha de peça na promoção (FR-062): modal de promoção no `Board` (dama/torre/bispo/cavalo, orientada pela cor), substituindo a auto-promoção para dama
- [X] T154 Matchmaking por rating (FR-063): `NearestRatingMatchmakingStrategy` (janela inicial ±100, +100 a cada 10s de espera, sem teto após 60s) substituindo FIFO puro via configuração; teste unitário de janela + regressão do pareamento

- [X] T155 Verify Phase 15: suíte backend completa verde, frontend lint+build, `docker compose up` sobe a stack inteira e o fluxo de jogo funciona end-to-end no navegador

---

## Phase 16: Stockfish real e escala de dificuldade calibrada (FR-046 revisto)

**Purpose**: Hoje o pacote `stockfish` não existe para arm64, então os níveis 8–10 caem
no minimax local e jogam igual ao nível 7. Compilar o engine na imagem e calibrar a
escala por Elo torna a progressão de dificuldade real.

- [X] T158 Corrigir status de corpo de requisição inválido: `HttpMessageNotReadableException` (JSON malformado, tipo incompatível) não é tratada e cai no handler genérico, devolvendo 500 em vez de 400; adicionar handler em `GlobalExceptionHandler` com código `MALFORMED_REQUEST` e teste em `MalformedRequestIT`

---

## Phase 17: Internacionalização (FR-065, FR-066)

- [X] T159 Infraestrutura de i18n: dicionários `en`/`pt` em `shared/i18n/messages.ts`, locale em cookie (`chess_locale`, padrão `en`), leitura no Server Component (`getLocale`/`getMessages`) e contexto + hook `useT()` para Client Components; `<html lang>` dinâmico; `LanguageSwitcher` no canto superior direito do cabeçalho
- [X] T160 Traduzir toda a interface: navegação, rodapé, formulários de auth, lobby (fila, bot, sala privada), tela de jogo (relógios, ações, promoção, desconexão, fim de jogo), histórico, PGN, ranking, perfil e exclusão de conta — incluindo `aria-label` e formatação de datas por locale
- [X] T161 Traduzir conteúdo longo e mensagens do servidor: páginas de Termos de Uso e Política de Privacidade em inglês e português; mapear códigos de erro da API (`VALIDATION_FAILED`, `CONFLICT`, `UNAUTHORIZED`, `GONE`, `RATE_LIMIT_EXCEEDED`…) para mensagens traduzidas no cliente; e-mail de recuperação de senha enviado no idioma do solicitante
- [X] T162 Verificar: `npm run lint` + `npm run build`, suíte backend verde e conferência visual das duas versões no navegador

- [X] T157 Envio real do e-mail de recuperação de senha (FR-064): `spring-boot-starter-mail`; `EmailPasswordResetNotifier` (multipart texto+HTML, `@Async`, erro só no log) selecionado por `chesslive.mail.enabled`, com `LoggingPasswordResetNotifier` como fallback de desenvolvimento; variáveis SMTP em `application.properties`/`.env.example`; Mailpit nos composes para inspecionar as mensagens; teste de integração com GreenMail verificando destinatário, assunto e link com o token real; verificação end-to-end (pedir reset → abrir e-mail no Mailpit → redefinir → logar com a nova senha)

- [X] T156 Compilar Stockfish em estágio separado do `backend/Dockerfile` (clone da tag estável, `make build` com `ARCH` derivado de `TARGETARCH`, binário copiado para o runtime — sem toolchain de compilação na imagem final); `StockfishBotStrategy` ganha suporte a `UCI_LimitStrength`/`UCI_Elo` além de `Skill Level`; `BotDifficultyResolver` passa a mapear níveis 4–10 para Elo calibrado (1350/1550/1750/2000/2300/2700/máximo) com tempo crescente e fallback local por nível (guloso, minimax d2/d3/d4); testes do resolver e verificação end-to-end de que o engine responde no container

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — no dependency on other stories
- **US2 (Phase 4)**: Depends on Foundational — no dependency on US1 (except authenticated WebSocket)
- **US3 (Phase 5)**: Depends on Foundational + US2 (GameStartedEvent creates the game session)
- **US4 (Phase 6)**: Depends on US3 (reconnection requires active game)
- **US5 (Phase 7)**: Depends on Foundational + US3 (private room creates game same as matchmaking)
- **US6 (Phase 8)**: Depends on US3 (games must exist with moves)
- **US7 (Phase 9)**: Depends on US3 (rated games must complete)
- **Polish (Phase 10)**: Depends on all desired stories being complete

### Within Each User Story

- Tests (marked above) MUST be written and FAIL before implementation
- Domain entities → Ports/Adapters → Use cases → Presentation → Frontend
- Story complete and independently testable before moving to next priority

### Parallel Opportunities Per Story

```
US1 (Phase 3) parallel tasks:
  T022, T023 (tests) can run while T024-T030 (backend) run in parallel with T031-T035 (frontend)

US3 (Phase 5) parallel tasks:
  T048-T050 (tests) → T051-T056 (domain entities all [P]) → T057-T059 (adapters all [P])
  → T062 (MakeMoveUseCase — depends on adapters) → T063-T067 (backend presentation/events)
  T068-T071 (frontend components all [P]) → T072 (useGame) → T073 (game page)
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: US1 (auth) — **STOP + VALIDATE**: can register, login, logout
4. Complete Phase 4: US2 (matchmaking) — **STOP + VALIDATE**: two users get paired
5. Complete Phase 5: US3 (gameplay) — **STOP + VALIDATE**: full game playable end-to-end
6. **MVP DEMO READY**: auth + matchmaking + real-time chess = shippable

### Incremental Delivery

1. MVP (US1+US2+US3) → Demo
2. Add US4 (reconnection) → More robust experience
3. Add US5 (private rooms) → Friend play
4. Add US6 (history) → PGN review
5. Add US7 (rating/ranking) → Competitive mode complete
6. Polish (Phase 10) → Security hardening + final validation

### Parallel Team Strategy (if multiple developers)

After Foundational (Phase 2) completes:
- Developer A: US1 (auth backend + frontend)
- Developer B: US2 (matchmaking backend)
- Developer C: Domain entities for US3 (T051-T056 are all [P])

After US1+US2+US3 complete:
- Developer A: US4 (reconnection)
- Developer B: US5 (private rooms)
- Developer C: US6+US7 (history + rating)

---

## Notes

- `[P]` = different files, no incomplete dependencies → safe to run in parallel
- `[USN]` label maps task to its user story for traceability
- Each story is independently completable and testable
- Tests marked with story label MUST fail before implementation begins
- Commit after each checkpoint at minimum
- Stop at each **Checkpoint** to validate the story independently before moving on
