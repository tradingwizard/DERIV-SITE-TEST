import { localize } from '@deriv-com/translations';

export const MARKET_OPTIONS = [
    [localize('Derived'), 'synthetic_index'],
    [localize('Forex'), 'forex'],
    [localize('Stock Indices'), 'indices'],
    [localize('Commodities'), 'commodities'],
    [localize('Cryptocurrencies'), 'cryptocurrency'],
];

export const SUBMARKET_OPTIONS = {
    synthetic_index: [
        [localize('Continuous Indices'), 'random_index'],
        [localize('Crash/Boom Indices'), 'crash_index'],
        [localize('Jump Indices'), 'jump_index'],
        [localize('Daily Reset Indices'), 'random_daily'],
        [localize('Step Indices'), 'step_index'],
    ],
};

export const SYMBOL_OPTIONS = {
    random_index: [
        [localize('Volatility 10 Index'), 'R_10'],
        [localize('Volatility 25 Index'), 'R_25'],
        [localize('Volatility 50 Index'), 'R_50'],
        [localize('Volatility 75 Index'), 'R_75'],
        [localize('Volatility 100 Index'), 'R_100'],
        [localize('Volatility 10 (1s) Index'), '1HZ10V'],
        [localize('Volatility 25 (1s) Index'), '1HZ25V'],
        [localize('Volatility 50 (1s) Index'), '1HZ50V'],
        [localize('Volatility 75 (1s) Index'), '1HZ75V'],
        [localize('Volatility 100 (1s) Index'), '1HZ100V'],
    ],
    crash_index: [
        [localize('Crash 300 Index'), 'CRASH300'],
        [localize('Crash 500 Index'), 'CRASH500'],
        [localize('Crash 1000 Index'), 'CRASH1000'],
        [localize('Boom 300 Index'), 'BOOM300'],
        [localize('Boom 500 Index'), 'BOOM500'],
        [localize('Boom 1000 Index'), 'BOOM1000'],
    ],
    jump_index: [
        [localize('Jump 10 Index'), 'JD10'],
        [localize('Jump 25 Index'), 'JD25'],
        [localize('Jump 50 Index'), 'JD50'],
        [localize('Jump 75 Index'), 'JD75'],
        [localize('Jump 100 Index'), 'JD100'],
    ],
    step_index: [[localize('Step Index'), 'STPRNG']],
    random_daily: [
        [localize('Bear Market Index'), 'RDBEAR'],
        [localize('Bull Market Index'), 'RDBULL'],
    ],
};

export const DURATIONS = [
    { display: localize('Ticks'), unit: 't', min: 1, max: 10 },
    { display: localize('Seconds'), unit: 's', min: 15, max: 3600 },
    { display: localize('Minutes'), unit: 'm', min: 1, max: 1440 },
    { display: localize('Hours'), unit: 'h', min: 1, max: 24 },
    { display: localize('Days'), unit: 'd', min: 1, max: 365 },
];

export const TRADE_TYPE_CATEGORY_OPTIONS = [
    [localize('Up/Down'), 'callput'],
    [localize('Touch/No Touch'), 'touchnotouch'],
    [localize('In/Out'), 'inout'],
    [localize('Digits'), 'digits'],
    [localize('Accumulators'), 'accumulator'],
];

export const TRADE_TYPE_OPTIONS = {
    callput: [
        [localize('Rise/Fall'), 'callput'],
        [localize('Rise Equals/Fall Equals'), 'callputequal'],
        [localize('Higher/Lower'), 'higherlower'],
    ],
    touchnotouch: [[localize('Touch/No Touch'), 'touchnotouch']],
    inout: [
        [localize('Ends Between/Ends Outside'), 'endsinout'],
        [localize('Stays Between/Goes Outside'), 'staysinout'],
    ],
    digits: [
        [localize('Matches/Differs'), 'matchesdiffers'],
        [localize('Even/Odd'), 'evenodd'],
        [localize('Over/Under'), 'overunder'],
    ],
    accumulator: [[localize('Buy'), 'accumulator']],
    asian: [[localize('Asian Up/Asian Down'), 'asians']],
    reset: [[localize('Reset Call/Reset Put'), 'reset']],
    highlowticks: [[localize('High Tick/Low Tick'), 'highlowticks']],
    runs: [[localize('Only Ups/Only Downs'), 'runs']],
};

export const SUBMARKET_ORDER = ['random_index', 'crash_index', 'jump_index', 'random_daily', 'step_index'];

