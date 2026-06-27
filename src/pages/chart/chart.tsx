import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { useStore } from '@/hooks/useStore';
import {
    ActiveSymbolsRequest,
    ServerTimeRequest,
    TicksHistoryResponse,
    TicksStreamRequest,
    TradingTimesRequest,
} from '@deriv/api-types';
import { ChartTitle, SmartChart } from '@deriv/deriv-charts';
import { useDevice } from '@deriv-com/ui';
import ToolbarWidgets from './toolbar-widgets';
import '@deriv/deriv-charts/dist/smartcharts.css';

type TSubscription = {
    [key: string]: null | {
        unsubscribe?: () => void;
    };
};

type TError = null | {
    error?: {
        code?: string;
        message?: string;
    };
};

const subscriptions: TSubscription = {};

const getErrorMessage = (error: unknown) =>
    (error as TError)?.error?.message || (error as Error)?.message || 'Chart data is currently unavailable.';

const getErrorCode = (error: unknown) => (error as TError)?.error?.code || 'ChartDataError';

const getRequestMessageType = (req: Record<string, unknown>) => {
    if (req.ticks_history) return req.style === 'candles' ? 'candles' : 'history';
    return Object.keys(req).find(key => key !== 'req_id' && key !== 'passthrough') ?? 'chart';
};

const createChartErrorResponse = (req: Record<string, unknown>, error: unknown) => ({
    echo_req: req,
    msg_type: getRequestMessageType(req),
    error: {
        code: getErrorCode(error),
        message: getErrorMessage(error),
        echo_req: req,
    },
});

const getStreamId = (data?: Record<string, any>) => data?.subscription?.id || data?.tick?.id || data?.ohlc?.id || '';

const isChartStreamResponse = (
    data: Record<string, any>,
    req: TicksStreamRequest,
    current_subscription_id: string
) => {
    if (!['tick', 'ohlc'].includes(data?.msg_type)) return false;

    const stream_id = getStreamId(data);
    if (current_subscription_id && stream_id && stream_id !== current_subscription_id) return false;

    const echo_req = data?.echo_req ?? {};
    const echo_symbol = echo_req.ticks_history || echo_req.ticks || data?.tick?.symbol || data?.ohlc?.symbol;
    if (echo_symbol && echo_symbol !== req.ticks_history) return false;

    return true;
};

const Chart = observer(({ show_digits_stats }: { show_digits_stats: boolean }) => {
    const barriers: [] = [];
    const { common, ui } = useStore();
    const { chart_store, run_panel, dashboard } = useStore();
    const [isSafari, setIsSafari] = useState(false);

    const {
        chart_type,
        getMarketsOrder,
        granularity,
        onSymbolChange,
        setChartStatus,
        symbol,
        updateChartType,
        updateGranularity,
        updateSymbol,
        setChartSubscriptionId,
        chart_subscription_id,
    } = chart_store;
    const chartSubscriptionIdRef = useRef(chart_subscription_id);
    const { isDesktop, isMobile } = useDevice();
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;
    const settings = {
        assetInformation: false, // ui.is_chart_asset_info_visible,
        countdown: true,
        isHighestLowestMarkerEnabled: false, // TODO: Pending UI,
        language: common.current_language.toLowerCase(),
        position: ui.is_chart_layout_default ? 'bottom' : 'left',
        theme: ui.is_dark_mode_on ? 'dark' : 'light',
    };
    useEffect(() => {
        // Safari browser detection
        const isSafariBrowser = () => {
            const ua = navigator.userAgent.toLowerCase();
            return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1 && ua.indexOf('android') === -1;
        };

        setIsSafari(isSafariBrowser());

        return () => {
            Object.keys(subscriptions).forEach(subscription_id => {
                subscriptions[subscription_id]?.unsubscribe?.();
                delete subscriptions[subscription_id];
            });
            chart_api.api?.forgetAll?.('ticks')?.catch?.(() => {});
        };
    }, []);

    useEffect(() => {
        chartSubscriptionIdRef.current = chart_subscription_id;
    }, [chart_subscription_id]);

    useEffect(() => {
        updateSymbol(symbol);
        api_base.active_symbols_promise?.then(() => updateSymbol(symbol));
        // We only want to validate the stored/default symbol when the chart mounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requestAPI = async (req: ServerTimeRequest | ActiveSymbolsRequest | TradingTimesRequest) => {
        try {
            return await chart_api.send(req);
        } catch (error) {
            return createChartErrorResponse(req as Record<string, unknown>, error);
        }
    };
    const requestForgetStream = async (subscription_id: string) => {
        if (!subscription_id) return;
        subscriptions[subscription_id]?.unsubscribe?.();
        delete subscriptions[subscription_id];
        chartSubscriptionIdRef.current = '';
        setChartSubscriptionId('');
        await chart_api.api?.forget?.(subscription_id)?.catch?.(() => {});
    };

    const requestSubscribe = async (req: TicksStreamRequest, callback: (data: any) => void) => {
        try {
            await requestForgetStream(chartSubscriptionIdRef.current);
            const history = await chart_api.send(req);
            const subscription_id = getStreamId(history);
            chartSubscriptionIdRef.current = subscription_id;
            setChartSubscriptionId(subscription_id);
            if (history) callback(history);

            if (req.subscribe === 1 && subscription_id) {
                subscriptions[subscription_id] = chart_api.api
                    ?.onMessage()
                    ?.subscribe(({ data }: { data: TicksHistoryResponse }) => {
                        if (!isChartStreamResponse(data, req, chartSubscriptionIdRef.current)) return;
                        callback(data);
                    });
            }
        } catch (error) {
            callback(createChartErrorResponse(req as Record<string, unknown>, error));
            setChartStatus(false);
        }
    };

    if (!symbol) return null;
    const is_connection_opened = !!chart_api?.api;
    return (
        <div
            className={classNames('dashboard__chart-wrapper', {
                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                'dashboard__chart-wrapper--safari': isSafari,
            })}
            dir='ltr'
        >
            <SmartChart
                id='dbot'
                barriers={barriers}
                showLastDigitStats={show_digits_stats}
                chartControlsWidgets={null}
                enabledChartFooter={false}
                chartStatusListener={(v: boolean) => setChartStatus(!v)}
                toolbarWidget={() => (
                    <ToolbarWidgets
                        updateChartType={updateChartType}
                        updateGranularity={updateGranularity}
                        position={!isDesktop ? 'bottom' : 'top'}
                        isDesktop={isDesktop}
                    />
                )}
                chartType={chart_type}
                isMobile={isMobile}
                enabledNavigationWidget={isDesktop}
                granularity={granularity}
                requestAPI={requestAPI}
                requestForget={() => {}}
                requestForgetStream={() => {}}
                requestSubscribe={requestSubscribe}
                settings={settings}
                symbol={symbol}
                topWidgets={() => <ChartTitle onChange={onSymbolChange} />}
                isConnectionOpened={is_connection_opened}
                getMarketsOrder={getMarketsOrder}
                isLive
                leftMargin={80}
            />
        </div>
    );
});

export default Chart;
