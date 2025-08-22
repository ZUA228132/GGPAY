import React from 'react';
import { TelegramUser, GameState } from '../types';
import { formatLargeNumber } from '../utils';

interface ProfileViewProps {
    user: TelegramUser | null;
    gameState: GameState;
    onShowHistory: () => void;
    onVerificationRequest: () => void;
}

const VerifiedBadge = () => (
    <span className="verified-badge">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
    </span>
);

const ProfileView: React.FC<ProfileViewProps> = ({ user, gameState, onShowHistory, onVerificationRequest }) => {
    if (!user) {
        return <div className="h-full flex items-center justify-center text-xl">Загрузка профиля...</div>;
    }

    const verificationButtonText = () => {
        switch (gameState.verificationStatus) {
            case 'none':
            case 'rejected':
                return 'Запросить верификацию';
            case 'pending':
                return 'Запрос на рассмотрении';
            case 'verified':
                return 'Вы верифицированы';
            default:
                return 'Верификация';
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <img 
                src={user.photoUrl || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user.username}`}
                alt="avatar" 
                className="w-28 h-28 rounded-full border-4 border-[var(--primary-accent)] shadow-lg"
            />
            <div className="flex flex-col">
                <h2 className="text-3xl font-bold font-orbitron text-white flex items-center">
                    {user.firstName} {user.lastName}
                    {gameState.isVerified && <VerifiedBadge />}
                </h2>
                {user.username && <p className="text-lg text-[var(--text-muted)]">@{user.username}</p>}
            </div>

            <div className="glass-panel p-4 mt-6 w-full max-w-sm flex flex-col space-y-4">
                <div className='text-left'>
                    <p className="text-sm text-[var(--text-muted)]">ВАШ TELEGRAM ID</p>
                    <p className="text-xl font-bold font-orbitron text-white">{user.id}</p>
                </div>
                <div className="h-px bg-[var(--glass-border)]"></div>
                <div className='text-left'>
                    <p className="text-sm text-[var(--text-muted)]">БАЛАНС</p>
                    <p className="text-3xl font-bold font-orbitron text-glow-primary">{formatLargeNumber(gameState.balance)} GG</p>
                </div>
            </div>
             <button onClick={onShowHistory} className="w-full max-w-sm p-3 mt-2 rounded-xl font-bold glass-button">
                История переводов
            </button>
            <button 
                onClick={onVerificationRequest}
                disabled={gameState.verificationStatus === 'pending' || gameState.verificationStatus === 'verified'}
                className="w-full max-w-sm p-3 rounded-xl font-bold glass-button disabled:opacity-50"
            >
                {verificationButtonText()}
            </button>
        </div>
    );
};

export default ProfileView;