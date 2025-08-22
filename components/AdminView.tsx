import React, { useState, useEffect } from 'react';
import { BoostConfig, VerificationRequest } from '../types';
import { 
    setBanStatus, addBalance, getBoostsConfig, updateBoostsConfig,
    getVerificationRequests, updateVerificationStatus, sendGlobalNotification
} from '../firebase/service';

type AdminTab = 'users' | 'boosts' | 'notifications' | 'verification';

const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    
    // Users Tab State
    const [userId, setUserId] = useState('');
    const [balanceAmount, setBalanceAmount] = useState('');
    
    // Boosts Tab State
    const [boosts, setBoosts] = useState<BoostConfig[]>([]);
    const [isEditingBoosts, setIsEditingBoosts] = useState(false);
    
    // Notifications Tab State
    const [notificationMessage, setNotificationMessage] = useState('');
    
    // Verification Tab State
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (activeTab === 'boosts') {
            getBoostsConfig().then(setBoosts);
        }
        if (activeTab === 'verification') {
            getVerificationRequests().then(setRequests);
        }
    }, [activeTab]);

    const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleBan = async () => {
        if (!userId) { showStatus('Введите ID пользователя', 'error'); return; }
        await setBanStatus(Number(userId), true);
        showStatus(`Пользователь ${userId} заблокирован.`);
    };

    const handleUnban = async () => {
        if (!userId) { showStatus('Введите ID пользователя', 'error'); return; }
        await setBanStatus(Number(userId), false);
        showStatus(`Пользователь ${userId} разблокирован.`);
    };
    
    const handleAddBalance = async () => {
        if (!userId || !balanceAmount) { showStatus('Введите ID и сумму', 'error'); return; }
        await addBalance(Number(userId), Number(balanceAmount));
        showStatus(`Баланс ${userId} пополнен на ${balanceAmount}.`);
        setBalanceAmount('');
    };
    
    const handleUpdateBoost = (index: number, field: keyof BoostConfig, value: string | number) => {
        const newBoosts = [...boosts];
        (newBoosts[index] as any)[field] = value;
        setBoosts(newBoosts);
    };

    const handleAddBoost = () => {
        setBoosts([...boosts, { id: `NEW_BOOST_${Date.now()}`, name: 'Новый Бустер', description: '', maxLevel: 5, iconName: 'MULTITAP', costFormula: '10000 * 2 ** level' }]);
    };
    
    const handleSaveBoosts = async () => {
        await updateBoostsConfig(boosts);
        setIsEditingBoosts(false);
        showStatus('Конфигурация бустеров сохранена.');
    };
    
    const handleSendNotification = async () => {
        if (!notificationMessage) { showStatus('Введите сообщение', 'error'); return; }
        await sendGlobalNotification(notificationMessage);
        showStatus('Уведомление отправлено.');
        setNotificationMessage('');
    };

    const handleVerification = async (reqUserId: number, approve: boolean) => {
        await updateVerificationStatus(reqUserId, approve ? 'verified' : 'rejected');
        setRequests(requests.filter(r => r.userId !== reqUserId));
        showStatus(`Запрос от ${reqUserId} ${approve ? 'одобрен' : 'отклонен'}.`);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                return (
                    <div className="space-y-4">
                        <input type="number" value={userId} onChange={e => setUserId(e.target.value)} placeholder="User ID" className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)]"/>
                        <div className="flex gap-2">
                            <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="Сумма GG" className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)]"/>
                            <button onClick={handleAddBalance} className="p-3 rounded-xl bg-[var(--primary-accent)]">Выдать</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleBan} className="w-full p-3 rounded-xl bg-[var(--danger-color)]">Забанить</button>
                            <button onClick={handleUnban} className="w-full p-3 rounded-xl bg-[var(--success-color)]">Разбанить</button>
                        </div>
                    </div>
                );
            case 'boosts':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2">
                            {!isEditingBoosts && <button onClick={() => setIsEditingBoosts(true)} className="p-2 rounded-xl bg-[var(--primary-accent)]">Редактировать</button>}
                            {isEditingBoosts && <>
                                <button onClick={handleAddBoost} className="p-2 rounded-xl bg-[var(--success-color)]">Добавить</button>
                                <button onClick={handleSaveBoosts} className="p-2 rounded-xl bg-[var(--primary-accent)]">Сохранить</button>
                            </>}
                        </div>
                        {boosts.map((boost, index) => (
                            <div key={index} className="p-3 bg-black/20 rounded-lg space-y-2">
                                <input disabled={!isEditingBoosts} value={boost.name} onChange={e => handleUpdateBoost(index, 'name', e.target.value)} placeholder="Название" className="w-full bg-transparent font-bold" />
                                <input disabled={!isEditingBoosts} value={boost.description} onChange={e => handleUpdateBoost(index, 'description', e.target.value)} placeholder="Описание" className="w-full bg-transparent text-sm" />
                                <input disabled={!isEditingBoosts} value={boost.costFormula} onChange={e => handleUpdateBoost(index, 'costFormula', e.target.value)} placeholder="Формула стоимости" className="w-full bg-transparent text-xs font-mono" />
                            </div>
                        ))}
                    </div>
                );
            case 'notifications':
                return (
                     <div className="space-y-4">
                        <textarea value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} placeholder="Сообщение для всех пользователей" rows={4} className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)]"></textarea>
                        <button onClick={handleSendNotification} className="w-full p-3 rounded-xl bg-[var(--primary-accent)]">Отправить</button>
                    </div>
                );
            case 'verification':
                 return (
                    <div className="space-y-3">
                        {requests.length > 0 ? requests.map(req => (
                            <div key={req.userId} className="p-3 bg-black/20 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{req.userName}</p>
                                    <p className="text-xs text-[var(--text-muted)]">ID: {req.userId}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVerification(req.userId, true)} className="p-2 rounded-lg bg-[var(--success-color)] text-xs">Одобрить</button>
                                    <button onClick={() => handleVerification(req.userId, false)} className="p-2 rounded-lg bg-[var(--danger-color)] text-xs">Отклонить</button>
                                </div>
                            </div>
                        )) : <p className="text-center text-[var(--text-muted)]">Нет новых запросов.</p>}
                    </div>
                 );
            default: return null;
        }
    };
    
    return (
        <div className="h-full flex flex-col text-white">
            <h2 className="text-3xl font-bold text-glow-primary font-orbitron text-center mb-6">Панель Администратора</h2>
            <div className="flex justify-center mb-4 p-1 rounded-full glass-panel max-w-md mx-auto text-sm">
                <button onClick={() => setActiveTab('users')} className={`w-1/4 py-2 rounded-full font-bold transition-colors ${activeTab === 'users' ? 'bg-[var(--primary-accent)]' : ''}`}>Users</button>
                <button onClick={() => setActiveTab('boosts')} className={`w-1/4 py-2 rounded-full font-bold transition-colors ${activeTab === 'boosts' ? 'bg-[var(--primary-accent)]' : ''}`}>Boosts</button>
                <button onClick={() => setActiveTab('notifications')} className={`w-1/4 py-2 rounded-full font-bold transition-colors ${activeTab === 'notifications' ? 'bg-[var(--primary-accent)]' : ''}`}>Notify</button>
                <button onClick={() => setActiveTab('verification')} className={`w-1/4 py-2 rounded-full font-bold transition-colors ${activeTab === 'verification' ? 'bg-[var(--primary-accent)]' : ''}`}>Verify</button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                {renderTabContent()}
            </div>
            
            {statusMessage && (
                <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 p-3 rounded-lg text-white ${statusMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {statusMessage.text}
                </div>
            )}
        </div>
    );
};
export default AdminView;