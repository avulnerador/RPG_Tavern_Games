
import { useState, useRef, useCallback } from 'react';
import { RacerState } from '../types';

const TRACK_LENGTH = 1000;

const BUG_STATS: Record<string, { base: number, vol: number }> = {
    'tank': { base: 0.38, vol: 0.05 },
    'speedster': { base: 0.55, vol: 0.8 },
    'void': { base: 0.42, vol: 0.3 },
    'golden': { base: 0.45, vol: 0.2 }
};

export const useBugRaceEngine = () => {
    const [racers, setRacers] = useState<RacerState[]>([]);
    const [winnerId, setWinnerId] = useState<string | null>(null);

    const racersRef = useRef<RacerState[]>([]);
    const isRacingRef = useRef(false);
    const requestRef = useRef<number>(0);

    const initializeRacers = () => {
        const initial: RacerState[] = ['tank', 'speedster', 'void', 'golden'].map(id => ({
            id, position: 0, status: 'running'
        }));
        setRacers(initial);
        racersRef.current = initial;
        setWinnerId(null);
        isRacingRef.current = true;
    };

    const stopRace = () => {
        isRacingRef.current = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    const generateCommentary = (currentRacers: RacerState[]) => {
        const leader = currentRacers.reduce((prev, curr) => (prev.position > curr.position) ? prev : curr);
        const sleeping = currentRacers.find(r => r.status === 'sleeping');
        if (sleeping) return `${sleeping.id.toUpperCase()} dormiu no ponto!`;
        return `${leader.id.toUpperCase()} lidera a disputa!`;
    };

    // The Game Loop
    const runGameLoop = (
        onTick: (racers: RacerState[], comment: string) => void,
        onFinish: (winnerId: string) => void
    ) => {
        if (!isRacingRef.current) return;

        const updatedRacers = racersRef.current.map(racer => {
            const stats = BUG_STATS[racer.id] || { base: 0.4, vol: 0.2 };
            let newStatus = racer.status;
            const eventRoll = Math.random();

            // Status Logic
            if (racer.status === 'running') {
                const sleepChance = 0.002 + (0.005 * stats.vol);
                if (eventRoll < sleepChance) newStatus = 'sleeping';
                else if (eventRoll > (1 - (0.005 + (0.01 * stats.vol)))) newStatus = 'boosting';
            } else if (racer.status === 'sleeping') {
                if (Math.random() < 0.02) newStatus = 'running';
            } else if (racer.status === 'boosting') {
                if (Math.random() < 0.05) newStatus = 'running';
            }

            // Movement
            let move = 0;
            const GLOBAL_SPEED = 1.2;

            if (newStatus === 'running') {
                const variance = 0.8 + (Math.random() * 0.4);
                move = stats.base * variance * GLOBAL_SPEED;
            } else if (newStatus === 'boosting') {
                move = stats.base * 2.5 * GLOBAL_SPEED;
            } else if (newStatus === 'sleeping') {
                move = 0;
            }

            // Rubber Banding
            const leaderPos = Math.max(...racersRef.current.map(r => r.position));
            if (leaderPos - racer.position > 150 && newStatus !== 'sleeping') {
                move *= 1.3;
            }

            return { ...racer, position: Math.min(TRACK_LENGTH, racer.position + move), status: newStatus };
        });

        racersRef.current = updatedRacers;
        setRacers(updatedRacers);

        // Check Winner (Win at 90% to match visual dotted line)
        const WIN_THRESHOLD = TRACK_LENGTH * 0.9;
        const winner = updatedRacers.find(r => r.position >= WIN_THRESHOLD);

        if (winner) {
            isRacingRef.current = false;
            setWinnerId(winner.id);
            onFinish(winner.id);
        } else {
            // Tick Callback (Throttled by caller if needed, but here simple)
            // We can randomize commentary update
            if (Math.random() < 0.1) {
                onTick(updatedRacers, generateCommentary(updatedRacers));
            }
            requestRef.current = requestAnimationFrame(() => runGameLoop(onTick, onFinish));
        }
    };

    return {
        racers, setRacers,
        winnerId, setWinnerId,
        initializeRacers,
        stopRace,
        runGameLoop,
        TRACK_LENGTH
    };
};
