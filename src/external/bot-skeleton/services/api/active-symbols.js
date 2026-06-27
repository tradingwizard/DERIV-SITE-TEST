/* eslint-disable no-confusing-arrow */
import { localize } from '@deriv-com/translations';
import { config } from '../../constants/config';
import PendingPromise from '../../utils/pending-promise';
import { api_base } from './api-base';

const isDebugDeriv = () =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug_deriv');

const debugDeriv = (label, payload) => {
    if (!isDebugDeriv()) return;
    // eslint-disable-next-line no-console
    console.info(`[debug_deriv] ${label}`, payload);
};

const DERIVED_SUBMARKET_DISPLAY = {
    random_index: localize('Continuous Indices'),
    crash_index: localize('Crash/Boom Indices'),
    jump_index: localize('Jump Indices'),
    random_daily: localize('Daily Reset Indices'),
    step_index: localize('Step Indices'),
    range_break: localize('Range Break Indices'),
};

const SUBMARKET_DISPLAY = {
    ...DERIVED_SUBMARKET_DISPLAY,
    forex_basket: localize('Forex Basket'),
    commodity_basket: localize('Commodities Basket'),
    commodities_basket: localize('Commodities Basket'),
    basket_commodities: localize('Commodities Basket'),
    basket_forex: localize('Forex Basket'),
};

const DERIVED_SUBMARKET_ORDER = ['random_index', 'crash_index', 'jump_index', 'random_daily', 'step_index'];

const FALLBACK_SUBMARKET_OPTIONS = {
    synthetic_index: [
        [localize('Continuous Indices'), 'random_index'],
        [localize('Crash/Boom Indices'), 'crash_index'],
        [localize('Jump Indices'), 'jump_index'],
        [localize('Daily Reset Indices'), 'random_daily'],
        [localize('Step Indices'), 'step_index'],
    ],
};

const normalizeLookupKey = value =>
    `${value || ''}`
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const normalizeSubmarket = submarket => {
    const aliases = {
        random_index: 'random_index',
        random: 'random_index',
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
        boom_crash: 'crash_index',
        boom_crash_index: 'crash_index',
        boom_crash_indices: 'crash_index',
        random_daily: 'random_daily',
        daily_reset_index: 'random_daily',
        daily_reset_indices: 'random_daily',
        jump_index: 'jump_index',
        jump_indices: 'jump_index',
        step_index: 'step_index',
        step_indices: 'step_index',
        commodity_basket: 'commodity_basket',
        commodities_basket: 'commodity_basket',
        basket_commodities: 'commodity_basket',
    };

    const normalized_key = normalizeLookupKey(submarket);
    return aliases[normalized_key] || submarket;
};

const getSubmarketDisplayName = submarket =>
    SUBMARKET_DISPLAY[submarket] || (submarket ? submarket.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '');

const isValidDropdownOption = option => Array.isArray(option) && option[0] && option[1] && option[1] !== 'na';

export default class ActiveSymbols {
    constructor(trading_times) {
        this.active_symbols = [];
        this.disabled_symbols = config().DISABLED_SYMBOLS;
        this.disabled_submarkets = config().DISABLED_SUBMARKETS;
        this.init_promise = new PendingPromise();
        this.is_initialised = false;
        this.processed_symbols = {};
        this.trading_times = trading_times;
    }

    async retrieveActiveSymbols(is_forced_update = false) {
        await this.trading_times.initialise();

        if (!is_forced_update && this.is_initialised) {
            await this.init_promise;
            return this.active_symbols;
        }

        this.is_initialised = true;

        if (api_base.has_active_symbols) {
            this.active_symbols = api_base?.active_symbols ?? [];
        } else {
            await api_base.active_symbols_promise;
            this.active_symbols = api_base?.active_symbols ?? [];
        }

        this.processed_symbols = this.processActiveSymbols();

        // TODO: fix need to look into it as the method is not present
        this.trading_times.onMarketOpenCloseChanged = changes => {
            Object.keys(changes).forEach(symbol_name => {
                const symbol_obj = this.active_symbols[symbol_name];

                if (symbol_obj) {
                    symbol_obj.exchange_is_open = changes[symbol_name];
                }
            });

            this.changes = changes;
            this.processActiveSymbols();
        };

        this.init_promise.resolve();

        debugDeriv('active symbols processed', {
            count: this.active_symbols.length,
            markets: Object.keys(this.processed_symbols),
            first_synthetics: this.active_symbols
                .filter(symbol => symbol.market === 'synthetic_index')
                .slice(0, 8)
                .map(symbol => ({
                    symbol: symbol.symbol,
                    display_name: symbol.display_name,
                    market: symbol.market,
                    submarket: symbol.submarket,
                })),
        });
        return this.active_symbols;
    }

