import React from 'react';
import { Piece } from '../types';
import { COLORS } from '../constants';

interface SinglePieceProps {
    piece: Piece | null;
}

const SinglePiece: React.FC<SinglePieceProps> = ({ piece }) => {
    const gridSize = 4;
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    if (piece) {
        const shape = piece.shape;
        const yOffset = Math.floor((gridSize - shape.length) / 2);
        const xOffset = Math.floor((gridSize - shape[0].length) / 2);
        
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell !== 0) {
                    grid[y + yOffset][x + xOffset] = piece.color;
                }
            });
        });
    }

    return (
        <div 
            className="grid gap-px mx-auto bg-slate-700"
            style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                width: '60px',
                height: '60px',
            }}
        >
            {grid.map((row, y) => 
                row.map((cell, x) => (
                    <div 
                        key={`${y}-${x}`} 
                        style={{ backgroundColor: COLORS[cell] || 'transparent' }} 
                    />
                ))
            )}
        </div>
    );
};

interface PiecePreviewProps {
    queue: Piece[];
}

const PiecePreview: React.FC<PiecePreviewProps> = ({ queue }) => {
    // Show up to 5 upcoming pieces
    const piecesToShow = queue.slice(0, 5);

    return (
        <div className="bg-slate-800 p-4 rounded-lg border-2 border-slate-700">
            <h3 className="text-lg font-bold mb-3 text-center text-cyan-400">NEXT</h3>
            <div className="flex flex-col items-center gap-2">
                {piecesToShow.length > 0 ? (
                    piecesToShow.map((p, i) => (
                        <React.Fragment key={i}>
                            <SinglePiece piece={p} />
                            {i < piecesToShow.length - 1 && <div className="w-1/2 h-px bg-slate-700 my-1"></div>}
                        </React.Fragment>
                    ))
                ) : (
                    <div className="h-[60px] flex items-center justify-center">
                        <p className="text-slate-500 text-sm">...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PiecePreview;