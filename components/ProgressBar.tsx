import React from 'react';

interface ProgressBarProps {
    currentValue: number;
    maxValue: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentValue, maxValue }) => {
    const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;

    return (
        <div className="w-full h-4 rounded-full bg-black/30 border border-[var(--glass-border)]" style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'}}>
            <div
                className="h-full rounded-full transition-all duration-300 ease-linear"
                style={{ 
                    width: `${percentage}%`,
                    background: 'linear-gradient(90deg, var(--primary-accent), var(--secondary-accent))',
                    boxShadow: `0 0 10px var(--primary-accent), 0 0 5px var(--secondary-accent)`
                }}
            ></div>
        </div>
    );
};

export default ProgressBar;