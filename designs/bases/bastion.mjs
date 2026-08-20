// BASTION - 2x2 armoured-suite duo base. The recommended build.
//
//   L0  double airlock, smelting, bulk storage        (behind honeycomb)
//   L1  loot vault + ARMOURED SUITE (utility + core)  (behind honeycomb)
//   L2  watch floor: eight embrasures, sacrificial
//   L3  sealed cap + gable roof
//
// Eight triangles form a two-storey honeycomb ring; the L2 floor triangles cap
// it into a skirt roof that every L2 embrasure looks down onto.
//
// The defensive idea is a two-cell armoured SUITE on L1 - cells C and D, with
// armoured walls, an armoured floor slab under them and an armoured slab over
// them. It has exactly one way in, a garage door from the loot vault, and one
// internal garage door between the utility room and the core. So the last three
// steps of any raid are three garage doors in a row with no shortcut around
// them, and every alternative goes through 15-rocket material.
//
// Vertical spine: cell B holds a staircase on L0 and another on L1, so B has no
// floor on L1 or L2. The spine never touches the core - the wall between them
// (eBD) is armoured and has no opening.

import { Base } from "../lib/base.mjs";
import { sq, sqEdge, triOn, triEdges, at } from "../lib/geometry.mjs";

const N = 0, E = 90, S = 180, W = 270;

export function build() {
  const b = new Base({
    name: "BASTION",
    slug: "bastion",
    tagline: "2x2 armoured-suite duo - 4 levels, 8-triangle honeycomb, 6 peeks, 15 large boxes, 14 rockets to the TC.",
    notes: [
      "Point the airlock triangle at your least open approach. Two L2 embrasures look straight down onto it.",
      "Every door on the loot path is a garage door: 3 rockets or 9 satchels each, against 2 and 4 for a metal door.",
      "L2 is the cheap floor on purpose. It eats the first breach, it holds the peeks, and nothing good lives there.",
      "The suite (C + D on L1) is sealed top and bottom by armoured slabs, so it cannot be splashed from L0 or L2.",
    ],
  });

  // ── grid ────────────────────────────────────────────────────────────────────
  const A = sq(0, 0);   // south-west - lobby, then loot vault, then watch room
  const B = sq(1, 0);   // south-east - stair spine, never a room
  const C = sq(0, 1);   // north-west - smelting, then the suite antechamber
  const D = sq(1, 1);   // north-east - storage, then the armoured core
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

  const eAB = sqEdge(A, E);   // lobby / vault  <-> spine
  const eAC = sqEdge(A, N);   // vault          <-> suite  (the only way in)
  const eBD = sqEdge(B, N);   // spine          <-> core   (armoured, sealed)
  const eCD = sqEdge(C, E);   // suite internal door

  const skinOf = (t) => { const { right, left } = triEdges(t); return [right, left]; };
  const skin = tris.flatMap(skinOf);
  const frontDoor = skinOf(tAS)[0];
  const skinWalls = skin.filter((e) => e !== frontDoor);

  // ── L0 - ground ─────────────────────────────────────────────────────────────
  const l0 = b.storey(0);
  l0.foundations([...core, ...tris]);
  l0.wall(skinWalls);
  l0.frame(frontDoor, "Stone", "GarageDoor");            // airlock door 1
  l0.frame(eAS, "Stone", "GarageDoor");                  // airlock door 2
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

  // ── L1 - loot floor + armoured suite ────────────────────────────────────────
  const l1 = b.storey(1);
  l1.floors([A, ...tris]);             // B is the stair opening
  l1.floors([C, D], "Armored");        // armoured slab under the whole suite
  l1.wall(skin);                       // honeycomb carries all the way up
  l1.wall([eAS, eAW, eBS, eBE]);
  l1.wall([eCN, eCW, eDN, eDE], "Armored");   // the suite's four outward walls
  l1.wall([eBD], "Armored");                  // spine cannot touch the core
  l1.frame(eAB, "Stone", "GarageDoor");       // spine -> loot vault
  l1.frame(eAC, "Armored", "GarageDoor");     // loot vault -> suite
  l1.frame(eCD, "Armored", "GarageDoor");     // suite -> core
  l1.stairs(B, N);

  l1.room(A, "loot vault\n+ workbench", "loot");
  l1.shaft(B, "stairs L0 -> L2", "stairs");
  l1.room(C, "SUITE: utility\n+ electricity", "core");
  l1.room(D, "SUITE: core\nTC + bags", "core");
  tris.forEach((t) => l1.room(t, "", "honeycomb"));

  l1.against("WorkbenchT3", A, S);
  l1.against("LargeWoodBox", A, W);
  l1.against("LargeWoodBox", C, N);
  l1.against("LargeWoodBox", C, W);
  l1.against("ToolCupboard", D, S);
  l1.against("LargeWoodBox", D, N);
  l1.against("LargeWoodBox", D, E);
  l1.prop("SleepingBag", at(D, 0, -0.06), N);   // bags on the floor, clear of the boxes

  // ── L2 - watch floor ────────────────────────────────────────────────────────
  const l2 = b.storey(2);
  l2.floors([A, ...tris]);             // triangles become the skirt roof
  l2.floors([C, D], "Armored");        // armoured lid over the suite
  // the shaft cell gets no window: it drops straight to the suite's door line
  l2.window([eAS, eAW, eCN, eCW, eDN, eDE], "Stone", "MetalVerticalEmbrasure");
  l2.wall([eBS, eBE], "Armored");
  l2.frame(eAB, "Armored", "GarageDoor");
  l2.doorway([eAC, eCD], "Stone", "MetalDoor");
  l2.wall([eBD]);

  l2.room(A, "watch - S + W", "peek");
  l2.shaft(B, "stair top", "stairs");
  l2.room(C, "battery / solar\nN + W peeks", "utility");
  l2.room(D, "overflow store\nN + E peeks", "loot");
  tris.forEach((t) => l2.room(t, "", "exterior"));

  // large boxes are short enough to sit under an embrasure without blocking it
  l2.against("LargeWoodBox", A, S);
  l2.against("LargeWoodBox", A, W);
  l2.prop("SleepingBag", at(A, 0, 0), N);
  l2.against("LargeWoodBox", C, N);
  l2.against("LargeWoodBox", C, W);
  l2.against("LargeWoodBox", D, N);
  l2.against("LargeWoodBox", D, E);
  l2.against("LargeWoodBox", D, S);

  // ── L3 - sealed cap ─────────────────────────────────────────────────────────
  const l3 = b.storey(3);
  l3.floors([A, C, D]);
  l3.floors([B], "Armored");   // armoured cap over the shaft, same reason as L2
  l3.roofSq([A, B], S);
  l3.roofSq([C, D], N);
  core.forEach((c) => l3.room(c, "roof", "exterior"));

  return b;
}
