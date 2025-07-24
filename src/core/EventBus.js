/**
 * Event Bus - Central event system for component communication
 * Implements event-driven architecture with performance monitoring
 */

export class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.eventStats = new Map();
        this.debug = false;
    }

    // Emit an event
    emit(event, data = {}) {
        const timestamp = performance.now();
        
        // Track event statistics
        this.trackEvent(event, timestamp);
        
        // Execute regular listeners
        if (this.events.has(event)) {
            const listeners = Array.from(this.events.get(event));
            listeners.forEach(listener => {
                try {
                    listener(data, { event, timestamp });
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        // Execute once listeners and remove them
        if (this.onceEvents.has(event)) {
            const onceListeners = Array.from(this.onceEvents.get(event));
            this.onceEvents.delete(event);
            onceListeners.forEach(listener => {
                try {
                    listener(data, { event, timestamp });
                } catch (error) {
                    console.error(`Error in once listener for ${event}:`, error);
                }
            });
        }
        
        if (this.debug) {
            console.log(`[EventBus] ${event}`, data);
        }
        
        return this;
    }

    // Subscribe to an event
    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(listener);
        
        // Return unsubscribe function
        return () => this.off(event, listener);
    }

    // Subscribe to an event once
    once(event, listener) {
        if (!this.onceEvents.has(event)) {
            this.onceEvents.set(event, new Set());
        }
        this.onceEvents.get(event).add(listener);
        
        // Return unsubscribe function
        return () => {
            if (this.onceEvents.has(event)) {
                this.onceEvents.get(event).delete(listener);
            }
        };
    }

    // Unsubscribe from an event
    off(event, listener) {
        if (this.events.has(event)) {
            this.events.get(event).delete(listener);
            if (this.events.get(event).size === 0) {
                this.events.delete(event);
            }
        }
        return this;
    }

    // Remove all listeners for an event
    removeAllListeners(event = null) {
        if (event) {
            this.events.delete(event);
            this.onceEvents.delete(event);
        } else {
            this.events.clear();
            this.onceEvents.clear();
        }
        return this;
    }

    // Wait for an event (returns Promise)
    waitFor(event, timeout = null) {
        return new Promise((resolve, reject) => {
            const unsubscribe = this.once(event, (data) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(data);
            });
            
            let timeoutId = null;
            if (timeout) {
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    reject(new Error(`Event ${event} timed out after ${timeout}ms`));
                }, timeout);
            }
        });
    }

    // Create a filtered event stream
    filter(event, predicate) {
        const filteredBus = new EventBus();
        
        this.on(event, (data, meta) => {
            if (predicate(data, meta)) {
                filteredBus.emit(event, data);
            }
        });
        
        return filteredBus;
    }

    // Pipe events to another bus
    pipe(targetBus, events = null) {
        const eventsToPipe = events || Array.from(this.events.keys());
        
        eventsToPipe.forEach(event => {
            this.on(event, (data, meta) => {
                targetBus.emit(event, data);
            });
        });
        
        return this;
    }

    // Track event statistics
    trackEvent(event, timestamp) {
        if (!this.eventStats.has(event)) {
            this.eventStats.set(event, {
                count: 0,
                firstEmit: timestamp,
                lastEmit: timestamp,
                totalListeners: 0
            });
        }
        
        const stats = this.eventStats.get(event);
        stats.count++;
        stats.lastEmit = timestamp;
        stats.totalListeners = (this.events.get(event)?.size || 0) + 
                              (this.onceEvents.get(event)?.size || 0);
    }

    // Get event statistics
    getStats(event = null) {
        if (event) {
            return this.eventStats.get(event) || null;
        }
        
        const allStats = {};
        this.eventStats.forEach((stats, event) => {
            allStats[event] = { ...stats };
        });
        return allStats;
    }

    // Enable debug mode
    setDebug(enabled) {
        this.debug = enabled;
        return this;
    }

    // Create a namespace
    namespace(name) {
        const namespacedBus = new EventBus();
        
        // Override emit to prefix events
        const originalEmit = namespacedBus.emit.bind(namespacedBus);
        namespacedBus.emit = (event, data) => {
            return originalEmit(`${name}:${event}`, data);
        };
        
        // Override on to prefix events
        const originalOn = namespacedBus.on.bind(namespacedBus);
        namespacedBus.on = (event, listener) => {
            return originalOn(`${name}:${event}`, listener);
        };
        
        // Override once to prefix events
        const originalOnce = namespacedBus.once.bind(namespacedBus);
        namespacedBus.once = (event, listener) => {
            return originalOnce(`${name}:${event}`, listener);
        };
        
        return namespacedBus;
    }

    // Utility method to list all active events
    listEvents() {
        const regularEvents = Array.from(this.events.keys());
        const onceEvents = Array.from(this.onceEvents.keys());
        return [...new Set([...regularEvents, ...onceEvents])];
    }
} 