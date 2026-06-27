import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import IntroSplash from '@/components/intro-splash/intro-splash';
import heroLightbulb from './assets/hero-trading.png';
import featureBulbChart from './assets/feature-chart.png';
import sectionDesk from './assets/section-desk.png';
import './home.scss';

const DERIV_ACCOUNT_URL = 'https://track.deriv.com/_VTH9KzYIL1T1hit6RV3zsGNd7ZgqdRLk/1/';
const PREMIUM_SOFTWARE_URL = 'https://www.gtsempire.com/software/';

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

const reveal = {
    hidden: { opacity: 0, y: 34 },
    visible: { opacity: 1, y: 0 },
};

const accessHighlights = [
    { label: 'Deriv synthetic traders', meta: 'Built for focus' },
    { label: 'AI-powered trading software', meta: 'Premium suite' },
    { label: 'Exclusive strategies', meta: 'Free for now' },
    { label: 'Workspace + Builder', meta: 'One flow' },
];

const softwareSuite = [
    {
        name: 'Empire Velocity',
        category: 'Speed Execution',
        market: 'Synthetic volatility indices',
        description: 'A fast-response execution suite shaped for traders who want disciplined synthetic-market timing.',
        visual: 'velocity',
    },
    {
        name: 'Crown Accumulator',
        category: 'Accumulator Suite',
        market: 'Accumulator contracts',
        description: 'A premium accumulator workflow with layered control, clean access, and structured progression.',
        visual: 'crown',
    },
    {
        name: 'Empire Vision AI',
        category: 'AI Entry Analysis',
        market: 'Synthetic digit conditions',
        description: 'A scanning interface for entry analysis, condition review, and focused workspace execution.',
        visual: 'vision',
    },
    {
        name: 'Empire Wizard AI',
        category: 'Adaptive Software',
        market: 'Synthetic over/under setups',
        description: 'A dark control core for software-assisted execution with visible logic and command points.',
        visual: 'wizard',
    },
    {
        name: 'Thunder Parity Pro',
        category: 'Parity Analysis',
        market: 'Even/Odd synthetic markets',
        description: 'A split-signal parity chamber for traders focused on even/odd synthetic market structure.',
        visual: 'thunder',
    },
    {
        name: 'Royal Parity AI',
        category: 'Digit Intelligence',
        market: 'Even/Odd synthetic markets',
        description: 'A refined parity engine with symmetrical digit panels, AI logic, and premium access flow.',
        visual: 'royal',
    },
];

