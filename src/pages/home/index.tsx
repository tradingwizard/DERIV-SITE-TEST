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
        title: 'Less emotional trading',
        description:
            'Rules are set before execution, so you are not reacting to every candle under pressure.',
        icon: '◆',
    },
    {
        title: 'Cleaner risk control',
        description:
            'Stake, target, stop loss, and session limits stay visible before the trade begins.',
        icon: '⚙',
    },
    {
        title: 'Faster execution',
        description:
            'The software handles repetitive actions while you focus on the trading plan.',
        icon: '✦',
    },
    {
        title: 'Better learning curve',
        description:
            'You can review what worked, what failed, and what needs adjustment.',
        icon: '◈',
    },
];

const stats = [
    { value: '24/7', label: 'Trading tools available anytime' },
    { value: '<15 min', label: 'Simple setup for serious traders' },
    { value: '50+', label: 'Structured tools and presets' },
    { value: '0 hype', label: 'Risk-first trading approach' },
];

const reveal = {
    hidden: { opacity: 0, y: 34 },
    visible: { opacity: 1, y: 0 },
};

const accessHighlights = [
    { label: 'Deriv options focused', meta: 'Built for structure' },
    { label: 'Risk-first workflow', meta: 'Rules before execution' },
    { label: 'AI-powered software', meta: 'Premium access' },
    { label: 'Workspace + Builder', meta: 'One disciplined flow' },
];

const softwareSuite = [
    {
        name: 'Prime Volatility',
        category: 'Structured volatility',
        market: 'Volatility markets',
        description:
            'A structured volatility module for traders who want cleaner execution, controlled risk settings, and a more disciplined way to approach fast-moving markets.',
        visual: 'velocity',
    },
    {
        name: 'Crash Boom Automator',
        category: 'Crash and Boom',
        market: 'Crash/Boom markets',
        description:
            'Designed for Crash and Boom traders who want speed, structure, and predefined rules before market movement begins.',
        visual: 'crown',
    },
    {
        name: 'Engine Titan X1',
        category: 'Advanced execution',
        market: 'Synthetic options',
        description:
            'A focused execution engine for traders who prefer a sharper, more advanced setup with clear controls and fast decision support.',
        visual: 'vision',
    },
    {
        name: 'Empire Wizard AI',
        category: 'Guided automation',
        market: 'Structured logic',
        description:
            'A guided automation module built to help traders move away from random entries and start working with structured logic.',
        visual: 'wizard',
    },
    {
        name: 'Thunder Fury Pro',
        category: 'Active conditions',
        market: 'Synthetic options',
        description:
            'A stronger module for traders who want to test more active conditions while keeping risk management and trading rules visible.',
        visual: 'thunder',
    },
    {
        name: 'Voodoo Matrix AI',
        category: 'Premium automation',
        market: 'Synthetic options',
        description:
            'A premium module for traders who understand that automation works best with patience, testing, and disciplined risk control.',
        visual: 'royal',
    },
];

const premiumSteps = [
    {
        number: '01',
        title: 'Choose your module',
        text: 'Pick the software engine that matches your experience level, preferred market, and trading style.',
    },
    {
        number: '02',
        title: 'Set your rules',
        text: 'Define stake size, take profit, stop loss, entry conditions, and session limits before execution.',
    },
    {
        number: '03',
        title: 'Test before scaling',
        text: 'Use demo or small capital first so you understand how the setup behaves before increasing exposure.',
    },
    {
        number: '04',
        title: 'Execute with discipline',
        text: 'Let the software support your plan while you remain responsible for every trading decision.',
    },
];

