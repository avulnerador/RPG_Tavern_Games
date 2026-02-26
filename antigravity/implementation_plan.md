# Plano de Implementação (Atualizado)

## Status Atual
### ✅ Frontend Profissional
- Tailwind CSS v3 configurado e rodando.
- Estilo sem CDN (melhor performance).

### ✅ UI/UX Refinements
- **GameHub**: Substituído o `prompt()` por um Modal customizado para edição de moedas.
- **TicTacToe**: Adicionado display de "Sua Bolsa" no cabeçalho.
- **Bug Race**: Ajustado placar para mostrar ganho líquido e adicionado botão de retorno.

#### [MODIFY] [TicTacToeBoard.tsx](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/tictactoe/TicTacToeBoard.tsx)
#### [MODIFY] [useBugRaceGame.ts](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/bugrace/hooks/useBugRaceGame.ts)
#### [MODIFY] [BugRaceBoard.tsx](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/bugrace/BugRaceBoard.tsx)

## UI/UX Refinements (Pendentes)
### [KnucklebonesBoard](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/knucklebones/KnucklebonesBoard.tsx)
- [ ] Display current Stake and User Wallet in the game interface. (Já existe o display básico, mas verificar se precisa de ajuste visual).
- [ ] Update Game Over modal to show "Won X Coins" or "Lost X Coins". (Já implementado).

### [TicTacToeBoard](file:///c:/Users/danie/rpg_tavern_games/RPG_Tavern_Games/games/tictactoe/TicTacToeBoard.tsx)
- [x] Display current Stake and User Wallet in the game interface.
- [x] Update Game Over modal to show "Won X Coins" or "Lost X Coins".
- [x] Add "Exit to Lobby" button in Game Over modal.

# Bug Derby Restoration & Stabilization
### ✅ Concluído
- Sincronização de corrida corrigida (Host dita as posições).
- Lógica de payout ajustada para ganho líquido no placar.
- Linha de chegada visual e lógica sincronizadas.

## Próximos Passos (Sugeridos)
1. **Testar Multiplayer:** Abrir duas abas (uma normal, uma anônima) e testar a conexão.
2. **Deploy:** Subir para o Cloudflare Pages.
3. **Histórico:** Salvar o resultado das partidas na tabela `matches`.
