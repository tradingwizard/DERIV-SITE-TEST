import { useEffect, useState } from 'react';
import './intro-splash.scss';

type Props = {
    storageKey?: string;
    duration?: number;
    tagline?: string;
};

const IntroSplash = ({
    storageKey = 'gts_intro_seen_v1',
    duration = 2700,
    tagline = 'AI Options Automation',
}: Props) => {
    const [visible, setVisible] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);

    useEffect(() => {
        try {
            const seen = sessionStorage.getItem(storageKey);
            if (seen) return;
            setVisible(true);
            sessionStorage.setItem(storageKey, '1');
            const fadeTimer = setTimeout(() => setFadingOut(true), duration - 600);
            const hideTimer = setTimeout(() => setVisible(false), duration);
            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(hideTimer);
            };
        } catch {
            // Storage not available — show splash but don't persist
            setVisible(true);
            const t = setTimeout(() => setVisible(false), duration);
            return () => clearTimeout(t);
        }
    }, [storageKey, duration]);

    if (!visible) return null;

    const skip = () => {
        setFadingOut(true);
        setTimeout(() => setVisible(false), 300);
    };

    return (
        <div
            className={`gts-intro ${fadingOut ? 'gts-intro--out' : ''}`}
            role='presentation'
            onClick={skip}
        >
            <div className='gts-intro__bg' />
            <div className='gts-intro__rays' />
            <div className='gts-intro__center'>
                <div className='gts-intro__bulb' aria-hidden='true'>
                    <svg viewBox='0 0 120 160' width='120' height='160'>
                        <defs>
                            <radialGradient id='gtsBulbGlow' cx='50%' cy='40%' r='55%'>
                                <stop offset='0%' stopColor='#fff5d4' />
                                <stop offset='55%' stopColor='#f6c567' />
                                <stop offset='100%' stopColor='#b91c1c' />
                            </radialGradient>
                        </defs>
                        <path
                            d='M60 14c-22 0-40 17-40 38 0 13 7 25 18 32v11c0 3 3 6 6 6h32c3 0 6-3 6-6V84c11-7 18-19 18-32 0-21-18-38-40-38z'
                            fill='url(#gtsBulbGlow)'
                        />
                        <rect x='42' y='128' width='36' height='8' rx='3' fill='#fbe1c4' />
                        <rect x='46' y='140' width='28' height='6' rx='2.5' fill='#fbe1c4' />
                    </svg>
                </div>
                <div className='gts-intro__wordmark'>
                    <span className='gts-intro__gts'>GTS</span>
                    <span className='gts-intro__empire'>EMPIRE</span>
                </div>
                <div className='gts-intro__tagline'>{tagline}</div>
                <div className='gts-intro__bar'>
                    <span />
                </div>
            </div>
        </div>
    );
};

export default IntroSplash;
