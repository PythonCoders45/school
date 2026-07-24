class SeededRandom {
    constructor(seedStr) {
        this.seed = this.hashString(seedStr);
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return Math.abs(this.seed / 233280);
    }

    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

const GRID_SIZE = 100;
const CELL_SIZE = 10;
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = GRID_SIZE * CELL_SIZE;
canvas.height = GRID_SIZE * CELL_SIZE;

const TILE = {
    WALL: 0,
    HALLWAY: 1,
    CLASSROOM: 2,
    FACULTY: 3,
    PRINCIPAL: 4,
    CAFETERIA: 5,
    PLAYGROUND: 6,
    LIBRARY: 7,
    SWEEP_CLOSET: 8,
    REFLEX_CLINIC: 9,
    JOHNNYS_STORE: 10,
    ELEVATOR: 11,
    DOOR: 12
};

const TILE_COLORS = {
    [TILE.WALL]: '#000000',
    [TILE.HALLWAY]: '#d4a373',
    [TILE.CLASSROOM]: '#3b82f6',
    [TILE.FACULTY]: '#8b5cf6',
    [TILE.PRINCIPAL]: '#f59e0b',
    [TILE.CAFETERIA]: '#10b981',
    [TILE.PLAYGROUND]: '#84cc16',
    [TILE.LIBRARY]: '#64748b',
    [TILE.SWEEP_CLOSET]: '#ec4899',
    [TILE.REFLEX_CLINIC]: '#06b6d4',
    [TILE.JOHNNYS_STORE]: '#eab308',
    [TILE.ELEVATOR]: '#ef4444',
    [TILE.DOOR]: '#ffffff'
};

function generateMap() {
    const seedText = document.getElementById('seedInput').value || "BALDI_HUGE_FLOOR";
    const rng = new SeededRandom(seedText);

    let grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(TILE.WALL));
    let hallwayTiles = [];

    // 1. Spawn Elevator Hub
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);

    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            grid[centerY + dy][centerX + dx] = TILE.ELEVATOR;
        }
    }

    // 2. Build Corridor Network
    let hallwayFrontier = [
        { x: centerX, y: centerY - 3, dirX: 0, dirY: -1 },
        { x: centerX, y: centerY + 3, dirX: 0, dirY: 1 },
        { x: centerX - 3, y: centerY, dirX: -1, dirY: 0 },
        { x: centerX + 3, y: centerY, dirX: 1, dirY: 0 }
    ];

    const maxHallways = 70;
    let hallsBuilt = 0;

    while (hallwayFrontier.length > 0 && hallsBuilt < maxHallways) {
        const current = hallwayFrontier.shift();
        const length = rng.range(10, 18);

        let hx = current.x;
        let hy = current.y;

        for (let step = 0; step < length; step++) {
            if (hx <= 5 || hx >= GRID_SIZE - 6 || hy <= 5 || hy >= GRID_SIZE - 6) break;

            if (grid[hy][hx] === TILE.WALL) {
                grid[hy][hx] = TILE.HALLWAY;
                hallwayTiles.push({ x: hx, y: hy });
            }

            // Double-wide corridors
            if (current.dirX !== 0 && hy + 1 < GRID_SIZE - 5 && grid[hy + 1][hx] === TILE.WALL) {
                grid[hy + 1][hx] = TILE.HALLWAY;
                hallwayTiles.push({ x: hx, y: hy + 1 });
            }
            if (current.dirY !== 0 && hx + 1 < GRID_SIZE - 5 && grid[hy][hx + 1] === TILE.WALL) {
                grid[hy][hx + 1] = TILE.HALLWAY;
                hallwayTiles.push({ x: hx + 1, y: hy });
            }

            hx += current.dirX;
            hy += current.dirY;
        }

        hallsBuilt++;
        if (rng.next() < 0.75) {
            const perpX = current.dirY;
            const perpY = current.dirX;
            hallwayFrontier.push({ x: hx, y: hy, dirX: perpX, dirY: perpY });
            if (rng.next() < 0.5) {
                hallwayFrontier.push({ x: hx, y: hy, dirX: -perpX, dirY: -perpY });
            }
        }
    }

    rng.shuffle(hallwayTiles);

    // 3. Special Rooms List
    const specialRooms = [
        { type: TILE.CAFETERIA, w: 8, h: 8 },
        { type: TILE.PLAYGROUND, w: 9, h: 9 },
        { type: TILE.PRINCIPAL, w: 5, h: 5 },
        { type: TILE.LIBRARY, w: 6, h: 6 },
        { type: TILE.SWEEP_CLOSET, w: 4, h: 4 },
        { type: TILE.REFLEX_CLINIC, w: 5, h: 5 },
        { type: TILE.JOHNNYS_STORE, w: 5, h: 5 }
    ];

    for (let room of specialRooms) {
        fastPlaceRoom(grid, hallwayTiles, room.w, room.h, room.type);
    }

    // Fill map with Classrooms & Faculty Rooms
    for (let i = 0; i < 60; i++) {
        const roomType = rng.next() < 0.75 ? TILE.CLASSROOM : TILE.FACULTY;
        const rw = rng.range(5, 7);
        const rh = rng.range(5, 7);
        fastPlaceRoom(grid, hallwayTiles, rw, rh, roomType);
    }

    renderMap(grid);
}

