import { generateDerivApiInstance } from './appId';

class ChartAPI {
    api;

    onsocketclose = () => {
        this.reconnectIfNotConnected();
    };

    init = async (force_create_connection = false) => {
        if (!this.api || force_create_connection) {
            if (this.api?.connection) {
                this.api.disconnect();
                this.api.connection.removeEventListener('close', this.onsocketclose);
            }
            this.api = await generateDerivApiInstance(force_create_connection);
            this.api?.connection.addEventListener('close', this.onsocketclose);
        }
        this.getTime();
    };

    isOpen() {
        return this.api?.connection?.readyState === WebSocket.OPEN;
    }

    waitUntilReady(timeout = 20000) {
        if (this.isOpen()) return Promise.resolve();

        return new Promise((resolve, reject) => {
            if (!this.api?.connection) {
                reject(new Error('Chart connection is not initialized.'));
                return;
            }

            let settled = false;
            const cleanup = () => {
                clearTimeout(timer);
                this.api?.connection?.removeEventListener('open', handleOpen);
                this.api?.connection?.removeEventListener('close', handleClose);
            };
            const settle = callback => {
                if (settled) return;
                settled = true;
                cleanup();
                callback();
            };
            const handleOpen = () => settle(resolve);
            const handleClose = () => settle(() => reject(new Error('Chart connection closed before data loaded.')));
            const timer = setTimeout(() => {
                settle(() => reject(new Error('Chart connection timed out.')));
            }, timeout);

            this.api.connection.addEventListener('open', handleOpen);
            this.api.connection.addEventListener('close', handleClose);
        });
    }

    async send(request, timeout) {
        if (!this.api) await this.init();
        await this.waitUntilReady(timeout);
        return this.api.send(request);
    }

    getTime() {
        if (!this.time_interval) {
            this.time_interval = setInterval(() => {
                this.send({ time: 1 }).catch(() => {});
            }, 30000);
        }
    }

    reconnectIfNotConnected = () => {
        // eslint-disable-next-line no-console
        console.log('chart connection state: ', this.api?.connection?.readyState);
        if (this.api?.connection?.readyState && this.api?.connection?.readyState > 1) {
            // eslint-disable-next-line no-console
            console.log('Info: Chart connection to the server was closed, trying to reconnect.');
            this.init(true);
        }
    };
}

const chart_api = new ChartAPI();

export default chart_api;
