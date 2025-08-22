import React from 'react';
import { Boost, BoostId } from '../types';
import { formatLargeNumber } from '../utils';

interface BoosterCardProps {
    boost: Boost;
    balance: number;
    onBuy: (boostId: BoostId) => void;
}

const BoosterCard: React.FC<BoosterCardProps> = ({ boost, balance, onBuy }) => {
    const cost = boost.getCost(boost.level);
    const canAfford = balance >= cost;
    const isMaxLevel = boost.level >= boost.maxLevel;

    return (
        <div className="flex items-center justify-between p-3 glass-panel">
            <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-black/20">
                    {boost.icon}
                </div>
                <div>
                    <h3 className="font-bold text-lg">{boost.name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">Уровень {boost.level} / {boost.maxLevel}</p>
                </div>
            </div>
            {!isMaxLevel ? (
                <button
                    onClick={() => onBuy(boost.id)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 text-sm glass-button
                        ${ canAfford 
                            ? 'text-white border-[var(--primary-accent)]' 
                            : 'text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {formatLargeNumber(cost)}
                </button>
            ) : (
                <div className="px-4 py-2 rounded-lg font-bold text-green-400 text-glow-secondary text-sm">
                    Макс.
                </div>
            )}
        </div>
    );
};

export default BoosterCard;
