// catalog.mjs
// Model names + cost tables mirrored from the app so generated designs can be
// costed and raid-analysed offline.
//
//   build costs  -> src/components/script/BuildCalculator.tsx
//   raid  costs  -> src/components/script/RaidCalculator.tsx
//   model names  -> src/components/script/ObjectList.tsx

export const MATERIALS = ["Stone", "Metal", "Armored"];

// ── build cost (resource per placed object) ───────────────────────────────────

export const STONE_COST = {
  StoneFoundationSquareHigh: 300, StoneFoundationSquareMid: 300, StoneFoundationSquareLow: 300,
  StoneWallHigh: 300, StoneWallMid: 300, StoneRoofWallLeft: 300, StoneRoofWallRight: 300,
  StoneStairsLShape: 300, StoneStairsUShape: 300, StoneDoorway: 210, StoneWindow: 210,
  StoneFoundationTriangleHigh: 150, StoneFoundationTriangleMid: 150, StoneFoundationTriangleLow: 150,
  StoneWallLow: 150, StoneWallFrame: 150, StoneFloorFrameSquare: 150, StoneFloorSquare: 150,
  StoneRoofSquare: 150, StoneRoofTriangle: 150, StoneFloorFrameTriangle: 75, StoneFloorTriangle: 75,
};

export const METAL_COST = {
  GarageDoor: 300,
  MetalFoundationSquareHigh: 200, MetalFoundationSquareMid: 200, MetalFoundationSquareLow: 200,
  MetalWallHigh: 200, MetalWallMid: 200, MetalRoofWallLeft: 200, MetalRoofWallRight: 200,
  MetalStairsUShape: 200, MetalStairsLShape: 200, MetalDoor: 150, MetalDoorway: 140, MetalWindow: 140,
  MetalFoundationTriangleHigh: 100, MetalFoundationTriangleMid: 100, MetalFoundationTriangleLow: 100,
  MetalWallLow: 100, MetalWallFrame: 100, MetalFloorFrameSquare: 100, MetalFloorSquare: 100,
  MetalVerticalEmbrasure: 100, MetalRoofSquare: 100, MetalRoofTriangle: 100,
  MetalFloorFrameTriangle: 50, MetalFloorTriangle: 50, StrenghtenedGlassWindow: 50,
};

export const HQM_COST = {
  ArmoredFoundationSquareHigh: 25, ArmoredFoundationSquareMid: 25, ArmoredFoundationSquareLow: 25,
  ArmoredWallHigh: 25, ArmoredWallMid: 25, ArmoredRoofWallLeft: 25, ArmoredRoofWallRight: 25,
  ArmoredStairsLShape: 25, ArmoredStairsUShape: 25, ArmoredDoorway: 18, ArmoredWindow: 18,
  ArmoredFoundationTriangleHigh: 13, ArmoredFoundationTriangleMid: 13, ArmoredFoundationTriangleLow: 13,
  ArmoredWallLow: 13, ArmoredFloorFrameSquare: 13, ArmoredWallFrame: 13, ArmoredFloorSquare: 13,
  ArmoredRoofSquare: 13, ArmoredRoofTriangle: 13, ArmoredFloorFrameTriangle: 7, ArmoredFloorTriangle: 7,
};

