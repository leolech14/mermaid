/**
 * State Manager - Immutable state management with event emission
 * Implements the single source of truth pattern
 */

export class StateManager {
    constructor(initialState = {}) {
        this.state = this.deepFreeze(initialState);
        this.listeners = new Map();
        this.middlewares = [];
    }

    // Get current state (immutable)
    get() {
        return this.state;
    }

    // Update state immutably
    update(updater) {
        const prevState = this.state;
        const nextState = typeof updater === 'function' 
            ? updater(prevState) 
            : { ...prevState, ...updater };
        
        // Apply middlewares
        const finalState = this.applyMiddlewares(prevState, nextState);
        
        // Only update if state actually changed
        if (finalState !== prevState) {
            this.state = this.deepFreeze(finalState);
            this.notifyListeners(prevState, this.state);
        }
        
        return this.state;
    }

    // Subscribe to state changes
    subscribe(path, listener) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(listener);
        
        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(path);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }

    // Add middleware for state transformations
    use(middleware) {
        this.middlewares.push(middleware);
    }

    // Get value at path
    getPath(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    // Private methods
    applyMiddlewares(prevState, nextState) {
        return this.middlewares.reduce(
            (state, middleware) => middleware(prevState, state),
            nextState
        );
    }

    notifyListeners(prevState, nextState) {
        // Notify global listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(listener => {
                listener(nextState, prevState);
            });
        }
        
        // Notify path-specific listeners
        this.listeners.forEach((listeners, path) => {
            if (path === '*') return;
            
            const prevValue = this.getPath(path);
            const nextValue = path.split('.').reduce((obj, key) => obj?.[key], nextState);
            
            if (prevValue !== nextValue) {
                listeners.forEach(listener => {
                    listener(nextValue, prevValue, nextState, prevState);
                });
            }
        });
    }

    deepFreeze(obj) {
        // Only freeze in development for performance
        // In browser, we'll check for localhost
        const isProduction = typeof window !== 'undefined' && 
                           !window.location.hostname.includes('localhost') && 
                           !window.location.hostname.includes('127.0.0.1');
        
        if (isProduction) {
            return obj;
        }
        
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach(prop => {
            if (obj[prop] !== null 
                && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
                && !Object.isFrozen(obj[prop])) {
                this.deepFreeze(obj[prop]);
            }
        });
        
        return obj;
    }

    // Utility methods
    reset(newState = {}) {
        this.state = this.deepFreeze(newState);
        this.notifyListeners({}, this.state);
    }

    toJSON() {
        return JSON.stringify(this.state, null, 2);
    }

    fromJSON(json) {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        this.reset(data);
    }
} 