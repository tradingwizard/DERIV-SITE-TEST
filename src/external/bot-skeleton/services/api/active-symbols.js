/* eslint-disable no-confusing-arrow */
import { localize } from '@deriv-com/translations';
import { config } from '../../constants/config';
import PendingPromise from '../../utils/pending-promise';
import { api_base } from './api-base';
import {
    MARKET_OPTIONS,
    SUBMARKET_OPTIONS,
    SYMBOL_OPTIONS,
    SUBMARKET_ORDER,
    firstValidOption,
    generateSymbolDisplayName,
    getMarketDisplayName,
    getSubmarketDisplayName,
    isSymbolOpen,
    normalizeMarket,
    normalizeSubmarket,
    uniqueOptions,
} from './builder-compat';

const isDebugDeriv = () =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug_deriv');
const debugDeriv = (label, payload) => {
    if (!isDebugDeriv()) return;
    // eslint-disable-next-line no-console
    console.info(`[debug_deriv] ${label}`, payload);
};

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
        this.has_initialization_error = false;
    }

    async retrieveActiveSymbols(is_forced_update = false) {
        await this.trading_times.initialise();

        if (!is_forced_update && this.is_initialised) {
            await this.init_promise;
            return this.active_symbols;
        }

        this.is_initialised = true;

        if (api_base.has_active_symbols) {
            this.active_symbols = Array.isArray(api_base?.active_symbols) ? api_base.active_symbols : [];
        } else {
            if (!api_base.active_symbols_promise) {
                api_base.active_symbols_promise = api_base.getActiveSymbols();
            }

            try {
                const active_symbols = await api_base.active_symbols_promise;
                this.active_symbols = Array.isArray(active_symbols)
                    ? active_symbols
                    : Array.isArray(api_base?.active_symbols)
                      ? api_base.active_symbols
                      : [];
            } catch (error) {
                debugDeriv('active symbols initial load failed', { error: error?.message || error });
                this.active_symbols = [];
            }
        }

        if (!this.active_symbols.length) {
            try {
                const active_symbols = await api_base.getActiveSymbols();
                this.active_symbols = Array.isArray(active_symbols)
                    ? active_symbols
                    : Array.isArray(api_base?.active_symbols)
                      ? api_base.active_symbols
                      : [];
            } catch (error) {
                debugDeriv('active symbols retry failed', { error: error?.message || error });
                this.active_symbols = [];
            }
        }

        this.has_initialization_error = this.active_symbols.length === 0;
        this.processed_symbols = this.processActiveSymbols();

        // TODO: fix need to look into it as the method is not present
        this.trading_times.onMarketOpenCloseChanged = changes => {
            Object.keys(changes).forEach(symbol_name => {
                const symbol_obj = this.active_symbols.find(
                    symbol => symbol.symbol === symbol_name || symbol.underlying_symbol === symbol_name
                );

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
            const symbol_code = symbol.underlying_symbol || symbol.symbol;
            const normalized_market = normalizeMarket(symbol.market);
            const normalized_submarket = normalizeSubmarket(
                symbol.submarket || symbol.subgroup || symbol.underlying_symbol_type || symbol.symbol_type
            );

            if (
                config().DISABLED_SYMBOLS.includes(symbol_code) ||
                config().DISABLED_SUBMARKETS.includes(normalized_submarket)
            ) {
                return processed_symbols;
            }

            const normalized_symbol = {
                ...symbol,
                symbol: symbol_code,
                market: normalized_market,
                submarket: normalized_submarket,
                display_name: symbol.display_name || symbol.underlying_symbol_name || generateSymbolDisplayName(symbol_code),
                market_display_name: getMarketDisplayName(normalized_market),
                submarket_display_name: getSubmarketDisplayName(normalized_submarket),
            };
            const isExistingValue = (object, prop) =>
                Object.keys(object).findIndex(a => a === normalized_symbol[prop]) !== -1;

            if (!isExistingValue(processed_symbols, 'market')) {
                processed_symbols[normalized_symbol.market] = {
                    display_name: normalized_symbol.market_display_name || getMarketDisplayName(normalized_symbol.market),
                    submarkets: {},
                };
            }

            const { submarkets } = processed_symbols[normalized_symbol.market];

            if (!isExistingValue(submarkets, 'submarket')) {
                submarkets[normalized_symbol.submarket] = {
                    display_name: normalized_symbol.submarket_display_name || getSubmarketDisplayName(normalized_symbol.submarket),
                    symbols: {},
                };
            }

            const { symbols } = submarkets[normalized_symbol.submarket];

            if (!isExistingValue(symbols, 'symbol')) {
                symbols[normalized_symbol.symbol] = {
                    display_name: normalized_symbol.display_name,
                    pip_size: `${normalized_symbol.pip || normalized_symbol.pip_size || 0}`.length - 2,
                    is_active: isSymbolOpen(normalized_symbol),
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
            return MARKET_OPTIONS;
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
            return SUBMARKET_OPTIONS[market] || config().NOT_AVAILABLE_DROPDOWN_OPTIONS;
        }
        if (market === 'synthetic_index') {
            submarket_options.sort((a, b) => {
                const index_a = SUBMARKET_ORDER.indexOf(a[1]);
                const index_b = SUBMARKET_ORDER.indexOf(b[1]);
                if (index_a === -1 && index_b === -1) return 0;
                if (index_a === -1) return 1;
                if (index_b === -1) return -1;
                return index_a - index_b;
            });
        }

        const sorted_options = this.sortDropdownOptions(submarket_options, this.isSubmarketClosed);
        return sorted_options.some(isValidDropdownOption) ? sorted_options : SUBMARKET_OPTIONS[market] || sorted_options;
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

        const safe_symbol_options = uniqueOptions(symbol_options);

        if (safe_symbol_options.length === 0) {
            return SYMBOL_OPTIONS[submarket] || config().NOT_AVAILABLE_DROPDOWN_OPTIONS;
        }

        const sorted_options = this.sortDropdownOptions(safe_symbol_options, this.isSymbolClosed);
        return firstValidOption(sorted_options) ? sorted_options : SYMBOL_OPTIONS[submarket] || sorted_options;
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
        const active_symbol = this.active_symbols.find(
            symbol => symbol.symbol === symbol_name || symbol.underlying_symbol === symbol_name
        );
        return active_symbol ? !isSymbolOpen(active_symbol) : false;
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
