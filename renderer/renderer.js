export class MapRenderer {
    constructor(canvasId, cellSize = 12) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = cellSize;
        this.textures = {};
        this.texturesLoaded = false;
    }

    // 1. Load PNG Textures
    async loadTextures(textureMap) {
        const loadPromises = Object.entries(textureMap).map(([key, src]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    this.textures[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load texture: ${src}. Falling back to color fill.`);
                    resolve(); // Fallback gracefully if image is missing
                };
            });
        });

        await Promise.all(loadPromises);
        this.texturesLoaded = true;
    }

    // 2. Render Map Grid with Wall PNGs
    renderGrid(grid, tileTextureMap) {
        const rows = grid.length;
        const cols = grid[0].length;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const tileType = grid[y][x];
                const textureKey = tileTextureMap[tileType];
                const texture = this.textures[textureKey];

                const px = x * this.cellSize;
                const py = y * this.cellSize;

                if (texture) {
                    // Draw image texture
                    this.ctx.drawImage(texture, px, py, this.cellSize, this.cellSize);
                } else {
                    // Default fallback fill if texture PNG isn't loaded yet
                    this.ctx.fillStyle = tileType === 0 ? '#000000' : '#d4a373';
                    this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
                }

                // Grid outlines
                if (tileType !== 0) {
                    this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                    this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                }
            }
        }
    }

    // 3. Render Billboard Sprites (Items/Characters always facing player)
    renderBillboardSprite(spriteKey, gridX, gridY, playerAngle = 0) {
        const texture = this.textures[spriteKey];
        if (!texture) return;

        const screenX = gridX * this.cellSize + this.cellSize / 2;
        const screenY = gridY * this.cellSize + this.cellSize / 2;

        this.ctx.save();
        this.ctx.translate(screenX, screenY);
        
        // Counter-rotate sprite matrix to always face the player/camera view
        this.ctx.rotate(playerAngle);

        // Draw centered billboard image
        this.ctx.drawImage(
            texture,
            -this.cellSize / 2,
            -this.cellSize / 2,
            this.cellSize,
            this.cellSize
        );

        this.ctx.restore();
    }
}
