export type TetrominoShape = (0 | number)[][];
export type BoardState = (0 | number)[][];

export interface Coords {
    x: number;
    y: number;
}

export interface Piece {
    shape: TetrominoShape;
    color: number;
    pos: Coords;
    rotation: number;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Insane';

export type PieceName = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';
export type PieceStats = { [key in PieceName]: number };