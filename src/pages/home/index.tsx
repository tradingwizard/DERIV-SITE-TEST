import { useNavigate } from 'react-router-dom';
import './home.scss';

const features = [
    {
        title: 'AI-Powered Decisions',
        description:
            'Our adaptive engine reads market structure, volatility and momentum in real time so every trade is calculated, not emotional.',
        icon: '◆',
    },
    {
        title: 'Hands-Free Execution',
        description:
            'Set your strategy once and let the bot work 24/7. Entries, exits and risk management happen automatically.',
        icon: '⚙',
    },
    {
        title: 'Battle-Tested Strategies',
        description:
            'Choose from a vault of proven options strategies — or build your own with our visual block editor in minutes.',
        icon: '⚡',
    },
    {
        title: 'Bank-Grade Risk Controls',
        description:
            'Stop-loss, take-profit, daily limits and martingale protection are baked in. You stay in control, always.',
        icon: '🛡',
    },
];

const stats = [
    { value: '24/7', label: 'Always-on trading' },
    { value: '0.3s', label: 'Avg. execution speed' },
    { value: '50+', label: 'Built-in strategies' },
    { value: '100%', label: 'No code required' },
];

const steps = [
    {
        number: '01',
        title: 'Connect',
        text: 'Link your trading account in under 60 seconds with secure OAuth.',
    },
    {
        number: '02',
        title: 'Configure',
        text: 'Pick a ready-made AI bot or design your own with drag-and-drop blocks.',
    },
    {
        number: '03',
        title: 'Compound',
        text: 'Activate your bot and watch it execute with discipline while you live your life.',
    },
];

const testimonials = [
    {
        quote: 'GTS Empire took the guesswork out of options. I sleep better knowing the bot follows my rules to the letter.',
        name: 'Marcus A.',
        role: 'Full-time trader',
    },
    {
        quote: 'I went from blowing accounts to consistent weeks. The AI does what I never could — stay disciplined.',
        name: 'Priya S.',
        role: 'Part-time investor',
    },
    {
        quote: 'The strategy library alone is worth it. Plug, configure, profit. This is the future of retail trading.',
        name: 'Daniel K.',
        role: 'Options swing trader',
    },
];

const Home = () => {
    const navigate = useNavigate();

    const goToApp = () => navigate('/dashboard');

    return (
        <div className='gts-home'>
            <header className='gts-home__nav'>
                <div className='gts-home__nav-inner'>
                    <div className='gts-home__brand'>
                        <span className='gts-home__brand-mark'>GTS</span>
                        <span className='gts-home__brand-name'>EMPIRE</span>
                    </div>
                    <nav className='gts-home__nav-links'>
                        <a href='#features'>Features</a>
                        <a href='#how'>How it works</a>
                        <a href='#testimonials'>Traders</a>
                    </nav>
                    <button className='gts-home__nav-cta' onClick={goToApp}>
                        Launch App
                    </button>
                </div>
            </header>

            <section className='gts-home__hero'>
                <div className='gts-home__hero-bg' aria-hidden='true' />
                <div className='gts-home__hero-inner'>
                    <span className='gts-home__eyebrow'>AI-Powered Options Automation</span>
                    <h1 className='gts-home__headline'>
                        Trade options <span className='gts-home__accent'>smarter</span>,
                        <br />
                        not harder.
                    </h1>
                    <p className='gts-home__subhead'>
                        GTS Empire is the elite automated trading platform that lets you deploy
                        AI-driven options strategies in minutes — no coding, no emotions, no
                        sleepless nights. Just disciplined, data-driven execution working for you
                        around the clock.
                    </p>
                    <div className='gts-home__hero-actions'>
                        <button className='gts-home__cta-primary' onClick={goToApp}>
                            Start Trading Now
                            <span className='gts-home__cta-arrow'>→</span>
                        </button>
                        <a href='#how' className='gts-home__cta-secondary'>
                            See how it works
                        </a>
                    </div>
                    <div className='gts-home__hero-trust'>
                        <span className='gts-home__dot' />
                        Trusted by traders building the empire — join thousands automating their edge.
                    </div>
                </div>
            </section>

            <section className='gts-home__stats'>
                {stats.map(s => (
                    <div key={s.label} className='gts-home__stat'>
                        <div className='gts-home__stat-value'>{s.value}</div>
                        <div className='gts-home__stat-label'>{s.label}</div>
                    </div>
                ))}
            </section>

            <section id='features' className='gts-home__section'>
                <div className='gts-home__section-head'>
                    <span className='gts-home__eyebrow'>Why GTS Empire</span>
                    <h2>Your unfair advantage in the options market.</h2>
                    <p>
                        Built for serious traders who want institutional-grade tools without the
                        institutional learning curve.
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
            </section>

            <section id='how' className='gts-home__section gts-home__section--dark'>
                <div className='gts-home__section-head'>
                    <span className='gts-home__eyebrow'>How it works</span>
                    <h2>From signup to first trade in three steps.</h2>
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
            </section>

            <section id='testimonials' className='gts-home__section'>
                <div className='gts-home__section-head'>
                    <span className='gts-home__eyebrow'>The Empire</span>
                    <h2>Traders who stopped trading on emotion.</h2>
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
            </section>

            <section className='gts-home__final'>
                <div className='gts-home__final-inner'>
                    <h2>
                        Ready to build your <span className='gts-home__accent'>empire</span>?
                    </h2>
                    <p>
                        Stop second-guessing every trade. Let intelligent automation execute your
                        edge with surgical precision.
                    </p>
                    <button className='gts-home__cta-primary gts-home__cta-primary--large' onClick={goToApp}>
                        Start Trading Now
                        <span className='gts-home__cta-arrow'>→</span>
                    </button>
                    <div className='gts-home__final-note'>
                        Risk warning: Trading involves risk of loss. Past performance is not
                        indicative of future results.
                    </div>
                </div>
            </section>

            <footer className='gts-home__footer'>
                <div className='gts-home__footer-inner'>
                    <div className='gts-home__brand'>
                        <span className='gts-home__brand-mark'>GTS</span>
                        <span className='gts-home__brand-name'>EMPIRE</span>
                    </div>
                    <p>© {new Date().getFullYear()} GTS Empire. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
