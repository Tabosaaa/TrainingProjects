# Gameplay Requirements Quality Checklist: Chess Live

**Purpose**: Validate completeness, clarity, consistency, and measurability of the Chess Live spec
before proceeding to /speckit-plan. Covers all MVP domains: auth, matchmaking, real-time
gameplay, chess rules, reconnection, rating/ranking, and security.
**Created**: 2026-06-11
**Feature**: [spec.md](../spec.md)
**Depth**: Standard (~30 items)
**Audience**: Author (self-review + peer review)

---

## Authentication & Account Requirements Quality

- [ ] CHK001 - Is the session inactivity timeout threshold quantified (e.g., "after X minutes of inactivity")? [Clarity, Spec §FR-004]
- [ ] CHK002 - Is the behavior on duplicate email or username registration attempts explicitly defined (error message, no info leakage)? [Coverage, Gap]
- [ ] CHK003 - Are account recovery flows (e.g., forgotten password) explicitly excluded from MVP scope or specified? [Completeness, Gap]
- [ ] CHK004 - Are password validation rules complete beyond minimum length (max length, allowed character set, confirmation field requirement)? [Completeness, Spec §FR-002]

---

## Matchmaking Requirements Quality

- [ ] CHK005 - Is the matchmaking pairing algorithm defined (e.g., FIFO, random, nearest-rating)? [Clarity, Spec §FR-007, Gap]
- [ ] CHK006 - Is the behavior defined when no opponent is found after a waiting threshold (timeout, cancel, keep waiting)? [Edge Case, Gap]
- [ ] CHK007 - Is color assignment for private rooms fully specified (creator chooses, random, or alternate)? [Clarity, Spec §Assumptions]
- [ ] CHK008 - Are requirements defined for what happens when a newly matched opponent disconnects before the first move is played? [Edge Case, Gap]

---

## Real-Time Gameplay Requirements Quality

- [ ] CHK009 - Is the pre-validation visual feedback boundary explicitly bounded — what the frontend is allowed to show unilaterally vs. what requires server confirmation? [Clarity, Spec §FR-012 + §Assumptions]
- [ ] CHK010 - Are move input methods (click-click, drag-and-drop, keyboard) explicitly defined or intentionally left open for implementation? [Gap]
- [ ] CHK011 - Is clock synchronization authority (server-authoritative vs. client display interpolation) and its acceptable tolerance defined? [Completeness, Gap]
- [ ] CHK012 - Is the pawn promotion piece selection mechanism specified (player choice dialog, auto-queen default, or other)? [Clarity, Spec §Assumptions]
- [ ] CHK013 - Are requirements defined for what happens when a player submits a move while it is not their turn? [Edge Case, Gap]
- [ ] CHK014 - Are draw offer frequency limits defined to prevent spam (e.g., max offers per game, cooldown between offers)? [Completeness, Spec §FR-024]

---

## Chess Rules Coverage Quality

- [ ] CHK015 - Are all five FIDE draw conditions individually mapped to Functional Requirements (stalemate FR-018, repetition FR-019, 50-move FR-020, insufficient material FR-021, mutual agreement FR-024/025)? [Completeness, Spec §FR-018–025]
- [ ] CHK016 - Is "insufficient material" defined with specific piece combinations that trigger it (K vs K, K+B vs K, K+N vs K, K+B vs K+B same color)? [Clarity, Spec §FR-021]
- [ ] CHK017 - Are requirements for en passant captures (and rejection of illegal en passant attempts) explicitly covered in acceptance scenarios or FRs? [Coverage, Gap]
- [ ] CHK018 - Are castling invalidation conditions (king/rook previously moved, king in check, squares attacked) explicitly addressed in acceptance scenarios or FRs? [Coverage, Gap]
- [ ] CHK019 - Is the simultaneous clock expiry edge case (both players' time at zero) fully specified with a deterministic outcome rule? [Edge Case, Spec §Edge Cases]

---

## Reconnection Requirements Quality

- [ ] CHK020 - Is the behavior defined when a player reconnects but their clock has already expired during the 60-second disconnection window? [Edge Case, Gap]
- [ ] CHK021 - Is the outcome for simultaneous disconnection (both players absent when the 60s grace period ends) explicitly specified? [Coverage, Spec §US4 acceptance scenario 4]
- [ ] CHK022 - Are the 60-second reconnection values consistent across all spec locations (US4 scenarios, FR-028, SC-005, and Assumptions)? [Consistency, Spec §US4/FR-028/SC-005/Assumptions]
- [ ] CHK023 - Is it explicit that the game state authoritative for reconnection is stored server-side, not recoverable from client state? [Completeness, Gap]

---

## Rating & Ranking Requirements Quality

- [ ] CHK024 - Is the Elo K-factor (or equivalent weighting parameter) defined, or is its deferral to implementation explicitly documented? [Clarity, Gap]
- [ ] CHK025 - Is the rating impact of abandoned/forfeited games specified precisely (full loss, scaled penalty, or equivalent to a normal loss)? [Completeness, Spec §Edge Cases]
- [ ] CHK026 - Are tiebreaker rules defined for the ranking table when two or more players share the same rating? [Clarity, Gap]
- [ ] CHK027 - Is FR-038 (initial rating 1200) consistent with the Assumptions section entry for initial rating? [Consistency, Spec §FR-038 + §Assumptions]

---

## Security & Anti-Cheat Requirements Quality

- [ ] CHK028 - Is the rate limiting threshold for move submission quantified (e.g., max N moves per second per session)? [Clarity, Spec §Assumptions]
- [ ] CHK029 - Are session security requirements specified beyond password hashing (e.g., secure token transmission, token expiry duration, logout-all-sessions capability)? [Completeness, Spec §FR-004/005]
- [ ] CHK030 - Is protection against a player submitting moves on behalf of the opponent (session isolation, server-side turn enforcement) addressed in requirements? [Gap]

---

## Scope & Consistency Quality

- [ ] CHK031 - Are the MVP exclusions (chat, spectators, bots, tournaments) documented as explicit out-of-scope statements in requirements or only in Assumptions? [Completeness, Spec §Assumptions]
- [ ] CHK032 - Is the single time control (10+0) reflected consistently across FR-006, user story scenarios, and the Assumptions section without residual references to other time controls? [Consistency, Spec §FR-006 + §Assumptions]

---

## Notes

- Items marked `[Gap]` indicate requirements that appear to be missing from the spec; resolve before `/speckit-plan`
- Items marked `[Consistency]` flag potential spec conflicts; verify all referenced sections agree
- Items marked `[Clarity]` require the spec to be more specific/quantified before implementation
- Run `/speckit-clarify` for any Gap item that meaningfully affects feature scope or architecture
