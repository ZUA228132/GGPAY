import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FloatingNumber, Boost, BoostType, View, Player, TelegramUser, GameState } from './types';
import { BOOSTS_CONFIG, TAPS_PER_CLICK_BASE, INITIAL_ENERGY, INITIAL_MAX_ENERGY, INITIAL_ENERGY_REGEN_RATE, BOT_OFFLINE_LIMIT_HOURS } from './constants';
import { formatLargeNumber } from './utils';
import { getUserData, createUserData, saveUserData, performTransferTransaction, fetchTopPlayers } from './firebase/service';
import Coin from './components/Coin';
import ProgressBar from './components/ProgressBar';
import BoosterCard from './components/BoosterCard';
import VirtualCard from './components/VirtualCard';
import HistoryModal from './components/HistoryModal';

declare global {
    interface Window {
        Telegram: any;
    }
}

// --- SVG ICONS ---
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const BoostIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>);
const TrophyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>);
const ResetIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>);
const ProfileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const CardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>);


// --- UI COMPONENTS ---
const BottomNav: React.FC<{ currentView: View; setCurrentView: (view: View) => void; }> = ({ currentView, setCurrentView }) => {
    const navItems = [
        { id: 'home', icon: HomeIcon, label: 'Главная' },
        { id: 'boosts', icon: BoostIcon, label: 'Улучшения' },
        { id: 'card', icon: CardIcon, label: 'Карта' },
        { id: 'top', icon: TrophyIcon, label: 'Топ' },
        { id: 'profile', icon: ProfileIcon, label: 'Профиль' },
    ];
    return (
        <nav className="w-full p-2 z-10 flex-shrink-0">
            <div className="max-w-md mx-auto flex justify-around glass-panel !rounded-full">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as View)}
                        className={`flex flex-col items-center space-y-1 p-2 flex-grow transition-colors duration-200 rounded-full ${
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

const PasswordModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (password: string) => boolean }> = ({ isOpen, onClose, onSubmit }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    if(!isOpen) return null;

    const handleSubmit = () => {
        if (onSubmit(password)) {
            setPassword('');
            setError(false);
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 w-full max-w-sm text-center">
                 <h2 className="text-2xl font-bold font-orbitron mb-4">Admin Access</h2>
                 <p className="text-sm text-[var(--text-muted)] mb-4">Введите пароль для доступа к панели.</p>
                 <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-transparent p-3 rounded-xl border focus:outline-none focus:ring-2 text-center text-lg font-orbitron tracking-widest ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--glass-border)] focus:ring-[var(--primary-accent)]'}`}
                 />
                 {error && <p className="text-red-500 text-sm mt-2">Неверный пароль</p>}
                 <div className="flex gap-4 mt-6">
                    <button onClick={onClose} className="w-full p-3 rounded-xl font-bold glass-button">Отмена</button>
                    <button onClick={handleSubmit} className="w-full p-3 rounded-xl font-bold bg-[var(--primary-accent)] text-white">Войти</button>
                 </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<{ isOpen: boolean; onClose: () => void; setBalance: (v: number) => void; setEnergy: (v: number) => void; resetState: () => void; }> = ({ isOpen, onClose, setBalance, setEnergy, resetState }) => {
    const [balanceInput, setBalanceInput] = useState('');
    const [energyInput, setEnergyInput] = useState('');

    if (!isOpen) return null;
    
    const handleSetBalance = () => {
        const value = parseFloat(balanceInput);
        if(!isNaN(value)) {
            setBalance(value);
            setBalanceInput('');
        }
    };

    const handleSetEnergy = () => {
        const value = parseInt(energyInput, 10);
        if(!isNaN(value)) {
            setEnergy(value);
            setEnergyInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-glow-primary font-orbitron">Admin Panel</h2>
                    <button onClick={onClose} className="p-2 rounded-full glass-button"><CloseIcon /></button>
                </div>
                <div className="space-y-6">
                    {/* Admin functionalities remain unchanged for now */}
                </div>
            </div>
        </div>
    );
};

const TopPlayersView: React.FC<{ 
    players: Player[]; 
    leaderboardTab: 'gg' | 'boosts', 
    setLeaderboardTab: (tab: 'gg' | 'boosts') => void,
}> = ({ players, leaderboardTab, setLeaderboardTab }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-glow-primary font-orbitron">Таблица Лидеров</h2>
      </div>
      <div className="flex justify-center mb-4 p-1 rounded-full glass-panel max-w-xs mx-auto">
        <button onClick={() => setLeaderboardTab('gg')} className={`w-1/2 py-2 rounded-full font-bold transition-colors ${leaderboardTab === 'gg' ? 'bg-[var(--primary-accent)] text-white' : ''}`}>Топ по GG</button>
        <button onClick={() => setLeaderboardTab('boosts')} className={`w-1/2 py-2 rounded-full font-bold transition-colors ${leaderboardTab === 'boosts' ? 'bg-[var(--primary-accent)] text-white' : ''}`}>Топ по Улучшениям</button>
      </div>
      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        {players.map((player, index) => (
          <div key={player.id} className={`flex items-center justify-between p-3 rounded-xl glass-panel ${player.isCurrentUser ? 'border-2 border-[var(--primary-accent)]' : ''}`}>
            <div className="flex items-center space-x-3">
              <span className={`text-xl font-bold font-orbitron w-8 text-center ${index < 3 ? 'text-[var(--secondary-accent)]' : 'text-gray-400'}`}>{index + 1}</span>
              <span className="font-semibold text-lg">{player.name}</span>
            </div>
            <div className='flex items-center gap-4'>
                <div className='text-right'>
                    <span className="font-bold text-lg text-glow-primary font-orbitron">
                        {leaderboardTab === 'gg' 
                            ? formatLargeNumber(player.balance)
                            : `Lvl ${player.totalBoostLevel}`
                        }
                    </span>
                    {leaderboardTab === 'boosts' && <div className="text-xs text-[var(--text-muted)]">{formatLargeNumber(player.balance)} GG</div>}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfileView: React.FC<{user: TelegramUser | null; balance: number; onShowHistory: () => void;}> = ({ user, balance, onShowHistory }) => {
    if (!user) {
        return <div className="h-full flex items-center justify-center text-xl">Загрузка профиля...</div>;
    }

    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <img 
                src={user.photoUrl || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user.username}`}
                alt="avatar" 
                className="w-28 h-28 rounded-full border-4 border-[var(--primary-accent)] shadow-lg"
            />
            <div className="flex flex-col">
                <h2 className="text-3xl font-bold font-orbitron text-white">
                    {user.firstName} {user.lastName}
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
                    <p className="text-3xl font-bold font-orbitron text-glow-primary">{formatLargeNumber(balance)} GG</p>
                </div>
            </div>
             <button onClick={onShowHistory} className="w-full max-w-sm p-3 mt-2 rounded-xl font-bold glass-button">
                История переводов
            </button>
        </div>
    );
};

const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
    const callback = useCallback(effect, deps);

    useEffect(() => {
        const handler = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [callback, delay]);
};


const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
    
    const [currentView, setCurrentView] = useState<View>('home');
    const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);

    // Admin states
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [adminClickCount, setAdminClickCount] = useState(0);
    const [lastAdminClickTime, setLastAdminClickTime] = useState(0);
    const [leaderboardTab, setLeaderboardTab] = useState<'gg' | 'boosts'>('gg');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    
    // Derived states
    const boosts = useMemo(() => {
        const fullBoosts: Record<BoostType, Boost> = {} as any;
        BOOSTS_CONFIG.forEach(config => {
            fullBoosts[config.id] = {
                ...config,
                level: gameState?.boosts[config.id]?.level ?? 0
            };
        });
        return fullBoosts;
    }, [gameState]);
    
    const tapsPerClick = useMemo(() => TAPS_PER_CLICK_BASE * ((boosts[BoostType.MULTITAP]?.level ?? 0) + 1), [boosts]);
    const maxEnergy = useMemo(() => INITIAL_MAX_ENERGY + ((boosts[BoostType.ENERGY_LIMIT]?.level ?? 0) * 500), [boosts]);
    const energyRegenRate = useMemo(() => INITIAL_ENERGY_REGEN_RATE + (boosts[BoostType.RECHARGING_SPEED]?.level ?? 0), [boosts]);

    // Load user and game data from Firebase
    useEffect(() => {
        const initializeApp = async () => {
            try {
                let currentUser: TelegramUser;
                const tg = window.Telegram?.WebApp;

                if (tg && tg.initDataUnsafe?.user) {
                    // Production mode: We are inside Telegram
                    tg.ready();
                    tg.expand();
                    const user = tg.initDataUnsafe.user;
                    currentUser = {
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        username: user.username,
                        photoUrl: user.photo_url,
                    };
                } else {
                    // Developer mode: We are not inside Telegram
                    console.warn("Telegram environment not found. Running in developer mode.");
                    currentUser = {
                        id: 1337, // A mock user ID
                        firstName: "Dev",
                        lastName: "User",
                        username: "devuser",
                        photoUrl: '',
                    };
                }

                setTelegramUser(currentUser);

                let data = await getUserData(currentUser.id);

                if (data) {
                    // Calculation logic for offline earnings
                    const offlineTimeSec = Math.min((Date.now() - data.lastSeen) / 1000, BOT_OFFLINE_LIMIT_HOURS * 3600);
                    const botLevel = data.boosts[BoostType.AUTO_TAP_BOT]?.level || 0;
                    const botEarnings = botLevel > 0 ? offlineTimeSec * TAPS_PER_CLICK_BASE * botLevel : 0;
                    const regenLevel = data.boosts[BoostType.RECHARGING_SPEED]?.level || 0;
                    const currentEnergyRegenRate = INITIAL_ENERGY_REGEN_RATE + regenLevel;
                    const energyLimitLevel = data.boosts[BoostType.ENERGY_LIMIT]?.level || 0;
                    const currentMaxEnergy = INITIAL_MAX_ENERGY + (energyLimitLevel * 500);
                    const offlineEnergyGain = Math.floor(offlineTimeSec * currentEnergyRegenRate);

                    setGameState({
                        ...data,
                        balance: data.balance + botEarnings,
                        energy: Math.min(data.energy + offlineEnergyGain, currentMaxEnergy),
                    });
                } else {
                    // User doesn't exist, create a new one
                    const newUserData = await createUserData(currentUser);
                    setGameState(newUserData);
                }
            } catch (err: any) {
                console.error("Initialization failed:", err);
                setError(err.message || "An unexpected error occurred during loading.");
            } finally {
                setLoading(false);
            }
        };

        initializeApp();
    }, []); // Empty dependency array, so it runs only once

    // Fetch top players
    useEffect(() => {
        if (!telegramUser || currentView !== 'top') return;
        fetchTopPlayers(telegramUser.id, leaderboardTab).then(setTopPlayers);
    }, [telegramUser, leaderboardTab, currentView]); 

    // Game loop for energy and printer
    useEffect(() => {
        if (!gameState) return;
        const regenInterval = setInterval(() => {
            setGameState(prev => {
                if (!prev) return prev;
                const printerLevel = prev.boosts[BoostType.GG_PRINTER]?.level || 0;
                const incomePerSecond = printerLevel > 0 ? printerLevel * 0.005 * (prev.boosts[BoostType.MULTITAP].level + 1) : 0;
                return {
                    ...prev,
                    energy: Math.min(maxEnergy, prev.energy + energyRegenRate),
                    balance: prev.balance + incomePerSecond
                };
            });
        }, 1000);
        return () => clearInterval(regenInterval);
    }, [gameState, energyRegenRate, maxEnergy]);

    // Debounced save to Firebase
    useDebouncedEffect(() => {
        if (gameState && telegramUser) {
            saveUserData(telegramUser.id, { ...gameState, lastSeen: Date.now() });
        }
    }, [gameState], 2000);


    const handleTap = useCallback((x: number, y: number) => {
        if (!gameState) return;

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
                id: Date.now() + Math.random(),
                value: `+${formatLargeNumber(tapValue)}`,
                x: x + (Math.random() - 0.5) * 30, y, isCritical,
            };
            setFloatingNumbers(prev => [...prev, newFloatingNumber]);
            setTimeout(() => setFloatingNumbers(current => current.filter(n => n.id !== newFloatingNumber.id)), 2000);

            try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch (e) { /* Ignore */ }
        }
    }, [gameState, boosts, tapsPerClick]);

    const handleBuyBoost = useCallback((boostId: BoostType) => {
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

    const handleAdminTrigger = () => {
        const now = Date.now();
        if (now - lastAdminClickTime < 500) {
            const newCount = adminClickCount + 1;
            setAdminClickCount(newCount);
            if (newCount >= 5) {
                setIsPasswordModalOpen(true);
                setAdminClickCount(0);
            }
        } else {
            setAdminClickCount(1);
        }
        setLastAdminClickTime(now);
    };

    const handlePasswordSubmit = (password: string) => {
        if (password === '152212') {
            setIsPasswordModalOpen(false);
            setIsAdminPanelOpen(true);
            return true;
        }
        return false;
    };

    const handleTransfer = async (recipientId: number, amount: number) => {
        if (!telegramUser || !gameState || gameState.balance < amount || amount <= 0) {
            return { success: false, message: 'Недостаточно средств или неверные данные.' };
        }
        
        try {
            const result = await performTransferTransaction(telegramUser.id, recipientId, amount);
            
            // Update state based on successful transaction from Firebase
            setGameState(prev => {
                if (!prev) return prev;
                return { 
                    ...prev,
                    balance: prev.balance - amount,
                    transactions: [result.newTransaction, ...prev.transactions]
                };
            });
            
            return { success: true, message: `Перевод на ${amount.toFixed(4)} GG выполнен!` };

        } catch (error: any) {
             return { success: false, message: error.message || 'Ошибка транзакции' };
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="text-2xl font-orbitron">Загрузка GG PAY...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center text-center p-4">
                <div>
                    <h2 className="text-2xl font-orbitron text-red-500">Ошибка Загрузки</h2>
                    <p className="text-[var(--text-muted)] mt-2">{error}</p>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="h-screen w-screen flex items-center justify-center text-center p-4">
                 <div>
                    <h2 className="text-2xl font-orbitron text-red-500">Не удалось загрузить данные</h2>
                    <p className="text-[var(--text-muted)] mt-2">Пожалуйста, попробуйте перезапустить приложение.</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (currentView) {
            case 'home':
                return (
                    <div className="flex flex-col items-center justify-between h-full space-y-4 flex-grow">
                        <div className="text-center z-10 pt-4" onClick={handleAdminTrigger}>
                            <h1 className="font-orbitron text-5xl font-black tracking-tight text-white">
                                {formatLargeNumber(gameState.balance)}
                                <span className="text-4xl font-bold text-[var(--primary-accent)] text-glow-primary"> GG</span>
                            </h1>
                        </div>
                        <div className="relative w-full flex-grow flex items-center justify-center">
                            <Coin onTap={handleTap} floatingNumbers={floatingNumbers} />
                        </div>
                        <div className="w-full max-w-md mx-auto z-10 space-y-2 pb-2">
                            <div className="flex items-center justify-center space-x-2 text-2xl font-orbitron">
                                <span className="text-yellow-400">⚡️</span>
                                <span className="font-bold">{Math.floor(gameState.energy)} / {maxEnergy}</span>
                            </div>
                            <ProgressBar currentValue={gameState.energy} maxValue={maxEnergy} />
                        </div>
                    </div>
                );
            case 'boosts':
                return (
                    <div className="h-full flex flex-col">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-glow-primary font-orbitron">Улучшения</h2>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                            {Object.values(boosts).map(boost => (
                                <BoosterCard key={boost.id} boost={boost} balance={gameState.balance} onBuy={handleBuyBoost} />
                            ))}
                        </div>
                    </div>
                );
            case 'card':
                 return <VirtualCard cardData={gameState.cardData} user={telegramUser} balance={gameState.balance} onTransfer={handleTransfer} />;
            case 'top':
                return <TopPlayersView players={topPlayers} leaderboardTab={leaderboardTab} setLeaderboardTab={setLeaderboardTab} />;
            case 'profile':
                return <ProfileView user={telegramUser} balance={gameState.balance} onShowHistory={() => setIsHistoryModalOpen(true)} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-transparent flex flex-col overflow-hidden">
            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordSubmit} />
            <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} setBalance={() => {}} setEnergy={() => {}} resetState={() => {}} />
            <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} transactions={gameState.transactions} />

            <main className="flex-grow px-4 pt-16 pb-2 flex flex-col overflow-y-auto">
                {renderContent()}
            </main>
            
            <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
        </div>
    );
};

export default App;