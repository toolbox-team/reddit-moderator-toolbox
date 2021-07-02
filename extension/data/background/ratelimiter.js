'use strict';

/**
 * Ratelimit handler supporting parallel in-flight requests.
 */
class Ratelimiter { // eslint-disable-line no-unused-vars
    constructor () {
        /** Array of data for pending requests. */
        this.requestsPending = [];
        /** Set of promises for in-flight requests. */
        this.requestsInFlight = new Set();

        /** The number of requests that can be sent before the limit resets */
        this.ratelimitRemaining = 0;
        /** When the limit will be reset */
        this.ratelimitResetDate = new Date();
        /** ID of the timer currently waiting for the ratelimit reset, if any */
        this.resetTimerID = null;
    }

    /**
     * Queues a request.
     * @param  {...any} fetchArgs Arguments to fetch()
     */
    request (...fetchArgs) {
        return new Promise((resolve, reject) => {
            this.requestsPending.push([fetchArgs, resolve, reject]);
            this._processQueue();
        });
    }

    /**
     * Recursively sends all queued requests.
     */
    async _processQueue () {
        // If there are no queued requests, there's nothing to do
        if (this.requestsPending.length <= 0) {
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

        // Shift the next request off the queue and send it
        await this._sendRequest(...this.requestsPending.shift());

        // Try another
        return this._processQueue();
    }

    /**
     * Sends a request, updating ratelimit information from response headers. If
     * the response is a 429, the request is added to the front of the queue and
     * retried.
     * @param {any[]} fetchArgs Arguments to fetch()
     * @param {Function} resolve Function called when the request completes
     * @param {Function} reject Function called if the request throws an error
     */
    async _sendRequest (fetchArgs, resolve, reject) {
        // Send the request and add it to the set of in-flight requests
        const requestPromise = fetch(...fetchArgs);
        this.requestsInFlight.add(requestPromise);

        // Wait for the response and then remove it from the in-flight set
        let response;
        try {
            response = await requestPromise;
        } catch (error) {
            // If the request rejects, we don't update the ratelimit
            return reject(error);
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
            this.requestsPending.unshift([fetchArgs, resolve, reject]);
            return;
        }

        // Return the response we got
        resolve(response);
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
