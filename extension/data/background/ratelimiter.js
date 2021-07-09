'use strict';

/**
 * Ratelimit handler supporting parallel in-flight requests.
 */
class Ratelimiter { // eslint-disable-line no-unused-vars
    constructor () {
        /**
         * Array of data for pending requests.
         * @type {RatelimiterPendingRequest[]}
         */
        this.requestsPending = [];
        /**
         * Set of promises for in-flight requests.
         * @type {Set<Promise<Response>>}
         */
        this.requestsInFlight = new Set();

        /**
         * The number of requests that can be sent before the limit resets
         * @type {number}
         */
        this.ratelimitRemaining = 0;
        /**
         * When the limit will be reset.
         * @type {Date}
         */
        this.ratelimitResetDate = new Date();
        /**
         * ID of the timer currently waiting for the ratelimit reset, if any.
         * @type {number}
         */
        this.resetTimerID = null;
    }

    /**
     * An object containing options that modify how a request is handled.
     * @typedef RatelimiterRequestOptions
     * @property {boolean} options.bypassLimit If true, this request will be
     * sent immediately even if the current ratelimit bucket is empty. Use
     * sparingly, only for requests which block all of Toolbox, and definitely
     * never for mass actions.
     */

    /**
     * An object containing details about a pending request.
     * @typedef RatelimiterPendingRequest
     * @property {any[]} fetchArgs Arguments to fetch()
     * @property {((response: Response) => void)} resolve Function to call if
     * the request is completed successfully
     * @property {(error: Error) => void} reject Function to call if an error
     * occurs while processing the request
     * @property {RatelimiterRequestOptions} options Request handling options
     */

    /**
     * Queues a request.
     * @param {RatelimiterRequestOptions} options Request handling options
     * @param  {...any} fetchArgs Arguments to fetch()
     */
    request (options, ...fetchArgs) {
        return new Promise((resolve, reject) => {
            this.requestsPending.push({fetchArgs, resolve, reject, options});
            this._processQueue();
        });
    }

    /**
     * Recursively sends all queued requests.
     * @private
     */
    async _processQueue () {
        // If there are no queued requests, there's nothing to do
        if (this.requestsPending.length <= 0) {
            return;
        }

        // Pull the next queued request
        const nextRequest = this.requestsPending.shift();

        // If this request ignores the limits, send it immediately and move on
        if (nextRequest.options.bypassLimit) {
            console.debug('Bypassing ratelimit for request:', nextRequest);
            this._sendRequest(nextRequest);
            this._processQueue();
            return;
        }

        // If we have as many in-flight requests as we do remaining ratelimit,
        // we can't do anything right now, but we can try again after the reset
        // (but if the ratelimit reset date has passed, allow sending serial
        // requests to get updated ratelimit information)
        if (this.ratelimitRemaining <= this.requestsInFlight.size && !(Date.now() > this.ratelimitResetDate && this.requestsInFlight.size === 0)) {
            // We store the reset timer's ID; if we've already got one going, we
            // don't create another
            if (this.resetTimerID == null) {
                this.resetTimerID = setTimeout(() => {
                    // Once we're done waiting, we reset the timer and try again
                    this.resetTimerID = null;
                    this._processQueue();
                }, this.ratelimitResetDate - Date.now());
            }
            return;
        }

        // If we were waiting for the limit to reset but we still have requests
        // left in the current limit, stop waiting for the reset - we'll send
        // something now instead
        if (this.resetTimerID != null) {
            clearInterval(this.resetTimerID);
            this.resetTimerID = null;
        }

        // Send the next request
        await this._sendRequest(nextRequest);

        // Try to send another
        this._processQueue();
    }

    /**
     * Sends a request, updating ratelimit information from response headers. If
     * the response is a 429, the request is added to the front of the queue and
     * retried.
     * @param {RatelimiterPendingRequest} request The request to send.
     */
    async _sendRequest (request) {
        // Send the request and add it to the set of in-flight requests
        const requestPromise = fetch(...request.fetchArgs);
        this.requestsInFlight.add(requestPromise);

        // Wait for the response and then remove it from the in-flight set
        let response;
        try {
            response = await requestPromise;
        } catch (error) {
            // If the request rejects, we don't update the ratelimit
            return request.reject(error);
        } finally {
            this.requestsInFlight.delete(requestPromise);
        }

        // Update our information based on response headers
        if (!response.headers.has('x-ratelimit-remaining')) {
            // If the server doesn't report the ratelimit, assume it decreased
            // and will reset at the time we already know
            this.ratelimitRemaining -= 1;
        } else {
            const newRatelimitRemaining = parseInt(response.headers.get('x-ratelimit-remaining'), 10);
            const newRatelimitResetDate = new Date(Date.now() + parseFloat(response.headers.get('x-ratelimit-reset')) * 1000);

            // With parallel requests, we could get responses out of order, so
            // we can't rely on the most recent response we got being the most
            // up-to-date. Instead, we
            if (newRatelimitRemaining < this.ratelimitRemaining || newRatelimitResetDate > this.ratelimitResetDate) {
                this.ratelimitRemaining = newRatelimitRemaining;
            }

            // ratelimit reset date should only get further into the future
            if (newRatelimitResetDate > this.ratelimitResetDate) {
                this.ratelimitResetDate = newRatelimitResetDate;
            }

            console.debug('request completed', {remaining: this.ratelimitRemaining, reset: this.ratelimitResetDate, pending: this.requestsPending.length, inFlight: this.requestsInFlight.size});
        }

        // If the response is a 429, add the request back to the front of the
        // queue and try again, and do not send back the response
        if (response.status === 429) {
            this.requestsPending.unshift(request);
            return;
        }

        // Return the response we got
        request.resolve(response);
    }

    /**
     * Dispatches a tb-ratelimit-info CustomEvent with details about the current
     * ratelimit status in its detail.
     */
    emitInfo () {
        window.dispatchEvent(new CustomEvent('tb-ratelimit-info', {
            detail: {
                reset: this.ratelimitResetDate,
                remaining: this.ratelimitRemaining,
                pending: this.requestsPending.length,
                inFlight: this.requestsInFlight.size,
                waiting: !!this.resetTimerID,
            },
        }));
    }
}
