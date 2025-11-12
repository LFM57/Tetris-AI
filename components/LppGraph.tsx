import React from 'react';

interface LppGraphProps {
    history: number[];
}

const BEST_LPP = 0.75;
const MAX_HISTORY_POINTS = 50;

const LppGraph: React.FC<LppGraphProps> = ({ history }) => {
    const data = history.slice(-MAX_HISTORY_POINTS);
    
    if (data.length < 2) {
        return (
            <div className="mt-4">
                <h4 className="text-md font-bold mb-2 text-center text-cyan-400/80">LPP EVOLUTION</h4>
                <div className="w-full h-[150px] bg-slate-900 rounded flex items-center justify-center text-center p-2">
                    <p className="text-slate-500 text-xs">
                        {history.length === 0 ? "Game has not started." : "Need more data for graph."}
                    </p>
                </div>
            </div>
        );
    }
    
    const currentLpp = data[data.length - 1];
    
    const width = 200;
    const height = 150;
    const padding = { top: 10, right: 25, bottom: 10, left: 10 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxY = Math.max(BEST_LPP, ...data) * 1.2;
    const minY = 0;

    const getX = (index: number) => (index / (data.length - 1)) * chartWidth + padding.left;
    const getY = (value: number) => height - padding.bottom - ((value - minY) / (maxY - minY)) * chartHeight;
    
    const pathData = data.map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(2)} ${getY(point).toFixed(2)}`).join(' ');
    
    const currentLppY = getY(currentLpp);
    const bestLppY = getY(BEST_LPP);

    return (
        <div className="mt-4 group">
            <h4 className="text-md font-bold mb-2 text-center text-cyan-400/80">LPP EVOLUTION</h4>
            <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full bg-slate-900 rounded transition-transform duration-300 ease-in-out group-hover:scale-125 group-hover:z-10 relative" 
                aria-label="LPP Performance Graph"
            >
                {/* Y-axis labels and grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const y = getY(maxY * ratio);
                    const value = maxY * ratio;
                    if (value < minY || y < padding.top) return null;
                    return (
                        <g key={ratio}>
                            <line x1={padding.left} y1={y} x2={width-padding.right} y2={y} stroke="#334155" strokeWidth="0.5" />
                            <text x={width - padding.right + 3} y={y} fill="#94a3b8" fontSize="6" dominantBaseline="middle">
                                {value.toFixed(1)}
                            </text>
                        </g>
                    )
                })}
                
                {/* Best LPP line */}
                {BEST_LPP < maxY && getY(BEST_LPP) > padding.top && (
                    <g>
                        <line x1={padding.left} y1={bestLppY} x2={width-padding.right} y2={bestLppY} stroke="#f43f5e" strokeWidth="0.75" strokeDasharray="2 2" />
                        <text x={padding.left + 5} y={bestLppY - 5} fill="#f43f5e" fontSize="6">Best LPP ({BEST_LPP.toFixed(1)})</text>
                    </g>
                )}

                {/* Avg LPP line */}
                {getY(currentLpp) > padding.top && (
                     <g>
                        <line x1={padding.left} y1={currentLppY} x2={width-padding.right} y2={currentLppY} stroke="#facc15" strokeWidth="0.75" strokeDasharray="2 2" />
                        <text x={padding.left + 5} y={currentLppY + (currentLppY < bestLppY + 10 ? 10 : -5)} fill="#facc15" fontSize="6">Actutal LPP ({currentLpp.toFixed(2)})</text>
                    </g>
                )}

                {/* LPP history path */}
                <path d={pathData} stroke="#22d3ee" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
        </div>
    );
};

export default LppGraph;