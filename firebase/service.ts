import { db } from './config';
import { ref, get, set, runTransaction, query, orderByChild, limitToLast, serverTimestamp, update } from "firebase/database";
import { GameState, TelegramUser, BoostId, Transaction, Player, BoostConfig, VerificationRequest, GlobalNotification, VerificationStatus, CardData } from '../types';
import { INITIAL_ENERGY, INITIAL_BOOSTS_CONFIG, VERIFICATION_COST } from '../constants';

const getInitialBoosts = (config: BoostConfig[]) => {
    const boosts: any = {};
    config.forEach(b => {
        boosts[b.id] = { level: 0 };
    });
    return boosts as Record<BoostId, { level: number }>;
};

const generateNewCard = (isPrimary = false): CardData => {
    const cardNumber = `5555 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const expiryYear = new Date().getFullYear() + 5 - 2000;
    const expiryMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    return { 
        id: `card_${Date.now()}`,
        cardNumber, 
        cardName: isPrimary ? "Основная" : `Карта #${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: `${expiryMonth}/${expiryYear}`,
        cvv,
        balance: isPrimary ? 0.001 : 0,
        isRevealed: false
    };
};

export const issueNewCardToUser = async (userId: number): Promise<CardData> => {
    const newCard = generateNewCard();
    const userCardsRef = ref(db, `users/${userId}/cards`);
    const cardMapRef = ref(db, `card_to_user_map/${newCard.cardNumber.replace(/\s/g, '')}`);
    
    const newCardList: CardData[] = await runTransaction(userCardsRef, (currentCards: CardData[]) => {
        if (currentCards) {
            currentCards.push(newCard);
            return currentCards;
        }
        return [newCard];
    }).then(result => result.snapshot.val());
    
    await set(cardMapRef, userId);
    return newCard;
};

export const createUserData = async (user: TelegramUser, boostsConfig: BoostConfig[]): Promise<GameState> => {
    const primaryCard = generateNewCard(true);
    const newUserState: GameState = {
        energy: INITIAL_ENERGY,
        boosts: getInitialBoosts(boostsConfig),
        lastSeen: Date.now(),
        transactions: [],
        cards: [primaryCard],
        isBanned: false,
        isVerified: false,
        verificationStatus: 'none',
    };
    const userRef = ref(db, `users/${user.id}`);
    const profileRef = ref(db, `profiles/${user.id}`);
    const cardMapRef = ref(db, `card_to_user_map/${primaryCard.cardNumber.replace(/\s/g, '')}`);

    await set(userRef, newUserState);
    await set(profileRef, {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || `User ${user.id}`,
        username: user.username || '',
        isVerified: false
    });
    await set(cardMapRef, user.id);

    return newUserState;
};

export const getUserData = async (userId: number): Promise<GameState | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        // Backward compatibility and data integrity checks
        if (!data.transactions) data.transactions = [];
        if (!data.cards || data.cards.length === 0) {
            data.cards = [generateNewCard(true)];
            if(data.balance) { // Migrate old balance to first card
                data.cards[0].balance = data.balance;
                delete data.balance;
            }
        }
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

export const findUserByCardNumber = async (cardNumber: string): Promise<{userId: number, recipientName: string} | null> => {
    const cardMapRef = ref(db, `card_to_user_map/${cardNumber.replace(/\s/g, '')}`);
    const snapshot = await get(cardMapRef);
    if(snapshot.exists()){
        const userId = snapshot.val();
        const profileRef = ref(db, `profiles/${userId}`);
        const profileSnapshot = await get(profileRef);
        return { userId, recipientName: profileSnapshot.val()?.name || `User ${userId}` };
    }
    return null;
}

