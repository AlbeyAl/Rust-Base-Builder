// HALBERD - the cheap one. Same 2x2 footprint as BASTION, two storeys.
//
//   L0  double airlock, smelting, bulk storage   (behind a one-storey honeycomb)
//   L1  loot vault, utility, ARMOURED CORE       (peeks on every open side)
//   L2  sealed cap + gable roof
//
// The honeycomb ring is one storey tall and capped by the L1 floor triangles,
// which double as a skirt roof. L1's own walls therefore face straight out, so
// peeks up there are free: a stone window and a stone wall both cost a raider
// four rockets.
//
// The armoured core's door opens onto the stair shaft, not onto a room with a
// window in it, and the shaft's own outward walls are armoured. That is the
// whole trick - armour is only worth what the cheapest door into it costs.

import { Base } from "../lib/base.mjs";
import { sq, sqEdge, triOn, triEdges, at } from "../lib/geometry.mjs";

const N = 0, E = 90, S = 180, W = 270;

export function build() {
  const b = new Base({
    name: "HALBERD",
    slug: "halberd",
    tagline: "2x2, two lived-in storeys, one honeycomb ring - 4 peeks, 8 large boxes, 10 rockets to the TC.",
    notes: [
      "Build order: 4 + 8 foundations, core walls, airlock, then the honeycomb ring. Sleep in the core from day one.",
      "The armoured shell - core walls, core floor and ceiling, shaft walls and shaft cap - is 177 HQM in total.",
      "Upgrade path: add a second honeycomb ring on L1, move the peeks up to a new L2, and you have BASTION.",
    ],
  });

  const A = sq(0, 0), B = sq(1, 0), C = sq(0, 1), D = sq(1, 1);
  const core = [A, B, C, D];

  const tAS = triOn(A, S), tAW = triOn(A, W);
  const tBS = triOn(B, S), tBE = triOn(B, E);
  const tCN = triOn(C, N), tCW = triOn(C, W);
  const tDN = triOn(D, N), tDE = triOn(D, E);
  const tris = [tAS, tAW, tBS, tBE, tCN, tCW, tDN, tDE];

  const eAS = sqEdge(A, S), eAW = sqEdge(A, W);
  const eBS = sqEdge(B, S), eBE = sqEdge(B, E);
  const eCN = sqEdge(C, N), eCW = sqEdge(C, W);
  const eDN = sqEdge(D, N), eDE = sqEdge(D, E);
  const eAB = sqEdge(A, E), eAC = sqEdge(A, N), eBD = sqEdge(B, N), eCD = sqEdge(C, E);

  const skinOf = (t) => { const { right, left } = triEdges(t); return [right, left]; };
  const skin = tris.flatMap(skinOf);
  const frontDoor = skinOf(tAS)[0];
  const skinWalls = skin.filter((e) => e !== frontDoor);

  // ── L0 ──────────────────────────────────────────────────────────────────────
  const l0 = b.storey(0);
  l0.foundations([...core, ...tris]);
  l0.wall(skinWalls);
  l0.frame(frontDoor, "Stone", "GarageDoor");
  l0.frame(eAS, "Stone", "GarageDoor");
  l0.wall([eAW, eBS, eBE, eCN, eCW, eDN, eDE]);
  l0.doorway([eAB, eAC, eCD], "Stone", "MetalDoor");
  l0.wall([eBD]);
  l0.stairs(B, N);

  l0.room(tAS, "airlock 1", "entry");
  l0.room(A, "airlock 2\nlobby", "entry");
  l0.shaft(B, "stairs up", "stairs");
  l0.room(C, "smelting", "utility");
  l0.room(D, "bulk storage", "loot");

  l0.against("WoodStorageBox", A, W);
  l0.against("Furnace", C, N, { n: 2 });
  l0.against("Furnace", C, W, { n: 2 });
  l0.against("LargeWoodBox", D, N);
  l0.against("LargeWoodBox", D, E);
  l0.against("LargeWoodBox", D, S);

  // ── L1 ──────────────────────────────────────────────────────────────────────
  const l1 = b.storey(1);
  l1.floors([A, C, ...tris]);          // the triangles become the skirt roof
  l1.floors([D], "Armored");
  l1.window([eAS, eAW], "Stone", "MetalVerticalEmbrasure");   // cover the front door
  l1.window([eCN, eCW], "Stone", "MetalVerticalEmbrasure");   // cover the back lanes
  l1.wall([eBS, eBE], "Armored");      // shaft is the last room before the core
  l1.wall([eDN, eDE], "Armored");
  l1.wall([eCD], "Armored");           // the core gets exactly one door
  l1.frame(eAB, "Stone", "GarageDoor");
  l1.doorway([eAC], "Stone", "MetalDoor");
  l1.frame(eBD, "Armored", "GarageDoor");

  l1.room(A, "loot vault\nS + W peeks", "loot");
  l1.shaft(B, "stairs from L0", "stairs");
  l1.room(C, "utility / electricity\nN + W peeks", "utility");
  l1.room(D, "ARMOURED CORE\nTC + bags", "core");
  tris.forEach((t) => l1.room(t, "", "exterior"));

  l1.against("WorkbenchT3", A, S);
  l1.against("LargeWoodBox", A, W);
  l1.against("LargeWoodBox", C, N);
  l1.against("LargeWoodBox", C, W);
  l1.against("ToolCupboard", D, N);
  l1.against("LargeWoodBox", D, E);
  l1.against("LargeWoodBox", D, S);
  l1.prop("SleepingBag", at(D, 0, 0.06), N);

  // ── L2 - cap ────────────────────────────────────────────────────────────────
  const l2 = b.storey(2);
  l2.floors([A, C]);
  l2.floors([B, D], "Armored");   // B: the shaft cap. Stone here is a 4-rocket
                                  // hole straight onto the core's garage door.
  l2.roofSq([A, B], S);
  l2.roofSq([C, D], N);
  core.forEach((c) => l2.room(c, "roof", "exterior"));

  return b;
}
