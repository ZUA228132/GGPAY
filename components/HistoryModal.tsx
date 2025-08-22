import React from 'react';
import { Transaction } from '../types';
import { formatLargeNumber, formatTimeAgo } from '../utils';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
}

const SentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const ReceivedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
);

const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>);


const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, transactions }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass-panel p-6 w-full max-w-md h-[70%] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-glow-primary font-orbitron">История</h2>
                    <button onClick={onClose} className="p-2 rounded-full glass-button"><CloseIcon /></button>
                </div>
                {transactions.length > 0 ? (
                    <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                        {transactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-full ${tx.type === 'sent' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                        {tx.type === 'sent' ? <SentIcon /> : <ReceivedIcon />}
                                    </div>
                                    <div>
                                        <p className="font-bold">
                                            {tx.type === 'sent' ? 'Перевод для' : 'Получено от'} ID: {tx.counterpartyId}
                                        </p>
                                        <p className="text-sm text-[var(--text-muted)]">{formatTimeAgo(tx.timestamp)}</p>
                                    </div>
                                </div>
                                <div className={`font-bold font-orbitron ${tx.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                                    {tx.type === 'sent' ? '-' : '+'} {formatLargeNumber(tx.amount)} GG
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center text-[var(--text-muted)]">
                        <p>У вас пока нет транзакций.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryModal;
