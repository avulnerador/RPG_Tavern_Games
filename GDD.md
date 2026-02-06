# 📜 Ossos da Taverna (Taverna RPG) - GDD & Relatório Técnico

## 1. Visão Geral do Projeto
**Ossos da Taverna** é uma plataforma web de *minigames* multiplayer com temática de fantasia medieval sombria (Dark Fantasy). A aplicação simula uma experiência de taverna onde viajantes (jogadores) se encontram para apostar moedas e disputar jogos de azar e estratégia.

O foco principal é a **imersão**, utilizando uma UI rica, efeitos sonoros (planejado), animações fluidas e uma paleta de cores baseada em madeira, pergaminho e ouro.

---

## 2. Arquitetura Técnica

### Stack Tecnológico
*   **Frontend:** React 19, TypeScript, Vite.
*   **Estilização:** Tailwind CSS (Utilitários), Framer Motion (Animações complexas).
*   **Backend / Realtime:** Supabase (Broadcast Channels).
*   **Assets:** Lucide React (Ícones), DiceBear (Avatares procedurais).

### Estrutura de Conexão (Netcode)
O jogo utiliza um modelo híbrido **Host-Client** via WebSockets (Supabase Realtime Broadcast):
1.  **Modo Offline (Local):** Toda a lógica roda no navegador. Oponente é simulado ou "pass-and-play".
2.  **Modo Online:**
    *   Não há um servidor de jogo autoritativo tradicional (backendless logic).
    *   O **Host** (criador da sala) detém a "verdade" do estado do jogo (Physics, RNG, Turnos).
    *   O Host transmite eventos (`state_update`, `race_tick`) para os **Guests**.
    *   Os Guests enviam inputs (`make_move`, `place_bet`) para o Host processar.

---

## 3. Fluxo do Usuário (UX)

1.  **Profile Setup:** O usuário insere um "Nome de Viajante" e escolhe um Avatar (Semente procedimental). Perfil salvo no `localStorage`.
2.  **Game Hub (Lobby):** Uma tela estilo "Mural de Missões" onde o jogador escolhe entre os jogos disponíveis.
    *   Opção de **Criar Sala** (Gera um código de 4 letras).
    *   Opção de **Entrar em Sala** (Digita o código).
3.  **Sessão de Jogo:** O tabuleiro carrega. O estado é sincronizado.
4.  **Fim de Jogo:** Tela de vitória/derrota com opção de revanche (Rematch).

---

## 4. Detalhamento dos Jogos

### 🎲 A. Ossos da Taverna (Knucklebones)
*Inspirado no minigame de Cult of the Lamb.*

**Mecânica Principal:**
*   Tabuleiro 3x3 para cada jogador.
*   Jogadores rolam um D6 por turno.
*   **Colocação:** O jogador escolhe uma coluna para colocar o dado.
*   **Combos (Multiplicador):** Dados de mesmo valor na mesma coluna somam seus valores e são multiplicados pelo número de dados (Ex: 6 e 6 = 12 * 2 = 24).
*   **Destruição:** Se você colocar um dado (ex: 5) numa coluna onde o oponente já tem um ou mais dados de valor 5, os dados do oponente são destruídos (removidos).
*   **Fim de Jogo:** Quando um jogador preenche todas as 9 casas. Vence quem tiver a maior pontuação total.

**Estado Atual:**
*   ✅ Lógica de pontuação e destruição completa.
*   ✅ Animações de dados rolando e sendo destruídos.
*   ✅ Perspectiva corrigida (Jogador local sempre à esquerda/baixo).
*   ✅ Multiplayer sincronizado.

### 🔥 B. Duelo de Grimórios (Tic-Tac-Toe Místico)
*O clássico Jogo da Velha com uma "skin" de duelo mágico.*

**Mecânica Principal:**
*   Grid 3x3.
*   Jogadores alternam entre Runas de Fogo (X) e Runas de Gelo (O).
*   Vence quem alinhar 3 runas.

**Estado Atual:**
*   ✅ Lógica básica funcional.
*   ✅ Efeitos visuais de partículas ao marcar casas.
*   ⚠️ *Falta implementar:* Poderes especiais (ex: roubar casa, bloquear) para diferenciar do jogo da velha comum.

### 🐌 C. Derby da Carapaça (Bug Race)
*Jogo de aposta e observação (Auto-battler/Racer).*

**Mecânica Principal:**
*   4 Insetos com atributos diferentes (Velocidade Base vs. Volatilidade).
    *   *Tanque:* Lento, mas constante.
    *   *Barata Turbo:* Rápida, mas para muito para "descansar".
*   **Fases:**
    1.  **Apostas:** Jogadores gastam moedas virtuais para apostar no vencedor.
    2.  **Corrida:** O Host simula a corrida quadro a quadro. Eventos aleatórios ocorrem (Dormir, Turbo).
    3.  **Resultados:** Pagamento das apostas (Dobro ou nada).

**Estado Atual:**
*   ✅ Simulação de corrida via `requestAnimationFrame` no Host.
*   ✅ Sincronização de posição dos insetos em tempo real.
*   ✅ Sistema de apostas multiplayer funcional.
*   ✅ Bots (NPCs) para inflar o pote de apostas.

---

## 5. Relatório de Desenvolvimento

### ✅ O que foi feito (Concluído)
1.  **Core da Aplicação:** Configuração do Vite, Tailwind e Roteamento manual de estados.
2.  **Sistema de Salas:** Lógica de `supabase.channel` para criar salas efêmeras.
3.  **UI/UX:** Tema consistente "Dark Wood/Tavern". Componentes reutilizáveis.
4.  **Knucklebones:**
    *   Correção crítica de layout (Grid espelhado para convidados).
    *   Otimização de performance (Extração de componentes para evitar re-render global).
5.  **Bug Race:** Implementação completa da lógica de apostas e sincronização de movimento.

### 🚧 O que falta fazer (Roadmap / Backlog)
1.  **Persistência de Dados (Database):**
    *   Atualmente, moedas e histórico são perdidos ao recarregar a página (apenas `localStorage` básico).
    *   *Necessário:* Tabela `profiles` e `matches` no Supabase para histórico de partidas.
2.  **Chat da Mesa:**
    *   Adicionar um chat de texto rápido ou emojis para interação entre jogadores.
3.  **Melhorias Mobile:**
    *   O *Bug Race* e o *Knucklebones* ficam apertados em telas muito pequenas (iPhone SE). Ajustar escalas.
4.  **Sistema de Reconexão:**
    *   Se o usuário der F5, ele perde a conexão com a sala. Implementar "Heartbeat" ou recuperação de sessão.
5.  **Duelo de Grimórios 2.0:**
    *   Transformar o Jogo da Velha em "Ultimate Tic Tac Toe" ou adicionar cartas de habilidade.

---

## 6. Como Rodar o Projeto

### Pré-requisitos
*   Node.js instalado.
*   Conta no Supabase (para multiplayer online).

### Instalação
1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie um arquivo `.env` na raiz (opcional para modo local, obrigatório para online):
    ```env
    VITE_SUPABASE_URL=sua_url
    VITE_SUPABASE_ANON_KEY=sua_key
    ```
4.  Rode o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

### Modo Offline
Se as chaves do Supabase não forem fornecidas, o jogo utilizará o `MockChannel` (definido em `services/supabase.ts`), permitindo testar a UI e a lógica de jogo localmente sem conexão com a internet.
