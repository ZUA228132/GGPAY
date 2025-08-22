import React from 'react';
import { Player } from '../types';
import { formatLargeNumber } from '../utils';

interface TopPlayersViewProps {
    players: Player[];
    leaderboardTab: 'gg' | 'boosts';
    setLeaderboardTab: (tab: 'gg' | 'boosts') => void;
    isLoading: boolean;
}

const VerifiedBadge = () => (
    <span className="verified-badge -mr-1 !w-4 !h-4">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
    </span>
);

const TopPlayersView: React.FC<TopPlayersViewProps> = ({ players, leaderboardTab, setLeaderboardTab, isLoading }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-glow-primary font-orbitron">Топ Игроков</h2>
            </div>
            <div className="flex justify-center mb-4 p-1 rounded-full glass-panel max-w-sm mx-auto w-full gap-1">
                <button
                    onClick={() => setLeaderboardTab('gg')}
                    className={`flex-1 py-2 rounded-full font-bold transition-colors ${leaderboardTab === 'gg' ? 'bg-[var(--primary-accent)]' : 'bg-transparent'}`}
                >
                    GG
                </button>
                <button
                    onClick={() => setLeaderboardTab('boosts')}
                    className={`flex-1 py-2 rounded-full font-bold transition-colors ${leaderboardTab === 'boosts' ? 'bg-[var(--primary-accent)]' : 'bg-transparent'}`}
                >
                    Бусты
                </button>
            </div>
            {isLoading ? (
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-lg font-orbitron">Загрузка рейтинга...</div>
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {players.map((player, index) => (
                        <div key={player.id} className={`flex items-center justify-between p-3 rounded-xl ${player.isCurrentUser ? 'bg-[var(--primary-accent)]/30 border border-[var(--primary-accent)]' : 'bg-black/20'}`}>
                            <div className="flex items-center space-x-3">
                                <span className="font-bold text-lg w-8 text-center text-[var(--text-muted)]">{index + 1}</span>
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold truncate max-w-[150px]">{player.name}</p>
                                    {player.isVerified && <VerifiedBadge />}
                                </div>
                            </div>
                            <div className="font-bold font-orbitron text-glow-primary">
                                {leaderboardTab === 'gg' 
                                    ? formatLargeNumber(player.balance) 
                                    : player.totalBoostLevel}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TopPlayersView;