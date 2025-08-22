import React, { useState, useEffect } from 'react';
import { BoostConfig, VerificationRequest } from '../types';
import { 
    setBanStatus, addBalance, getBoostsConfig, updateBoostsConfig,
    getVerificationRequests, updateVerificationStatus, sendGlobalNotification
} from '../firebase/service';

// Icons for the admin panel cubes
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const BoostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const NotifyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const VerifyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const AdminView: React.FC = () => {
    const [adminSection, setAdminSection] = useState<'users' | 'boosts' | 'notifications' | 'verification' | null>(null);
    
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

    // Fetch data when a section is opened
    useEffect(() => {
        if (adminSection === 'boosts') {
            getBoostsConfig().then(setBoosts);
        }
        if (adminSection === 'verification') {
            getVerificationRequests().then(setRequests);
        }
    }, [adminSection]);

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

    const renderSection = () => {
        if (!adminSection) return null;

        let title = '';
        let content: React.ReactNode = null;

        switch (adminSection) {
            case 'users':
                title = 'Управление пользователями';
                content = (
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
                break;
            case 'boosts':
                title = 'Настройка улучшений';
                content = (
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
                break;
            case 'notifications':
                title = 'Глобальные уведомления';
                content = (
                     <div className="space-y-4">
                        <textarea value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} placeholder="Сообщение для всех пользователей" rows={4} className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)]"></textarea>
                        <button onClick={handleSendNotification} className="w-full p-3 rounded-xl bg-[var(--primary-accent)]">Отправить</button>
                    </div>
                );
                break;
            case 'verification':
                 title = 'Запросы на верификацию';
                 content = (
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
                 break;
        }

        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center mb-6">
                     <button onClick={() => setAdminSection(null)} className="p-2 mr-2 rounded-full glass-button">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                     </button>
                     <h3 className="text-xl font-bold font-orbitron">{title}</h3>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {content}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col text-white">
            <h2 className="text-3xl font-bold text-glow-primary font-orbitron text-center mb-6">Панель Администратора</h2>

            {adminSection ? renderSection() : (
                <div className="grid grid-cols-2 gap-4 flex-grow">
                    <button onClick={() => setAdminSection('users')} className="glass-panel p-4 flex flex-col justify-center items-center text-center transition-transform transform hover:scale-105">
                        <UserIcon />
                        <span className="font-bold">Пользователи</span>
                    </button>
                    <button onClick={() => setAdminSection('boosts')} className="glass-panel p-4 flex flex-col justify-center items-center text-center transition-transform transform hover:scale-105">
                        <BoostIcon />
                        <span className="font-bold">Улучшения</span>
                    </button>
                    <button onClick={() => setAdminSection('notifications')} className="glass-panel p-4 flex flex-col justify-center items-center text-center transition-transform transform hover:scale-105">
                        <NotifyIcon />
                        <span className="font-bold">Уведомления</span>
                    </button>
                    <button onClick={() => setAdminSection('verification')} className="glass-panel p-4 flex flex-col justify-center items-center text-center transition-transform transform hover:scale-105">
                        <VerifyIcon />
                        <span className="font-bold">Верификация</span>
                    </button>
                </div>
            )}
            
            {statusMessage && (
                <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 p-3 rounded-lg text-white ${statusMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'} z-50`}>
                    {statusMessage.text}
                </div>
            )}
        </div>
    );
};
export default AdminView;