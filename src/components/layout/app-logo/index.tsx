import { useDevice } from '@deriv-com/ui';
import { GtsEmpireLogo } from '../header/gts-empire-logo';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();

    if (!isDesktop) return null;
    return (
        <a href='/' className='app-header__logo' style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <GtsEmpireLogo height={28} />
        </a>
    );
};