    processActiveSymbols() {
        return this.active_symbols.reduce((processed_symbols, symbol) => {
            if (
                config().DISABLED_SYMBOLS.includes(symbol.symbol) ||
                config().DISABLED_SUBMARKETS.includes(normalizeSubmarket(symbol.submarket))
            ) {
                return processed_symbols;
            }

            const normalized_submarket = normalizeSubmarket(
                symbol.submarket || symbol.subgroup || symbol.underlying_symbol_type || symbol.symbol_type
            );
            const normalized_symbol = {
                ...symbol,
                submarket: normalized_submarket,
            };
            const isExistingValue = (object, prop) =>
                Object.keys(object).findIndex(a => a === normalized_symbol[prop]) !== -1;

            if (!isExistingValue(processed_symbols, 'market')) {
                processed_symbols[normalized_symbol.market] = {
                    display_name: normalized_symbol.market_display_name,
                    submarkets: {},
                };
            }

            const { submarkets } = processed_symbols[normalized_symbol.market];

            if (!isExistingValue(submarkets, 'submarket')) {
                submarkets[normalized_symbol.submarket] = {
                    display_name: getSubmarketDisplayName(normalized_symbol.submarket),
                    symbols: {},
                };
            }

            const { symbols } = submarkets[normalized_symbol.submarket];

            if (!isExistingValue(symbols, 'symbol')) {
                symbols[normalized_symbol.symbol] = {
                    display_name: normalized_symbol.display_name,
                    pip_size: `${normalized_symbol.pip}`.length - 2,
                    is_active: !normalized_symbol.is_trading_suspended && normalized_symbol.exchange_is_open,
                };
            }

            return processed_symbols;
        }, {});
    }

    /**
     * Retrieves all symbols and returns an array of symbol objects consisting of symbol and their linked market + submarket.
     * @returns {Array} Symbols and their submarkets + markets.
     */
    getAllSymbols(should_be_open = false) {
        const all_symbols = [];

        Object.keys(this.processed_symbols).forEach(market_name => {
            if (should_be_open && this.isMarketClosed(market_name)) {
                return;
            }

            const market = this.processed_symbols[market_name];
            const { submarkets } = market;

            Object.keys(submarkets).forEach(submarket_name => {
                const submarket = submarkets[submarket_name];
                const { symbols } = submarket;

                Object.keys(symbols).forEach(symbol_name => {
                    const symbol = symbols[symbol_name];

                    all_symbols.push({
                        market: market_name,
                        market_display: market.display_name,
                        submarket: submarket_name,
                        submarket_display: submarket.display_name,
                        symbol: symbol_name,
                        symbol_display: symbol.display_name,
                    });
                });
            });
        });
        this.getSymbolsForBot();
        return all_symbols;
    }

    /**
     *
     * @returns {Array} Symbols and their submarkets + markets for deriv-bot
     */
    getSymbolsForBot() {
        const { DISABLED } = config().QUICK_STRATEGY;
        const symbols_for_bot = [];
        Object.keys(this.processed_symbols).forEach(market_name => {
            if (this.isMarketClosed(market_name)) return;

            const market = this.processed_symbols[market_name];
            const { submarkets } = market;

            Object.keys(submarkets).forEach(submarket_name => {
                if (DISABLED.SUBMARKETS.includes(submarket_name)) return;
                const submarket = submarkets[submarket_name];
                const { symbols } = submarket;

                Object.keys(symbols).forEach(symbol_name => {
                    if (DISABLED.SYMBOLS.includes(symbol_name)) return;
                    const symbol = symbols[symbol_name];
                    symbols_for_bot.push({
                        group: submarket.display_name,
                        text: symbol.display_name,
                        value: symbol_name,
                        submarket: submarket_name,
                    });
                });
            });
        });

        return symbols_for_bot;
    }

