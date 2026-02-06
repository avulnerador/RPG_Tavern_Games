# Tarefas - RPG Tavern Games

- [/] **Planejamento Inicial e Organização**
    - [x] Criar estrutura de arquivos de planejamento (antigravity/)
    - [x] Verificar e padronizar dependências (Tailwind CSS v3)
    - [x] Organizar estrutura de pastas do projeto (se necessário)

- [/] **Ambiente Local e Correções**
    - [x] Verificar execução local (Build Verificado)
    - [x] Garantir que o modo offline (MockChannel) funciona perfeitamente
    - [x] Identificar e corrigir bugs nos minigames (Corrigido lógica de entrada em sala)

- [/] **Integração com Supabase (Online)**
    - [x] **Global Wallet System**
    - [x] Add `coins` to `UserProfile`.
    - [x] Implement persistent wallet in `App.tsx` (localStorage).
    - [x] Align Finish Line visual with Win Condition
- [/] Sync Race Narration for Host and Guests
- [/] Fix Guest Wallet Deduction/Payout sync
- [x] Implement Final Scoreboard with Ranking
- [x] **Bug Race Enhancements**
    - [x] Implement Pari-mutuel Betting (Dynamic Odds).
    - [x] Integrate Global Wallet for bets/payouts.
    - [x] Update UI to show dynamic odds and odds controls.
- [x] **1v1 Betting Implementation**
    - [x] Add `stake` to `TableSession`.
    - [x] Implement Stake Logic in `Knucklebones` (Deduct on start, Payout on win).
    - [x] Implement Stake Logic in `TicTacToe` (Deduct on start, Payout on win).
    - [x] Update UI to show Stake/Pot.s de NPCs e Odds Configuráveis
    - [x] Bug Race: Multiplayer, Apostas e Odds
    - [x] Bug Race: Painel de Controle do Mestre (Configuração de Jogo)
    - [x] Bug Race: Apostas de NPCs e Odds Configuráveis
    - [x] Bug Race: Correção Visual de Vencedor
    - [ ] Sistema: Carteira Global (Moedas persistentes)
    - [ ] Bug Race: Sistema de Odds Dinâmicas (Pari-mutuel)
    - [ ] Games 1x1: Sistema de Aposta (Knucklebones & Jogo da Velha)

- [x] **Deploy e Automação**
    - [x] Proteger credenciais (.gitignore)
    - [x] Git Push (Atualizado e Enviado)

- [ ] **Integração VTT (Foundry) - [ADIADO/FUTURO]**
    - [ ] Planejar arquitetura de integração (Iframe / Browser window)
    - [ ] Criar mecanismo de geração de links para o Foundry
