import React from 'react';
import { observer } from 'mobx-react-lite';
import './analysis-tool.scss';

const AnalysisTool = observer(() => {
    return (
        <div className='analysis-tool'>
            <div className='analysis-tool__header'>
                <span className='analysis-tool__header-icon'>◆</span>
                <span className='analysis-tool__header-title'>GTS Empire Market Analysis</span>
                <span className='analysis-tool__header-sub'>Live Insights</span>
            </div>
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
    );
});

export default AnalysisTool;
