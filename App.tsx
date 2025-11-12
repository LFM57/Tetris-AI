import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BoardState, Piece, Difficulty, PieceStats, PieceName } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, PIECES, DIFFICULTIES, PIECE_NAMES, INITIAL_PIECE_STATS } from './constants';
import { createEmptyBoard, hardDrop, isValidMove, getFinalY } from './services/gameLogic';
import { findBestMove, findRandomMove, Move } from './services/ai';
import Board from './components/Board';
import PiecePreview from './components/PiecePreview';
import InfoPanel from './components/InfoPanel';
import StatisticsPanel from './components/StatisticsPanel';

const App: React.FC = () => {
    const [board, setBoard] = useState<BoardState>(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
    const [pieceQueue, setPieceQueue] = useState<Piece[]>([]);
    const [ghostPiece, setGhostPiece] = useState<Piece | null>(null);
    const [bestMove, setBestMove] = useState<Move | null>(null);
    const [score, setScore] = useState(0);
    const [linesCleared, setLinesCleared] = useState(0);
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [gameActive, setGameActive] = useState(false);
    const [isBotKilled, setIsBotKilled] = useState(false);
    const [isHyperMode, setIsHyperMode] = useState(false);
    const [isTetrisMode, setIsTetrisMode] = useState(false);
    const [isAfraidOfHoles, setIsAfraidOfHoles] = useState(false);
    const [tetrisFlash, setTetrisFlash] = useState(false);

    // Stats
    const [totalPiecesPlaced, setTotalPiecesPlaced] = useState(0);
    const [gameTime, setGameTime] = useState(0);
    const [pieceStats, setPieceStats] = useState<PieceStats>(INITIAL_PIECE_STATS);
    const [lppHistory, setLppHistory] = useState<number[]>([]);
    const [recentLinesPerPiece, setRecentLinesPerPiece] = useState<number[]>([]);
    const [rollingLpp, setRollingLpp] = useState(0);
    
    const gameLoopTimeout = useRef<number | null>(null);
    const animationFrame = useRef<number | null>(null);
    
    const getRandomPiece = useCallback((): { piece: Piece; name: PieceName } => {
        const pieceName = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
        const shape = PIECES[pieceName].shape;
        const piece = {
            shape,
            color: PIECES[pieceName].color,
            pos: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2), y: 0 },
            rotation: 0,
        };
        return { piece, name: pieceName };
    }, []);

    const startGame = useCallback(() => {
        setGameActive(true);
        setIsGameOver(false);
        setIsPaused(false);
        setIsBotKilled(false);
        setBoard(createEmptyBoard());
        setScore(0);
        setLinesCleared(0);
        setTotalPiecesPlaced(0);
        setGameTime(0);
        setLppHistory([]);
        setRecentLinesPerPiece([]);
        setRollingLpp(0);

        const initialPieces = Array.from({ length: 6 }, () => getRandomPiece());
        setCurrentPiece(initialPieces[0].piece);
        setPieceQueue(initialPieces.slice(1).map(p => p.piece));

        const initialStats = { ...INITIAL_PIECE_STATS };
        initialPieces.forEach(({ name }) => initialStats[name]++);
        setPieceStats(initialStats);
    }, [getRandomPiece]);

    const togglePause = () => {
        if(isBotKilled) return;
        setIsPaused(prev => !prev);
    };

    const killBot = () => {
        setIsBotKilled(true);
        if (isPaused) {
            setIsPaused(false);
        }
    }

    const runGameCycle = useCallback(() => {
        if (isGameOver || !currentPiece || pieceQueue.length === 0 || !bestMove) return;
        
        const pieceAfterMove = { ...currentPiece, shape: bestMove.shape, pos: { x: bestMove.x, y: currentPiece.pos.y } };
        const { newBoard } = hardDrop(board, pieceAfterMove);

        let clearedLines = 0;
        let boardAfterClear = newBoard;

        const fullRows = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (boardAfterClear[y].every(cell => cell !== 0)) {
                fullRows.push(y);
            }
        }

        if (fullRows.length > 0) {
            clearedLines = fullRows.length;
            if (clearedLines === 4) {
                setTetrisFlash(true);
                setTimeout(() => setTetrisFlash(false), 2000);
            }
            boardAfterClear = boardAfterClear.filter((_, index) => !fullRows.includes(index));
            const newRows = Array.from({ length: clearedLines }, () => Array(BOARD_WIDTH).fill(0));
            boardAfterClear = [...newRows, ...boardAfterClear];
        }

        const newRecentLines = [...recentLinesPerPiece, clearedLines].slice(-51);
        setRecentLinesPerPiece(newRecentLines);

        const currentRollingLpp = newRecentLines.length > 0
            ? newRecentLines.reduce((a, b) => a + b, 0) / newRecentLines.length
            : 0;
        
        setRollingLpp(currentRollingLpp);
        setLppHistory(prev => [...prev, currentRollingLpp]);

        setLinesCleared(prev => prev + clearedLines);
        
        const linePoints = [0, 100, 300, 500, 800];
        setScore(prev => prev + linePoints[clearedLines]);

        setBoard(boardAfterClear);
        setTotalPiecesPlaced(prev => prev + 1);

        const { piece: newNextPiece, name: newNextName } = getRandomPiece();
        setPieceStats(prev => ({ ...prev, [newNextName]: prev[newNextName] + 1 }));

        const nextPieceInQueue = pieceQueue[0];
        if (!isValidMove(boardAfterClear, nextPieceInQueue, nextPieceInQueue.pos)) {
            setIsGameOver(true);
            setGameActive(false);
            return;
        }

        setCurrentPiece(pieceQueue[0]);
        setPieceQueue(prev => [...prev.slice(1), newNextPiece]);

    }, [board, currentPiece, pieceQueue, getRandomPiece, isGameOver, bestMove, recentLinesPerPiece]);
    
    useEffect(() => {
        if (!currentPiece || pieceQueue.length === 0 || isGameOver || isPaused || !gameActive) {
            setGhostPiece(null);
            return;
        };
    
        let move: Move | null;
        if (isBotKilled) {
            move = findRandomMove(board, currentPiece);
        } else {
            // For performance, God mode looks at the next 2 pieces (3-piece search total). Standard mode looks at 1 (2-piece search total).
            const lookaheadQueue = isHyperMode ? pieceQueue.slice(0, 2) : pieceQueue.slice(0, 1);
            move = findBestMove(board, currentPiece, lookaheadQueue, DIFFICULTIES[difficulty].maxHeight, isTetrisMode, isAfraidOfHoles);
        }
        setBestMove(move);
    
        if(move) {
            const pieceForGhost = { ...currentPiece, shape: move.shape, pos: { x: move.x, y: currentPiece.pos.y } };
            const finalY = getFinalY(board, pieceForGhost);
            setGhostPiece({ ...pieceForGhost, pos: { x: move.x, y: finalY } });
        }
    
    }, [currentPiece, pieceQueue, board, isGameOver, isPaused, gameActive, difficulty, isBotKilled, isHyperMode, isTetrisMode, isAfraidOfHoles]);

    useEffect(() => {
        if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);

        if (gameActive && !isGameOver && !isPaused) {
            const gameSpeed = isBotKilled ? 100 : DIFFICULTIES[difficulty].speed;
            gameLoopTimeout.current = window.setTimeout(() => {
                animationFrame.current = requestAnimationFrame(runGameCycle);
            }, gameSpeed);
        }

        return () => {
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
            if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        };
    }, [runGameCycle, isGameOver, isPaused, gameActive, difficulty, isBotKilled]);

    useEffect(() => {
        let timer: number | null = null;
        if (gameActive && !isPaused && !isGameOver) {
            timer = window.setInterval(() => setGameTime(prev => prev + 1), 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [gameActive, isPaused, isGameOver]);

    return (
        <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-mono">
            <h1 className="text-4xl font-bold mb-4 tracking-widest text-cyan-400">TETRIS AI</h1>
            <p className={`text-lg mb-6 transition-colors ${isBotKilled ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                {isBotKilled ? 'BOT TERMINATED. CHAOS MODE ENGAGED.' : 'AI is playing...'}
            </p>
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
                 <aside className="w-full lg:w-auto flex justify-center lg:justify-start">
                    <PiecePreview queue={pieceQueue} />
                </aside>
                <main className="relative">
                    <Board board={board} currentPiece={currentPiece} ghostPiece={ghostPiece} isPaused={isPaused} />
                    {tetrisFlash && (
                         <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <h2 className="text-6xl font-black text-rose-500 animate-pulse" style={{ textShadow: '0 0 15px rgba(244, 63, 94, 0.8)' }}>
                                TETRIS!
                            </h2>
                        </div>
                    )}
                </main>
                <aside className="w-full lg:w-[450px] flex flex-col gap-6">
                    <div className="flex flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-6">
                             <div className="bg-slate-800 p-4 rounded-lg border-2 border-slate-700">
                                <h3 className="text-lg font-bold mb-3 text-center text-cyan-400">SETTINGS</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            disabled={gameActive}
                                            className={`font-bold py-2 px-2 rounded-md transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${difficulty === d ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-cyan-400'} ${gameActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >{d.toUpperCase()}</button>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <label htmlFor="god-mode-toggle" className="font-bold text-cyan-400">
                                                God Mode AI
                                            </label>
                                            <div className="relative group flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <div className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 transform rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none border border-slate-700">
                                                    Allows the AI to see 2 additional pieces into the future (3-piece total lookahead). This enables more complex setups and improves long-term strategy. May slightly reduce game speed.
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">Smarter, deeper search.</p>
                                    </div>
                                    <button
                                        id="god-mode-toggle"
                                        role="switch"
                                        aria-checked={isHyperMode}
                                        onClick={() => setIsHyperMode(p => !p)}
                                        disabled={gameActive}
                                        className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 ${isHyperMode ? 'bg-cyan-500' : 'bg-slate-600'} ${gameActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isHyperMode ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <label htmlFor="tetris-mode-toggle" className="font-bold text-cyan-400">
                                                Full Tetris
                                            </label>
                                             <div className="relative group flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <div className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 transform rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none border border-slate-700">
                                                    Forces the AI to prioritize setting up and scoring Tetrises (4-line clears). This can lead to higher scores but may result in riskier board states and a lower overall LPP.
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">Prioritize tetrises.</p>
                                    </div>
                                    <button
                                        id="tetris-mode-toggle"
                                        role="switch"
                                        aria-checked={isTetrisMode}
                                        onClick={() => setIsTetrisMode(p => !p)}
                                        disabled={gameActive}
                                        className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 ${isTetrisMode ? 'bg-cyan-500' : 'bg-slate-600'} ${gameActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isTetrisMode ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <label htmlFor="afraid-mode-toggle" className="font-bold text-cyan-400">
                                                Afraid of Holes
                                            </label>
                                             <div className="relative group flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <div className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 transform rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none border border-slate-700">
                                                    Forces the AI to be extremely cautious about creating holes in the board. This often leads to a flatter, safer board but may sacrifice higher scoring opportunities.
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">Play it safe.</p>
                                    </div>
                                    <button
                                        id="afraid-mode-toggle"
                                        role="switch"
                                        aria-checked={isAfraidOfHoles}
                                        onClick={() => setIsAfraidOfHoles(p => !p)}
                                        disabled={gameActive}
                                        className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 ${isAfraidOfHoles ? 'bg-cyan-500' : 'bg-slate-600'} ${gameActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isAfraidOfHoles ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                            </div>
                            <InfoPanel score={score} linesCleared={linesCleared} difficulty={difficulty} />
                        </div>
                        <div className="flex-1 flex flex-col gap-6">
                           <StatisticsPanel 
                                totalPiecesPlaced={totalPiecesPlaced}
                                linesCleared={linesCleared}
                                gameTime={gameTime}
                                pieceStats={pieceStats}
                                lppHistory={lppHistory}
                                rollingLpp={rollingLpp}
                            />
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-2">
                        {!gameActive && (
                             <button
                                onClick={startGame}
                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-600"
                            >{isGameOver ? 'PLAY AGAIN' : 'START GAME'}</button>
                        )}

                        {gameActive && (
                            <div className="flex gap-2">
                                <button
                                    onClick={togglePause}
                                    className="flex-grow bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={isPaused ? 'Resume game' : 'Pause game'}
                                    disabled={isBotKilled}
                                >{isPaused ? 'RESUME' : 'PAUSE'}</button>
                                <button
                                    onClick={killBot}
                                    className="flex-grow bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 disabled:bg-rose-900 disabled:text-rose-600"
                                    disabled={isBotKilled}
                                >{isBotKilled ? 'BOT KILLED' : 'KILL BOT'}</button>
                            </div>
                        )}
                         {isGameOver && (
                            <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg text-center mt-2">
                                <h2 className="text-2xl font-bold">GAME OVER</h2>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default App;