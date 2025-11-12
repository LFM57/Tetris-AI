import { Difficulty, PieceStats, PieceName } from "./types";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const PIECES: { [key in PieceName]: { shape: number[][]; color: number } } = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: 1
    },
    O: {
        shape: [[2, 2], [2, 2]],
        color: 2
    },
    T: {
        shape: [[0, 3, 0], [3, 3, 3]],
        color: 3
    },
    L: {
        shape: [[0, 0, 4], [4, 4, 4]],
        color: 4
    },
    J: {
        shape: [[5, 0, 0], [5, 5, 5]],
        color: 5
    },
    S: {
        shape: [[0, 6, 6], [6, 6, 0]],
        color: 6
    },
    Z: {
        shape: [[7, 7, 0], [0, 7, 7]],
        color: 7
    },
};

export const PIECE_NAMES = Object.keys(PIECES) as PieceName[];

export const INITIAL_PIECE_STATS: PieceStats = {
    I: 0,
    O: 0,
    T: 0,
    L: 0,
    J: 0,
    S: 0,
    Z: 0,
};

export const COLORS = [
    '#1e293b',    // 0: bg-slate-800
    '#22d3ee',    // 1: I - cyan-400
    '#facc15',    // 2: O - yellow-400
    '#a78bfa',    // 3: T - violet-400
    '#fb923c',    // 4: L - orange-400
    '#60a5fa',    // 5: J - blue-400
    '#4ade80',    // 6: S - green-400
    '#f43f5e',    // 7: Z - rose-500
];

export const DIFFICULTIES: {
    [key in Difficulty]: { speed: number; maxHeight: number };
} = {
    Easy: {
        speed: 800,
        maxHeight: 20,
    },
    Medium: {
        speed: 500,
        maxHeight: 18,
    },
    Hard: {
        speed: 250,
        maxHeight: 16,
    },
    Insane: {
        speed: 100,
        maxHeight: 14,
    },
};