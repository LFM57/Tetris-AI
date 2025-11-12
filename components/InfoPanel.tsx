import React from 'react';
import { Difficulty } from '../types';

interface InfoPanelProps {
    score: number;
    linesCleared: number;
    difficulty: Difficulty;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ score, linesCleared, difficulty }) => {
    return (
        <div className="bg-slate-800 p-4 rounded-lg border-2 border-slate-700 text-lg space-y-3">
            <div>
                <span className="text-slate-400">Score:</span>
                <p className="font-bold text-2xl text-cyan-400">{score}</p>
            </div>
            <div>
                <span className="text-slate-400">Lines:</span>
                <p className="font-bold text-2xl text-cyan-400">{linesCleared}</p>
            </div>
            <div>
                <span className="text-slate-400">Speed:</span>
                <p className="font-bold text-2xl text-cyan-400">{difficulty}</p>
            </div>
        </div>
    );
};

export default InfoPanel;