import { useNavigate } from 'react-router-dom';
import IntroSplash from '@/components/intro-splash/intro-splash';
import heroLightbulb from './assets/hero-trading.png';
import featureBulbChart from './assets/feature-chart.png';
import sectionDesk from './assets/section-desk.png';
import './home.scss';

const features = [
    {
        title: 'Intelligent Signal Analysis',
        description:
            'Our AI scans price action, volatility and momentum across markets in real time — surfacing only the highest-conviction setups.',
        icon: '◆',
    },
    {
        title: 'Effortless Automation',
        description:
            'Configure your strategy once. The platform handles every entry, exit and adjustment for you, around the clock, with absolute discipline.',
        icon: '⚙',
    },
    {
        title: 'Curated Strategy Vault',
        description:
            'Access a library of professionally engineered options strategies — or build your own using a clean visual editor. No code, ever.',
        icon: '✦',
    },
    {
        title: 'Institutional Risk Controls',
        description:
            'Daily loss caps, take-profit ladders and position sizing logic come built-in. Your downside is always measured. Always.',
        icon: '◈',
    },
];

const stats = [
    { value: '24 / 7', label: 'Always-on execution' },
    { value: '< 1s', label: 'Avg. trade response' },
    { value: '50+', label: 'Curated strategies' },
    { value: '0', label: 'Lines of code' },
];

const steps = [
    {
        number: '01',
        title: 'Connect',
        text: 'Securely link your trading account in under a minute through encrypted authentication.',
    },
    {
        number: '02',
        title: 'Configure',
        text: 'Choose a proven AI strategy from the vault or design your own with intuitive building blocks.',
    },
    {
        number: '03',
        title: 'Compound',
        text: 'Activate your bot and let intelligent execution work in the background while you focus on what matters.',
    },
];

const testimonials = [
    {
        quote: 'GTS Empire removed every emotional decision from my trading day. The discipline is unmatched — I finally trust my system.',
        name: 'Marcus A.',
        role: 'Full-time options trader',
    },
    {
        quote: 'I went from inconsistent results to a process I can repeat. The strategy vault alone saved me months of research.',
        name: 'Priya S.',
        role: 'Active investor',
    },
    {
        quote: 'Setup was effortless and the platform feels built for serious traders. This is what premium automation should look like.',
        name: 'Daniel K.',
        role: 'Swing trader',
    },
];