    getMarketDropdownOptions() {
        const market_options = [];

        Object.keys(this.processed_symbols).forEach(market_name => {
            const { display_name } = this.processed_symbols[market_name];
            const market_display_name =
                display_name + (this.isMarketClosed(market_name) ? ` ${localize('(Closed)')}` : '');
            market_options.push([market_display_name, market_name]);
        });

        if (market_options.length === 0) {
            return config().NOT_AVAILABLE_DROPDOWN_OPTIONS;
        }
        market_options.sort(a => (a[1] === 'synthetic_index' ? -1 : 1));

        const has_closed_markets = market_options.some(market_option => this.isMarketClosed(market_option[1]));

        if (has_closed_markets) {
            const sorted_options = this.sortDropdownOptions(market_options, this.isMarketClosed);

            if (this.isMarketClosed('forex')) {
                return sorted_options.sort(a => (a[1] === 'synthetic_index' ? -1 : 1));
            }

            return sorted_options;
        }

        return market_options;
    }

    getSubmarketDropdownOptions(market) {
        const submarket_options = [];
        const market_obj = this.processed_symbols[market];

        if (market_obj) {
            const { submarkets } = market_obj;

            Object.keys(submarkets).forEach(submarket_name => {
                const { display_name } = submarkets[submarket_name];
                const submarket_display_name =
                    display_name + (this.isSubmarketClosed(submarket_name) ? ` ${localize('(Closed)')}` : '');
                submarket_options.push([submarket_display_name, submarket_name]);
            });
        }

        if (submarket_options.length === 0) {
            return FALLBACK_SUBMARKET_OPTIONS[market] || config().NOT_AVAILABLE_DROPDOWN_OPTIONS;
        }
        if (market === 'synthetic_index') {
            submarket_options.sort((a, b) => {
                const index_a = DERIVED_SUBMARKET_ORDER.indexOf(a[1]);
                const index_b = DERIVED_SUBMARKET_ORDER.indexOf(b[1]);
                if (index_a === -1 && index_b === -1) return 0;
                if (index_a === -1) return 1;
                if (index_b === -1) return -1;
                return index_a - index_b;
            });
        }

        const sorted_options = this.sortDropdownOptions(submarket_options, this.isSubmarketClosed);
        return sorted_options.some(isValidDropdownOption) ? sorted_options : FALLBACK_SUBMARKET_OPTIONS[market] || sorted_options;
    }

    getSymbolDropdownOptions(submarket) {
        const symbol_options = Object.keys(this.processed_symbols).reduce((accumulator, market_name) => {
            const { submarkets } = this.processed_symbols[market_name];

            Object.keys(submarkets).forEach(submarket_name => {
                if (submarket_name === submarket) {
                    const { symbols } = submarkets[submarket_name];
                    Object.keys(symbols).forEach(symbol_name => {
                        const { display_name } = symbols[symbol_name];
                        const symbol_display_name =
                            display_name + (this.isSymbolClosed(symbol_name) ? ` ${localize('(Closed)')}` : '');
                        accumulator.push([symbol_display_name, symbol_name]);
                    });
                }
            });

            return accumulator;
        }, []);

        if (symbol_options.length === 0) {
            return config().NOT_AVAILABLE_DROPDOWN_OPTIONS;
        }

        return this.sortDropdownOptions(symbol_options, this.isSymbolClosed);
    }

    isMarketClosed(market_name) {
        const market = this.processed_symbols[market_name];

        if (!market) {
            return true;
        }

        return Object.keys(market.submarkets).every(submarket_name => this.isSubmarketClosed(submarket_name));
    }

    isSubmarketClosed(submarket_name) {
        const market_name = Object.keys(this.processed_symbols).find(name => {
            const market = this.processed_symbols[name];
            return Object.keys(market.submarkets).includes(submarket_name);
        });

        if (!market_name) {
            return true;
        }

        const market = this.processed_symbols[market_name];
        const submarket = market.submarkets[submarket_name];

        if (!submarket) {
            return true;
        }

        const { symbols } = submarket;
        return Object.keys(symbols).every(symbol_name => this.isSymbolClosed(symbol_name));
    }

    isSymbolClosed(symbol_name) {
        return this.active_symbols.some(
            active_symbol =>
                active_symbol.symbol === symbol_name &&
                (!active_symbol.exchange_is_open || active_symbol.is_trading_suspended)
        );
    }

    sortDropdownOptions = (dropdown_options, closedFunc) => {
        const options = [...dropdown_options];

        options.sort((a, b) => {
            const is_a_closed = closedFunc.call(this, a[1]);
            const is_b_closed = closedFunc.call(this, b[1]);

            if (is_a_closed && !is_b_closed) {
                return 1;
            } else if (is_a_closed === is_b_closed) {
                return 0;
            }
            return -1;
        });

        return options;
    };
}
