# Plano de Implementação (Atualizado)

## Status Atual
### ✅ Frontend Profissional
- Tailwind CSS v3 configurado e rodando.
- Estilo sem CDN (melhor performance).

#### [MODIFY] [TicTacToeBoard.tsx](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/tictactoe/TicTacToeBoard.tsx)

## UI/UX Refinements
### [GameHub](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/components/GameHub.tsx)
- [ ] Replace `prompt()` with a custom styling Modal for editing coins.

### [KnucklebonesBoard](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/knucklebones/KnucklebonesBoard.tsx)
- [ ] Display current Stake and User Wallet in the game interface.
- [ ] Update Game Over modal to show "Won X Coins" or "Lost X Coins".
- [ ] Add "Exit to Lobby" button in Game Over modal.

### [TicTacToeBoard](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/tictactoe/TicTacToeBoard.tsx)
- [ ] Display current Stake and User Wallet in the game interface.
- [ ] Update Game Over modal to show "Won X Coins" or "Lost X Coins".
- [ ] Add "Exit to Lobby" button in Game Over modal.

# Bug Derby Restoration & Stabilization

Fixing race synchronization, betting payout logic, and implementing a detailed scoreboard.

## User Review Required
> [!IMPORTANT]
> The race physics are slightly randomized. To ensure perfect sync, guests will now strictly follow the host's position updates, which may cause minor "jitter" if the connection is slow, but will guarantee the same winner on all screens.

## Proposed Changes

### Bug Derby Components
#### [MODIFY] [useBugRaceGame.ts](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/bugrace/hooks/useBugRaceGame.ts)
- Host will broadcast the full player list whenever a new player joins to ensure everyone is synced.
- Adjust win condition to reach 900 (90% of track) to match the visual line.

#### [MODIFY] [BugRaceBoard.tsx](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/bugrace/BugRaceBoard.tsx)
- Move dotted finish line to a percentage-based position (90%) to match the engine.
- Ensure only one `Players` list is used for the sidebar to avoid host-guest discrepancy.

## Verification Plan
### Manual Verification
- Test with two browsers.
- Verify race positions match reasonably well (within 10-20% margin during lead changes).
- Verify winner displays correctly on both.
- Verify the scoreboard shows correct values for both host and guest.

### ✅ Backend Supabase
- Projeto "RPG Tavern Games" criado na região sa-east-1.
- Tabelas (`profiles`, `rooms`, `matches`) criadas.
- RLS (Segurança) configurado.

### ✅ Correção de Lógica
- **Bug Fix:** O jogo não entra mais apenas em "Knucklebones". Agora ele verifica a sala no banco de dados e carrega o jogo correto (`gameId`).
- **Autenticação:** O sistema agora cria automaticamente um ID único para o usuário no banco de dados, permitindo que ele seja Host ou Guest.

## Próximos Passos (Sugeridos)
1. **Testar Multiplayer:** Abrir duas abas (uma normal, uma anônima) e testar a conexão.
2. **Deploy:** Subir para o Cloudflare Pages.
3. **Histórico:** Salvar o resultado das partidas na tabela `matches`.