export const performTransferTransaction = async (
    senderId: number,
    senderCardNumber: string,
    recipientCardNumber: string,
    amount: number
): Promise<{ success: boolean; newTransaction: Transaction }> => {
    if (senderCardNumber === recipientCardNumber) throw new Error("Нельзя перевести на ту же карту.");
    if (amount <= 0) throw new Error("Сумма должна быть положительной.");

    const recipientInfo = await findUserByCardNumber(recipientCardNumber);
    if (!recipientInfo) throw new Error("Карта получателя не найдена.");

    const { userId: recipientId, recipientName } = recipientInfo;
    if(senderId === recipientId) throw new Error("Нельзя перевести самому себе.");

    const senderRef = ref(db, `users/${senderId}`);
    const recipientRef = ref(db, `users/${recipientId}`);
    const txId = `txn_${Date.now()}`;
    const timestamp = Date.now();

    // Perform transaction for the sender
    await runTransaction(senderRef, (currentUserData: GameState) => {
        if (currentUserData) {
            const cardIndex = currentUserData.cards.findIndex(c => c.cardNumber === senderCardNumber);
            if (cardIndex === -1 || currentUserData.cards[cardIndex].balance < amount) return; // Abort
            
            currentUserData.cards[cardIndex].balance -= amount;
            if (!currentUserData.transactions) currentUserData.transactions = [];
            currentUserData.transactions.unshift({ 
                id: txId, type: 'sent', amount, 
                senderCardNumber, recipientCardNumber, 
                counterpartyId: recipientId, counterpartyName: recipientName, timestamp 
            });
        }
        return currentUserData;
    });

    // Perform transaction for the recipient
    await runTransaction(recipientRef, (currentUserData: GameState) => {
        if (currentUserData) {
            const cardIndex = currentUserData.cards.findIndex(c => c.cardNumber === recipientCardNumber);
            if (cardIndex === -1) return; // Should not happen if findUserByCardNumber worked
            
            currentUserData.cards[cardIndex].balance += amount;
            if (!currentUserData.transactions) currentUserData.transactions = [];
            const senderProfileRef = ref(db, `profiles/${senderId}`); // Get sender name for recipient history
            get(senderProfileRef).then(snap => {
                 currentUserData.transactions.unshift({ 
                    id: txId, type: 'received', amount,
                    senderCardNumber, recipientCardNumber,
                    counterpartyId: senderId, counterpartyName: snap.val()?.name || `User ${senderId}`, timestamp
                });
            });
        }
        return currentUserData;
    });

    return { success: true, newTransaction: { id: txId, type: 'sent', amount, senderCardNumber, recipientCardNumber, counterpartyId: recipientId, counterpartyName: recipientName, timestamp }};
};


export const fetchTopPlayers = async (currentUserId: number, sortBy: 'gg' | 'boosts'): Promise<Player[]> => {
    const usersRef = ref(db, 'users');
    const profilesRef = ref(db, 'profiles');
    
    // We fetch all users and sort client-side because of complex data structure
    const [usersSnapshot, profilesSnapshot] = await Promise.all([get(usersRef), get(profilesRef)]);

    if (!usersSnapshot.exists() || !profilesSnapshot.exists()) return [];

    const usersData = usersSnapshot.val();
    const profilesData = profilesSnapshot.val();
    
    const players: Player[] = Object.entries(usersData).map(([id, data]) => {
        const gameState = data as GameState;
        const totalBoostLevel = Object.values(gameState.boosts || {}).reduce((sum, b: any) => sum + b.level, 0);
        const totalBalance = (gameState.cards || []).reduce((sum, c) => sum + c.balance, 0);
        return {
            id: parseInt(id, 10),
            name: profilesData[id]?.name || `User ${id}`,
            balance: totalBalance,
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
    return players.slice(0, 50);
};

// --- Admin Functions ---

export const setBanStatus = async (userId: number, isBanned: boolean) => {
    const userRef = ref(db, `users/${userId}/isBanned`);
    await set(userRef, isBanned);
};

export const addBalance = async (userId: number, amount: number) => {
    const userMainCardRef = ref(db, `users/${userId}/cards/0/balance`);
    await runTransaction(userMainCardRef, (currentBalance) => (currentBalance || 0) + amount);
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
    // Transaction to deduct cost and set status
    const userRef = ref(db, `users/${userId}`);
    await runTransaction(userRef, (currentUserData: GameState) => {
        if(currentUserData) {
            const totalBalance = currentUserData.cards.reduce((sum, c) => sum + c.balance, 0);
            if (totalBalance < VERIFICATION_COST) return; // Abort
            
            let remainingCost = VERIFICATION_COST;
            currentUserData.cards.forEach(card => {
                if(remainingCost > 0) {
                    const deduction = Math.min(card.balance, remainingCost);
                    card.balance -= deduction;
                    remainingCost -= deduction;
                }
            });
            currentUserData.verificationStatus = 'pending';
        }
        return currentUserData;
    });

    const requestRef = ref(db, `admin/verificationRequests/${userId}`);
    await set(requestRef, { userId, userName, timestamp: serverTimestamp() });
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