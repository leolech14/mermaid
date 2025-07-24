/**
 * Pixel Perfect Renderer - Handles sub-pixel rendering issues
 * Stub implementation for V2
 */

export class PixelPerfectRenderer {
    constructor() {
        this.dpr = window.devicePixelRatio || 1;
    }

    // Snap coordinate to pixel grid
    snapToPixel(value) {
        return Math.round(value);
    }

    // Snap rectangle to pixel grid
    snapRectToPixel(rect) {
        return {
            x: this.snapToPixel(rect.x),
            y: this.snapToPixel(rect.y),
            width: this.snapToPixel(rect.width),
            height: this.snapToPixel(rect.height)
        };
    }

    // Get pixel-perfect line width
    getLineWidth(baseWidth) {
        return Math.max(1, Math.round(baseWidth * this.dpr)) / this.dpr;
    }

    // Prepare canvas for pixel-perfect rendering
    prepareCanvas(canvas, ctx) {
        // Apply pixel-perfect settings
        ctx.imageSmoothingEnabled = false;
        ctx.translate(0.5, 0.5); // Offset for crisp lines
    }

    // Clear sub-pixel artifacts
    clearArtifacts(ctx, rect) {
        const snapped = this.snapRectToPixel(rect);
        ctx.clearRect(snapped.x - 1, snapped.y - 1, snapped.width + 2, snapped.height + 2);
    }
} 