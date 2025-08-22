import React, { useRef, useEffect, useState } from 'react';
import { CardData, TelegramUser } from '../types';

interface VirtualCardProps {
    cardData: CardData | null;
    user: TelegramUser | null;
}

const VirtualCard: React.FC<VirtualCardProps> = ({ cardData, user }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScratching, setIsScratching] = useState(false);
    const [scratchedPercentage, setScratchedPercentage] = useState(0);

    const draw = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fill();
    };

    const getScratchedAmount = (ctx: CanvasRenderingContext2D) => {
        if(!canvasRef.current) return 0;
        const pixels = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        let transparent = 0;
        for (let i = 0, n = pixels.data.length; i < n; i += 4) {
            if (pixels.data[i + 3] < 128) { // Check alpha channel
                transparent++;
            }
        }
        return (transparent / (canvasRef.current.width * canvasRef.current.height)) * 100;
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match the div
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Fill with scratchable surface
        ctx.fillStyle = 'silver';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#a0a0a0';
        ctx.font = 'bold 12px Rajdhani';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2);

    }, []);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        setIsScratching(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        draw(ctx, e.clientX - rect.left, e.clientY - rect.top);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isScratching) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        draw(ctx, e.clientX - rect.left, e.clientY - rect.top);
    };

    const handlePointerUp = () => {
        setIsScratching(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setScratchedPercentage(getScratchedAmount(ctx));
    };


    if (!cardData || !user) {
        return <div className="h-full flex items-center justify-center">Loading Card...</div>;
    }

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'GG User';

    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-sm aspect-[1.586] rounded-2xl p-6 flex flex-col justify-between text-white shadow-2xl virtual-card">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold font-orbitron">GG PAY</h2>
                    <div className="w-12 h-8 bg-yellow-400 rounded-md bg-opacity-80 flex items-center justify-center">
                        <div className="w-10 h-6 bg-yellow-600 rounded-sm"></div>
                    </div>
                </div>

                <div className="relative">
                    <p className="font-orbitron text-2xl tracking-widest text-gray-200" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                       {cardData.cardNumber}
                    </p>
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full rounded-md scratch-canvas"
                        style={{ opacity: scratchedPercentage > 70 ? 0 : 1, transition: 'opacity 0.5s ease' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    ></canvas>
                </div>


                <div className="flex justify-between items-end">
                    <div className="font-orbitron">
                        <p className="text-xs opacity-70">CARD HOLDER</p>
                        <p className="text-lg font-bold uppercase tracking-wider">{userName}</p>
                    </div>
                    <div className="font-orbitron text-right">
                        <p className="text-xs opacity-70">EXPIRES</p>
                        <p className="text-lg font-bold">{cardData.expiryDate}</p>
                    </div>
                </div>
            </div>
            <p className="text-sm text-center text-[var(--text-muted)] mt-4">
                Это ваша уникальная виртуальная карта. Проведите пальцем, чтобы увидеть номер.
            </p>
        </div>
    );
};

export default VirtualCard;
