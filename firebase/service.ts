import { db } from './config';
import { ref, get, set, runTransaction, query, orderByChild, limitToLast, child, serverTimestamp, update } from "firebase/database";
import { GameState, TelegramUser, BoostId, Transaction, Player, BoostConfig, VerificationRequest, GlobalNotification, VerificationStatus } from '../types';
import { INITIAL_ENERGY, INITIAL_BOOSTS_CONFIG } from '../constants';

const getInitialBoosts = (config: BoostConfig[]) => {
    const boosts: any = {};
    config.forEach(b => {
        boosts[b.id] = { level: 0 };
    });
    return boosts as Record<BoostId, { level: number }>;
};

const generateNewCard = () => {
    const newCardNumber = `5555 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const expiryYear = new Date().getFullYear() + 5 - 2000;
    const expiryMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
    return { cardNumber: newCardNumber, expiryDate: `${expiryMonth}/${expiryYear}` };
};

export const createUserData = async (user: TelegramUser, boostsConfig: BoostConfig[]): Promise<GameState> => {
    const newUserState: GameState = {
        balance: 0,
        energy: INITIAL_ENERGY,
        boosts: getInitialBoosts(boostsConfig),
        lastSeen: Date.now(),
        transactions: [],
        cardData: generateNewCard(),
        isBanned: false,
        isVerified: false,
        verificationStatus: 'none',
    };
    const userRef = ref(db, `users/${user.id}`);
    const profileRef = ref(db, `profiles/${user.id}`);
    
    await set(userRef, newUserState);
    await set(profileRef, {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || `User ${user.id}`,
        username: user.username || '',
        isVerified: false
    });

    return newUserState;
};

export const getUserData = async (userId: number): Promise<GameState | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        // Backward compatibility checks
        if (!data.transactions) data.transactions = [];
        if (!data.cardData) data.cardData = generateNewCard();
        if (typeof data.isBanned === 'undefined') data.isBanned = false;
        if (typeof data.isVerified === 'undefined') data.isVerified = false;
        if (!data.verificationStatus) data.verificationStatus = 'none';

        return data;
    }
    return null;
};

export const saveUserData = async (userId: number, gameState: GameState): Promise<void> => {
    const userRef = ref(db, `users/${userId}`);
    await set(userRef, gameState);
};

export const performTransferTransaction = async (
    senderId: number,
    recipientId: number,
    amount: number
): Promise<{ success: boolean; newTransaction: Transaction }> => {
    if (senderId === recipientId) throw new Error("Нельзя перевести самому себе.");
    if (amount <= 0) throw new Error("Сумма должна быть положительной.");

    const senderRef = ref(db, `users/${senderId}`);
    const recipientRef = ref(db, `users/${recipientId}`);

    const recipientSnapshot = await get(recipientRef);
    if (!recipientSnapshot.exists()) throw new Error("Получатель не найден.");

    const txId = `txn_${Date.now()}`;
    const timestamp = Date.now();

    await runTransaction(senderRef, (currentUserData: GameState) => {
        if (currentUserData) {
            if (currentUserData.balance < amount) return; // Abort
            currentUserData.balance -= amount;
            if (!currentUserData.transactions) currentUserData.transactions = [];
            currentUserData.transactions.unshift({ id: txId, type: 'sent', amount, counterpartyId: recipientId, timestamp });
        }
        return currentUserData;
    });

    await runTransaction(recipientRef, (currentUserData: GameState) => {
        if (currentUserData) {
            currentUserData.balance += amount;
             if (!currentUserData.transactions) currentUserData.transactions = [];
            currentUserData.transactions.unshift({ id: txId, type: 'received', amount, counterpartyId: senderId, timestamp });
        }
        return currentUserData;
    });

    return { success: true, newTransaction: { id: txId, type: 'sent', amount, counterpartyId: recipientId, timestamp }};
};

export const fetchTopPlayers = async (currentUserId: number, sortBy: 'gg' | 'boosts'): Promise<Player[]> => {
    const usersRef = ref(db, 'users');
    const profilesRef = ref(db, 'profiles');
    
    const topQuery = query(usersRef, orderByChild('balance'), limitToLast(50));
    
    const [usersSnapshot, profilesSnapshot] = await Promise.all([get(topQuery), get(profilesRef)]);

    if (!usersSnapshot.exists() || !profilesSnapshot.exists()) return [];

    const usersData = usersSnapshot.val();
    const profilesData = profilesSnapshot.val();
    
    const players: Player[] = Object.entries(usersData).map(([id, data]) => {
        const gameState = data as GameState;
        const totalBoostLevel = Object.values(gameState.boosts || {}).reduce((sum, b: any) => sum + b.level, 0);
        return {
            id: parseInt(id, 10),
            name: profilesData[id]?.name || `User ${id}`,
            balance: gameState.balance,
            boosts: gameState.boosts as any,
            totalBoostLevel,
            isCurrentUser: parseInt(id, 10) === currentUserId,
            isVerified: profilesData[id]?.isVerified || false,
        };
    });

    if (sortBy === 'boosts') {
        players.sort((a, b) => (b.totalBoostLevel || 0) - (a.totalBoostLevel || 0));
    } else {
        players.sort((a, b) => b.balance - a.balance);
    }
    return players;
};

// --- Admin Functions ---

export const setBanStatus = async (userId: number, isBanned: boolean) => {
    const userRef = ref(db, `users/${userId}/isBanned`);
    await set(userRef, isBanned);
};

export const addBalance = async (userId: number, amount: number) => {
    const userRef = ref(db, `users/${userId}/balance`);
    await runTransaction(userRef, (currentBalance) => (currentBalance || 0) + amount);
};

export const getBoostsConfig = async (): Promise<BoostConfig[]> => {
    const configRef = ref(db, 'config/boosts');
    const snapshot = await get(configRef);
    if (snapshot.exists()) {
        return Object.values(snapshot.val());
    } else {
        await set(configRef, INITIAL_BOOSTS_CONFIG.reduce((acc, b) => ({ ...acc, [b.id]: b }), {}));
        return INITIAL_BOOSTS_CONFIG;
    }
};

export const updateBoostsConfig = async (newConfig: BoostConfig[]) => {
    const configRef = ref(db, 'config/boosts');
    await set(configRef, newConfig.reduce((acc, b) => ({ ...acc, [b.id]: b }), {}));
};

export const getVerificationRequests = async (): Promise<VerificationRequest[]> => {
    const requestsRef = ref(db, 'admin/verificationRequests');
    const snapshot = await get(requestsRef);
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const updateVerificationStatus = async (userId: number, status: VerificationStatus) => {
    const userUpdates: any = {};
    userUpdates[`users/${userId}/isVerified`] = status === 'verified';
    userUpdates[`users/${userId}/verificationStatus`] = status;
    userUpdates[`profiles/${userId}/isVerified`] = status === 'verified';
    await update(ref(db), userUpdates);

    // Remove request from queue
    const requestRef = ref(db, `admin/verificationRequests/${userId}`);
    await set(requestRef, null);
};

export const requestVerification = async (userId: number, userName: string) => {
    const requestRef = ref(db, `admin/verificationRequests/${userId}`);
    await set(requestRef, { userId, userName, timestamp: serverTimestamp() });
    
    const userStatusRef = ref(db, `users/${userId}/verificationStatus`);
    await set(userStatusRef, 'pending');
};

export const sendGlobalNotification = async (message: string) => {
    const id = `notif_${Date.now()}`;
    const notificationRef = ref(db, `admin/notifications/${id}`);
    await set(notificationRef, { id, message, timestamp: serverTimestamp() });
};

export const getLatestNotification = async (lastSeenId: string | null): Promise<GlobalNotification | null> => {
    const notificationsRef = query(ref(db, 'admin/notifications'), limitToLast(1));
    const snapshot = await get(notificationsRef);
    if (snapshot.exists()) {
        const [latestNotification] = Object.values(snapshot.val()) as GlobalNotification[];
        if (latestNotification && latestNotification.id !== lastSeenId) {
            return latestNotification;
        }
    }
    return null;
};

export const markNotificationAsSeen = (userId: number, notificationId: string) => {
    localStorage.setItem(`seen_notification_${userId}`, notificationId);
};
