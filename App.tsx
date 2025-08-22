import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FloatingNumber, Boost, BoostType, View, Player, TelegramUser, Transaction, CardData } from './types';
import { BOOSTS_CONFIG, TAPS_PER_CLICK_BASE, INITIAL_ENERGY, INITIAL_MAX_ENERGY, INITIAL_ENERGY_REGEN_RATE, BOT_OFFLINE_LIMIT_HOURS } from './constants';
import { MOCK_TOP_PLAYERS } from './mock-data';
import { formatLargeNumber } from './utils';
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
const TransferIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>);
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
                    <div className="space-y-2">
                        <label className="block text-sm text-[var(--text-muted)]">Установить баланс</label>
                        <div className="flex gap-2">
                          <input type="number" value={balanceInput} onChange={e => setBalanceInput(e.target.value)} className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]"/>
                          <button onClick={handleSetBalance} className="p-3 rounded-xl glass-button text-[var(--primary-accent)]"><EditIcon /></button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm text-[var(--text-muted)]">Установить энергию</label>
                        <div className="flex gap-2">
                            <input type="number" value={energyInput} onChange={e => setEnergyInput(e.target.value)} className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]"/>
                            <button onClick={handleSetEnergy} className="p-3 rounded-xl glass-button text-[var(--primary-accent)]"><EditIcon /></button>
                        </div>
                    </div>
                    <button onClick={resetState} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold glass-button text-[var(--danger-color)]">
                        <ResetIcon />
                        СБРОСИТЬ ПРОГРЕСС
                    </button>
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

