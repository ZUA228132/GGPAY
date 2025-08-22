import React, { useRef, useEffect, useState } from 'react';
import { CardData, TelegramUser } from '../types';
import { formatLargeNumber } from '../utils';

interface VirtualCardProps {
    cardData: CardData;
    user: TelegramUser;
    isNewlyIssued: boolean;
    onReveal: (cardId: string) => void;
}

const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>);


const VirtualCard: React.FC<VirtualCardProps> = ({ cardData, user, isNewlyIssued, onReveal }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScratching, setIsScratching] = useState(false);
    const [isRevealed, setIsRevealed] = useState(cardData.isRevealed || !isNewlyIssued);
    const [copied, setCopied] = useState(false);

    const draw = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, 2 * Math.PI);
        ctx.fill();
    };

    const checkScratchAmount = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        for (let i = 0, n = pixels.data.length; i < n; i += 4) {
            if (pixels.data[i + 3] < 128) transparent++;
        }
        if ((transparent / (canvas.width * canvas.height)) * 100 > 70) {
            setIsRevealed(true);
            onReveal(cardData.id);
        }
    };
    
    useEffect(() => {
        if (isRevealed) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.fillStyle = 'silver';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#a0a0a0';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2);
    }, [isRevealed]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault(); setIsScratching(true);
        const ctx = canvasRef.current?.getContext('2d'); if(!ctx) return;
        draw(ctx, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault(); if (!isScratching) return;
        const ctx = canvasRef.current?.getContext('2d'); if(!ctx) return;
        draw(ctx, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const handlePointerUp = () => {
        setIsScratching(false);
        checkScratchAmount();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(cardData.cardNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'GG User';

    return (
         <div className="w-full max-w-sm aspect-[1.586] rounded-2xl p-6 flex flex-col justify-between text-white shadow-2xl relative" style={{background: 'linear-gradient(45deg, #2c3e50, #4a6da7)'}}>
            <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold font-orbitron">GG PAY</h2>
                <div className="w-12 h-8 bg-yellow-400 rounded-md bg-opacity-80 flex items-center justify-center">
                    <div className="w-10 h-6 bg-yellow-600 rounded-sm"></div>
                </div>
            </div>

            <div className="relative">
                <div className="flex items-center gap-2">
                    <p className="font-orbitron text-2xl tracking-widest text-gray-200" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                       {cardData.cardNumber}
                    </p>
                    <button onClick={handleCopy} className="text-gray-300 hover:text-white transition-colors">
                        {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                </div>
                 {!isRevealed && (
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full rounded-md scratch-canvas"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    ></canvas>
                )}
            </div>

            <div className="flex justify-between items-end">
                <div className="font-orbitron">
                    <p className="text-xs opacity-70">CARD HOLDER</p>
                    <p className="text-lg font-bold uppercase tracking-wider">{userName}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs opacity-70 font-orbitron">BALANCE</p>
                    <p className="text-lg font-bold font-orbitron">{formatLargeNumber(cardData.balance)} GG</p>
                </div>
            </div>
        </div>
    );
};

export default VirtualCard;