import { createContext, useContext, useEffect, useRef, useState } from 'react';
import ChunkLoader from '@/components/loader/chunk-loader';
import RootStore from '@/stores/root-store';
import { TWebSocket } from '@/Types';
import { localize } from '@deriv-com/translations';
import Bot from '../external/bot-skeleton/scratch/dbot';

const StoreContext = createContext<null | RootStore>(null);

type TStoreProvider = {
    children: React.ReactNode;
    mockStore?: RootStore;
};

const StoreProvider: React.FC<TStoreProvider> = ({ children, mockStore }) => {
    const [store, setStore] = useState<RootStore | null>(null);
    const initializingStore = useRef(false);

    useEffect(() => {
        const initializeStore = async () => {
            const rootStore = new RootStore(Bot);
            setStore(rootStore);
        };

        if (!store && !initializingStore.current) {
            initializingStore.current = true;
            // If the store is mocked for testing purposes, then return the mocked value.
            if (mockStore) {
                setStore(mockStore);
            } else {
                initializeStore();
            }
        }
    }, [store, mockStore]);

    // Never hand a null store to consumers. Components throughout the app
    // destructure values like `dashboard` directly off useStore(); rendering
    // children before the root store exists causes a white-screen crash
    // ("Cannot destructure property 'dashboard' of ... null"). Show the loader
    // until the store is initialized.
    if (!store) return <ChunkLoader message={localize('Initializing Deriv Bot...')} />;

    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

const useStore = () => {
    const store = useContext(StoreContext);

    return store as RootStore;
};

export { StoreProvider, useStore };

export const mockStore = (ws: TWebSocket) => new RootStore(Bot, ws);
