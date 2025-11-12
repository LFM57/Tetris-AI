import { BoardState, Piece, TetrominoShape, Coords } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

export const createEmptyBoard = (): BoardState => 
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

export const rotate = (shape: TetrominoShape): TetrominoShape => {
    const rows = shape.length;
    const cols = shape[0].length;
    const newShape: TetrominoShape = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            newShape[col][rows - 1 - row] = shape[row][col];
        }
    }
    return newShape;
};

export const isValidMove = (board: BoardState, piece: Piece, pos: Coords): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const newX = pos.x + x;
                const newY = pos.y + y;

                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return false;
                }
                if (newY >= 0 && board[newY][newX] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
};

export const getFinalY = (board: BoardState, piece: Piece): number => {
    let y = piece.pos.y;
    while (isValidMove(board, piece, { x: piece.pos.x, y: y + 1 })) {
        y++;
    }
    return y;
};

export const hardDrop = (board: BoardState, piece: Piece): { newBoard: BoardState; finalY: number } => {
    const finalY = getFinalY(board, piece);

    const newBoard = JSON.parse(JSON.stringify(board));
    piece.shape.forEach((row, rowY) => {
        row.forEach((cell, cellX) => {
            if (cell !== 0) {
                const boardX = piece.pos.x + cellX;
                const boardY = finalY + rowY;
                if (boardY >= 0) {
                    newBoard[boardY][boardX] = piece.color;
                }
            }
        });
    });

    return { newBoard, finalY };
};