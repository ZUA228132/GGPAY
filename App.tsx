import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FloatingNumber, Boost, View, Player, TelegramUser, GameState, BoostConfig, BoostId, GlobalNotification, VerificationRequest, BoostType } from './types';
import { TAPS_PER_CLICK_BASE, INITIAL_ENERGY, INITIAL_MAX_ENERGY, INITIAL_ENERGY_REGEN_RATE, BOT_OFFLINE_LIMIT_HOURS, ADMIN_USER_ID, BoostIconMap } from './constants';
import { formatLargeNumber } from './utils';
import { 
    getUserData, createUserData, saveUserData, performTransferTransaction, 
    fetchTopPlayers, getBoostsConfig, requestVerification, 
    getLatestNotification, markNotificationAsSeen 
} from './firebase/service';
import Coin from './components/Coin';
import ProgressBar from './components/ProgressBar';
import BoosterCard from './components/BoosterCard';
import VirtualCard from './components/VirtualCard';
import HistoryModal from './components/HistoryModal';
import ProfileView from './components/ProfileView';
import AdminView from './components/AdminView';
import TransferAnimation from './components/TransferAnimation';
import TopPlayersView from './components/TopPlayersView';

declare global {
    interface Window {
        Telegram: any;
    }
}

// Custom hook for debouncing effects
const useDebouncedEffect = (callback: () => void, deps: React.DependencyList, delay: number) => {
    useEffect(() => {
        const handler = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...(deps || []), delay]);
};

// --- SVG ICONS ---
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const BoostsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>);
const TrophyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" transform="scale(1.1) translate(-1, -1)" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14a2 2 0 002-2v-1a2 2 0 00-2-2H5a2 2 0 00-2 2v1a2 2 0 002 2z" /></svg>);
const ProfileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const CardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>);
const AdminIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);

