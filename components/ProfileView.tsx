import React, { useState } from 'react';
import { TelegramUser, GameState } from '../types';
import { formatLargeNumber } from '../utils';
import { VERIFICATION_COST } from '../constants';

interface ProfileViewProps {
    user: TelegramUser | null;
    gameState: GameState;
    totalBalance: number;
    onShowHistory: () => void;
    onVerificationRequest: () => void;
}

const VerifiedBadge = () => (
    <span className="verified-badge">
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
    </span>
);

const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>);


const ProfileView: React.FC<ProfileViewProps> = ({ user, gameState, totalBalance, onShowHistory, onVerificationRequest }) => {
    const [copied, setCopied] = useState(false);

    if (!user) {
        return <div className="h-full flex items-center justify-center text-xl">Загрузка профиля...</div>;
    }

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.id.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const canAffordVerification = totalBalance >= VERIFICATION_COST;
    
    const verificationButtonText = () => {
        switch (gameState.verificationStatus) {
            case 'none':
            case 'rejected':
                return `Запросить (${formatLargeNumber(VERIFICATION_COST)} GG)`;
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
                    <div className="flex items-center justify-between">
                        <p className="text-xl font-bold font-orbitron text-white">{user.id}</p>
                        <button onClick={handleCopyId} className="text-gray-300 hover:text-white transition-colors">
                            {copied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                    </div>
                </div>
                <div className="h-px bg-[var(--glass-border)]"></div>
                <div className='text-left'>
                    <p className="text-sm text-[var(--text-muted)]">ОБЩИЙ БАЛАНС</p>
                    <p className="text-3xl font-bold font-orbitron text-glow-primary">{formatLargeNumber(totalBalance)} GG</p>
                </div>
            </div>
             <button onClick={onShowHistory} className="w-full max-w-sm p-3 mt-2 rounded-xl font-bold glass-button">
                История переводов
            </button>
            <button 
                onClick={onVerificationRequest}
                disabled={gameState.verificationStatus === 'pending' || gameState.verificationStatus === 'verified' || !canAffordVerification}
                className="w-full max-w-sm p-3 rounded-xl font-bold glass-button disabled:opacity-50"
            >
                {verificationButtonText()}
            </button>
             {gameState.verificationStatus === 'rejected' && <p className="text-xs text-red-400">Ваш предыдущий запрос был отклонен.</p>}
        </div>
    );
};

export default ProfileView;