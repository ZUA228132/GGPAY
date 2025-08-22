import { Player, BoostType } from './types';

export const MOCK_TOP_PLAYERS: Player[] = [
    { 
        id: 1, name: 'CryptoKing', balance: 157890.45,
        boosts: {
            [BoostType.MULTITAP]: { level: 8 }, [BoostType.ENERGY_LIMIT]: { level: 7 }, [BoostType.RECHARGING_SPEED]: { level: 4 },
            [BoostType.AUTO_TAP_BOT]: { level: 5 }, [BoostType.ENERGY_GURU]: { level: 9 }, [BoostType.CRITICAL_TAP]: { level: 6 }, [BoostType.GG_PRINTER]: { level: 4 }
        }
    },
    { 
        id: 2, name: 'GemHunter', balance: 120456.12,
        boosts: {
            [BoostType.MULTITAP]: { level: 10 }, [BoostType.ENERGY_LIMIT]: { level: 6 }, [BoostType.RECHARGING_SPEED]: { level: 3 },
            [BoostType.AUTO_TAP_BOT]: { level: 4 }, [BoostType.ENERGY_GURU]: { level: 10 }, [BoostType.CRITICAL_TAP]: { level: 5 }, [BoostType.GG_PRINTER]: { level: 5 }
        }
    },
    { 
        id: 3, name: 'PixelPioneer', balance: 98765.43,
        boosts: {
            [BoostType.MULTITAP]: { level: 7 }, [BoostType.ENERGY_LIMIT]: { level: 10 }, [BoostType.RECHARGING_SPEED]: { level: 5 },
            [BoostType.AUTO_TAP_BOT]: { level: 3 }, [BoostType.ENERGY_GURU]: { level: 7 }, [BoostType.CRITICAL_TAP]: { level: 8 }, [BoostType.GG_PRINTER]: { level: 3 }
        }
    },
    { 
        id: 10, name: 'You', balance: 0, isCurrentUser: true,
        boosts: {}
    },
    { 
        id: 4, name: 'TapMaster', balance: 88123.90,
        boosts: {
            [BoostType.MULTITAP]: { level: 9 }, [BoostType.ENERGY_LIMIT]: { level: 5 }, [BoostType.RECHARGING_SPEED]: { level: 5 },
            [BoostType.AUTO_TAP_BOT]: { level: 2 }, [BoostType.ENERGY_GURU]: { level: 8 }, [BoostType.CRITICAL_TAP]: { level: 9 }, [BoostType.GG_PRINTER]: { level: 2 }
        }
    },
    { 
        id: 5, name: 'CoinCollector', balance: 75643.21,
        boosts: {
            [BoostType.MULTITAP]: { level: 6 }, [BoostType.ENERGY_LIMIT]: { level: 8 }, [BoostType.RECHARGING_SPEED]: { level: 3 },
            [BoostType.AUTO_TAP_BOT]: { level: 5 }, [BoostType.ENERGY_GURU]: { level: 6 }, [BoostType.CRITICAL_TAP]: { level: 4 }, [BoostType.GG_PRINTER]: { level: 4 }
        }
    },
    { 
        id: 6, name: 'SatoshiJr', balance: 60321.78,
        boosts: {
            [BoostType.MULTITAP]: { level: 5 }, [BoostType.ENERGY_LIMIT]: { level: 5 }, [BoostType.RECHARGING_SPEED]: { level: 2 },
            [BoostType.AUTO_TAP_BOT]: { level: 1 }, [BoostType.ENERGY_GURU]: { level: 5 }, [BoostType.CRITICAL_TAP]: { level: 5 }, [BoostType.GG_PRINTER]: { level: 1 }
        }
    },
    { 
        id: 7, name: 'DiamondHands', balance: 51234.56,
        boosts: {
            [BoostType.MULTITAP]: { level: 8 }, [BoostType.ENERGY_LIMIT]: { level: 9 }, [BoostType.RECHARGING_SPEED]: { level: 4 },
            [BoostType.AUTO_TAP_BOT]: { level: 3 }, [BoostType.ENERGY_GURU]: { level: 4 }, [BoostType.CRITICAL_TAP]: { level: 7 }, [BoostType.GG_PRINTER]: { level: 3 }
        }
    },
    { 
        id: 8, name: 'WhaleWatcher', balance: 45876.89,
        boosts: {
            [BoostType.MULTITAP]: { level: 4 }, [BoostType.ENERGY_LIMIT]: { level: 6 }, [BoostType.RECHARGING_SPEED]: { level: 1 },
            [BoostType.AUTO_TAP_BOT]: { level: 2 }, [BoostType.ENERGY_GURU]: { level: 9 }, [BoostType.CRITICAL_TAP]: { level: 3 }, [BoostType.GG_PRINTER]: { level: 2 }
        }
    },
    { 
        id: 9, name: 'NFTrillionaire', balance: 39012.34,
        boosts: {
            [BoostType.MULTITAP]: { level: 7 }, [BoostType.ENERGY_LIMIT]: { level: 7 }, [BoostType.RECHARGING_SPEED]: { level: 3 },
            [BoostType.AUTO_TAP_BOT]: { level: 4 }, [BoostType.ENERGY_GURU]: { level: 7 }, [BoostType.CRITICAL_TAP]: { level: 6 }, [BoostType.GG_PRINTER]: { level: 3 }
        }
    },
];