const premiumSteps = [
    {
        number: '01',
        title: 'Choose exclusive software',
        text: 'Enter the premium software suite and select the strategy style that fits your synthetic-market workflow.',
    },
    {
        number: '02',
        title: 'Connect your Deriv account',
        text: 'Use the secure Deriv account connection so the workspace can prepare the correct trading environment.',
    },
    {
        number: '03',
        title: 'Test in the workspace',
        text: 'Review the setup, understand the flow, and test the software from a clean workspace before running it.',
    },
    {
        number: '04',
        title: 'Run from the Builder',
        text: 'Move into the Builder and manage execution from a focused interface built for Deriv synthetic traders.',
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
    const goToSoftware = () => navigate('/dashboard#free_bots');

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
                            <a
                                href={DERIV_ACCOUNT_URL}
                                className='gts-home__cta-secondary'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Create Deriv Trading Account
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

            <div className='gts-home__premium-world'>
                <section className='gts-home__access-strip' aria-label='GTS Empire access highlights'>
                    <div className='gts-home__container gts-home__access-grid'>
                        {accessHighlights.map(item => (
                            <div key={item.label} className='gts-home__access-item'>
                                <span className='gts-home__access-dot' aria-hidden='true' />
                                <div>
                                    <strong>{item.label}</strong>
                                    <span>{item.meta}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <motion.section
                    className='gts-home__suite-hero'
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    variants={reveal}
                >
                    <div className='gts-home__premium-grid' aria-hidden='true' />
                    <div className='gts-home__container gts-home__suite-hero-grid'>
                        <div className='gts-home__suite-copy'>
                            <span className='gts-home__eyebrow'>
                                Built for Deriv options traders
                            </span>
                            <h2>
                                A cleaner way to trade with structure on Deriv.
                            </h2>
                            <p>
                                GTS Empire brings your trading tools into one focused workspace:
                                free AI-powered trading software, Deriv account connection, demo
                                testing, and Builder launch. It is designed to help traders follow
                                a planned setup instead of jumping between random entries.
                            </p>
                            <div className='gts-home__suite-actions'>
                                <button className='gts-home__premium-button' onClick={goToSoftware}>
                                    Start With Free Software
                                </button>
                                <a
                                    className='gts-home__premium-button gts-home__premium-button--ghost'
                                    href={PREMIUM_SOFTWARE_URL}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    View Premium Software
                                </a>
                            </div>
                        </div>
                        <div className='gts-home__console-scene' aria-label='Animated GTS Empire workspace preview'>
                            <div className='gts-home__console-orbit' />
                            <div className='gts-home__console-stack'>
                                <div className='gts-home__console-panel gts-home__console-panel--back' />
                                <div className='gts-home__console-panel gts-home__console-panel--mid'>
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                <div className='gts-home__console-panel gts-home__console-panel--front'>
                                    <div className='gts-home__console-header'>
                                        <span>GTS EMPIRE</span>
                                        <strong>ACTIVE</strong>
                                    </div>
                                    <div className='gts-home__console-chart'>
                                        <i />
                                        <i />
                                        <i />
                                        <i />
                                        <i />
                                        <i />
                                    </div>
                                    <div className='gts-home__console-gridlets'>
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                </div>
                            </div>
                            <div className='gts-home__console-chip gts-home__console-chip--one'>
                                Demo testing
                            </div>
                            <div className='gts-home__console-chip gts-home__console-chip--two'>
                                Builder launch
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    className='gts-home__light-bridge'
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    variants={reveal}
                >
                    <div className='gts-home__container gts-home__light-bridge-grid'>
                        <div className='gts-home__light-bridge-visual' aria-hidden='true'>
                            <div className='gts-home__light-orbit' />
                            <div className='gts-home__light-panel gts-home__light-panel--one'>
                                <span />
                                <span />
                                <span />
                            </div>
                            <div className='gts-home__light-panel gts-home__light-panel--two'>
                                <i />
                                <i />
                                <i />
                            </div>
                            <div className='gts-home__light-signal' />
                        </div>
                        <div className='gts-home__light-bridge-copy'>
                            <span className='gts-home__eyebrow'>Currently free access</span>
                            <h2>Premium software, open for a limited time.</h2>
                            <p>
                                The featured AI-powered trading software below is premium by design,
                                but available free right now inside GTS Empire for Deriv synthetic
                                traders who want a cleaner workspace.
                            </p>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    className='gts-home__software-section'
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    variants={reveal}
                >
                    <div className='gts-home__container'>
                        <div className='gts-home__premium-head'>
                            <span className='gts-home__eyebrow gts-home__eyebrow--light'>
                                Featured AI-powered trading software
                            </span>
                            <h2>Six premium modules, built to feel exclusive.</h2>
                            <p>
                                Each software module gets its own live 3D identity, motion system,
                                synthetic-market focus, and free limited-time access inside the
                                app workspace.
                            </p>
                        </div>
                        <div className='gts-home__software-grid'>
                            {softwareSuite.map(software => (
                                <article
                                    key={software.name}
                                    className={`gts-home__software-card gts-home__software-card--${software.visual}`}
                                >
                                    <div className='gts-home__software-visual' aria-hidden='true'>
                                        <div className='gts-home__visual-depth' />
                                        <div className='gts-home__visual-core' />
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <div className='gts-home__software-card-top'>
                                        <span>{software.category}</span>
                                        <strong>Free access</strong>
                                    </div>
                                    <h3>{software.name}</h3>
                                    <p>{software.description}</p>
                                    <div className='gts-home__software-meta'>
                                        <span>Synthetic focus</span>
                                        <strong>{software.market}</strong>
                                    </div>
                                    <button className='gts-home__software-link' onClick={goToSoftware}>
                                        Launch in App
                                    </button>
                                </article>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    id='how'
                    className='gts-home__premium-how'
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    variants={reveal}
                >
                    <div className='gts-home__container gts-home__premium-how-grid'>
                        <div className='gts-home__premium-how-copy'>
                            <span className='gts-home__eyebrow gts-home__eyebrow--light'>
                                How it works
                            </span>
                            <h2>From premium software to Builder execution.</h2>
                            <p>
                                Traders who want extremely exclusive, top-notch strategies can
                                explore the premium software collection and move into the GTS
                                Empire workspace with a clean, guided flow.
                            </p>
                            <a
                                className='gts-home__premium-button'
                                href={PREMIUM_SOFTWARE_URL}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Explore Premium Software
                            </a>
                        </div>
                        <div className='gts-home__premium-steps'>
                            {premiumSteps.map(step => (
                                <div key={step.number} className='gts-home__premium-step'>
                                    <span>{step.number}</span>
                                    <div>
                                        <h3>{step.title}</h3>
                                        <p>{step.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    className='gts-home__api-workspace'
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    variants={reveal}
                >
                    <div className='gts-home__container gts-home__api-grid'>
                        <div className='gts-home__api-stage' aria-label='Deriv API workspace visual'>
                            <div className='gts-home__api-node gts-home__api-node--deriv'>
                                <span>DERIV</span>
                                <strong>Account</strong>
                            </div>
                            <div className='gts-home__api-beam' />
                            <div className='gts-home__api-node gts-home__api-node--gts'>
                                <span>GTS</span>
                                <strong>Workspace</strong>
                            </div>
                            <div className='gts-home__api-panel'>
                                <div className='gts-home__api-panel-head'>
                                    <span>API connection</span>
                                    <strong>Secure</strong>
                                </div>
                                <div className='gts-home__api-lines'>
                                    <i />
                                    <i />
                                    <i />
                                </div>
                            </div>
                        </div>
                        <div className='gts-home__api-copy'>
                            <span className='gts-home__eyebrow gts-home__eyebrow--light'>
                                Deriv API workspace
                            </span>
                            <h2>Built for Deriv traders without pretending to be Deriv.</h2>
                            <p>
                                GTS Empire is designed for Deriv synthetic traders who want an
                                all-in-one workspace for premium software access, secure connection,
                                testing, Builder flow, and execution visibility.
                            </p>
                            <a
                                href={DERIV_ACCOUNT_URL}
                                className='gts-home__premium-button gts-home__premium-button--ghost'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Create Deriv Trading Account
                            </a>
                        </div>
                    </div>
                </motion.section>

                <section className='gts-home__limited'>
                    <div className='gts-home__container gts-home__limited-inner'>
                        <div>
                            <span className='gts-home__eyebrow gts-home__eyebrow--light'>
                                Limited premium access
                            </span>
                            <h2>
                                Premium AI-powered trading software is currently available
                                free for a limited time.
                            </h2>
                            <p>
                                Open the workspace, explore the software suite, and move from
                                selection to Builder execution without touching the trading logic.
                            </p>
                        </div>
                        <div className='gts-home__limited-actions'>
                            <button className='gts-home__premium-button' onClick={goToApp}>
                                Launch App
                            </button>
                            <a
                                href={PREMIUM_SOFTWARE_URL}
                                className='gts-home__premium-button gts-home__premium-button--ghost'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Explore Premium Software
                            </a>
                        </div>
                    </div>
                </section>
            </div>

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
