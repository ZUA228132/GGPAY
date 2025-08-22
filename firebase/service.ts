import { db } from './config';
import { ref, get, set, runTransaction, query, orderByChild, limitToLast, child } from "firebase/database";
import { GameState, TelegramUser, BoostType, Transaction, Player } from '../types';
import { BOOSTS_CONFIG, INITIAL_ENERGY } from '../constants';

const getInitialBoosts = () => {
    const boosts: any = {};
    BOOSTS_CONFIG.forEach(b => {
        boosts[b.id] = { level: 0 };
    });
    return boosts as Record<BoostType, { level: number }>;
};

const generateNewCard = () => {
    const newCardNumber = `5555 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const expiryYear = new Date().getFullYear() + 5 - 2000;
    const expiryMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
    return { cardNumber: newCardNumber, expiryDate: `${expiryMonth}/${expiryYear}` };
};

export const createUserData = async (user: TelegramUser): Promise<GameState> => {
    const newUserState: GameState = {
        balance: 0,
        energy: INITIAL_ENERGY,
        boosts: getInitialBoosts(),
        lastSeen: Date.now(),
        transactions: [],
        cardData: generateNewCard(),
    };
    const userRef = ref(db, `users/${user.id}`);
    const profileRef = ref(db, `profiles/${user.id}`);
    
    await set(userRef, newUserState);
    await set(profileRef, {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || `User ${user.id}`,
        username: user.username || ''
    });

    return newUserState;
};

export const getUserData = async (userId: number): Promise<GameState | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        // Ensure transactions is an array
        if (!data.transactions) {
            data.transactions = [];
        }
        // Ensure boosts exist for backward compatibility
        if (!data.boosts) {
            data.boosts = getInitialBoosts();
        }
        // Ensure cardData exists for backward compatibility
        if (!data.cardData) {
            data.cardData = generateNewCard();
        }
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
    if (!recipientSnapshot.exists()) {
        throw new Error("Получатель не найден.");
    }

    await runTransaction(senderRef, (currentUserData: GameState) => {
        if (currentUserData) {
            if (currentUserData.balance < amount) {
                // Not enough balance, abort transaction
                return; // Abort
            }
            currentUserData.balance -= amount;
            if (!currentUserData.transactions) {
                currentUserData.transactions = [];
            }
            currentUserData.transactions.unshift({
                id: `txn_${Date.now()}`,
                type: 'sent',
                amount: amount,
                counterpartyId: recipientId,
                timestamp: Date.now(),
            });
        }
        return currentUserData;
    });

    await runTransaction(recipientRef, (currentUserData: GameState) => {
        if (currentUserData) {
            currentUserData.balance += amount;
             if (!currentUserData.transactions) {
                currentUserData.transactions = [];
            }
            currentUserData.transactions.unshift({
                id: `txn_${Date.now()}`,
                type: 'received',
                amount: amount,
                counterpartyId: senderId,
                timestamp: Date.now(),
            });
        }
        return currentUserData;
    });

    return {
        success: true,
        newTransaction: {
            id: `txn_${Date.now()}`,
            type: 'sent',
            amount,
            counterpartyId: recipientId,
            timestamp: Date.now(),
        },
    };
};

export const fetchTopPlayers = async (currentUserId: number, sortBy: 'gg' | 'boosts'): Promise<Player[]> => {
    const usersRef = ref(db, 'users');
    const profilesRef = ref(db, 'profiles');
    
    // For simplicity and performance, we'll fetch a limited number of top players.
    // Real-world scenarios might require more complex queries or backend processing.
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
        };
    });

    if (sortBy === 'boosts') {
        players.sort((a, b) => (b.totalBoostLevel || 0) - (a.totalBoostLevel || 0));
    } else {
        players.sort((a, b) => b.balance - a.balance);
    }

    return players;
};