const BottomNav: React.FC<{ currentView: View; setCurrentView: (view: View) => void; isAdmin: boolean; }> = ({ currentView, setCurrentView, isAdmin }) => {
    const navItems = [
        { id: 'home', icon: HomeIcon, label: 'Главная' },
        { id: 'boosts', icon: BoostsIcon, label: 'Улучшения' },
        { id: 'card', icon: CardIcon, label: 'Карта' },
        { id: 'top', icon: TrophyIcon, label: 'Топ' },
        { id: 'profile', icon: ProfileIcon, label: 'Профиль' },
    ];
    if (isAdmin) {
        navItems.push({ id: 'admin', icon: AdminIcon, label: 'Админ' });
    }
    return (
        <nav className="w-full p-2 z-10 flex-shrink-0" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
            <div className="max-w-md mx-auto flex justify-around glass-panel !rounded-full">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as View)}
                        className={`flex flex-col items-center justify-center h-16 w-16 space-y-1 transition-colors duration-200 rounded-full ${
                            currentView === item.id ? 'text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <item.icon />
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

const GlobalNotificationModal: React.FC<{ notification: GlobalNotification | null; onClose: () => void }> = ({ notification, onClose }) => {
    if (!notification) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 w-full max-w-sm text-center">
                 <h2 className="text-2xl font-bold font-orbitron mb-4 text-glow-primary">Уведомление</h2>
                 <p className="text-base text-white mb-6">{notification.message}</p>
                 <button onClick={onClose} className="w-full p-3 rounded-xl font-bold bg-[var(--primary-accent)] text-white">Понятно</button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
    const [boostsConfig, setBoostsConfig] = useState<BoostConfig[]>([]);
    
    const [currentView, setCurrentView] = useState<View>('home');
    const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [isTopPlayersLoading, setIsTopPlayersLoading] = useState(false);
    
    const [leaderboardTab, setLeaderboardTab] = useState<'gg' | 'boosts'>('gg');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [showTransferAnimation, setShowTransferAnimation] = useState(false);
    const [globalNotification, setGlobalNotification] = useState<GlobalNotification | null>(null);
    
    const isAdmin = useMemo(() => telegramUser?.id === ADMIN_USER_ID, [telegramUser]);

    // Derived states from GameState and BoostsConfig
    const boosts = useMemo((): Record<BoostId, Boost> => {
        const fullBoosts: Record<BoostId, Boost> = {} as any;
        boostsConfig.forEach(config => {
            const getCost = (level: number) => {
                try {
                    return new Function('level', `return ${config.costFormula}`)(level);
                } catch (e) {
                    console.error("Error evaluating cost formula:", e);
                    return Infinity;
                }
            };
            const IconComponent = BoostIconMap[config.iconName] || (() => null);
            fullBoosts[config.id] = {
                ...config,
                level: gameState?.boosts[config.id]?.level ?? 0,
                icon: <IconComponent />,
                getCost
            };
        });
        return fullBoosts;
    }, [gameState, boostsConfig]);
    
    const tapsPerClick = useMemo(() => TAPS_PER_CLICK_BASE * ((boosts[BoostType.MULTITAP]?.level ?? 0) + 1), [boosts]);
    const maxEnergy = useMemo(() => INITIAL_MAX_ENERGY + ((boosts[BoostType.ENERGY_LIMIT]?.level ?? 0) * 500), [boosts]);
    const energyRegenRate = useMemo(() => INITIAL_ENERGY_REGEN_RATE + (boosts[BoostType.RECHARGING_SPEED]?.level ?? 0), [boosts]);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const tg = window.Telegram?.WebApp;

                if (!tg || !tg.initDataUnsafe?.user?.id) {
                    setError("Это приложение можно запустить только внутри Telegram.");
                    setLoading(false);
                    return;
                }
                
                tg.expand();
                const user = tg.initDataUnsafe.user;
                const currentUser: TelegramUser = { id: user.id, firstName: user.first_name, lastName: user.last_name, username: user.username, photoUrl: user.photo_url };
                
                setTelegramUser(currentUser);

                const [data, config, notification] = await Promise.all([
                    getUserData(currentUser.id),
                    getBoostsConfig(),
                    getLatestNotification(localStorage.getItem(`seen_notification_${currentUser.id}`))
                ]);
                setBoostsConfig(config);

                if (notification) setGlobalNotification(notification);

                let loadedGameState = data;
                if (!loadedGameState) {
                    loadedGameState = await createUserData(currentUser, config);
                }
                 if (loadedGameState.isBanned) {
                    setError("Ваш аккаунт был заблокирован.");
                    setLoading(false);
                    return;
                }
                
                // Offline calculations
                const offlineTimeSec = Math.min((Date.now() - loadedGameState.lastSeen) / 1000, BOT_OFFLINE_LIMIT_HOURS * 3600);
                const botLevel = loadedGameState.boosts[BoostType.AUTO_TAP_BOT]?.level || 0;
                const botEarnings = botLevel > 0 ? offlineTimeSec * TAPS_PER_CLICK_BASE * botLevel : 0;
                const localBoosts = loadedGameState.boosts;
                const regenLevel = localBoosts[BoostType.RECHARGING_SPEED]?.level || 0;
                const currentEnergyRegenRate = INITIAL_ENERGY_REGEN_RATE + regenLevel;
                const energyLimitLevel = localBoosts[BoostType.ENERGY_LIMIT]?.level || 0;
                const currentMaxEnergy = INITIAL_MAX_ENERGY + (energyLimitLevel * 500);
                const offlineEnergyGain = Math.floor(offlineTimeSec * currentEnergyRegenRate);

                setGameState({
                    ...loadedGameState,
                    balance: loadedGameState.balance + botEarnings,
                    energy: Math.min(loadedGameState.energy + offlineEnergyGain, currentMaxEnergy),
                });

            } catch (err: any) {
                console.error("Initialization failed:", err);
                setError("Не удалось подключиться к базе. Проверьте правила Firebase и интернет-соединение.");
            } finally {
                setLoading(false);
            }
        };
        initializeApp();
    }, []);

    // Game loop for energy and printer
    useEffect(() => {
        if (!gameState || !boosts[BoostType.GG_PRINTER]) return;
        const regenInterval = setInterval(() => {
            setGameState(prev => {
                if (!prev) return prev;
                const printerLevel = prev.boosts[BoostType.GG_PRINTER]?.level || 0;
                const incomePerSecond = printerLevel > 0 ? printerLevel * 0.005 * ((prev.boosts[BoostType.MULTITAP]?.level || 0) + 1) : 0;
                return {
                    ...prev,
                    energy: Math.min(maxEnergy, prev.energy + energyRegenRate),
                    balance: prev.balance + incomePerSecond
                };
            });
        }, 1000);
        return () => clearInterval(regenInterval);
    }, [gameState, energyRegenRate, maxEnergy, boosts]);
    
    // Save data logic
    const gameStateRef = useRef(gameState);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useDebouncedEffect(() => {
        if (gameStateRef.current && telegramUser) {
            saveUserData(telegramUser.id, { ...gameStateRef.current, lastSeen: Date.now() });
        }
    }, [gameState], 500);
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && telegramUser && gameStateRef.current) {
                saveUserData(telegramUser.id, { ...gameStateRef.current, lastSeen: Date.now() });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [telegramUser]);
    
    // Fetch top players when view changes
    useEffect(() => {
        if (!telegramUser || currentView !== 'top') return;
        const fetch = async () => {
            setIsTopPlayersLoading(true);
            try {
                const players = await fetchTopPlayers(telegramUser.id, leaderboardTab);
                setTopPlayers(players);
            } catch (e) {
                console.error("Failed to fetch top players:", e);
                setError("Не удалось загрузить рейтинг. Проверьте правила Firebase (нужен .indexOn).");
            } finally { setIsTopPlayersLoading(false); }
        };
        fetch();
    }, [telegramUser, leaderboardTab, currentView]); 

    const handleTap = useCallback((x: number, y: number) => {
        if (!gameState || !boosts[BoostType.ENERGY_GURU] || !boosts[BoostType.CRITICAL_TAP]) return;
        const energyCost = 1;
        const guruLevel = boosts[BoostType.ENERGY_GURU].level;
        const freeTapChance = guruLevel * 0.02; 
        const consumesEnergy = Math.random() > freeTapChance;

        if (!consumesEnergy || gameState.energy >= energyCost) {
            const critLevel = boosts[BoostType.CRITICAL_TAP].level;
            const critChance = critLevel * 0.005;
            const isCritical = Math.random() < critChance;
            const tapMultiplier = isCritical ? 10 : 1;
            const tapValue = tapsPerClick * tapMultiplier;

            if (consumesEnergy) {
                setGameState(prev => prev ? { ...prev, balance: prev.balance + tapValue, energy: prev.energy - energyCost } : prev);
            } else {
                setGameState(prev => prev ? { ...prev, balance: prev.balance + tapValue } : prev);
            }

            const newFloatingNumber: FloatingNumber = {
                id: Date.now() + Math.random(), value: `+${formatLargeNumber(tapValue)}`, x: x + (Math.random() - 0.5) * 30, y, isCritical,
            };
            setFloatingNumbers(prev => [...prev, newFloatingNumber]);
            setTimeout(() => setFloatingNumbers(current => current.filter(n => n.id !== newFloatingNumber.id)), 2000);
            try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch (e) { /* Ignore */ }
        }
    }, [gameState, boosts, tapsPerClick]);

    const handleBuyBoost = useCallback((boostId: BoostId) => {
        const boost = boosts[boostId];
        if (!boost || !gameState || boost.level >= boost.maxLevel) return;
        const cost = boost.getCost(boost.level);
        if (gameState.balance >= cost) {
            setGameState(prev => {
                if (!prev) return prev;
                const newBoosts = { ...prev.boosts, [boostId]: { level: boost.level + 1 } };
                return { ...prev, balance: prev.balance - cost, boosts: newBoosts };
            });
        }
    }, [gameState, boosts]);

    const handleTransfer = async (recipientId: number, amount: number) => {
        if (!telegramUser || !gameState || gameState.balance < amount || amount <= 0) {
            return { success: false, message: 'Недостаточно средств или неверные данные.' };
        }
        try {
            const result = await performTransferTransaction(telegramUser.id, recipientId, amount);
            setGameState(prev => {
                if (!prev) return prev;
                const newTransactions = [result.newTransaction, ...(prev.transactions || [])];
                return { ...prev, balance: prev.balance - amount, transactions: newTransactions };
            });
            setShowTransferAnimation(true);
            setTimeout(() => setShowTransferAnimation(false), 2500);
            return { success: true, message: `Перевод на ${amount.toFixed(4)} GG выполнен!` };
        } catch (error: any) {
             return { success: false, message: error.message || 'Ошибка транзакции' };
        }
    };

    const handleVerificationRequest = async () => {
        if (!telegramUser || !gameState || gameState.verificationStatus === 'pending') return;
        try {
            await requestVerification(telegramUser.id, `${telegramUser.firstName} ${telegramUser.lastName}`);
            setGameState(prev => prev ? { ...prev, verificationStatus: 'pending' } : prev);
        } catch (e) {
            console.error(e);
        }
    };
    
    if (loading) return <div className="h-screen w-screen flex items-center justify-center"><div className="text-2xl font-orbitron">Загрузка GG PAY...</div></div>;
    if (error) return <div className="h-screen w-screen flex items-center justify-center text-center p-4"><div><h2 className="text-2xl font-orbitron text-red-500">Ошибка</h2><p className="text-[var(--text-muted)] mt-2">{error}</p></div></div>;
    if (!gameState) return <div className="h-screen w-screen flex items-center justify-center text-center p-4"><div><h2 className="text-2xl font-orbitron text-red-500">Не удалось загрузить данные</h2><p className="text-[var(--text-muted)] mt-2">Пожалуйста, попробуйте перезапустить приложение.</p></div></div>;

    return (
        <div className="h-screen bg-transparent flex flex-col overflow-hidden font-sans">
            <div className="w-full flex-shrink-0" style={{ height: 'env(safe-area-inset-top)' }} />
            <GlobalNotificationModal notification={globalNotification} onClose={() => {
                 if (globalNotification && telegramUser) markNotificationAsSeen(telegramUser.id, globalNotification.id);
                 setGlobalNotification(null);
            }} />
            {showTransferAnimation && gameState.cardData && telegramUser && <TransferAnimation cardData={gameState.cardData} user={telegramUser} />}
            <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} transactions={gameState.transactions} />

            <main className="flex-grow px-4 pb-2 pt-4 flex flex-col overflow-y-auto">
                {currentView === 'home' && (
                    <div className="flex flex-col items-center justify-between h-full space-y-4 flex-grow">
                        <div className="text-center z-10">
                             <h1 className="font-orbitron text-5xl font-black tracking-tight text-white">{formatLargeNumber(gameState.balance)}<span className="text-4xl font-bold text-[var(--primary-accent)] text-glow-primary"> GG</span></h1>
                        </div>
                        <div className="relative w-full flex-grow flex items-center justify-center"><Coin onTap={handleTap} floatingNumbers={floatingNumbers} /></div>
                        <div className="w-full max-w-md mx-auto z-10 space-y-2">
                             <div className="flex items-center justify-center space-x-2 text-2xl font-orbitron"><span className="text-yellow-400">⚡️</span><span className="font-bold">{Math.floor(gameState.energy)} / {maxEnergy}</span></div>
                             <ProgressBar currentValue={gameState.energy} maxValue={maxEnergy} />
                        </div>
                    </div>
                )}
                 {currentView === 'boosts' && (
                    <div className="h-full flex flex-col">
                        <div className="text-center mb-6"><h2 className="text-3xl font-bold text-glow-primary font-orbitron">Улучшения</h2></div>
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                            {Object.values(boosts).map(boost => <BoosterCard key={boost.id} boost={boost} balance={gameState.balance} onBuy={handleBuyBoost} />)}
                        </div>
                    </div>
                )}
                {currentView === 'card' && <VirtualCard cardData={gameState.cardData} user={telegramUser} balance={gameState.balance} onTransfer={handleTransfer} />}
                {currentView === 'top' && <TopPlayersView players={topPlayers} leaderboardTab={leaderboardTab} setLeaderboardTab={setLeaderboardTab} isLoading={isTopPlayersLoading} />}
                {currentView === 'profile' && <ProfileView user={{...telegramUser, isVerified: gameState.isVerified}} gameState={gameState} onShowHistory={() => setIsHistoryModalOpen(true)} onVerificationRequest={handleVerificationRequest} />}
                {currentView === 'admin' && isAdmin && <AdminView />}
            </main>
            
            <BottomNav currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />
        </div>
    );
};

export default App;