// CALTROP - 2x2 rosette turret. The showpiece.
//
//   L0  double airlock, smelting, bulk storage        (sealed honeycomb)
//   L1  loot vault + ARMOURED SUITE with the TC       (sealed honeycomb)
//   L2  THE GALLERY - six triangle pods, twelve slots at 30 deg offsets
//   L3  THE CROWN   - open drum on the block, six slots on the cardinals
//   L4  sealed cap + gable roof
//
// The peek idea, in one line: a caltrop always has a spike pointing at you.
//
// A triangle hangs off a square edge, so its two slant faces sit at +/-60 deg
// from that edge's bearing - 30, 60, 120, 150, 210, 240, 300, 330. The square's
// own faces sit on the cardinals - 0, 90, 180, 270. Neither ring covers the
// other's bearings. Put a firing ring on each and the union is TWELVE bearings
// exactly 30 degrees apart, with no gap anywhere on the compass, and every
// bearing watched from two different heights. Crouch behind a rock to break the
// crown's line and the gallery still has you.
//
// THE OUBLIETTE. The airlock triangle gets no ceiling on L1 or L2 and a floor
// frame at the top, so it is a three-storey shaft with your own front door at
// the bottom of it. Blow the outer garage and you are standing in a 3x3m stone
// tube being shot at from directly overhead, with nothing to build on inside
// the TC radius. The pod is behind its own garage door, so the shaft costs the
// base nothing: the gallery is four rockets with or without it.
//
// The loot does not live on either firing floor. L2 and L3 are sacrificial and
// hold ammo; the TC sits on L1 inside an armoured suite under an armoured lid.

import { Base } from "../lib/base.mjs";
import { sq, sqEdge, triOn, triEdges, at } from "../lib/geometry.mjs";

const N = 0, E = 90, S = 180, W = 270;

