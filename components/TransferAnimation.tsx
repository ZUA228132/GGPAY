import React from 'react';
import { CardData, TelegramUser } from '../types';

interface TransferAnimationProps {
    cardData: CardData;
    user: TelegramUser;
}

const TransferAnimation: React.FC<TransferAnimationProps> = ({ cardData, user }) => {
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'GG User';
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transfer-animation-overlay">
            <div className="w-full max-w-sm aspect-[1.586] rounded-2xl p-6 flex flex-col justify-between text-white shadow-2xl relative virtual-card transfer-animation-card">
                {/* Card content duplicated for animation */}
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold font-orbitron">GG PAY</h2>
                     <div className="w-12 h-8 bg-yellow-400 rounded-md bg-opacity-80 flex items-center justify-center">
                        <div className="w-10 h-6 bg-yellow-600 rounded-sm"></div>
                    </div>
                </div>
                 <div className="font-orbitron text-2xl tracking-widest text-gray-200" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                    {cardData.cardNumber.slice(0, 5)} **** **** {cardData.cardNumber.slice(-4)}
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
            {/* Success Tick */}
            <div className="absolute">
                <svg className="w-32 h-32" viewBox="0 0 52 52">
                    <circle className="stroke-current text-green-500" cx="26" cy="26" r="25" fill="none" strokeWidth="3" opacity="0.3" />
                    <path className="stroke-current text-green-500 transfer-animation-tick" cx="26" cy="26" r="25" fill="none" strokeWidth="4" strokeLinecap="round" d="M14 27l5 5 16-16" />
                </svg>
            </div>
        </div>
    );
};

export default TransferAnimation;