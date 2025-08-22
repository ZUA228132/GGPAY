import React, { useState, useRef } from 'react';
import { CardData, TelegramUser } from '../types';
import { formatLargeNumber } from '../utils';
import VirtualCard from './VirtualCard';
import { MAX_CARDS } from '../constants';

interface BankViewProps {
    user: TelegramUser;
    cards: CardData[];
    onTransfer: (senderCard: CardData, recipientCardNumber: string, amount: number) => Promise<{success: boolean; message: string;}>;
    onIssueCard: () => void;
}

const BankView: React.FC<BankViewProps> = ({ user, cards, onTransfer, onIssueCard }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [recipientCardNumber, setRecipientCardNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [transferStatus, setTransferStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const cardWidth = scrollRef.current.offsetWidth;
            const newIndex = Math.round(scrollLeft / cardWidth);
            setActiveIndex(newIndex);
        }
    };
    
    const handleReveal = (cardId: string) => {
        // This is a dummy handler for now, as the reveal state is managed locally in VirtualCard
        // For persistence, this would trigger a state update in App.tsx
        console.log(`Card ${cardId} revealed`);
    };

    const handleSend = async () => {
        setTransferStatus(null);
        const activeCard = cards[activeIndex];
        
        const formattedRecipientCardNumber = recipientCardNumber.replace(/\s/g, '');
        const numAmount = parseFloat(amount);

        if (formattedRecipientCardNumber.length !== 16 || isNaN(Number(formattedRecipientCardNumber))) {
            setTransferStatus({ type: 'error', message: 'Введите корректный номер карты.' }); return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setTransferStatus({ type: 'error', message: 'Введите корректную сумму.' }); return;
        }
        if (numAmount > activeCard.balance) {
            setTransferStatus({ type: 'error', message: 'Недостаточно средств на этой карте.' }); return;
        }

        setIsSubmitting(true);
        const result = await onTransfer(activeCard, recipientCardNumber, numAmount);
        setIsSubmitting(false);

        if (result.success) {
            setTransferStatus({ type: 'success', message: result.message });
            setRecipientCardNumber(''); setAmount('');
            setTimeout(() => setTransferStatus(null), 3000);
        } else {
            setTransferStatus({ type: 'error', message: result.message });
        }
    };
    
    return (
        <div className="h-full flex flex-col space-y-6">
             <h2 className="text-3xl font-bold text-glow-primary font-orbitron text-center">Банк</h2>
            <div ref={scrollRef} onScroll={handleScroll} className="card-carousel flex overflow-x-auto w-full gap-4 py-2 -mx-4 px-4">
                {cards.map((card) => (
                    <div key={card.id} className="w-full max-w-sm flex-shrink-0">
                        <VirtualCard 
                            cardData={card} 
                            user={user} 
                            isNewlyIssued={!card.isRevealed} 
                            onReveal={handleReveal}
                        />
                    </div>
                ))}
            </div>
            
             <div className="flex justify-center gap-2">
                {cards.map((_, index) => (
                    <div key={index} className={`w-2 h-2 rounded-full transition-colors ${activeIndex === index ? 'bg-white' : 'bg-gray-600'}`}></div>
                ))}
            </div>

            {cards.length < MAX_CARDS && (
                <button onClick={onIssueCard} className="w-full max-w-sm mx-auto p-3 rounded-xl font-bold glass-button">
                    Выпустить новую карту
                </button>
            )}

            <div className="w-full max-w-sm mx-auto space-y-4 glass-panel p-6">
                <h3 className="text-xl font-bold font-orbitron text-center">Перевод по номеру карты</h3>
                <div className="space-y-2">
                    <label className="block text-sm text-[var(--text-muted)]">Номер карты получателя</label>
                    <input 
                        type="text"
                        placeholder="5555 XXXX XXXX XXXX"
                        value={recipientCardNumber}
                        onChange={e => { setTransferStatus(null); setRecipientCardNumber(e.target.value); }}
                        className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)] font-orbitron"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm text-[var(--text-muted)]">Сумма GG</label>
                    <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => { setTransferStatus(null); setAmount(e.target.value); }}
                        className="w-full bg-transparent p-3 rounded-xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)] font-orbitron"
                    />
                </div>
                 <p className="text-xs text-[var(--text-muted)] text-center">Баланс активной карты: {formatLargeNumber(cards[activeIndex]?.balance ?? 0)} GG</p>
                
                {transferStatus && <p className={`text-sm text-center ${transferStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{transferStatus.message}</p>}

                <button 
                    onClick={handleSend}
                    className="w-full p-3 rounded-xl font-bold bg-[var(--primary-accent)] text-white disabled:bg-gray-600 disabled:opacity-50 transition-colors"
                    disabled={isSubmitting || !recipientCardNumber || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > (cards[activeIndex]?.balance ?? 0)}
                >
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
            </div>
        </div>
    );
};

export default BankView;