function fastPlaceRoom(grid, hallwayTiles, rw, rh, roomType) {
    for (let tile of hallwayTiles) {
        const offsets = [
            { x: tile.x + 1, y: tile.y },
            { x: tile.x - rw, y: tile.y },
            { x: tile.x, y: tile.y + 1 },
            { x: tile.x, y: tile.y - rh }
        ];

        for (let pos of offsets) {
            if (canPlaceRoom(grid, pos.x, pos.y, rw, rh)) {
                // Stamp room tiles
                for (let y = 0; y < rh; y++) {
                    for (let x = 0; x < rw; x++) {
                        grid[pos.y + y][pos.x + x] = roomType;
                    }
                }

                // Attach Door
                let door = findDoorLocation(grid, pos.x, pos.y, rw, rh);
                if (door) {
                    grid[door.y][door.x] = TILE.DOOR;
                }

                return true;
            }
        }
    }
    return false;
}

function canPlaceRoom(grid, rx, ry, w, h) {
    if (rx < 3 || rx + w >= GRID_SIZE - 3 || ry < 3 || ry + h >= GRID_SIZE - 3) return false;

    // 1. Room interior MUST be empty WALL space
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (grid[ry + y][rx + x] !== TILE.WALL) return false;
        }
    }

    // 2. Padding around room must not overlap other rooms (can touch hallways/walls)
    for (let y = -1; y <= h; y++) {
        for (let x = -1; x <= w; x++) {
            const tile = grid[ry + y][rx + x];
            if (tile !== TILE.WALL && tile !== TILE.HALLWAY && tile !== TILE.ELEVATOR) {
                return false; // Prevents room-on-room overlap
            }
        }
    }

    return true;
}

function findDoorLocation(grid, rx, ry, w, h) {
    for (let x = 0; x < w; x++) {
        if (grid[ry - 1][rx + x] === TILE.HALLWAY) return { x: rx + x, y: ry };
        if (grid[ry + h][rx + x] === TILE.HALLWAY) return { x: rx + x, y: ry + h - 1 };
    }
    for (let y = 0; y < h; y++) {
        if (grid[ry + y][rx - 1] === TILE.HALLWAY) return { x: rx, y: ry + y };
        if (grid[ry + y][rx + w] === TILE.HALLWAY) return { x: rx + w - 1, y: ry + y };
    }
    return null;
}

function renderMap(grid) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = grid[y][x];
            ctx.fillStyle = TILE_COLORS[tile] || '#000000';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            if (tile !== TILE.WALL) {
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function randomSeed() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('seedInput').value = result;
    generateMap();
}

window.onload = generateMap;