const testimonials = [
    {
        quote: 'I stopped jumping into random trades. The setup forced me to think about my rules first.',
        name: 'GTS Empire User',
        role: '',
    },
    {
        quote: 'What I liked most was the structure. It made Deriv options feel less confusing.',
        name: 'Deriv Options Trader',
        role: '',
    },
    {
        quote: 'It does not remove risk, but it helped me approach the market with more discipline.',
        name: 'Software User',
        role: '',
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
                                Trade with structure, not pressure.
                            </h2>
                            <p>
                                Most traders do not lose because they lack ambition. They lose
                                because they enter without a clear plan, change rules under
                                pressure, and let emotion control execution. GTS Empire gives Deriv
                                options traders a cleaner way to approach the market through
                                structured automation, risk settings, and tools designed to support
                                disciplined trading decisions.
                            </p>
                            <div className='gts-home__suite-actions'>
                                <button className='gts-home__premium-button' onClick={goToSoftware}>
                                    Explore the software
                                </button>
                                <a
                                    className='gts-home__premium-button gts-home__premium-button--ghost'
                                    href={PREMIUM_SOFTWARE_URL}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    See how it works
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
                            <span className='gts-home__eyebrow'>Premium Trading Software</span>
                            <h2>Automation built for traders who want control, not noise.</h2>
                            <p>
                                This is not about guessing entries or chasing every market move. GTS
                                Empire is built to help you define your trading rules, manage risk
                                before execution, and approach Deriv options with more discipline.
                                You stay in control. The software helps you execute with structure.
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
                                Built for Different Trading Styles
                            </span>
                            <h2>Choose the engine that matches how you trade.</h2>
                            <p>
                                Every trader is different. Some want simple structure. Some want
                                faster execution. Some want a more advanced setup. GTS Empire gives
                                you access to premium modules designed around different market
                                conditions, risk levels, and trading styles. Start simple. Test
                                carefully. Scale only when the setup makes sense.
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
                                        <span>Market focus</span>
                                        <strong>{software.market}</strong>
                                    </div>
                                    <button className='gts-home__software-link' onClick={goToSoftware}>
                                        Learn more
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
                                From Software to Execution
                            </span>
                            <h2>Every trade should have a plan before it starts.</h2>
                            <p>
                                Good software should not make you reckless. It should help you slow
                                down, define your setup, control your risk, and execute with less
                                emotion. GTS Empire gives you a practical trading workflow: choose
                                your module, set your rules, test your setup, and trade with
                                discipline.
                            </p>
                            <a
                                className='gts-home__premium-button'
                                href={PREMIUM_SOFTWARE_URL}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Start with the right module
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
                                Built Around Deriv Options
                            </span>
                            <h2>Made for Deriv traders. Independent from Deriv.</h2>
                            <p>
                                GTS Empire is designed for traders using Deriv synthetic indices and
                                options. The goal is to help you approach trading with better
                                structure, automation, and risk awareness. GTS Empire is not owned
                                by, operated by, or officially endorsed by Deriv. Trading involves
                                risk, and results are never guaranteed.
                            </p>
                            <a
                                href={DERIV_ACCOUNT_URL}
                                className='gts-home__premium-button gts-home__premium-button--ghost'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Explore trading tools
                            </a>
                        </div>
                    </div>
                </motion.section>

                <section className='gts-home__limited'>
                    <div className='gts-home__container gts-home__limited-inner'>
                        <div>
                            <span className='gts-home__eyebrow gts-home__eyebrow--light'>
                                Premium automation access
                            </span>
                            <h2>
                                Premium automation access is currently open.
                            </h2>
                            <p>
                                Get access to selected AI-powered trading software and start
                                building a cleaner, more disciplined Deriv options workflow. No
                                hype. No guaranteed profits. Just structured tools for traders who
                                want to execute better.
                            </p>
                        </div>
                        <div className='gts-home__limited-actions'>
                            <button className='gts-home__premium-button' onClick={goToApp}>
                                Claim access
                            </button>
                            <a
                                href={PREMIUM_SOFTWARE_URL}
                                className='gts-home__premium-button gts-home__premium-button--ghost'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Talk to support
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            <section id='features' className='gts-home__section'>
                <div className='gts-home__container'>
                    <div className='gts-home__section-head'>
                        <span className='gts-home__eyebrow'>Why Traders Use It</span>
                        <h2>
                            What changes when your
                            <br />
                            trading has structure.
                        </h2>
                        <p>
                            The biggest upgrade is not just automation. It is knowing what should
                            happen before, during, and after the trade.
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
                        <span className='gts-home__eyebrow'>For Serious Traders</span>
                        <h2>
                            Ideas only matter when you can <em>execute them</em>.
                        </h2>
                        <p>
                            Many traders know what they should do, but struggle to follow their own
                            rules when the market starts moving. GTS Empire helps you move from
                            random decisions to a more structured workflow: choose the module,
                            define the risk, test the setup, then trade with discipline.
                        </p>
                        <ul className='gts-home__showcase-list'>
                            <li>Built around Deriv options trading</li>
                            <li>Designed for beginners and existing traders</li>
                            <li>Supports automation, structure, and risk planning</li>
                            <li>No guaranteed profit, no fake certainty, no hype</li>
                        </ul>
                        <button className='gts-home__cta-primary gts-home__cta-primary--ghost' onClick={goToApp}>
                            Explore the software
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
                        <span className='gts-home__eyebrow'>Trader Feedback</span>
                        <h2>Traders choosing process over pressure.</h2>
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
