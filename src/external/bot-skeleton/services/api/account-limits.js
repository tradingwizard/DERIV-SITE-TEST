export default class AccountLimits {
    constructor(store) {
        this.ws = store.ws;
    }
    // eslint-disable-next-line default-param-last
    getStakePayoutLimits(currency = 'AUD', landing_company_shortcode = 'svg', selected_market) {
        return this.ws
            .send({
                landing_company_details: landing_company_shortcode,
            })
            .then(landing_company => {
                const currency_config = landing_company?.landing_company_details?.currency_config[selected_market];
                return currency_config ? currency_config[currency] : {};
            })
            .catch(() => {
                // The new API platform does not support `landing_company_details`
                // (replies UnrecognisedRequest). Degrade to no limits instead of
                // surfacing an unhandled rejection in the console.
                return {};
            });
    }
}
