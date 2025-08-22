import React, { useRef, useEffect, useState } from 'react';
import { CardData, TelegramUser } from '../types';
import { formatLargeNumber } from '../utils';

interface VirtualCardProps {
    cardData: CardData | null;
    user: TelegramUser | null;
    balance: number;
    onTransfer: (recipientId: number, amount: number) => Promise<{success: boolean; message: string;}>;
}

const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>);

const VirtualCard: React.FC<VirtualCardProps> = ({ cardData, user, balance, onTransfer }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScratching, setIsScratching] = useState(false);
    const [scratchedPercentage, setScratchedPercentage] = useState(0);

    const [copied, setCopied] = useState<'number' | 'expiry' | null>(null);
    
    // Transfer form state
    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [transferStatus, setTransferStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const draw = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, 2 * Math.PI);
        ctx.fill();
    };

    const getScratchedAmount = (ctx: CanvasRenderingContext2D) => {
        if(!canvasRef.current) return 0;
        const pixels = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        let transparent = 0;
        for (let i = 0, n = pixels.data.length; i < n; i += 4) {
            if (pixels.data[i + 3] < 128) {
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

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

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
        e.preventDefault();
        setIsScratching(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        draw(ctx, e.clientX - rect.left, e.clientY - rect.top);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
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

    const handleCopy = (type: 'number' | 'expiry') => {
        if (!cardData) return;
        const textToCopy = type === 'number' ? cardData.cardNumber : cardData.expiryDate;
        navigator.clipboard.writeText(textToCopy);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSend = async () => {
        setTransferStatus(null);
        
        const numRecipientId = parseInt(recipientId, 10);
        const numAmount = parseFloat(amount);

        if (isNaN(numRecipientId) || numRecipientId <= 0) {
            setTransferStatus({ type: 'error', message: 'Введите корректный ID.' });
            return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setTransferStatus({ type: 'error', message: 'Введите корректную сумму.' });
            return;
        }
        if (numAmount > balance) {
            setTransferStatus({ type: 'error', message: 'Недостаточно средств.' });
            return;
        }

        setIsSubmitting(true);
        const result = await onTransfer(numRecipientId, numAmount);
        setIsSubmitting(false);

        if (result.success) {
            setTransferStatus({ type: 'success', message: result.message });
            setRecipientId('');
            setAmount('');
            setTimeout(() => setTransferStatus(null), 3000); // Clear message after a while
        } else {
            setTransferStatus({ type: 'error', message: result.message });
        }
    };

    if (!cardData || !user) {
        return <div className="h-full flex items-center justify-center">Loading Card...</div>;
    }

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'GG User';

    return (
        <div className="h-full flex-grow flex flex-col items-center justify-start p-4 overflow-y-auto">
             <div className="w-full max-w-sm aspect-[1.586] rounded-2xl p-6 flex flex-col justify-between text-white shadow-2xl virtual-card flex-shrink-0">
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
                         <button onClick={() => handleCopy('number')} className="text-gray-300 hover:text-white transition-colors">
                            {copied === 'number' ? <span className="text-xs">Готово!</span> : <CopyIcon />}
                        </button>
                    </div>
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full rounded-md scratch-canvas"
                        style={{ 
                            opacity: scratchedPercentage > 80 ? 0 : 1, 
                            transition: 'opacity 0.5s ease',
                        }}
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
                    <div className="font-orbitron text-right flex items-center gap-2">
                         <div>
                            <p className="text-xs opacity-70">EXPIRES</p>
                            <p className="text-lg font-bold">{cardData.expiryDate}</p>
                         </div>
                         <button onClick={() => handleCopy('expiry')} className="text-gray-300 hover:text-white transition-colors">
                            {copied === 'expiry' ? <span className="text-xs">Готово!</span> : <CopyIcon />}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Transfer Form */}
            <div className="w-full max-w-sm mt-6 space-y-4 glass-panel p-6">
                <h3 className="text-xl font-bold font-orbitron text-center">Перевод GG</h3>
                <div className="space-y-2">
                    <label className="block text-sm text-[var(--text-muted)]">ID Получателя</label>
                    <input 
                        type="number"
                        placeholder="123456789"
                        value={recipientId}
                        onChange={e => { setTransferStatus(null); setRecipientId(e.target.value); }}
                        className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)] font-orbitron"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm text-[var(--text-muted)]">Сумма GG</label>
                    <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => { setTransferStatus(null); setAmount(e.target.value); }}
                        className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)] font-orbitron"
                    />
                </div>
                 <p className="text-xs text-[var(--text-muted)] text-center">Ваш баланс: {formatLargeNumber(balance)} GG</p>
                
                {transferStatus && <p className={`text-sm text-center ${transferStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{transferStatus.message}</p>}

                <button 
                    onClick={handleSend}
                    className="w-full p-3 rounded-xl font-bold bg-[var(--primary-accent)] text-white disabled:bg-gray-600 disabled:opacity-50 transition-colors"
                    disabled={isSubmitting || !recipientId || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                >
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
            </div>
        </div>
    );
};

export default VirtualCard;