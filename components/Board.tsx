import React from 'react';
import { BoardState, Piece } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, COLORS } from '../constants';

interface BoardProps {
    board: BoardState;
    currentPiece: Piece | null;
    ghostPiece: Piece | null;
    isPaused: boolean;
}

const Board: React.FC<BoardProps> = ({ board, currentPiece, ghostPiece, isPaused }) => {
    
    const displayBoard = JSON.parse(JSON.stringify(board));

    if (ghostPiece) {
        ghostPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell !== 0) {
                    const boardX = ghostPiece.pos.x + x;
                    const boardY = ghostPiece.pos.y + y;
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH && displayBoard[boardY][boardX] === 0) {
                        displayBoard[boardY][boardX] = -1; // Special value for ghost piece
                    }
                }
            });
        });
    }

    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell !== 0) {
                    const boardX = currentPiece.pos.x + x;
                    const boardY = currentPiece.pos.y + y;
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                        displayBoard[boardY][boardX] = currentPiece.color;
                    }
                }
            });
        });
    }

    return (
        <div className="relative">
            <div 
                className="grid gap-px bg-slate-700 border-4 border-slate-700 shadow-2xl shadow-cyan-500/20 rounded-md overflow-hidden"
                style={{
                    gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                    gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
                    width: 'min(40vh, 300px)',
                    height: 'min(80vh, 600px)',
                }}
            >
                {displayBoard.map((row, y) => 
                    row.map((cell, x) => (
                        <div 
                            key={`${y}-${x}`} 
                            className="w-full h-full"
                            style={{ 
                                backgroundColor: cell === -1 
                                    ? 'rgba(255, 255, 255, 0.2)' 
                                    : (COLORS[cell] || '#1e293b' /* bg-slate-800 */)
                            }}
                        />
                    ))
                )}
            </div>
            {isPaused && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md" aria-hidden="true">
                    <h2 className="text-3xl font-bold text-cyan-400 tracking-widest animate-pulse">PAUSED</h2>
                </div>
            )}
        </div>
    );
};

export default Board;