import type { RegionTerra } from "#ctx/region";

const TERRAIN_COLORS: Record<string, string> = {
    超深海: "#0a1a3a",
    深海: "#0d2b5e",
    中海: "#1a4a8a",
    浅海: "#2e6eb5",
    平原: "#7cb342",
    高原: "#a58c5a",
    浅丘: "#8d9e4e",
    深丘: "#6d7a3a",
    低山: "#5d6b3a",
    中山: "#4a5828",
    高山: "#6e6e6e",
};

const PHYSIO_COLORS: Record<"森林" | "草地" | "荒地" | "雪地" | "城镇" | "水域", string> = {
    水域: "#2e6eb5",
    雪地: "#e8eaf0",
    草地: "#8bc34a",
    荒地: "#c4a35a",
    森林: "#2e7d32",
    城镇: "#78909c",
};

const COALITION_PALETTE = [
    "#e53935",
    "#1e88e5",
    "#43a047",
    "#fb8c00",
    "#8e24aa",
    "#00acc1",
    "#f4511e",
    "#3949ab",
    "#7cb342",
    "#c0ca33",
    "#ff7043",
    "#5c6bc0",
    "#26a69a",
    "#ef5350",
    "#42a5f5",
    "#66bb6a",
    "#ffa726",
    "#ab47bc",
    "#26c6da",
    "#ec407a",
];

function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function blendColors(colors: { color: string; weight: number }[]): string {
    let totalWeight = 0;
    let r = 0,
        g = 0,
        b = 0;
    for (const { color, weight } of colors) {
        const [cr, cg, cb] = hexToRgb(color);
        r += cr * weight;
        g += cg * weight;
        b += cb * weight;
        totalWeight += weight;
    }
    if (totalWeight === 0) return "#333333";
    return rgbToHex(
        Math.round(r / totalWeight),
        Math.round(g / totalWeight),
        Math.round(b / totalWeight),
    );
}

export function 计算格子底色(地形: string, 地貌: RegionTerra): string {
    if (地貌.是否为海洋) {
        return TERRAIN_COLORS[地形] ?? "#1a4a8a";
    }

    const entries: { color: string; weight: number }[] = [];
    if (地貌.森林 > 0) entries.push({ color: PHYSIO_COLORS.森林, weight: 地貌.森林 });
    if (地貌.草地 > 0) entries.push({ color: PHYSIO_COLORS.草地, weight: 地貌.草地 });
    if (地貌.荒地 > 0) entries.push({ color: PHYSIO_COLORS.荒地, weight: 地貌.荒地 });
    if (地貌.雪地 > 0) entries.push({ color: PHYSIO_COLORS.雪地, weight: 地貌.雪地 });
    if (地貌.城镇 > 0) entries.push({ color: PHYSIO_COLORS.城镇, weight: 地貌.城镇 });
    if (地貌.水域 > 0) entries.push({ color: PHYSIO_COLORS.水域, weight: 地貌.水域 });

    if (entries.length === 0) {
        return TERRAIN_COLORS[地形] ?? "#7cb342";
    }

    const baseColor = blendColors(entries);

    const terrainTint = TERRAIN_COLORS[地形] ?? "#7cb342";
    const [br, bg, bb] = hexToRgb(baseColor);
    const [tr, tg, tb] = hexToRgb(terrainTint);
    const tintStrength = 0.25;
    return rgbToHex(
        Math.round(br * (1 - tintStrength) + tr * tintStrength),
        Math.round(bg * (1 - tintStrength) + tg * tintStrength),
        Math.round(bb * (1 - tintStrength) + tb * tintStrength),
    );
}

export function 创建势力配色器(): (owner: string) => string {
    const ownerColorMap = new Map<string, string>();
    let colorIndex = 0;
    return (owner: string) => {
        if (!ownerColorMap.has(owner)) {
            ownerColorMap.set(
                owner,
                COALITION_PALETTE[colorIndex % COALITION_PALETTE.length] ?? "#666666",
            );
            colorIndex++;
        }
        return ownerColorMap.get(owner) as string;
    };
}
