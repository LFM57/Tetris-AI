import React from 'react';
import { PieceStats, PieceName } from '../types';
import { PIECES, COLORS, PIECE_NAMES } from '../constants';
import LppGraph from './LppGraph';

interface StatisticsPanelProps {
    totalPiecesPlaced: number;
    linesCleared: number;
    gameTime: number; // in seconds
    pieceStats: PieceStats;
    lppHistory: number[];
    rollingLpp: number;
}

const MiniPiece: React.FC<{ pieceName: PieceName }> = ({ pieceName }) => {
    const pieceData = PIECES[pieceName];
    if (!pieceData) return null;

    const shape = pieceData.shape;
    const color = pieceData.color;

    const gridSize = shape.length > 2 || shape[0].length > 2 ? 4 : 3;
    const yOffset = Math.floor((gridSize - shape.length) / 2);
    const xOffset = Math.floor((gridSize - shape[0].length) / 2);

    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell !== 0) {
                grid[y + yOffset][x + xOffset] = color;
            }
        });
    });

    return (
        <div 
            className="grid gap-px" 
            style={{ 
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                width: '32px',
                height: '32px'
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


const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ totalPiecesPlaced, linesCleared, gameTime, pieceStats, lppHistory, rollingLpp }) => {
    const pps = gameTime > 0 ? (totalPiecesPlaced / gameTime).toFixed(2) : '0.00';
    const lpp = rollingLpp.toFixed(2);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="bg-slate-800 p-4 rounded-lg border-2 border-slate-700 text-sm">
            <h3 className="text-lg font-bold mb-3 text-center text-cyan-400">STATS</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                <div>
                    <span className="text-slate-400">Time:</span>
                    <p className="font-bold text-lg text-cyan-400">{formatTime(gameTime)}</p>
                </div>
                <div>
                    <span className="text-slate-400">Pieces:</span>
                    <p className="font-bold text-lg text-cyan-400">{totalPiecesPlaced}</p>
                </div>
                <div>
                    <span className="text-slate-400">PPS:</span>
                    <p className="font-bold text-lg text-cyan-400">{pps}</p>
                </div>
                <div>
                    <span className="text-slate-400">LPP:</span>
                    <p className="font-bold text-lg text-cyan-400">{lpp}</p>
                </div>
            </div>
            
            <LppGraph history={lppHistory} />

            <h4 className="text-md font-bold mt-4 mb-2 text-center text-cyan-400/80">PIECE COUNT</h4>
            <div className="grid grid-cols-4 gap-y-2 items-center justify-items-center">
                 {PIECE_NAMES.map(name => (
                    <div key={name} className="flex flex-col items-center">
                        <MiniPiece pieceName={name} />
                        <span className="font-bold text-cyan-400 mt-1">{pieceStats[name]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatisticsPanel;