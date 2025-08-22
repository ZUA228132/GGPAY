export function formatLargeNumber(num: number): string {
    if (num < 10000) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
        });
    }
    const suffixes = [
        { value: 1e12, symbol: 'T' },
        { value: 1e9, symbol: 'B' },
        { value: 1e6, symbol: 'M' },
        { value: 1e3, symbol: 'K' },
    ];
    const item = suffixes.find(item => num >= item.value);
    if (item) {
        const formatted = (num / item.value).toFixed(2);
        // parseFloat removes trailing .00
        return `${parseFloat(formatted)}${item.symbol}`;
    }
    return num.toLocaleString('en-US');
}

export function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) {
        return "только что";
    }

    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " г. назад";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " мес. назад";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " д. назад";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " ч. назад";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " мин. назад";
    }
    return Math.floor(seconds) + " сек. назад";
}
