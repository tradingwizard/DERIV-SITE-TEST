import { localize } from '@deriv-com/translations';
import ApiHelpers from '../../../../services/api/api-helpers';
import DBotStore from '../../../dbot-store';
import { excludeOptionFromContextMenu, modifyContextMenu, runIrreversibleEvents } from '../../../utils';
/* eslint-disable */
const isValidDropdownOption = option => Array.isArray(option) && option[0] && option[1] && option[1] !== 'na';

const getSafeDropdownValue = (options, current_value) => {
    if (options.some(option => isValidDropdownOption(option) && option[1] === current_value)) {
        return current_value;
    }

    return options.find(isValidDropdownOption)?.[1] || options[0]?.[1] || '';
};

window.Blockly.Blocks.trade_definition_market = {
    init() {
        this.jsonInit({
            message0: localize('Market: {{ input_market }} > {{ input_submarket }} > {{ input_symbol }}', {
                input_market: '%1',
                input_submarket: '%2',
                input_symbol: '%3',
            }),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'MARKET_LIST',
                    options: [['', '']],
                },
                {
                    type: 'field_dropdown',
                    name: 'SUBMARKET_LIST',
                    options: [['', '']],
                },
                {
                    type: 'field_dropdown',
                    name: 'SYMBOL_LIST',
                    options: [['', '']],
                },
            ],
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            previousStatement: null,
            nextStatement: null,
        });

        this.setMovable(false);
        this.setDeletable(false);
    },
    customContextMenu(menu) {
        const menu_items = [localize('Enable Block'), localize('Disable Block')];
        excludeOptionFromContextMenu(menu, menu_items);
        modifyContextMenu(menu);
    },
    onchange(event) {
        const allowed_events = ['BLOCK_CREATE', 'BLOCK_CHANGE', 'BLOCK_DRAG'];
        const is_allowed_event =
            allowed_events.findIndex(event_name => event.type === window.Blockly.Events[event_name]) !== -1;

        if (
            !this.workspace ||
            window.Blockly.derivWorkspace.isFlyoutVisible ||
            this.workspace.isDragging() ||
            !is_allowed_event
        ) {
            return;
        }

        this.enforceLimitations();

        const { active_symbols } = ApiHelpers?.instance ?? {};
        if (!active_symbols) return;

        const market_dropdown = this.getField('MARKET_LIST');
        const submarket_dropdown = this.getField('SUBMARKET_LIST');
        const symbol_dropdown = this.getField('SYMBOL_LIST');
        const market_options = active_symbols.getMarketDropdownOptions();

        const refreshMarketDropdowns = () => {
            const safe_market = getSafeDropdownValue(market_options, market_dropdown.getValue());
            market_dropdown?.updateOptions(market_options, {
                default_value: safe_market,
                should_pretend_empty: true,
                event_group: event.group,
            });

            const submarket_options = active_symbols.getSubmarketDropdownOptions(safe_market);
            const safe_submarket = getSafeDropdownValue(submarket_options, submarket_dropdown.getValue());
            submarket_dropdown?.updateOptions(submarket_options, {
                default_value: safe_submarket,
                should_pretend_empty: true,
                event_group: event.group,
            });

            const symbol_options = active_symbols.getSymbolDropdownOptions(safe_submarket);
            const safe_symbol = getSafeDropdownValue(symbol_options, symbol_dropdown.getValue());
            symbol_dropdown?.updateOptions(symbol_options, {
                default_value: safe_symbol,
                should_pretend_empty: true,
                event_group: event.group,
            });

            if (safe_symbol && safe_symbol !== 'na') {
                DBotStore.instance.dashboard.setBotBuilderSymbol(safe_symbol);
            }
        };

        if (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) {
            refreshMarketDropdowns();
        } else if (event.type === window.Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
            if (event.name === 'MARKET_LIST') {
                refreshMarketDropdowns();
            } else if (event.name === 'SUBMARKET_LIST') {
                const submarket_options = active_symbols.getSubmarketDropdownOptions(market_dropdown.getValue());
                const safe_submarket = getSafeDropdownValue(submarket_options, submarket_dropdown.getValue());
                const symbol_options = active_symbols.getSymbolDropdownOptions(safe_submarket);
                const safe_symbol = getSafeDropdownValue(symbol_options, symbol_dropdown.getValue());
                symbol_dropdown.updateOptions(symbol_options, {
                    default_value: safe_symbol,
                    should_pretend_empty: true,
                    event_group: event.group,
                });
                if (safe_symbol && safe_symbol !== 'na') {
                    DBotStore.instance.dashboard.setBotBuilderSymbol(safe_symbol);
                }
            } else if (event.name === 'SYMBOL_LIST') {
                const new_symbol = symbol_dropdown.getValue();
                DBotStore.instance.dashboard.setBotBuilderSymbol(new_symbol);
            }
        } else if (
            event.type === window.Blockly.Events.BLOCK_DRAG &&
            !event.isStart &&
            event.blockId === this.getRootBlock().id
        ) {
            if (market_dropdown.isEmpty() || submarket_dropdown.isEmpty() || symbol_dropdown.isEmpty()) {
                refreshMarketDropdowns();
            }
        }
    },
    enforceLimitations() {
        runIrreversibleEvents(() => {
            if (!this.isDescendantOf('trade_definition')) {
                this.unplug(false); // Unplug without reconnecting siblings

                const top_blocks = this.workspace.getTopBlocks();
                const trade_definition_block = top_blocks.find(block => block.type === 'trade_definition');

                // Reconnect self to trade definition block.
                if (trade_definition_block) {
                    const connection = trade_definition_block.getLastConnectionInStatement('TRADE_OPTIONS');
                    if (connection) {
                        connection.connect(this.previousConnection);
                    }
                } else {
                    this.dispose();
                }
            }
            // These blocks cannot be disabled.
            else if (this.disabled) {
                this.setDisabled(false);
            }
        });
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.trade_definition_market = () => {};
