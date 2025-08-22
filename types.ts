import { ReactNode } from 'react';

export interface FloatingNumber {
  id: number;
  value: string;
  x: number;
  y: number;
  isCritical: boolean;
}

export enum BoostType {
  MULTITAP = 'MULTITAP',
  ENERGY_LIMIT = 'ENERGY_LIMIT',
  RECHARGING_SPEED = 'RECHARGING_SPEED',
  AUTO_TAP_BOT = 'AUTO_TAP_BOT',
  ENERGY_GURU = 'ENERGY_GURU',
  CRITICAL_TAP = 'CRITICAL_TAP',
  GG_PRINTER = 'GG_PRINTER'
}

export interface Boost {
  id: BoostType;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  icon: ReactNode;
  getCost: (level: number) => number;
}

export interface Player {
    id: number;
    name: string;
    balance: number;
    isCurrentUser?: boolean;
    boosts: { [key in BoostType]?: { level: number } };
    totalBoostLevel?: number;
}

export interface TelegramUser {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
}

export interface Transaction {
    id: string;
    type: 'sent' | 'received';
    amount: number;
    counterpartyId: number;
    timestamp: number;
}

export interface CardData {
    cardNumber: string;
    expiryDate: string;
}

export type View = 'home' | 'boosts' | 'top' | 'transfer' | 'profile' | 'card';