export function build() {
  const b = new Base({
    name: "CALTROP",
    slug: "caltrop",
    tagline: "2x2 rosette turret - 5 levels, 20 slots on 12 bearings exactly 30 deg apart, and a 3-storey murder shaft over the front door.",
    notes: [
      "Point the airlock triangle at your busiest approach. It is the one you WANT people walking into.",
      "Fight from the gallery (L2), not the crown. The crown is for range and for watching; the gallery has the shaft.",
      "Leave the oubliette pod's garage door open when you are home and shut it when you log. Closed, it costs the base nothing.",
      "Nothing valuable above L1. Both firing floors are meant to be lost.",
    ],
  });

  // ── grid ────────────────────────────────────────────────────────────────────
  const A = sq(0, 0);   // south-west - lobby / loot vault / gallery / crown
  const B = sq(1, 0);   // south-east - stair spine, sealed at every level
  const C = sq(0, 1);   // north-west - smelting / suite antechamber
  const D = sq(1, 1);   // north-east - storage / armoured core
  const core = [A, B, C, D];

  const tAS = triOn(A, S), tAW = triOn(A, W);
  const tBS = triOn(B, S), tBE = triOn(B, E);
  const tCN = triOn(C, N), tCW = triOn(C, W);
  const tDN = triOn(D, N), tDE = triOn(D, E);
  const tris = [tAS, tAW, tBS, tBE, tCN, tCW, tDN, tDE];

  // tBS and tBE hang off the stair spine, so they stay sealed honeycomb all the
  // way up - opening them would hand a raider the spine for four rockets.
  const pods = [tAW, tCN, tCW, tDN, tDE];        // gallery pods, open to the walkway
  const sealedTris = [tBS, tBE];

  const eAS = sqEdge(A, S), eAW = sqEdge(A, W);
  const eBS = sqEdge(B, S), eBE = sqEdge(B, E);
  const eCN = sqEdge(C, N), eCW = sqEdge(C, W);
  const eDN = sqEdge(D, N), eDE = sqEdge(D, E);

  const eAB = sqEdge(A, E);   // everything <-> spine
  const eAC = sqEdge(A, N);
  const eBD = sqEdge(B, N);   // spine <-> core: armoured, never opened
  const eCD = sqEdge(C, E);

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

  l0.room(tAS, "airlock 1\n+ shaft floor", "entry");
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
  l1.floors([A, tAW, tBS, tBE, tCN, tCW, tDN, tDE]);   // no floor over tAS: the shaft
  l1.floors([C, D], "Armored");                        // armoured raft under the suite
  l1.wall(skin);
  l1.wall([eAW, eBS, eBE]);
  // eAS is the shaft's own wall, and the shaft starts behind the outer garage
  // door. Stone here is a 3 + 4 rocket bypass straight into the loot vault.
  l1.wall([eAS], "Armored");
  l1.wall([eCN, eCW, eDN, eDE], "Armored");
  l1.wall([eBD], "Armored");
  l1.frame(eAB, "Stone", "GarageDoor");
  l1.frame(eAC, "Armored", "GarageDoor");
  l1.frame(eCD, "Armored", "GarageDoor");
  l1.stairs(B, N);

  l1.room(A, "loot vault\n+ workbench", "loot");
  l1.shaft(B, "stairs L0 -> L3", "stairs");
  l1.room(C, "SUITE: utility\n+ electricity", "core");
  l1.room(D, "SUITE: core\nTC + bags", "core");
  l1.shaft(tAS, "OUBLIETTE\nshaft", "entry");
  [tAW, tBS, tBE, tCN, tCW, tDN, tDE].forEach((t) => l1.room(t, "", "honeycomb"));

  l1.against("WorkbenchT3", A, S);
  l1.against("LargeWoodBox", A, W);
  l1.against("LargeWoodBox", C, N);
  l1.against("LargeWoodBox", C, W);
  l1.against("ToolCupboard", D, S);
  l1.against("LargeWoodBox", D, N);
  l1.against("LargeWoodBox", D, E);
  l1.prop("SleepingBag", at(D, 0, -0.06), N);

  // ── L2 - THE GALLERY --------------------------------------------------------
  // Six triangle pods open straight onto the walkway, so one player walks a ring
  // and never has to open a door to change angle. Twelve slots, eight bearings.
  const l2 = b.storey(2);
  l2.floors([A, ...pods, ...sealedTris]);
  l2.floors([C, D], "Armored");                 // armoured lid over the suite
  l2.floorFrames([tAS]);                        // the murder hole

  const podSlots = pods.flatMap(skinOf);
  const glass = [skinOf(tCN)[0], skinOf(tDE)[1]];            // watch without a hole
  l2.window(podSlots.filter((e) => !glass.includes(e)), "Stone", "MetalVerticalEmbrasure");
  l2.window(glass, "Stone", "StrenghtenedGlassWindow");
  l2.window(skinOf(tAS), "Stone", "MetalVerticalEmbrasure"); // the shaft pod fires too
  l2.wall(sealedTris.flatMap(skinOf));                       // spine triangles stay solid

  l2.frame(eAS, "Stone", "GarageDoor");         // the oubliette pod's own door
  l2.frame(eAB, "Stone", "GarageDoor");         // walkway -> spine
  l2.wall([eBS, eBE], "Armored");               // spine's outward faces
  l2.wall([eBD], "Armored");
  // eAW, eAC, eCN, eCW, eCD, eDN, eDE left open: the gallery is one room
  l2.stairs(B, N);

  l2.room(A, "gallery\nwalkway", "peek");
  l2.shaft(B, "stair landing", "stairs");
  l2.room(C, "gallery\nwalkway", "peek");
  l2.room(D, "gallery\nwalkway", "peek");
  l2.room(tAS, "OUBLIETTE\nshoot down", "peek");
  pods.forEach((t) => l2.room(t, "pod", "peek"));
  sealedTris.forEach((t) => l2.room(t, "", "honeycomb"));

  l2.against("LargeWoodBox", A, W);
  l2.against("LargeWoodBox", C, N);
  l2.against("LargeWoodBox", D, E);
  l2.prop("SleepingBag", at(C, 0, 0), N);

  // ── L3 - THE CROWN ---------------------------------------------------------
  // The block only. Its four faces are the cardinals the gallery cannot reach.
  const l3 = b.storey(3);
  l3.floors([A, C, D, ...tris]);                // triangles become the skirt roof
  l3.window([eAS, eAW, eCN, eCW, eDN, eDE], "Stone", "MetalVerticalEmbrasure");
  l3.wall([eBS, eBE], "Armored");
  l3.frame(eAB, "Stone", "GarageDoor");
  l3.wall([eBD], "Armored");
  // eAC and eCD left open: the crown is a single drum you pivot inside
  l3.stairs(B, N);

  l3.room(A, "CROWN\nS + W", "peek");
  l3.shaft(B, "stair top", "stairs");
  l3.room(C, "CROWN\nN + W", "peek");
  l3.room(D, "CROWN\nN + E", "peek");
  tris.forEach((t) => l3.room(t, "", "exterior"));

  l3.against("LargeWoodBox", C, N);
  l3.against("LargeWoodBox", D, E);
  l3.prop("SleepingBag", at(A, 0, 0), N);

  // ── L4 - sealed cap ─────────────────────────────────────────────────────────
  const l4 = b.storey(4);
  l4.floors([A, C, D]);
  l4.floors([B], "Armored");                    // cap over the spine
  l4.roofSq([A, B], S);
  l4.roofSq([C, D], N);
  core.forEach((c) => l4.room(c, "roof", "exterior"));

  return b;
}
