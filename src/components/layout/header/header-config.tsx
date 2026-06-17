import { ReactNode } from 'react';
import { standalone_routes } from '@/components/shared';
import { LegacyChartsIcon as AnalyticsLogo, LegacyDerivIcon as RobotLogo } from '@deriv/quill-icons/Legacy';
import {
    DerivProductBrandLightDerivTraderLogoWordmarkIcon as DerivTraderLogo,
    PartnersProductBrandLightSmarttraderLogoWordmarkIcon as SmarttraderLogo,
} from '@deriv/quill-icons/Logo';
import { localize } from '@deriv-com/translations';
import { GtsEmpireLogo } from './gts-empire-logo';

export type PlatformsConfig = {
    active: boolean;
    buttonIcon: ReactNode;
    description: string;
    href: string;
    icon: ReactNode;
    showInEU: boolean;
};

export type MenuItemsConfig = {
    as: 'a' | 'button';
    href: string;
    icon: ReactNode;
    label: string;
};

export type TAccount = {
    balance: string;
    currency: string;
    icon: React.ReactNode;
    isActive: boolean;
    isEu: boolean;
    isVirtual: boolean;
    loginid: string;
    token: string;
    type: string;
};

export const platformsConfig: PlatformsConfig[] = [
    {
        active: false,
        buttonIcon: <DerivTraderLogo height={25} width={114.97} />,
        description: localize('A whole new trading experience on a powerful yet easy to use platform.'),
        href: standalone_routes.trade,
        icon: <DerivTraderLogo height={32} width={148} />,
        showInEU: true,
    },
    {
        active: true,
        buttonIcon: <GtsEmpireLogo height={22} />,
        description: localize('AI-powered automated options trading. No coding needed.'),
        href: standalone_routes.bot,
        icon: <GtsEmpireLogo height={28} />,
        showInEU: false,
    },
    {
        active: false,
        buttonIcon: <SmarttraderLogo height={24} width={115} />,
        description: localize('Trade the world’s markets with our popular user-friendly platform.'),
        href: standalone_routes.smarttrader,
        icon: <SmarttraderLogo height={32} width={153} />,
        showInEU: false,
    },
];

export const MenuItems: MenuItemsConfig[] = [
    {
        as: 'a',
        href: standalone_routes.free_bots,
        icon: <RobotLogo iconSize='xs' />,
        label: localize('Free Tools'),
    },
    {
        as: 'a',
        href: standalone_routes.analysis_tool,
        icon: <AnalyticsLogo iconSize='xs' />,
        label: localize('Analysis Tool'),
    },
    {
        as: 'a',
        href: standalone_routes.premium_tools,
        icon: <AnalyticsLogo iconSize='xs' />,
        label: localize('Premium Tools'),
    },
];
