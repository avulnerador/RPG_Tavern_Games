import { Die, Grid } from '../types';

export const MAX_DICE_PER_COLUMN = 3;

/**
 * Calculates the score for a single column based on Knucklebones rules.
 * Rule: Sum of dice * (Count of dice with same value).
 * Example: [4, 4, 2] -> (4+4)*2 + 2 = 16 + 2 = 18.
 */
export const calculateColumnScore = (column: Die[]): number => {
  const counts: Record<number, number> = {};
  
  column.forEach(die => {
    counts[die.value] = (counts[die.value] || 0) + 1;
  });

  let score = 0;
  column.forEach(die => {
    // If there are 2 dice of value 4, each contributes 4 * 2 = 8 to the total.
    // Total for those two is 16.
    score += die.value * counts[die.value];
  });

  return score;
};

export const calculateTotalScore = (grid: Grid): number => {
  return grid.reduce((acc, col) => acc + calculateColumnScore(col), 0);
};

export const isBoardFull = (grid: Grid): boolean => {
  return grid.every(col => col.length >= MAX_DICE_PER_COLUMN);
};

export const generateDieValue = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};