const Home = () => {
    const navigate = useNavigate();

    const goToApp = () => navigate('/dashboard');

    return (
        <div className='gts-home'>
            <IntroSplash storageKey='gts_intro_home_v1' />
            <header className='gts-home__nav'>
                <div className='gts-home__container gts-home__nav-inner'>
                    <div className='gts-home__brand'>
                        <span className='gts-home__brand-mark'>GTS</span>
                        <span className='gts-home__brand-name'>EMPIRE</span>
                    </div>
                    <nav className='gts-home__nav-links'>
                        <a href='#features'>Platform</a>
                        <a href='#how'>How it works</a>
                        <a
                            href='https://www.gtsempire.com/software/'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            Premium
                        </a>
                        <a href='#testimonials'>Traders</a>
                    </nav>
                    <button className='gts-home__nav-cta' onClick={goToApp}>
                        Launch App
                    </button>
                </div>
            </header>

            <section className='gts-home__hero'>
                <div className='gts-home__hero-glow' aria-hidden='true' />
                <div className='gts-home__container gts-home__hero-grid'>
                    <div className='gts-home__hero-copy'>
                        <span className='gts-home__eyebrow'>
                            <span className='gts-home__eyebrow-dot' /> AI Options Automation
                        </span>
                        <h1 className='gts-home__headline'>
                            The smarter way to <em>trade options</em>.
                        </h1>
                        <p className='gts-home__subhead'>
                            GTS Empire is a refined automated trading platform for serious
                            options traders. Deploy AI-driven strategies in minutes, remove
                            emotion from every decision, and let intelligent execution build your
                            edge — quietly, consistently, around the clock.
                        </p>
                        <div className='gts-home__hero-actions'>
                            <button className='gts-home__cta-primary' onClick={goToApp}>
                                Start Trading Now
                                <span className='gts-home__cta-arrow' aria-hidden='true'>
                                    →
                                </span>
                            </button>
                            <a href='#how' className='gts-home__cta-secondary'>
                                See how it works
                            </a>
                        </div>
                        <div className='gts-home__hero-meta'>
                            <div className='gts-home__hero-trust'>
                                <span className='gts-home__pulse' aria-hidden='true' />
                                Built for traders who value precision over noise.
                            </div>
                            <div className='gts-home__powered'>
                                <span className='gts-home__powered-label'>Powered by</span>
                                <a
                                    className='gts-home__powered-name'
                                    href='https://deriv.com'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    Deriv
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='gts-home__hero-visual'>
                        <div className='gts-home__hero-visual-bg' aria-hidden='true' />
                        <img src={heroLightbulb} alt='AI-driven trading chart with rising candles' />
                        <div className='gts-home__hero-badge'>
                            <span className='gts-home__hero-badge-label'>Live</span>
                            <span className='gts-home__hero-badge-text'>
                                AI engine active &middot; 12 strategies running
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className='gts-home__stats'>
                <div className='gts-home__container gts-home__stats-grid'>
                    {stats.map(s => (
                        <div key={s.label} className='gts-home__stat'>
                            <div className='gts-home__stat-value'>{s.value}</div>
                            <div className='gts-home__stat-label'>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section id='features' className='gts-home__section'>
                <div className='gts-home__container'>
                    <div className='gts-home__section-head'>
                        <span className='gts-home__eyebrow'>The Platform</span>
                        <h2>
                            An unfair advantage,
                            <br />
                            engineered for clarity.
                        </h2>
                        <p>
                            Every feature is designed to remove friction and protect your capital —
                            so you can focus on the strategy, not the screen.
                        </p>
                    </div>
                    <div className='gts-home__features'>
                        {features.map(f => (
                            <div key={f.title} className='gts-home__feature'>
                                <div className='gts-home__feature-icon'>{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className='gts-home__showcase'>
                <div className='gts-home__container gts-home__showcase-grid'>
                    <div className='gts-home__showcase-image'>
                        <img src={featureBulbChart} alt='Premium trading chart on dark glass' />
                    </div>
                    <div className='gts-home__showcase-copy'>
                        <span className='gts-home__eyebrow'>Why It Works</span>
                        <h2>
                            Ideas only matter if you can <em>execute them</em>.
                        </h2>
                        <p>
                            Most traders lose to themselves — hesitation, overtrading, fear of
                            missing out. GTS Empire turns your strategy into a system that runs
                            with discipline you simply cannot replicate manually.
                        </p>
                        <ul className='gts-home__showcase-list'>
                            <li>Removes emotion from every entry and exit.</li>
                            <li>Backtested logic with transparent performance.</li>
                            <li>Adjusts to volatility regimes automatically.</li>
                        </ul>
                        <button className='gts-home__cta-primary gts-home__cta-primary--ghost' onClick={goToApp}>
                            Explore the platform
                            <span className='gts-home__cta-arrow' aria-hidden='true'>
                                →
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            <section id='how' className='gts-home__section gts-home__section--soft'>
                <div className='gts-home__container'>
                    <div className='gts-home__section-head'>
                        <span className='gts-home__eyebrow'>How it works</span>
                        <h2>From signup to first trade in three steps.</h2>
                        <p>Built to feel effortless. Designed to feel inevitable.</p>
                    </div>
                    <div className='gts-home__steps'>
                        {steps.map(s => (
                            <div key={s.number} className='gts-home__step'>
                                <div className='gts-home__step-number'>{s.number}</div>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id='testimonials' className='gts-home__section'>
                <div className='gts-home__container'>
                    <div className='gts-home__section-head'>
                        <span className='gts-home__eyebrow'>The Empire</span>
                        <h2>Traders who chose discipline over guesswork.</h2>
                    </div>
                    <div className='gts-home__testimonials'>
                        {testimonials.map(t => (
                            <div key={t.name} className='gts-home__testimonial'>
                                <p className='gts-home__quote'>&ldquo;{t.quote}&rdquo;</p>
                                <div className='gts-home__author'>
                                    <strong>{t.name}</strong>
                                    <span>{t.role}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section
                className='gts-home__final'
                style={{ backgroundImage: `url(${sectionDesk})` }}
            >
                <div className='gts-home__final-overlay' />
                <div className='gts-home__container gts-home__final-inner'>
                    <span className='gts-home__eyebrow gts-home__eyebrow--light'>Ready when you are</span>
                    <h2>
                        Build your empire on <em>better decisions</em>.
                    </h2>
                    <p>
                        Stop second-guessing every move. Let intelligent automation execute your
                        edge with surgical precision — starting today.
                    </p>
                    <button
                        className='gts-home__cta-primary gts-home__cta-primary--large'
                        onClick={goToApp}
                    >
                        Start Trading Now
                        <span className='gts-home__cta-arrow' aria-hidden='true'>
                            →
                        </span>
                    </button>
                    <div className='gts-home__final-note'>
                        Trading involves risk of loss. Past performance is not indicative of future results.
                    </div>
                </div>
            </section>

            <footer className='gts-home__footer'>
                <div className='gts-home__container gts-home__footer-inner'>
                    <div className='gts-home__brand'>
                        <span className='gts-home__brand-mark'>GTS</span>
                        <span className='gts-home__brand-name'>EMPIRE</span>
                    </div>
                    <div className='gts-home__footer-meta'>
                        <p>© {new Date().getFullYear()} GTS Empire. All rights reserved.</p>
                        <p className='gts-home__footer-powered'>
                            Powered by{' '}
                            <a href='https://deriv.com' target='_blank' rel='noopener noreferrer'>
                                Deriv
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
