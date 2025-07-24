/**
 * History Manager - Implements undo/redo with efficient state management
 * Uses command pattern for reversible operations
 */

export class HistoryManager {
    constructor(stateManager, options = {}) {
        this.stateManager = stateManager;
        this.options = {
            maxHistory: 100,
            debounceTime: 300,
            groupActions: true,
            ...options
        };
        
        this.history = [];
        this.currentIndex = -1;
        this.isPerformingAction = false;
        this.actionGroup = null;
        this.debounceTimer = null;
    }

    // Record a state change
    record(action, state = null) {
        if (this.isPerformingAction) return;
        
        const currentState = state || this.stateManager.get();
        const entry = {
            action,
            state: this.cloneState(currentState),
            timestamp: Date.now(),
            group: this.actionGroup
        };
        
        // If we're in the middle of history, remove future entries
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Add to history
        this.history.push(entry);
        this.currentIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > this.options.maxHistory) {
            const overflow = this.history.length - this.options.maxHistory;
            this.history = this.history.slice(overflow);
            this.currentIndex -= overflow;
        }
    }

    // Group multiple actions together
    beginGroup(groupName) {
        this.actionGroup = {
            name: groupName,
            id: Date.now(),
            startIndex: this.currentIndex + 1
        };
    }

    endGroup() {
        if (!this.actionGroup) return;
        
        const group = this.actionGroup;
        this.actionGroup = null;
        
        // Mark all entries in the group
        for (let i = group.startIndex; i <= this.currentIndex; i++) {
            if (this.history[i]) {
                this.history[i].group = group;
            }
        }
    }

    // Undo last action
    undo() {
        if (!this.canUndo()) return false;
        
        this.isPerformingAction = true;
        
        // Find the start of the current group
        let targetIndex = this.currentIndex;
        const currentGroup = this.history[targetIndex]?.group;
        
        if (currentGroup && this.options.groupActions) {
            // Find the first action in the group
            while (targetIndex > 0 && this.history[targetIndex - 1]?.group?.id === currentGroup.id) {
                targetIndex--;
            }
        }
        
        // Apply the state from before the action/group
        const previousEntry = this.history[targetIndex - 1];
        if (previousEntry) {
            this.stateManager.reset(this.cloneState(previousEntry.state));
            this.currentIndex = targetIndex - 1;
        } else {
            // No previous state, reset to initial
            this.stateManager.reset({});
            this.currentIndex = -1;
        }
        
        this.isPerformingAction = false;
        return true;
    }

    // Redo last undone action
    redo() {
        if (!this.canRedo()) return false;
        
        this.isPerformingAction = true;
        
        // Find the end of the next group
        let targetIndex = this.currentIndex + 1;
        const nextGroup = this.history[targetIndex]?.group;
        
        if (nextGroup && this.options.groupActions) {
            // Find the last action in the group
            while (targetIndex < this.history.length - 1 && 
                   this.history[targetIndex + 1]?.group?.id === nextGroup.id) {
                targetIndex++;
            }
        }
        
        // Apply the state
        const entry = this.history[targetIndex];
        this.stateManager.reset(this.cloneState(entry.state));
        this.currentIndex = targetIndex;
        
        this.isPerformingAction = false;
        return true;
    }

    // Check if undo is possible
    canUndo() {
        return this.currentIndex > -1;
    }

    // Check if redo is possible
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    // Get undo/redo information
    getUndoInfo() {
        if (!this.canUndo()) return null;
        
        const entry = this.history[this.currentIndex];
        return {
            action: entry.action,
            timestamp: entry.timestamp,
            group: entry.group
        };
    }

    getRedoInfo() {
        if (!this.canRedo()) return null;
        
        const entry = this.history[this.currentIndex + 1];
        return {
            action: entry.action,
            timestamp: entry.timestamp,
            group: entry.group
        };
    }

    // Clear history
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.actionGroup = null;
    }

    // Get history statistics
    getStats() {
        return {
            totalEntries: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            groups: this.getGroups().length,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    // Get all groups in history
    getGroups() {
        const groups = new Map();
        this.history.forEach(entry => {
            if (entry.group) {
                groups.set(entry.group.id, entry.group);
            }
        });
        return Array.from(groups.values());
    }

    // Estimate memory usage
    estimateMemoryUsage() {
        // Rough estimation based on JSON string length
        const sample = this.history.slice(0, 5);
        const avgSize = sample.reduce((sum, entry) => {
            return sum + JSON.stringify(entry.state).length;
        }, 0) / sample.length;
        
        return Math.round((avgSize * this.history.length) / 1024) + ' KB';
    }

    // Clone state for immutability
    cloneState(state) {
        // Deep clone using structured clone if available
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(state);
            } catch (e) {
                // Fall back to JSON method
            }
        }
        
        // JSON method for deep cloning
        return JSON.parse(JSON.stringify(state));
    }

    // Export history for debugging or persistence
    exportHistory() {
        return {
            version: '1.0',
            history: this.history,
            currentIndex: this.currentIndex,
            timestamp: Date.now()
        };
    }

    // Import history
    importHistory(data) {
        if (data.version !== '1.0') {
            throw new Error('Incompatible history version');
        }
        
        this.history = data.history;
        this.currentIndex = data.currentIndex;
        
        // Apply current state
        if (this.currentIndex >= 0 && this.history[this.currentIndex]) {
            this.stateManager.reset(this.cloneState(this.history[this.currentIndex].state));
        }
    }
} 