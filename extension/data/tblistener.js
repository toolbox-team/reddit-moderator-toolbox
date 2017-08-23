(function() {
    const requestAnimationFrame = window.requestAnimationFrame
                                    || window.webkitRequestAnimationFrame
                                    || window.mozRequestAnimationFrame
                                    || window.msRequestAnimationFrame
                                    || function(cb) { return setTimeout(cb, 16); };
    const listenerAliases = {
        'postAuthor': ['author']
    };

    function runTasks(tasks) {
        console.log('run tasks');
        let task; while (task = tasks.shift()) task();
    }

    function remove(array, item) {
        const index = array.indexOf(item);
        return !!~index && !!array.splice(index, 1);
    }

    class TBListener {
        constructor() {
            this.queue = [];
            this.boundFunc = this.listener.bind(this);
            this.started = false;
            this.listeners = {};
            this.scheduled = false;
            this.debugFunc = null;
        }

        start() {
            if (!this.started) {
                document.addEventListener('reddit', this.boundFunc, true);
                this.started = true;
            }
        }

        stop() {
            if (this.started) {
                document.removeEventListener('reddit', this.boundFunc);
                this.started = false;
            }
        }

        on(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }

            this.listeners[event].push(callback);
        }

        listener(event) {
            const eventType = event.detail.type;

            if (Array.isArray(this.listeners[eventType])) {
                for (let listener of this.listeners[eventType]) {
                    this.queue.push(listener.bind(event.target, event));
                }
            }

            if (Array.isArray(listenerAliases[eventType])) {
                for (let alias of listenerAliases[eventType]) {
                    if (Array.isArray(this.listeners[alias])) {
                        for (let listener of this.listeners[alias]) {
                            this.queue.push(listener.bind(event.target, event));
                        }
                    }
                }
            }

            if (this.debugFunc) {
                this.queue.push(this.debugFunc.bind(event.target, event));
            }

            this.scheduleFlush();
        }

        clear(task) {
            return remove(this.queue, task);
        }

        scheduleFlush() {
            if (!this.scheduled) {
                this.scheduled = true;
                requestAnimationFrame(this.flush.bind(this));
            }
        }

        flush() {
            const queue = this.queue;
            let error;

            try {
                runTasks(queue);
            } catch (e) { error = e; }

            this.scheduled = false;

            // If the batch errored we may still have tasks queued
            if (queue.length) {
                this.scheduleFlush();
            }

            if (error) {
                console.error('task errored', error.message);
                if (this.catch) this.catch(error);
                else throw error;
            }
        }

    }

    window.TBListener = new TBListener();
    window.TBListener.start();
    const loadedEvent = new CustomEvent('TBListenerLoaded');
    const readyEvent = new Event('reddit.ready');
    document.dispatchEvent(loadedEvent);
    document.dispatchEvent(readyEvent);
})();