// wood burnt getting each piece from twig -> wood before it can be upgraded
export const TWIG_WOOD_COST = {
  StoneFoundationSquareHigh: 50, StoneFoundationSquareMid: 50, StoneFoundationSquareLow: 50,
  StoneWallHigh: 50, StoneWallMid: 50, StoneRoofWallLeft: 50, StoneRoofWallRight: 50,
  StoneStairsLShape: 50, StoneStairsUShape: 50,
  MetalFoundationSquareHigh: 50, MetalFoundationSquareMid: 50, MetalFoundationSquareLow: 50,
  MetalStairsLShape: 50, MetalStairsUShape: 50, MetalWallHigh: 50, MetalWallMid: 50,
  MetalRoofWallLeft: 50, MetalRoofWallRight: 50,
  ArmoredFoundationSquareHigh: 50, ArmoredFoundationSquareMid: 50, ArmoredFoundationSquareLow: 50,
  ArmoredWallHigh: 50, ArmoredWallMid: 50, ArmoredRoofWallLeft: 50, ArmoredRoofWallRight: 50,
  ArmoredStairsLShape: 50, ArmoredStairsUShape: 50,
  StoneDoorway: 35, MetalDoorway: 35, StoneWindow: 35, MetalWindow: 35, ArmoredDoorway: 35, ArmoredWindow: 35,
  StoneFoundationTriangleHigh: 25, StoneFoundationTriangleMid: 25, StoneFoundationTriangleLow: 25,
  StoneWallLow: 25, StoneFloorSquare: 25, StoneWallFrame: 25, StoneFloorFrameSquare: 25,
  StoneFloorFrameTriangle: 25, StoneRoofSquare: 25, StoneRoofTriangle: 25,
  MetalFoundationTriangleHigh: 25, MetalFoundationTriangleMid: 25, MetalFoundationTriangleLow: 25,
  MetalWallLow: 25, MetalFloorSquare: 25, MetalWallFrame: 25, MetalFloorFrameSquare: 25,
  MetalFloorFrameTriangle: 25, MetalRoofSquare: 25, MetalRoofTriangle: 25,
  ArmoredFoundationTriangleHigh: 25, ArmoredFoundationTriangleMid: 25, ArmoredFoundationTriangleLow: 25,
  ArmoredWallLow: 25, ArmoredWallFrame: 25, ArmoredFloorFrameSquare: 25, ArmoredFloorFrameTriangle: 25,
  ArmoredFloorSquare: 25, ArmoredRoofSquare: 25, ArmoredRoofTriangle: 25,
  StoneFloorTriangle: 13, MetalFloorTriangle: 13, ArmoredFloorTriangle: 13,
};

// deployables (only counted when "count miscs" is enabled in the app)
export const MISC_COST = {
  ToolCupboard:   { wood: 1000 },
  LargeWoodBox:   { wood: 350, metal: 50 },   // 250 + 100 wood, 50 frags
  WoodStorageBox: { wood: 0 },                // 100 wood in game; app charges none
  Furnace:        { wood: 100, stone: 200, lqfuel: 50 },
  WorkbenchT3:    { metal: 1000, hqm: 100, scrap: 1250 },
  SleepingBag:    { cloth: 30 },
  GarageDoorGear: { gear: 2 },
};

// Deployable footprints, measured off the shipped .glb bounds:
//   [ width along the wall, depth away from it ]. The app's models are a little
//   oversized against the 2-unit foundation, which is why a 1x1 room here fits
//   one large box per wall where the game fits two.
export const PROP_FOOTPRINT = {
  LargeWoodBox: [1.26, 0.68], WoodStorageBox: [0.65, 0.5], Furnace: [0.7, 0.71],
  WorkbenchT3: [1.44, 0.64], ToolCupboard: [0.71, 0.55], SleepingBag: [1.41, 0.72],
};

/** Distance from a cell centre that puts a deployable flush against the wall. */
export const propDepth = (model) => +(1 - (PROP_FOOTPRINT[model] || [0.6, 0.6])[1] / 2).toFixed(3);
export const propWidth = (model) => (PROP_FOOTPRINT[model] || [0.6, 0.6])[0];

// ── raid cost (explosives to destroy one object) ──────────────────────────────

const R = (models, rockets, c4, satchels) => models.map((m) => [m, { rockets, c4, satchels }]);

