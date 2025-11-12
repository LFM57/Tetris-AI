import { BoardState, Piece } from '../types';
import { isValidMove, rotate, hardDrop } from './gameLogic';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

export interface Move {
    x: number;
    shape: number[][];
    score: number;
}

const HEURISTIC_WEIGHTS = {
    aggregateHeight: -0.510066,
    completedLines: 0.760666,
    holes: -0.35663,
    bumpiness: -0.184483,
};

function evaluateBoard(board: BoardState, maxHeightAllowed: number, isTetrisMode: boolean, isAfraidOfHoles: boolean): number {
    let aggregateHeight = 0;
    let completedLines = 0;
    let holes = 0;
    let bumpiness = 0;

    const columnHeights = new Array(BOARD_WIDTH).fill(0);
    let maxHeight = 0;
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x] !== 0) {
                const height = BOARD_HEIGHT - y;
                columnHeights[x] = height;
                if (height > maxHeight) {
                    maxHeight = height;
                }
                break;
            }
        }
    }
    
    aggregateHeight = columnHeights.reduce((a, b) => a + b, 0);

    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
    }

    for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (board[y].every(cell => cell !== 0)) {
            completedLines++;
        }
    }

    for (let x = 0; x < BOARD_WIDTH; x++) {
        let blockFound = false;
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x] !== 0) {
                blockFound = true;
            } else if (blockFound) {
                holes++;
            }
        }
    }

    const heightPenalty = maxHeight > maxHeightAllowed
        ? Math.pow(maxHeight - maxHeightAllowed, 2) * 10
        : 0;
    
    let linesScore = HEURISTIC_WEIGHTS.completedLines * completedLines * completedLines;
    if (isTetrisMode && completedLines === 4) {
        linesScore *= 2; // Double reward for tetris
    }
    
    const holeWeight = isAfraidOfHoles ? HEURISTIC_WEIGHTS.holes * 5 : HEURISTIC_WEIGHTS.holes;

    return (
        HEURISTIC_WEIGHTS.aggregateHeight * aggregateHeight +
        linesScore +
        holeWeight * holes +
        HEURISTIC_WEIGHTS.bumpiness * bumpiness -
        heightPenalty
    );
}

// Finds the best placement for a single piece without looking ahead.
function findBestMoveForOnePiece(board: BoardState, piece: Piece, maxHeightAllowed: number, isTetrisMode: boolean, isAfraidOfHoles: boolean): Move {
    let bestMove: Move = { x: 0, shape: piece.shape, score: -Infinity };
    let currentShape = piece.shape;

    for (let r = 0; r < 4; r++) {
        for (let x = -2; x < BOARD_WIDTH; x++) {
            const tempPiece = { ...piece, shape: currentShape };
            if (isValidMove(board, tempPiece, { x, y: 0 })) {
                const { newBoard } = hardDrop(board, { ...tempPiece, pos: { x, y: 0 } });
                const score = evaluateBoard(newBoard, maxHeightAllowed, isTetrisMode, isAfraidOfHoles);
                if (score > bestMove.score) {
                    bestMove = { x, shape: currentShape, score };
                }
            }
        }
        currentShape = rotate(currentShape);
    }
    return bestMove;
}

// This function is the original findBestMove, performing a 1-piece lookahead.
function findBestMoveWith1Lookahead(board: BoardState, currentPiece: Piece, nextPiece: Piece, maxHeightAllowed: number, isTetrisMode: boolean, isAfraidOfHoles: boolean): Move {
    let bestMove: Move = { x: 0, shape: currentPiece.shape, score: -Infinity };
    let currentShape = currentPiece.shape;

    for (let r = 0; r < 4; r++) {
        for (let x = -2; x < BOARD_WIDTH; x++) {
            const testPiece = { ...currentPiece, shape: currentShape };
            if (isValidMove(board, testPiece, { x, y: 0 })) {
                const { newBoard } = hardDrop(board, { ...testPiece, pos: {x, y: 0} });
                const nextBestMove = findBestMoveForOnePiece(newBoard, nextPiece, maxHeightAllowed, isTetrisMode, isAfraidOfHoles);
                const finalScore = nextBestMove.score;

                if (finalScore > bestMove.score) {
                    bestMove = { x, shape: currentShape, score: finalScore };
                }
            }
        }
        currentShape = rotate(currentShape);
    }
    return bestMove;
}

