type Props = {
    height?: number;
};

export const GtsEmpireLogo = ({ height = 28 }: Props) => (
    <span
        style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '0.4rem',
            fontFamily: "'Playfair Display', Georgia, serif",
            lineHeight: 1,
            height,
        }}
    >
        <span
            style={{
                fontSize: `${height * 0.95}px`,
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#b91c1c',
                letterSpacing: '-0.01em',
            }}
        >
            GTS
        </span>
        <span
            style={{
                fontFamily: "'Manrope', -apple-system, sans-serif",
                fontSize: `${height * 0.46}px`,
                fontWeight: 700,
                letterSpacing: '0.28em',
                color: '#1a1413',
            }}
        >
            EMPIRE
        </span>
    </span>
);

export default GtsEmpireLogo;