const SUBMARKET_ALIASES = {
    random: 'random_index',
    random_index: 'random_index',
    continuous_index: 'random_index',
    continuous_indices: 'random_index',
    volatility: 'random_index',
    volatility_index: 'random_index',
    volatility_indices: 'random_index',
    crash_index: 'crash_index',
    crash_indices: 'crash_index',
    crashboom: 'crash_index',
    crash_boom: 'crash_index',
    crash_boom_index: 'crash_index',
    crash_boom_indices: 'crash_index',
    jump_index: 'jump_index',
    jump_indices: 'jump_index',
    random_daily: 'random_daily',
    daily_reset_index: 'random_daily',
    daily_reset_indices: 'random_daily',
    step_index: 'step_index',
    step_indices: 'step_index',
    commodity_basket: 'commodity_basket',
    commodities_basket: 'commodity_basket',
    basket_commodities: 'commodity_basket',
};

const SUBMARKET_DISPLAY = {
    random_index: localize('Continuous Indices'),
    crash_index: localize('Crash/Boom Indices'),
    jump_index: localize('Jump Indices'),
    random_daily: localize('Daily Reset Indices'),
    step_index: localize('Step Indices'),
    range_break: localize('Range Break Indices'),
    forex_basket: localize('Forex Basket'),
    commodity_basket: localize('Commodities Basket'),
    commodities_basket: localize('Commodities Basket'),
    basket_commodities: localize('Commodities Basket'),
    basket_forex: localize('Forex Basket'),
};

const MARKET_DISPLAY = {
    synthetic_index: localize('Derived'),
    derived: localize('Derived'),
    forex: localize('Forex'),
    indices: localize('Stock Indices'),
    stock_index: localize('Stock Indices'),
    stocks: localize('Stocks'),
    commodities: localize('Commodities'),
    cryptocurrency: localize('Cryptocurrencies'),
    basket_index: localize('Baskets'),
};

const normalizeLookupKey = value =>
    `${value || ''}`
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

export const normalizeMarket = market => {
    if (market === 'derived') return 'synthetic_index';
    return market;
};

export const normalizeSubmarket = submarket => {
    if (!submarket) return submarket;
    return SUBMARKET_ALIASES[normalizeLookupKey(submarket)] || submarket;
};

export const getMarketDisplayName = market => MARKET_DISPLAY[market] || humanize(market);

export const getSubmarketDisplayName = submarket => SUBMARKET_DISPLAY[submarket] || humanize(submarket);

export const humanize = value =>
    `${value || ''}`
        .split('_')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export const generateSymbolDisplayName = symbol => {
    const code = `${symbol || ''}`;
    const patterns = [
        [/^R_(\d+)$/i, match => `Volatility ${match[1]} Index`],
        [/^(\d+)HZ(\d+)V$/i, match => `Volatility ${match[2]} (${match[1]}s) Index`],
        [/^CRASH(\d+)N?$/i, match => `Crash ${match[1]} Index`],
        [/^BOOM(\d+)N?$/i, match => `Boom ${match[1]} Index`],
        [/^JD(\d+)$/i, match => `Jump ${match[1]} Index`],
        [/^JMP(\d+)$/i, match => `Jump ${match[1]} Index`],
        [/^STPRNG$/i, () => 'Step Index'],
        [/^STPRNG(\d+)$/i, match => `Step ${match[1]}00 Index`],
        [/^RDBEAR$/i, () => 'Bear Market Index'],
        [/^RDBULL$/i, () => 'Bull Market Index'],
    ];

    const match = patterns.find(([pattern]) => pattern.test(code));
    return match ? match[1](code.match(match[0])) : code;
};

export const isSyntheticSymbol = symbol => {
    const code = `${symbol || ''}`;
    return /^(R_|1HZ|CRASH|BOOM|JD|JMP|STPRNG|RDBEAR|RDBULL)/i.test(code);
};

export const isSymbolOpen = symbol => {
    if (symbol?.is_trading_suspended) return false;
    if (typeof symbol?.exchange_is_open === 'boolean') return symbol.exchange_is_open;
    return isSyntheticSymbol(symbol?.symbol || symbol?.underlying_symbol);
};

export const firstValidOption = options =>
    (options || []).find(option => Array.isArray(option) && option[0] && option[1] && option[1] !== 'na');

export const uniqueOptions = options => {
    const seen = new Set();
    return (options || []).filter(option => {
        if (!Array.isArray(option) || !option[1] || seen.has(option[1])) return false;
        seen.add(option[1]);
        return true;
    });
};