const TIERS = [
  ...R(["MetalDoor"], 2, 1, 4),
  ...R(["GarageDoor", "StrenghtenedGlassWindow"], 3, 2, 9),
  ...R([
    "StoneFoundationSquareHigh", "StoneFoundationSquareMid", "StoneFoundationSquareLow",
    "StoneFoundationTriangleHigh", "StoneFoundationTriangleMid", "StoneFoundationTriangleLow",
    "StoneWallHigh", "StoneWallMid", "StoneWallLow", "StoneRoofWallLeft", "StoneRoofWallRight",
    "StoneDoorway", "StoneWindow", "StoneStairsLShape", "StoneStairsUShape", "StoneWallFrame",
    "StoneFloorSquare", "StoneFloorTriangle", "StoneFloorFrameSquare", "StoneFloorFrameTriangle",
    "MetalVerticalEmbrasure", "StoneRoofSquare", "StoneRoofTriangle",
  ], 4, 2, 10),
  ...R([
    "MetalFoundationSquareHigh", "MetalFoundationSquareMid", "MetalFoundationSquareLow",
    "MetalFoundationTriangleHigh", "MetalFoundationTriangleMid", "MetalFoundationTriangleLow",
    "MetalWallHigh", "MetalWallMid", "MetalWallLow", "MetalRoofWallLeft", "MetalRoofWallRight",
    "MetalDoorway", "MetalWindow", "MetalStairsLShape", "MetalStairsUShape", "MetalWallFrame",
    "MetalFloorSquare", "MetalFloorTriangle", "MetalFloorFrameSquare", "MetalFloorFrameTriangle",
    "MetalRoofSquare", "MetalRoofTriangle",
  ], 8, 4, 23),
  ...R([
    "ArmoredFoundationSquareHigh", "ArmoredFoundationSquareMid", "ArmoredFoundationSquareLow",
    "ArmoredFoundationTriangleHigh", "ArmoredFoundationTriangleMid", "ArmoredFoundationTriangleLow",
    "ArmoredWallHigh", "ArmoredWallMid", "ArmoredWallLow", "ArmoredRoofWallLeft", "ArmoredRoofWallRight",
    "ArmoredDoorway", "ArmoredWindow", "ArmoredWallFrame", "ArmoredFloorFrameSquare",
    "ArmoredFloorFrameTriangle", "ArmoredFloorSquare", "ArmoredFloorTriangle",
    "ArmoredStairsLShape", "ArmoredStairsUShape", "ArmoredRoofSquare", "ArmoredRoofTriangle",
  ], 15, 8, 46),
];

export const RAID_COST = Object.fromEntries(TIERS);

// sulfur per explosive, crafted from raw sulfur (app: "count sub ingredients")
export const SULFUR_PER = { rockets: 1400, c4: 2200, satchels: 480 };

// ── classification helpers ────────────────────────────────────────────────────

export const isFoundation = (m) => /Foundation(Square|Triangle)(High|Mid|Low)$/.test(m);
export const isFloor = (m) => /Floor(Square|Triangle)$/.test(m) || /FloorFrame(Square|Triangle)$/.test(m);
export const isRoof = (m) => /Roof(Square|Triangle)$/.test(m);
// A structural panel standing in a wall slot. StrenghtenedGlassWindow also ends
// in "Window" but is an insert, not a wall, so it is excluded explicitly.
export const isWallish = (m) =>
  /Wall(High|Mid|Low|Frame)$|Doorway$|Window$/.test(m) &&
  !/RoofWall/.test(m) &&
  m !== "StrenghtenedGlassWindow";
export const isDoor = (m) => m === "MetalDoor" || m === "GarageDoor";
export const isInsert = (m) => m === "MetalVerticalEmbrasure" || m === "StrenghtenedGlassWindow";
export const isProp = (m) =>
  ["ToolCupboard", "WoodStorageBox", "LargeWoodBox", "Furnace", "WorkbenchT3", "SleepingBag"].includes(m);
export const isStairs = (m) => /Stairs[LU]Shape$/.test(m);

/** A frame you can walk through once its insert is gone. Windows are not walkable. */
export const isWalkableWhenEmpty = (m) => /Doorway$|WallFrame$/.test(m) && !/RoofWall/.test(m);

export function buildCost(models) {
  const t = { stone: 0, metal: 0, hqm: 0, wood: 0 };
  for (const m of models) {
    t.stone += STONE_COST[m] || 0;
    t.metal += METAL_COST[m] || 0;
    t.hqm += HQM_COST[m] || 0;
    t.wood += TWIG_WOOD_COST[m] || 0;
  }
  return t;
}

/** Upkeep multiplier, mirroring CountUpkeepPercentileRampup(). Props are excluded. */
export function upkeepRampup(structuralCount) {
  const n = structuralCount;
  if (n <= 15) return 0.1;
  if (n <= 100) return (15 * 0.1 + (n - 15) * 0.15) / n;
  if (n <= 175) return (15 * 0.1 + 85 * 0.15 + (n - 100) * 0.2) / n;
  return (15 * 0.1 + 85 * 0.15 + 75 * 0.2 + (n - 175) * 0.33) / n;
}
