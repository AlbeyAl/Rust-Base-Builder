// CITADEL - 3x2 keep-and-bailey duo base for late wipe.
//
//   L0  double airlock, smelting bay, two bulk stores, workshop
//   L1  two stone side vaults + a three-cell ARMOURED KEEP holding the TC
//   L2  watch gallery, eight embrasures, high vault, electricity
//   L3  sealed cap + gable roof
//
// Why three wide: on a 3x2 grid the two middle cells (B and E) each touch the
// outside on exactly ONE edge. B becomes the stair spine and E becomes the
// vault, so neither can be reached by breaking two walls in a straight line.
//
// The keep is A -> D -> E on L1: armoured walls all the way round, an armoured
// slab underneath and another over the top, and three garage doors in series
// with no wall shortcut cheaper than 15 rockets. Loot is split three ways - the
// keep, the stone side vaults (C, F) and the ground stores - so no single
// breach takes the base.

import { Base } from "../lib/base.mjs";
import { sq, sqEdge, triOn, triEdges, at } from "../lib/geometry.mjs";

const N = 0, E = 90, S = 180, W = 270;

export function build() {
  const b = new Base({
    name: "CITADEL",
    slug: "citadel",
    tagline: "3x2 keep-and-bailey duo - 4 levels, 10-triangle honeycomb, 8 peeks, 28 large boxes, 16 rockets to the TC.",
    notes: [
      "Late-wipe base. Do not start it until you can hold the full stone bill plus 431 HQM.",
      "Split your loot on purpose: explosives and guns in the keep, components in the side vaults, farm on the ground.",
      "Cell E never gets a window, an outside door, or a second entrance on either storey. Keep it that way.",
      "Build the stone shell first and upgrade the keep to armoured later - the layout does not change.",
    ],
  });

  // ── grid: three wide, two deep ──────────────────────────────────────────────
  const A = sq(0, 0), B = sq(1, 0), C = sq(2, 0);   // south row
  const D = sq(0, 1), E_ = sq(1, 1), F = sq(2, 1);  // north row
  const core = [A, B, C, D, E_, F];

  const tAS = triOn(A, S), tAW = triOn(A, W);
  const tBS = triOn(B, S);
  const tCS = triOn(C, S), tCE = triOn(C, E);
  const tDN = triOn(D, N), tDW = triOn(D, W);
  const tEN = triOn(E_, N);
  const tFN = triOn(F, N), tFE = triOn(F, E);
  const tris = [tAS, tAW, tBS, tCS, tCE, tDN, tDW, tEN, tFN, tFE];

  const eAS = sqEdge(A, S), eAW = sqEdge(A, W);
  const eBS = sqEdge(B, S);
  const eCS = sqEdge(C, S), eCE = sqEdge(C, E);
  const eDN = sqEdge(D, N), eDW = sqEdge(D, W);
  const eEN = sqEdge(E_, N);
  const eFN = sqEdge(F, N), eFE = sqEdge(F, E);

  const eAB = sqEdge(A, E);   // spine <-> keep chamber 1
  const eBC = sqEdge(B, E);   // spine <-> side vault 1
  const eAD = sqEdge(A, N);   // keep 1 <-> keep 2
  const eBE = sqEdge(B, N);   // spine <-> vault column
  const eCF = sqEdge(C, N);   // side vault 1 <-> side vault 2
  const eDE = sqEdge(D, E);   // keep 2 <-> the vault itself
  const eEF = sqEdge(E_, E);  // vault <-> side vault 2 (sealed)

  const skinOf = (t) => { const { right, left } = triEdges(t); return [right, left]; };
  const skin = tris.flatMap(skinOf);
  const frontDoor = skinOf(tAS)[0];
  const skinWalls = skin.filter((e) => e !== frontDoor);

  // ── L0 - ground ─────────────────────────────────────────────────────────────
  const l0 = b.storey(0);
  l0.foundations([...core, ...tris]);
  l0.wall(skinWalls);
  l0.frame(frontDoor, "Stone", "GarageDoor");
  l0.frame(eAS, "Stone", "GarageDoor");
  l0.wall([eAW, eBS, eCS, eCE, eDN, eDW, eEN, eFN, eFE]);
  l0.doorway([eAB, eBC, eBE, eDE, eEF], "Stone", "MetalDoor");
  l0.wall([eAD, eCF]);
  l0.stairs(B, N);

  l0.room(tAS, "airlock 1", "entry");
  l0.room(A, "airlock 2\nlobby", "entry");
  l0.shaft(B, "stairs up", "stairs");
  l0.room(C, "smelting bay", "utility");
  l0.room(D, "bulk store 1", "loot");
  l0.room(E_, "bulk store 2", "loot");
  l0.room(F, "workshop", "utility");

  l0.against("WoodStorageBox", A, W);
  l0.against("Furnace", C, S, { n: 2 });
  l0.against("Furnace", C, E, { n: 2 });
  l0.against("Furnace", C, N, { n: 2 });
  l0.against("LargeWoodBox", D, N);
  l0.against("LargeWoodBox", D, W);
  l0.against("LargeWoodBox", D, S);
  l0.against("LargeWoodBox", E_, N);
  l0.against("LargeWoodBox", E_, S);
  l0.against("WorkbenchT3", F, N);
  l0.against("LargeWoodBox", F, E);
  l0.against("LargeWoodBox", F, S);

  // ── L1 - side vaults + the armoured keep ────────────────────────────────────
  const l1 = b.storey(1);
  l1.floors([C, F, ...tris]);              // B is the stair opening
  l1.floors([A, D, E_], "Armored");        // armoured raft under the whole keep
  l1.wall(skin);                           // honeycomb carries up
  l1.wall([eBS, eCS, eCE, eFN, eFE]);
  l1.wall([eAS, eAW, eDN, eDW, eEN], "Armored");   // the keep's outward face
  l1.wall([eBE, eEF], "Armored");                  // the vault touches nothing else
  l1.frame(eAB, "Armored", "GarageDoor");          // spine  -> keep chamber 1
  l1.frame(eAD, "Armored", "GarageDoor");          // keep 1 -> keep 2
  l1.frame(eDE, "Armored", "GarageDoor");          // keep 2 -> vault
  l1.frame(eBC, "Stone", "GarageDoor");            // spine  -> side vault 1
  l1.doorway([eCF], "Stone", "MetalDoor");
  l1.stairs(B, N);

  l1.room(A, "KEEP 1\nelectricity", "core");
  l1.shaft(B, "stairs L0 -> L2", "stairs");
  l1.room(C, "side vault 1", "loot");
  l1.room(D, "KEEP 2\nammo + meds", "core");
  l1.room(E_, "KEEP VAULT\nTC + bags", "core");
  l1.room(F, "side vault 2", "loot");
  tris.forEach((t) => l1.room(t, "", "honeycomb"));

  l1.against("ToolCupboard", E_, N);
  l1.against("LargeWoodBox", E_, S);
  l1.against("LargeWoodBox", E_, E);
  l1.prop("SleepingBag", at(E_, 0, 0.06), N);
  l1.against("LargeWoodBox", D, N);
  l1.against("LargeWoodBox", D, W);
  l1.against("LargeWoodBox", D, S);
  l1.against("WoodStorageBox", A, S);
  l1.against("WoodStorageBox", A, W);
  l1.against("LargeWoodBox", C, S);
  l1.against("LargeWoodBox", C, E);
  l1.against("LargeWoodBox", F, N);
  l1.against("LargeWoodBox", F, E);
  l1.prop("SleepingBag", at(D, 0, 0), N);

  // ── L2 - watch gallery + high vault ─────────────────────────────────────────
  const l2 = b.storey(2);
  l2.floors([C, F, ...tris]);              // triangles cap the honeycomb
  l2.floors([A, D, E_], "Armored");        // armoured lid over the keep
  l2.window([eAS, eAW, eCS, eCE, eDN, eDW, eFN, eFE], "Stone", "MetalVerticalEmbrasure");
  l2.wall([eBS], "Armored");               // the spine's one outward face
  l2.wall([eEN, eDE, eEF], "Armored");     // high vault: one door, from the spine
  l2.frame(eBE, "Armored", "GarageDoor");
  l2.frame([eAB, eBC], "Stone", "GarageDoor");   // every door onto the spine is a garage door
  l2.doorway([eAD, eCF], "Stone", "MetalDoor");

  l2.room(A, "watch - S + W", "peek");
  l2.shaft(B, "stair top", "stairs");
  l2.room(C, "watch - S + E", "peek");
  l2.room(D, "watch - N + W", "peek");
  l2.room(E_, "HIGH VAULT", "core");
  l2.room(F, "battery / solar\nN + E peeks", "utility");
  tris.forEach((t) => l2.room(t, "", "exterior"));

  // large boxes are short enough to sit under an embrasure without blocking it
  l2.against("LargeWoodBox", E_, N);
  l2.against("LargeWoodBox", E_, S);
  l2.against("LargeWoodBox", E_, E);
  l2.against("LargeWoodBox", F, N);
  l2.against("LargeWoodBox", F, E);
  l2.against("LargeWoodBox", F, S);
  l2.against("LargeWoodBox", A, S);
  l2.against("LargeWoodBox", A, W);
  l2.against("LargeWoodBox", C, S);
  l2.against("LargeWoodBox", C, E);
  l2.against("LargeWoodBox", D, N);
  l2.against("LargeWoodBox", D, W);
  l2.prop("SleepingBag", at(A, 0, 0), N);
  l2.prop("SleepingBag", at(C, 0, 0), N);

  // ── L3 - sealed cap ─────────────────────────────────────────────────────────
  const l3 = b.storey(3);
  l3.floors([A, C, D, F]);
  l3.floors([B, E_], "Armored");           // caps over the spine and the vaults
  l3.roofSq([A, B, C], S);
  l3.roofSq([D, E_, F], N);
  core.forEach((c) => l3.room(c, "roof", "exterior"));

  return b;
}