const TransferView: React.FC<{balance: number; onTransfer: (recipientId: number, amount: number) => boolean}> = ({ balance, onTransfer }) => {
    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSend = () => {
        setError('');
        setSuccess('');
        
        const numRecipientId = parseInt(recipientId, 10);
        const numAmount = parseFloat(amount);

        if (isNaN(numRecipientId) || numRecipientId <= 0) {
            setError('Введите корректный ID получателя.');
            return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Введите корректную сумму.');
            return;
        }
        if (numAmount > balance) {
            setError('Недостаточно средств на балансе.');
            return;
        }

        if (onTransfer(numRecipientId, numAmount)) {
            setSuccess(`Успешно переведено ${formatLargeNumber(numAmount)} GG!`);
            setRecipientId('');
            setAmount('');
        } else {
             setError('Произошла ошибка при переводе.');
        }
    };
    
    return (
        <div className="h-full flex flex-col">
             <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-glow-primary font-orbitron">Перевод по ID</h2>
            </div>
            <div className="w-full max-w-sm mx-auto space-y-6 glass-panel p-6">
                <div className="space-y-2">
                    <label className="block text-sm text-[var(--text-muted)]">ID Получателя</label>
                    <input 
                        type="number"
                        placeholder="123456789"
                        value={recipientId}
                        onChange={e => { setError(''); setSuccess(''); setRecipientId(e.target.value); }}
                        className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)] font-orbitron"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm text-[var(--text-muted)]">Сумма GG</label>
                    <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => { setError(''); setSuccess(''); setAmount(e.target.value); }}
                        className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)] font-orbitron"
                    />
                </div>
                <p className="text-xs text-[var(--text-muted)] text-center">Ваш баланс: {formatLargeNumber(balance)} GG</p>
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {success && <p className="text-green-400 text-sm text-center">{success}</p>}

                <button 
                    onClick={handleSend}
                    className="w-full p-3 rounded-xl font-bold bg-[var(--primary-accent)] text-white disabled:bg-gray-600 transition-colors"
                    disabled={!recipientId || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                >
                    Отправить
                </button>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);
    const [currentView, setCurrentView] = useState<View>('home');
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [adminClickCount, setAdminClickCount] = useState(0);
    const [lastAdminClickTime, setLastAdminClickTime] = useState(0);
    const [leaderboardTab, setLeaderboardTab] = useState<'gg' | 'boosts'>('gg');
    const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [cardData, setCardData] = useState<CardData | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const initialBoosts = useMemo(() => {
        const boosts: Record<BoostType, Boost> = {} as Record<BoostType, Boost>;
        BOOSTS_CONFIG.forEach(b => {
            boosts[b.id] = { ...b, level: 0 };
        });
        return boosts;
    }, []);

    const [boosts, setBoosts] = useState<Record<BoostType, Boost>>(initialBoosts);
    
    const [maxEnergy, setMaxEnergy] = useState<number>(INITIAL_MAX_ENERGY);
    const [energy, setEnergy] = useState<number>(INITIAL_ENERGY);
    const [energyRegenRate, setEnergyRegenRate] = useState<number>(INITIAL_ENERGY_REGEN_RATE);
    const [tapsPerClick, setTapsPerClick] = useState<number>(TAPS_PER_CLICK_BASE);
    const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);

    const [topPlayers, setTopPlayers] = useState<Player[]>([]);

    const loadGameState = useCallback(() => {
        try {
            const savedState = localStorage.getItem('ggPayGameStateV2');
            if (savedState) {
                const state = JSON.parse(savedState);
                const loadedBalance = state.balance || 0;
                setBalance(loadedBalance);
                
                const lastSeen = state.lastSeen || Date.now();
                const offlineTimeSec = Math.min((Date.now() - lastSeen) / 1000, BOT_OFFLINE_LIMIT_HOURS * 3600);

                const loadedBoosts = { ...initialBoosts };
                if (state.boosts) {
                    for (const key in state.boosts) {
                        if (loadedBoosts[key as BoostType]) {
                            loadedBoosts[key as BoostType].level = state.boosts[key].level;
                        }
                    }
                }
                setBoosts(loadedBoosts);

                // Load transactions and card data
                setTransactions(state.transactions || []);
                if (state.cardData) {
                    setCardData(state.cardData);
                } else {
                    const newCardNumber = `5555 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
                    const expiryYear = new Date().getFullYear() + 5 - 2000;
                    const expiryMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
                    const newCardData = { cardNumber: newCardNumber, expiryDate: `${expiryMonth}/${expiryYear}` };
                    setCardData(newCardData);
                }

                const multitapLevel = loadedBoosts[BoostType.MULTITAP]?.level || 0;
                setTapsPerClick(TAPS_PER_CLICK_BASE * (multitapLevel + 1));

                const energyLimitLevel = loadedBoosts[BoostType.ENERGY_LIMIT]?.level || 0;
                const newMaxEnergy = INITIAL_MAX_ENERGY + (energyLimitLevel * 500);
                setMaxEnergy(newMaxEnergy);

                const regenLevel = loadedBoosts[BoostType.RECHARGING_SPEED]?.level || 0;
                const newEnergyRegenRate = INITIAL_ENERGY_REGEN_RATE + regenLevel;
                setEnergyRegenRate(newEnergyRegenRate);
                
                const botLevel = loadedBoosts[BoostType.AUTO_TAP_BOT]?.level || 0;
                if (botLevel > 0) {
                    const botEarnings = offlineTimeSec * TAPS_PER_CLICK_BASE * botLevel;
                    setBalance(prev => prev + botEarnings);
                }

                const offlineEnergyGain = Math.floor(offlineTimeSec * newEnergyRegenRate);
                setEnergy(Math.min(state.energy + offlineEnergyGain, newMaxEnergy));
            } else {
                 setBoosts(initialBoosts);
                 setEnergy(INITIAL_ENERGY);
            }
        } catch (error) {
            console.error("Failed to load game state:", error);
        }
    }, [initialBoosts]);
    
    const saveGameState = useCallback(() => {
        try {
            const state = { 
                balance, 
                energy, 
                boosts, 
                lastSeen: Date.now(),
                transactions,
                cardData,
            };
            localStorage.setItem('ggPayGameStateV2', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save game state:", error);
        }
    }, [balance, energy, boosts, transactions, cardData]);
    
    const resetGameState = () => {
        localStorage.removeItem('ggPayGameStateV2');
        window.location.reload();
    };

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if(tg) {
            tg.ready();
            tg.expand();
            const user = tg.initDataUnsafe?.user;
            if (user) {
                const currentUser: TelegramUser = {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    photoUrl: user.photo_url,
                };
                setTelegramUser(currentUser);

                const userIndex = MOCK_TOP_PLAYERS.findIndex(p => p.isCurrentUser);
                if (userIndex !== -1) {
                    MOCK_TOP_PLAYERS[userIndex].id = currentUser.id;
                    MOCK_TOP_PLAYERS[userIndex].name = currentUser.firstName || currentUser.username || 'You';
                }
            }
        }
        loadGameState();
    }, [loadGameState]);

    useEffect(() => {
        const currentUserBoostLevels = Object.fromEntries(
            Object.entries(boosts).map(([key, value]) => [key, { level: value.level }])
        ) as { [key in BoostType]?: { level: number } };

        const playersWithTotals = MOCK_TOP_PLAYERS.map(p => {
            const currentBoosts = p.isCurrentUser ? currentUserBoostLevels : p.boosts;
            const totalBoostLevel = Object.values(currentBoosts).reduce((sum, boost) => sum + (boost?.level || 0), 0);
            return {
                ...p,
                balance: p.isCurrentUser ? balance : p.balance,
                boosts: currentBoosts,
                totalBoostLevel
            };
        });
        
        const sortedPlayers = [...playersWithTotals].sort((a, b) => {
            if (leaderboardTab === 'boosts') {
                return (b.totalBoostLevel || 0) - (a.totalBoostLevel || 0);
            }
            return b.balance - a.balance;
        });

        setTopPlayers(sortedPlayers);
    }, [balance, boosts, leaderboardTab]);

    useEffect(() => {
        const regenInterval = setInterval(() => {
            setEnergy(prev => Math.min(maxEnergy, prev + energyRegenRate));
            
            const printerLevel = boosts[BoostType.GG_PRINTER]?.level || 0;
            if (printerLevel > 0) {
                const incomePerSecond = printerLevel * 0.005 * (boosts[BoostType.MULTITAP].level + 1);
                setBalance(prev => prev + incomePerSecond);
            }
        }, 1000);
        return () => clearInterval(regenInterval);
    }, [energyRegenRate, maxEnergy, boosts]);
    
    useEffect(() => {
      const saveInterval = setInterval(saveGameState, 5000);
      return () => clearInterval(saveInterval);
    }, [saveGameState]);

    const handleTap = useCallback((x: number, y: number) => {
        const energyCost = 1;
        const guruLevel = boosts[BoostType.ENERGY_GURU].level;
        const freeTapChance = guruLevel * 0.02; // 2% chance per level
        const consumesEnergy = Math.random() > freeTapChance;

        if (!consumesEnergy || energy >= energyCost) {
            const critLevel = boosts[BoostType.CRITICAL_TAP].level;
            const critChance = critLevel * 0.005; // 0.5% chance per level
            const isCritical = Math.random() < critChance;
            const tapMultiplier = isCritical ? 10 : 1;
            const tapValue = tapsPerClick * tapMultiplier;

            setBalance(prev => prev + tapValue);
            if (consumesEnergy) {
                setEnergy(prev => prev - energyCost);
            }

            const newFloatingNumber: FloatingNumber = {
                id: Date.now() + Math.random(),
                value: `+${formatLargeNumber(tapValue)}`,
                x: x + (Math.random() - 0.5) * 30,
                y,
                isCritical,
            };
            setFloatingNumbers(prev => [...prev, newFloatingNumber]);
            setTimeout(() => {
                setFloatingNumbers(current => current.filter(n => n.id !== newFloatingNumber.id));
            }, 2000);

            try {
                if(window.Telegram && window.Telegram.WebApp.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                }
            } catch (e) { /* Ignore */ }
        }
    }, [energy, tapsPerClick, boosts]);

    const handleBuyBoost = useCallback((boostId: BoostType) => {
        const boost = boosts[boostId];
        if (!boost || boost.level >= boost.maxLevel) return;

        const cost = boost.getCost(boost.level);
        if (balance >= cost) {
            setBalance(prev => prev - cost);
            
            const newBoosts = { ...boosts, [boostId]: { ...boost, level: boost.level + 1 } };
            setBoosts(newBoosts);

            if (boostId === BoostType.MULTITAP) {
                setTapsPerClick(TAPS_PER_CLICK_BASE * (newBoosts[BoostType.MULTITAP].level + 1));
            } else if (boostId === BoostType.ENERGY_LIMIT) {
                setMaxEnergy(INITIAL_MAX_ENERGY + (newBoosts[BoostType.ENERGY_LIMIT].level * 500));
            } else if (boostId === BoostType.RECHARGING_SPEED) {
                setEnergyRegenRate(INITIAL_ENERGY_REGEN_RATE + newBoosts[BoostType.RECHARGING_SPEED].level);
            }
        }
    }, [balance, boosts]);

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

    const handleTransfer = (recipientId: number, amount: number) => {
        if (balance >= amount && amount > 0) {
            setBalance(prev => prev - amount);
            const newTransaction: Transaction = {
                id: `txn_${Date.now()}`,
                type: 'sent',
                amount: amount,
                counterpartyId: recipientId,
                timestamp: Date.now(),
            };
            setTransactions(prev => [newTransaction, ...prev]);
            return true;
        }
        return false;
    };

    const renderContent = () => {
        switch (currentView) {
            case 'home':
                return (
                    <div className="flex flex-col items-center justify-between h-full space-y-4 flex-grow">
                        <div className="text-center z-10 pt-4" onClick={handleAdminTrigger}>
                            <h1 className="font-orbitron text-5xl font-black tracking-tight text-white">
                                {formatLargeNumber(balance)}
                                <span className="text-4xl font-bold text-[var(--primary-accent)] text-glow-primary"> GG</span>
                            </h1>
                        </div>
                        <div className="relative w-full flex-grow flex items-center justify-center">
                            <Coin onTap={handleTap} floatingNumbers={floatingNumbers} />
                        </div>
                        <div className="w-full max-w-md mx-auto z-10 space-y-2 pb-2">
                            <div className="flex items-center justify-center space-x-2 text-2xl font-orbitron">
                                <span className="text-yellow-400">⚡️</span>
                                <span className="font-bold">{Math.floor(energy)} / {maxEnergy}</span>
                            </div>
                            <ProgressBar currentValue={energy} maxValue={maxEnergy} />
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
                                <BoosterCard key={boost.id} boost={boost} balance={balance} onBuy={handleBuyBoost} />
                            ))}
                        </div>
                    </div>
                );
            case 'card':
                 return <VirtualCard cardData={cardData} user={telegramUser} />;
            case 'top':
                return <TopPlayersView players={topPlayers} leaderboardTab={leaderboardTab} setLeaderboardTab={setLeaderboardTab} />;
            case 'profile':
                return <ProfileView user={telegramUser} balance={balance} onShowHistory={() => setIsHistoryModalOpen(true)} />;
            case 'transfer':
                setCurrentView('card'); // Redirect to card view
                return <div className="h-full flex items-center justify-center"><p>Переводы теперь доступны на главном экране карты.</p></div>;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-transparent flex flex-col overflow-hidden">
            <PasswordModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
            />
            <AdminPanel 
                isOpen={isAdminPanelOpen}
                onClose={() => setIsAdminPanelOpen(false)}
                setBalance={setBalance}
                setEnergy={setEnergy}
                resetState={resetGameState}
            />
            <HistoryModal 
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                transactions={transactions}
            />

            <main className="flex-grow p-4 pb-2 flex flex-col overflow-y-auto">
                {renderContent()}
            </main>
            
            {currentView !== 'transfer' && <BottomNav currentView={currentView} setCurrentView={setCurrentView} />}
        </div>
    );
};

export default App;