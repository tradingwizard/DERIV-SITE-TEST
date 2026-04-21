import React from 'react';
import { observer } from 'mobx-react-lite';
import './analysis-tool.scss';

const AnalysisTool = observer(() => {
    return (
        <div className='analysis-tool'>
            <div className='analysis-tool__header'>
                <div className='analysis-tool__header-glow' aria-hidden='true' />
                <div className='analysis-tool__header-left'>
                    <span className='analysis-tool__header-icon' aria-hidden='true'>
                        <svg viewBox='0 0 24 24' width='24' height='24' fill='none'>
                            <path d='M12 2L3 7l9 5 9-5-9-5zm0 7L3 4v9l9 5 9-5V4l-9 5z' fill='#fbe1c4' />
                        </svg>
                    </span>
                    <div>
                        <div className='analysis-tool__header-title'>GTS Empire Market Analysis</div>
                        <div className='analysis-tool__header-meta'>Real-time digit, candle &amp; volatility intelligence</div>
                    </div>
                </div>
                <div className='analysis-tool__header-right'>
                    <span className='analysis-tool__pulse' aria-hidden='true' />
                    <span className='analysis-tool__header-sub'>Live Stream</span>
                </div>
            </div>
            <div className='analysis-tool__iframe-frame'>
                <div className='analysis-tool__iframe-container'>
                    <iframe
                        src='https://bot-analysis-tool-belex.web.app'
                        className='analysis-tool__iframe'
                        title='GTS Empire Market Analysis'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
});

export default AnalysisTool;
