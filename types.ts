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

export type BoostId = BoostType | string;

export interface BoostConfig {
  id: BoostId;
  name: string;
  description: string;
  maxLevel: number;
  iconName: string; // To allow dynamic icon lookup
  costFormula: string; // Stored as a string formula like '10 * 2.5 ** level'
}

export interface Boost extends Omit<BoostConfig, 'costFormula'> {
    level: number;
    icon: ReactNode;
    getCost: (level: number) => number;
}


export interface Player {
    id: number;
    name: string;
    balance: number;
    isCurrentUser?: boolean;
    isVerified?: boolean;
    boosts: { [key in BoostId]?: { level: number } };
    totalBoostLevel?: number;
}

export interface TelegramUser {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
    isVerified?: boolean;
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

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface GameState {
    balance: number;
    energy: number;
    boosts: Record<BoostId, { level: number }>;
    lastSeen: number;
    transactions: Transaction[];
    cardData: CardData;
    isBanned: boolean;
    isVerified: boolean;
    verificationStatus: VerificationStatus;
}

export interface VerificationRequest {
    userId: number;
    userName: string;
    timestamp: number;
}

export interface GlobalNotification {
    id: string;
    message: string;
    timestamp: number;
}


export type View = 'home' | 'boosts' | 'top' | 'profile' | 'card' | 'admin';