import React, { useEffect, useState } from 'react';
import { CardData, TelegramUser } from '../types';
import VirtualCard from './VirtualCard';

interface CardIssuanceAnimationProps {
    cardData: CardData;
    onAnimationEnd: () => void;
}

// Dummy user for display purposes during animation
const dummyUser: TelegramUser = {
    id: 0,
    firstName: 'New',
    lastName: 'Card',
};

const CardIssuanceAnimation: React.FC<CardIssuanceAnimationProps> = ({ cardData, onAnimationEnd }) => {
    const [showCard, setShowCard] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowCard(true);
        }, 100); // Small delay to ensure animation triggers

        const endTimer = setTimeout(() => {
            onAnimationEnd();
        }, 4000); // Total animation duration + time for user to see

        return () => {
            clearTimeout(timer);
            clearTimeout(endTimer);
        };
    }, [onAnimationEnd]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`transition-all duration-500 ${showCard ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <VirtualCard 
                    cardData={cardData}
                    user={dummyUser}
                    isNewlyIssued={true}
                    onReveal={() => {}} // Reveal logic is handled in BankView
                />
            </div>
        </div>
    );
};

export default CardIssuanceAnimation;