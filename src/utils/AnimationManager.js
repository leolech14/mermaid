/**
 * Animation Manager - Handles all animations with performance optimization
 * Respects user preferences and maintains 60fps target
 */

export class AnimationManager {
    constructor(options = {}) {
        this.options = {
            targetFPS: 60,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            ...options
        };
        
        this.animations = new Map();
        this.running = false;
        this.frameTime = 1000 / this.options.targetFPS;
        this.lastFrame = 0;
        
        // Bind animation loop
        this.tick = this.tick.bind(this);
        
        // Listen for reduced motion changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.options.reducedMotion = e.matches;
        });
    }
    
    // Update method called by the render loop
    update(deltaTime) {
        if (this.options.reducedMotion || this.animations.size === 0) {
            return;
        }
        
        const now = performance.now();
        const toRemove = [];
        
        this.animations.forEach((animation, id) => {
            const elapsed = now - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            // Apply easing
            const easedProgress = animation.easing(progress);
            
            // Update properties
            animation.properties.forEach(prop => {
                const current = prop.from + (prop.to - prop.from) * easedProgress;
                if (prop.apply) {
                    prop.apply(current);
                }
            });
            
            // Check if complete
            if (progress >= 1) {
                toRemove.push(id);
                if (animation.resolve) {
                    animation.resolve();
                }
            }
        });
        
        // Remove completed animations
        toRemove.forEach(id => this.animations.delete(id));
    }

    // Animate a property or set of properties
    animate(id, properties, duration = 300, easing = 'ease-in-out') {
        if (this.options.reducedMotion) {
            // Skip animation in reduced motion mode
            return Promise.resolve();
        }
        
        // Cancel existing animation with same ID
        if (this.animations.has(id)) {
            this.cancelAnimation(id);
        }
        
        const animation = {
            id,
            properties: this.normalizeProperties(properties),
            duration,
            easing: this.getEasingFunction(easing),
            startTime: performance.now(),
            resolve: null,
            reject: null
        };
        
        // Create promise for animation completion
        const promise = new Promise((resolve, reject) => {
            animation.resolve = resolve;
            animation.reject = reject;
        });
        
        this.animations.set(id, animation);
        
        // Start animation loop if not running
        if (!this.running) {
            this.start();
        }
        
        return promise;
    }

    // Spring animation for natural physics
    spring(id, properties, config = {}) {
        const springConfig = {
            stiffness: 170,
            damping: 26,
            mass: 1,
            ...config
        };
        
        if (this.options.reducedMotion) {
            return Promise.resolve();
        }
        
        const animation = {
            id,
            type: 'spring',
            properties: this.normalizeProperties(properties),
            config: springConfig,
            velocity: {},
            startTime: performance.now(),
            resolve: null,
            reject: null
        };
        
        // Initialize velocity for each property
        Object.keys(animation.properties).forEach(key => {
            animation.velocity[key] = 0;
        });
        
        const promise = new Promise((resolve, reject) => {
            animation.resolve = resolve;
            animation.reject = reject;
        });
        
        this.animations.set(id, animation);
        
        if (!this.running) {
            this.start();
        }
        
        return promise;
    }

    // Sequence multiple animations
    sequence(animations) {
        return animations.reduce((promise, { id, properties, duration, easing }) => {
            return promise.then(() => this.animate(id, properties, duration, easing));
        }, Promise.resolve());
    }

    // Parallel animations
    parallel(animations) {
        return Promise.all(
            animations.map(({ id, properties, duration, easing }) => 
                this.animate(id, properties, duration, easing)
            )
        );
    }

    // Stagger animations
    stagger(animations, delay = 50) {
        return Promise.all(
            animations.map(({ id, properties, duration, easing }, index) => 
                new Promise(resolve => {
                    setTimeout(() => {
                        this.animate(id, properties, duration, easing).then(resolve);
                    }, index * delay);
                })
            )
        );
    }

    // Animation loop
    tick(timestamp) {
        if (!this.running) return;
        
        // Frame rate limiting
        if (timestamp - this.lastFrame < this.frameTime) {
            requestAnimationFrame(this.tick);
            return;
        }
        
        this.lastFrame = timestamp;
        const completed = [];
        
        // Update all animations
        this.animations.forEach((animation, id) => {
            if (animation.type === 'spring') {
                if (this.updateSpringAnimation(animation, timestamp)) {
                    completed.push(id);
                }
            } else {
                if (this.updateAnimation(animation, timestamp)) {
                    completed.push(id);
                }
            }
        });
        
        // Remove completed animations
        completed.forEach(id => {
            const animation = this.animations.get(id);
            if (animation.resolve) {
                animation.resolve();
            }
            this.animations.delete(id);
        });
        
        // Continue loop if animations remain
        if (this.animations.size > 0) {
            requestAnimationFrame(this.tick);
        } else {
            this.running = false;
        }
    }

    // Update standard animation
    updateAnimation(animation, timestamp) {
        const elapsed = timestamp - animation.startTime;
        const progress = Math.min(elapsed / animation.duration, 1);
        const easedProgress = animation.easing(progress);
        
        // Update each property
        Object.keys(animation.properties).forEach(key => {
            const { from, to, unit = '', callback } = animation.properties[key];
            const value = from + (to - from) * easedProgress;
            
            if (callback) {
                callback(value, unit, easedProgress);
            }
        });
        
        return progress >= 1;
    }

    // Update spring animation
    updateSpringAnimation(animation, timestamp) {
        const { stiffness, damping, mass } = animation.config;
        const dt = Math.min((timestamp - animation.lastTime) / 1000, 0.064); // Cap at ~15fps min
        animation.lastTime = timestamp;
        
        let allSettled = true;
        
        Object.keys(animation.properties).forEach(key => {
            const { from, to, unit = '', callback } = animation.properties[key];
            const displacement = to - from;
            
            // Spring physics
            const springForce = -stiffness * displacement;
            const dampingForce = -damping * animation.velocity[key];
            const acceleration = (springForce + dampingForce) / mass;
            
            animation.velocity[key] += acceleration * dt;
            const newDisplacement = displacement + animation.velocity[key] * dt;
            const value = to - newDisplacement;
            
            if (callback) {
                callback(value, unit, 1 - Math.abs(newDisplacement / (to - from)));
            }
            
            // Check if settled (velocity and displacement near zero)
            if (Math.abs(animation.velocity[key]) > 0.01 || Math.abs(newDisplacement) > 0.01) {
                allSettled = false;
            }
        });
        
        return allSettled;
    }

    // Normalize properties to consistent format
    normalizeProperties(properties) {
        const normalized = {};
        
        Object.keys(properties).forEach(key => {
            const value = properties[key];
            
            if (Array.isArray(value)) {
                normalized[key] = {
                    from: value[0],
                    to: value[1],
                    unit: value[2] || ''
                };
            } else if (typeof value === 'object') {
                normalized[key] = value;
            } else {
                console.warn(`Invalid animation property format for ${key}`);
            }
        });
        
        return normalized;
    }

    // Get easing function
    getEasingFunction(easing) {
        if (typeof easing === 'function') {
            return easing;
        }
        
        const easingFunctions = {
            'linear': t => t,
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            'cubic-bezier(0.4, 0, 0.2, 1)': t => this.cubicBezier(0.4, 0, 0.2, 1, t),
            'cubic-bezier(0.34, 1.56, 0.64, 1)': t => this.cubicBezier(0.34, 1.56, 0.64, 1, t)
        };
        
        return easingFunctions[easing] || easingFunctions['ease-in-out'];
    }

    // Cubic bezier calculation
    cubicBezier(p1x, p1y, p2x, p2y, t) {
        // Simplified cubic bezier for common cases
        // For production, use a proper implementation
        const cx = 3 * p1x;
        const bx = 3 * (p2x - p1x) - cx;
        const ax = 1 - cx - bx;
        
        const cy = 3 * p1y;
        const by = 3 * (p2y - p1y) - cy;
        const ay = 1 - cy - by;
        
        let t2 = t;
        for (let i = 0; i < 5; i++) {
            const x = ((ax * t2 + bx) * t2 + cx) * t2;
            if (Math.abs(x - t) < 0.001) break;
            const dx = (3 * ax * t2 + 2 * bx) * t2 + cx;
            t2 -= (x - t) / dx;
        }
        
        return ((ay * t2 + by) * t2 + cy) * t2;
    }

    // Start animation loop
    start() {
        if (!this.running) {
            this.running = true;
            this.lastFrame = performance.now();
            requestAnimationFrame(this.tick);
        }
    }

    // Stop animation loop
    stop() {
        this.running = false;
    }

    // Cancel specific animation
    cancelAnimation(id) {
        const animation = this.animations.get(id);
        if (animation && animation.reject) {
            animation.reject(new Error('Animation cancelled'));
        }
        this.animations.delete(id);
    }

    // Cancel all animations
    cancelAll() {
        this.animations.forEach((animation, id) => {
            if (animation.reject) {
                animation.reject(new Error('Animation cancelled'));
            }
        });
        this.animations.clear();
        this.stop();
    }

    // Update options
    setOptions(options) {
        Object.assign(this.options, options);
        this.frameTime = 1000 / this.options.targetFPS;
    }

    // Get animation statistics
    getStats() {
        return {
            activeAnimations: this.animations.size,
            running: this.running,
            reducedMotion: this.options.reducedMotion,
            targetFPS: this.options.targetFPS
        };
    }

    // Destroy manager
    destroy() {
        this.cancelAll();
        this.animations.clear();
    }
} 