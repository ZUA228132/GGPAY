import React from 'react';
import { Boost, BoostType } from './types';

// SVG Icons for Boosts
const MultitapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 8.812a9.025 9.025 0 0112.728 0M12 21.75V12" />
    </svg>
);

const EnergyLimitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const RechargingSpeedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const AutoTapBotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const EnergyGuruIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-12v4m-2-2h4m6 4v4m-2-2h4M6 3a9 9 0 019 9h-3.342a3.001 3.001 0 00-5.316 0H6z" />
    </svg>
);

const CriticalTapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--secondary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l4 4L5 11m14-8l-4 4 4 4M12 21a9 9 0 110-18 9 9 0 010 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l2 2-2 2-2-2 2-2z" />
    </svg>
);

const GGPrinterIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--secondary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
    </svg>
);


export const TAPS_PER_CLICK_BASE = 0.001;
export const INITIAL_ENERGY = 1000;
export const INITIAL_MAX_ENERGY = 1000;
export const INITIAL_ENERGY_REGEN_RATE = 2; // per second
export const BOT_OFFLINE_LIMIT_HOURS = 3;

export const BOOSTS_CONFIG: Omit<Boost, 'level'>[] = [
    {
        id: BoostType.MULTITAP,
        name: 'Мультитап',
        description: 'Увеличивает GG за одно нажатие.',
        maxLevel: 10,
        icon: <MultitapIcon />,
        getCost: (level) => Math.floor(10 * Math.pow(2.5, level)),
    },
    {
        id: BoostType.ENERGY_LIMIT,
        name: 'Лимит энергии',
        description: 'Увеличивает максимальный запас энергии.',
        maxLevel: 10,
        icon: <EnergyLimitIcon />,
        getCost: (level) => Math.floor(20 * Math.pow(2.2, level)),
    },
    {
        id: BoostType.RECHARGING_SPEED,
        name: 'Скорость восстановления',
        description: 'Увеличивает скорость восстановления энергии.',
        maxLevel: 5,
        icon: <RechargingSpeedIcon />,
        getCost: (level) => Math.floor(50 * Math.pow(3, level)),
    },
    {
        id: BoostType.AUTO_TAP_BOT,
        name: 'Авто-тап Бот',
        description: `Собирает GG, пока вы оффлайн (до ${BOT_OFFLINE_LIMIT_HOURS} часов).`,
        maxLevel: 5,
        icon: <AutoTapBotIcon />,
        getCost: (level) => Math.floor(1000 * Math.pow(4, level)),
    },
    {
        id: BoostType.ENERGY_GURU,
        name: 'Энергетический Гуру',
        description: 'Шанс не потратить энергию при нажатии.',
        maxLevel: 10,
        icon: <EnergyGuruIcon />,
        getCost: (level) => Math.floor(500 * Math.pow(2.8, level)),
    },
    {
        id: BoostType.CRITICAL_TAP,
        name: 'Критический клик',
        description: 'Шанс на x10 GG с одного нажатия.',
        maxLevel: 10,
        icon: <CriticalTapIcon />,
        getCost: (level) => Math.floor(2000 * Math.pow(3, level)),
    },
    {
        id: BoostType.GG_PRINTER,
        name: 'GG Принтер',
        description: 'Пассивно генерирует GG каждую секунду.',
        maxLevel: 5,
        icon: <GGPrinterIcon />,
        getCost: (level) => Math.floor(5000 * Math.pow(5, level)),
    }
];