import { observer } from 'mobx-react-lite';
import './premium-tools.scss';

const PREMIUM_URL = 'https://www.gtsempire.com/software/';

const PremiumTools = observer(() => {
    return (
        <div className='premium-tools'>
            <div className='premium-tools__header'>
                <div className='premium-tools__header-left'>
                    <span className='premium-tools__crest'>★</span>
                    <div>
                        <div className='premium-tools__title'>GTS Empire Premium Suite</div>
                        <div className='premium-tools__subtitle'>
                            Advanced AI tools, signal engines &amp; private strategies — straight from the Empire.
                        </div>
                    </div>
                </div>
                <a
                    className='premium-tools__cta'
                    href={PREMIUM_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    Visit gtsempire.com →
                </a>
            </div>
            <div className='premium-tools__iframe-container'>
                <iframe
                    src={PREMIUM_URL}
                    className='premium-tools__iframe'
                    title='GTS Empire Premium Tools'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    allowFullScreen
                />
            </div>
        </div>
    );
});

export default PremiumTools;
