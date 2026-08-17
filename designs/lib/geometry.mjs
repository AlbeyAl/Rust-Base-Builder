// geometry.mjs
// Grid maths for the Rust Base Builder canvas.
//
// Verified against the shipped .glb bounds and the prebuilt bases in
// src/components/script/PrebuiltBasesData.tsx:
//
//   square foundation  2 x 2, origin at the centre, bottom at y = 0
//   low / mid / high   top surface at y = 0.05 / 1.05 / 2.05
//   triangle           origin at the MIDPOINT OF THE BASE EDGE, apex at +1.732
//                      along the facing direction
//   wall               2 wide, 2 tall, origin bottom-centre, spans +/-1 sideways
//   floor square       2 x 2, origin centre; floor triangle same origin as a
//                      triangle foundation
//   roof square/tri    rises 2 over its span, low edge at the origin
//
// Angles are degrees clockwise from +Z. dir(0) = +Z ("north"), dir(90) = +X.
// That matches the app's Euler _y rotation, whose vector is (sin, cos).

export const CELL = 2;               // world units across one foundation
export const TRI_H = Math.sqrt(3);   // 1.7320508 - triangle height
export const STOREY = 2;             // world units of one storey
export const GROUND = 0.05;          // top of a "low" foundation

const rad = (deg) => (deg * Math.PI) / 180;

export const norm = (deg) => ((deg % 360) + 360) % 360;

/**
 * Snap to `d` decimals and fold -0 into 0. sin(180 deg) is -1.2e-16, so without
 * this the same edge reached from its two neighbouring cells hashes to "-0.00"
 * from one side and "0.00" from the other, and the seal check thinks there is a
 * hole where there is a wall.
 */
export const round = (v, d = 3) => {
  const f = 10 ** d;
  const r = Math.round(v * f) / f;
  return r === 0 ? 0 : r;
};
export const roundPt = (p, d = 3) => [round(p[0], d), round(p[1], d)];

export const dir = (deg) => roundPt([Math.sin(rad(deg)), Math.cos(rad(deg))], 6);
/** Unit vector 90 deg clockwise from dir(deg). dir=0 -> (+1, 0). */
export const side = (deg) => roundPt([Math.cos(rad(deg)), -Math.sin(rad(deg))], 6);

export const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s];
export const key = (p) => `${round(p[0], 2).toFixed(2)}|${round(p[1], 2).toFixed(2)}`;

/** y of a storey: level 0 sits on top of low foundations. */
export const levelY = (k) => +(GROUND + STOREY * k).toFixed(3);

// ── square cells ──────────────────────────────────────────────────────────────

/** A square cell addressed by integer grid coordinates. */
export function sq(i, j) {
  return { kind: "sq", i, j, id: `S${i},${j}`, c: [i * CELL, j * CELL] };
}

/** Midpoint + outward rotation of one of a square cell's four edges. */
export function sqEdge(cell, deg) {
  return { p: roundPt(add(cell.c, dir(deg))), rot: norm(deg), owner: cell.id };
}

export const sqEdges = (cell) => [0, 90, 180, 270].map((d) => sqEdge(cell, d));

export const sqCorners = (cell) => [
  [cell.c[0] - 1, cell.c[1] - 1], [cell.c[0] + 1, cell.c[1] - 1],
  [cell.c[0] + 1, cell.c[1] + 1], [cell.c[0] - 1, cell.c[1] + 1],
];

// ── triangle cells ────────────────────────────────────────────────────────────

/** Triangle grown outward from a square edge (the honeycomb ring). */
export function triOn(cell, deg) {
  const e = sqEdge(cell, deg);
  return tri(e.p, e.rot);
}

/** Triangle from an explicit base-edge midpoint + facing. */
export function tri(p, deg) {
  const rot = norm(deg);
  const q = roundPt(p);
  return { kind: "tri", p: q, rot, id: `T${key(q)}@${rot}` };
}

export const triApex = (t) => roundPt(add(t.p, dir(t.rot), TRI_H));
export const triCentroid = (t) => roundPt(add(t.p, dir(t.rot), TRI_H / 3));

export const triCorners = (t) => [
  add(t.p, side(t.rot), 1),
  add(t.p, side(t.rot), -1),
  triApex(t),
];

/**
 * The three edges of a triangle, each as { p, rot } with rot pointing OUT of
 * the triangle.
 *   base  - shared with the square it hangs off
 *   right - clockwise side (towards side(rot))
 *   left  - counter-clockwise side
 */
export function triEdges(t) {
  const d = dir(t.rot);
  const s = side(t.rot);
  return {
    base: { p: t.p, rot: norm(t.rot + 180), owner: t.id },
    right: { p: roundPt(add(add(t.p, s, 0.5), d, TRI_H / 2)), rot: norm(t.rot + 60), owner: t.id },
    left: { p: roundPt(add(add(t.p, s, -0.5), d, TRI_H / 2)), rot: norm(t.rot - 60), owner: t.id },
  };
}

export const triOuterEdges = (t) => [triEdges(t).right, triEdges(t).left];

/** Roof piece that caps a triangle sloping DOWN towards its apex. */
export function triRoofPlacement(t) {
  return { p: triApex(t), rot: norm(t.rot + 180) };
}

export const cellCorners = (cell) => (cell.kind === "sq" ? sqCorners(cell) : triCorners(cell));
export const cellCentre = (cell) => (cell.kind === "sq" ? cell.c : triCentroid(cell));
export const cellEdges = (cell) =>
  cell.kind === "sq" ? sqEdges(cell) : Object.values(triEdges(cell));

/** Point inside a cell, offset from its centre. */
export const at = (cell, dx, dz) => roundPt([cellCentre(cell)[0] + dx, cellCentre(cell)[1] + dz]);

/**
 * A deployable slot flush against the `deg` wall of a square cell.
 * `depth` is the distance from the cell centre to the deployable's origin, so
 * it is (1 - half the model's depth). `along` slides it sideways along the wall.
 */
export const slot = (cell, deg, depth, along = 0) => {
  const c = cellCentre(cell);
  const d = dir(deg);
  const s = side(deg);
  return roundPt([c[0] + d[0] * depth + s[0] * along, c[1] + d[1] * depth + s[1] * along]);
};
