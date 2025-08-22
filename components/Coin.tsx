import React, { useState } from 'react';
import { FloatingNumber } from '../types';

interface CoinProps {
    onTap: (x: number, y: number) => void;
    floatingNumbers: FloatingNumber[];
}

const Coin: React.FC<CoinProps> = ({ onTap, floatingNumbers }) => {
    const [isPressed, setIsPressed] = useState(false);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        onTap(e.clientX - rect.left, e.clientY - rect.top);
        setIsPressed(true);
    };

    const handlePointerUp = () => {
        setIsPressed(false);
    };
    
    const handlePointerLeave = () => {
        setIsPressed(false);
    };

    const coinClasses = `w-full h-full rounded-full flex items-center justify-center text-8xl font-black
                         transition-all duration-100 ease-in-out select-none font-orbitron`;

    const coinStyle: React.CSSProperties = {
        background: 'conic-gradient(from 180deg at 50% 50%, #4f46e5 0%, #d946ef 50%, #4f46e5 100%)',
        color: 'rgba(255, 255, 255, 0.9)',
        boxShadow: isPressed
            ? 'inset 0 0 25px rgba(0,0,0,0.5), 0 0 20px var(--primary-accent)'
            : '0 0 25px var(--primary-accent), 0 0 50px var(--secondary-accent)',
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        textShadow: '2px 2px 5px rgba(0,0,0,0.5)',
        border: '3px solid rgba(255,255,255,0.2)'
    };

    return (
        <div className="relative w-4/5 max-w-[320px] aspect-square flex items-center justify-center cursor-pointer">
             <div 
                className={coinClasses} 
                style={coinStyle}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onContextMenu={(e) => e.preventDefault()}
             >
                GG
            </div>
            
            {floatingNumbers.map(num => (
                <div
                    key={num.id}
                    className={`absolute text-5xl font-bold pointer-events-none font-orbitron ${num.isCritical ? 'text-[var(--secondary-accent)]' : 'text-white'}`}
                    style={{
                        left: `${num.x}px`,
                        top: `${num.y}px`,
                        textShadow: num.isCritical ? '0 0 10px var(--secondary-accent)' : '0 0 8px rgba(0,0,0,0.5)',
                        transform: 'translate(-50%, -50%)',
                        animation: `${num.isCritical ? 'critFloatUp' : 'floatUp'} 2s ease-out forwards`,
                    }}
                >
                    {num.value}
                </div>
            ))}
            <style>
            {`
                @keyframes floatUp {
                    0% { transform: translate(-50%, -50%); opacity: 1; }
                    100% { transform: translate(-50%, -250%); opacity: 0; }
                }
                @keyframes critFloatUp {
                    0% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    20% { transform: translate(-50%, -80%) scale(1.5); }
                    100% { transform: translate(-50%, -300%) scale(1.5); opacity: 0; }
                }
            `}
            </style>
        </div>
    );
};

export default Coin;