function calculateBestScoreForState(board: BoardState, pieces: Piece[], maxHeightAllowed: number, isTetrisMode: boolean, isAfraidOfHoles: boolean): number {
    if (pieces.length === 0) {
        return evaluateBoard(board, maxHeightAllowed, isTetrisMode, isAfraidOfHoles);
    }

    const piece = pieces[0];
    const remainingPieces = pieces.slice(1);
    let bestScore = -Infinity;
    let currentShape = piece.shape;

    for (let r = 0; r < 4; r++) {
        for (let x = -2; x < BOARD_WIDTH; x++) {
            const tempPiece = { ...piece, shape: currentShape };
            if (isValidMove(board, tempPiece, { x, y: 0 })) {
                const { newBoard } = hardDrop(board, { ...tempPiece, pos: { x, y: 0 } });
                const score = calculateBestScoreForState(newBoard, remainingPieces, maxHeightAllowed, isTetrisMode, isAfraidOfHoles);
                if (score > bestScore) {
                    bestScore = score;
                }
            }
        }
        currentShape = rotate(currentShape);
    }
    return bestScore;
}

function findBestMoveRecursive(board: BoardState, pieces: Piece[], maxHeightAllowed: number, isTetrisMode: boolean, isAfraidOfHoles: boolean): Move {
    const currentPiece = pieces[0];
    const remainingPieces = pieces.slice(1);
    let bestMove: Move = { x: 0, shape: currentPiece.shape, score: -Infinity };
    let currentShape = currentPiece.shape;

    for (let r = 0; r < 4; r++) {
        for (let x = -2; x < BOARD_WIDTH; x++) {
            const testPiece = { ...currentPiece, shape: currentShape };
            if (isValidMove(board, testPiece, { x, y: 0 })) {
                const { newBoard } = hardDrop(board, { ...testPiece, pos: {x, y: 0} });
                const futureScore = calculateBestScoreForState(newBoard, remainingPieces, maxHeightAllowed, isTetrisMode, isAfraidOfHoles);

                if (futureScore > bestMove.score) {
                    bestMove = { x, shape: currentShape, score: futureScore };
                }
            }
        }
        currentShape = rotate(currentShape);
    }
    return bestMove;
}

export function findBestMove(board: BoardState, currentPiece: Piece, pieceQueue: Piece[], maxHeightAllowed: number, isTetrisMode: boolean, isAfraidOfHoles: boolean): Move {
    if (pieceQueue.length === 0) {
        return findBestMoveForOnePiece(board, currentPiece, maxHeightAllowed, isTetrisMode, isAfraidOfHoles);
    }
    if (pieceQueue.length === 1) {
        return findBestMoveWith1Lookahead(board, currentPiece, pieceQueue[0], maxHeightAllowed, isTetrisMode, isAfraidOfHoles);
    }

    const piecesToConsider = [currentPiece, ...pieceQueue];
    return findBestMoveRecursive(board, piecesToConsider, maxHeightAllowed, isTetrisMode, isAfraidOfHoles);
}

export function findRandomMove(board: BoardState, piece: Piece): Move | null {
    const possibleMoves: { x: number; shape: number[][] }[] = [];
    let currentShape = piece.shape;

    for (let r = 0; r < 4; r++) {
        for (let x = -2; x < BOARD_WIDTH; x++) {
            const tempPiece = { ...piece, shape: currentShape };
            if (isValidMove(board, tempPiece, { x, y: 0 })) {
                possibleMoves.push({ x, shape: currentShape });
            }
        }
        currentShape = rotate(currentShape);
    }

    if (possibleMoves.length === 0) {
        const move = findBestMoveForOnePiece(board, piece, BOARD_HEIGHT, false, false); // Fallback doesn't use tetris mode or hole aversion
        if(move.score === -Infinity) return null;
        return move;
    }

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    const randomChoice = possibleMoves[randomIndex];

    return { ...randomChoice, score: 0 };
}