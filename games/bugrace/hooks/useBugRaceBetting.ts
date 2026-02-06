
import { useState, useRef, useCallback } from 'react';
import { PlayerBet, NpcBet, BugRaceConfig } from '../types';

export const useBugRaceBetting = (
    minBet: number,
    myId: string,
    myCoinsProfile: number,
    onUpdateCoins: (amount: number) => void
) => {
    // --- STATE ---
    const [players, setPlayers] = useState<PlayerBet[]>([]);
    const [npcBets, setNpcBets] = useState<NpcBet[]>([]);
    const [myBetAmount, setMyBetAmount] = useState(minBet);
    const [mySelectedBug, setMySelectedBug] = useState<string | null>(null);

    // Track coins locally for reactive UI
    const [myCoins, setLocalCoins] = useState(myCoinsProfile);
    const hasPaidBetRef = useRef(false);
    const hasReceivedPayoutRef = useRef(false);

    // --- ODDS CALCULATION ---
    const calculateOdds = (bugId: string, currentPlayers: PlayerBet[], currentNpcBets: NpcBet[]) => {
        const totalPool = currentPlayers.reduce((acc, p) => acc + (p.betAmount || 0), 0) +
            currentNpcBets.reduce((acc, n) => acc + n.amount, 0);

        const bugPool = currentPlayers.filter(p => p.betBugId === bugId).reduce((acc, p) => acc + (p.betAmount || 0), 0) +
            currentNpcBets.filter(n => n.bugId === bugId).reduce((acc, n) => acc + n.amount, 0);

        // Margin for the tavern (15%)
        const tavernMargin = 0.15;
        const availablePool = totalPool * (1 - tavernMargin);

        if (totalPool === 0) return 2.0; // Default for no bets at all

        if (bugPool === 0) {
            // If no one bet on this bug, it should have high odds but not infinite.
            // Let's assume a virtual 5 coin bet to calculate a "theoretical" odd.
            const virtualOdds = availablePool / Math.max(5, totalPool * 0.05);
            return Math.min(10.0, Math.max(2.0, parseFloat(virtualOdds.toFixed(2))));
        }

        let odds = availablePool / bugPool;

        // Realistic caps: 1.1x min (always make something), 10x max (longshot)
        if (odds < 1.1) odds = 1.1;
        if (odds > 10.0) odds = 10.0;

        return parseFloat(odds.toFixed(2));
    };

    // --- ACTIONS ---
    const placeBet = (bugId: string, amount: number) => {
        if (amount < minBet) return;
        setMySelectedBug(bugId);
        setMyBetAmount(amount);

        // Optimistic UI update for player list
        setPlayers(prev => prev.map(p => {
            if (p.playerId === myId) {
                return { ...p, betBugId: bugId, betAmount: amount };
            }
            return p;
        }));
    };

    const generateNPCBets = (density: BugRaceConfig['npcDensity'], minBet: number) => {
        const bugs = ['tank', 'speedster', 'void', 'golden'];
        const bets: NpcBet[] = [];
        let count = 0;
        switch (density) {
            case 'low': count = 3; break;
            case 'medium': count = 8; break;
            case 'high': count = 15; break;
            case 'none': default: count = 0; break;
        }

        for (let i = 0; i < count; i++) {
            const bug = bugs[Math.floor(Math.random() * bugs.length)];
            const amount = Math.floor(Math.random() * 5 + 1) * minBet;
            bets.push({ bugId: bug, amount });
        }
        return bets;
    };

    // --- WALLET INTEGRATION ---
    const processBetDeduction = () => {
        if (mySelectedBug && myBetAmount > 0 && !hasPaidBetRef.current) {
            hasPaidBetRef.current = true;
            const newBalance = myCoins - myBetAmount;
            setLocalCoins(newBalance);
            onUpdateCoins(newBalance);
            console.log(`💰 [BUG_RACE] Bet deducted: ${myBetAmount}.`);
            return true;
        }
        return false;
    };

    const processPayout = (winnerId: string): number => {
        if (hasReceivedPayoutRef.current) return 0;
        hasReceivedPayoutRef.current = true;

        let delta = 0;
        if (mySelectedBug === winnerId) {
            const finalOdds = calculateOdds(winnerId, players, npcBets);
            delta = Math.floor(myBetAmount * finalOdds);

            const newBalance = myCoins + delta;
            setLocalCoins(newBalance);
            onUpdateCoins(newBalance);
            console.log(`💰 [BUG_RACE] Won ${delta} coins!`);
        } else if (mySelectedBug) {
            delta = -myBetAmount;
            console.log(`💰 [BUG_RACE] Lost bet.`);
        }
        return delta;
    };

    const resetBettingState = () => {
        hasPaidBetRef.current = false;
        hasReceivedPayoutRef.current = false;
        setMySelectedBug(null);
    };

    // Helper to sync local state from parent prop
    const syncWalletRef = (coins: number) => {
        setLocalCoins(coins);
    };

    return {
        players, setPlayers,
        npcBets, setNpcBets,
        myBetAmount, setMyBetAmount,
        mySelectedBug, setMySelectedBug,
        myCoins,
        calculateOdds,
        placeBet,
        generateNPCBets,
        processBetDeduction,
        processPayout,
        resetBettingState,
        syncWalletRef
    };
};
