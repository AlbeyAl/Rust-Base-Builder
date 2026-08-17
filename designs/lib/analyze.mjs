// analyze.mjs - seal check, raid pathing and cost roll-up for a Base.

import * as G from "./geometry.mjs";
import {
  RAID_COST, SULFUR_PER, buildCost, upkeepRampup,
  isWallish, isDoor, isInsert, isWalkableWhenEmpty, isProp,
} from "./catalog.mjs";

const OUTSIDE = "OUTSIDE";
const rockets = (m) => (RAID_COST[m] ? RAID_COST[m].rockets : Infinity);

/**
 * Cheapest way through one edge, in rockets.
 * 0 means you can already walk through it.
 */
export function edgePassage(models) {
  if (!models || models.length === 0) return { cost: 0, via: "open" };
  const walls = models.filter(isWallish);
  if (walls.length === 0) return { cost: 0, via: "open" };

  let best = { cost: Infinity, via: null };
  const fills = models.filter((m) => isDoor(m) || isInsert(m));

  for (const w of walls) {
    if (isWalkableWhenEmpty(w)) {
      // frame / doorway: walk through once whatever fills it is gone
      if (fills.length === 0) return { cost: 0, via: `${w} (empty)` };
      const cheapestFill = fills.reduce(
        (acc, m) => (rockets(m) < acc.cost ? { cost: rockets(m), via: m } : acc),
        { cost: Infinity, via: null },
      );
      const candidate = rockets(w) < cheapestFill.cost ? { cost: rockets(w), via: w } : cheapestFill;
      if (candidate.cost < best.cost) best = candidate;
    } else if (rockets(w) < best.cost) {
      best = { cost: rockets(w), via: w };
    }
  }
  return best;
}

/**
 * Build the connectivity graph of walkable spaces.
 * Nodes are `${level}:${cellId}` plus OUTSIDE. Every arc carries the rocket
 * cost of the cheapest object standing in the way (0 = already open).
 */
export function graph(base) {
  const nodes = new Map(); // node -> { level, cell, label }
  const arcs = new Map();  // node -> [{ to, cost, via }]

  const link = (a, b, cost, via) => {
    if (!arcs.has(a)) arcs.set(a, []);
    if (!arcs.has(b)) arcs.set(b, []);
    arcs.get(a).push({ to: b, cost, via });
    arcs.get(b).push({ to: a, cost, via });
  };

  const nodeId = (k, cellId) => `${k}:${cellId}`;

  for (const [k, lv] of base.levels) {
    for (const [cellId, cell] of lv.cells) {
      const room = lv.rooms.get(cellId);
      nodes.set(nodeId(k, cellId), {
        level: k, cell, cellId,
        label: room ? room.label : cellId,
        kind: room ? room.kind : "room",
      });
    }
  }

  // lateral arcs
  for (const [k, lv] of base.levels) {
    const byEdge = new Map(); // edgeKey -> [cellId]
    for (const [cellId, cell] of lv.cells) {
      for (const e of G.cellEdges(cell)) {
        const ek = G.key(e.p);
        if (!byEdge.has(ek)) byEdge.set(ek, []);
        byEdge.get(ek).push(cellId);
      }
    }
    for (const [ek, owners] of byEdge) {
      const models = lv.edges.has(ek) ? lv.edges.get(ek).models : [];
      const { cost, via } = edgePassage(models);
      if (owners.length === 1) {
        link(nodeId(k, owners[0]), OUTSIDE, cost, via);
      } else {
        for (let a = 0; a < owners.length; a++) {
          for (let b = a + 1; b < owners.length; b++) {
            link(nodeId(k, owners[a]), nodeId(k, owners[b]), cost, via);
          }
        }
      }
    }
  }

  // vertical arcs: a space is sealed above by the next storey's floor or roof
  const maxLevel = Math.max(...base.levels.keys());
  for (const [k, lv] of base.levels) {
    const above = base.levels.get(k + 1);
    for (const cellId of lv.cells.keys()) {
      const ceiling = above ? (above.floor.get(cellId) || above.cover.get(cellId)) : undefined;
      const upNode = above && above.cells.has(cellId) ? nodeId(k + 1, cellId) : OUTSIDE;
      const cost = ceiling ? rockets(ceiling) : 0;
      // a space with no ceiling is open to whatever is above it
      link(nodeId(k, cellId), upNode, cost, ceiling || "open sky");
    }
    if (k === maxLevel) continue;
  }

  return { nodes, arcs };
}

/** Dijkstra from OUTSIDE over rocket cost. */
export function raidCosts(base) {
  const { nodes, arcs } = graph(base);
  const dist = new Map([[OUTSIDE, 0]]);
  const prev = new Map();
  const seen = new Set();

  for (;;) {
    let cur = null;
    let best = Infinity;
    for (const [n, d] of dist) if (!seen.has(n) && d < best) { best = d; cur = n; }
    if (cur === null) break;
    seen.add(cur);
    for (const arc of arcs.get(cur) || []) {
      const nd = best + arc.cost;
      if (nd < (dist.has(arc.to) ? dist.get(arc.to) : Infinity)) {
        dist.set(arc.to, nd);
        prev.set(arc.to, { from: cur, via: arc.via, cost: arc.cost });
      }
    }
  }

  const path = (node) => {
    const steps = [];
    let n = node;
    while (prev.has(n)) {
      const p = prev.get(n);
      steps.unshift({ into: nodes.get(n) ? nodes.get(n).label : n, via: p.via, cost: p.cost });
      n = p.from;
    }
    return steps;
  };

  return { nodes, dist, path };
}

/** Which cell of `level` contains `point`, if any. */
export function cellAt(base, level, point) {
  const lv = base.levels.get(level);
  if (!lv) return null;
  for (const [cellId, cell] of lv.cells) {
    if (cell.kind === "sq") {
      if (Math.abs(point[0] - cell.c[0]) <= 1 && Math.abs(point[1] - cell.c[1]) <= 1) return cellId;
    } else {
      // barycentric test against the triangle's three corners
      const [a, b, c] = G.triCorners(cell);
      const area = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1]);
      const d1 = area(point, a, b), d2 = area(point, b, c), d3 = area(point, c, a);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) return cellId;
    }
  }
  return null;
}

/** The room holding the tool cupboard - the room a raid is actually aimed at. */
export function tcLocation(base) {
  const tc = base.objects.find((o) => o.model === "ToolCupboard");
  if (!tc) return null;
  for (const [k, lv] of base.levels) {
    if (lv.y !== tc.y) continue;
    const cellId = cellAt(base, k, tc.p);
    if (cellId) return { level: k, cellId, node: `${k}:${cellId}` };
  }
  return null;
}

/** Rooms a raider can walk into without breaking anything. */
export function openRooms(base) {
  const { nodes, dist } = raidCosts(base);
  const out = [];
  for (const [node, meta] of nodes) {
    if (dist.get(node) === 0) out.push({ node, ...meta });
  }
  return out;
}

export function costSummary(base) {
  const structural = base.structuralModels;
  const build = buildCost(base.allModels);
  const ramp = upkeepRampup(structural.length);
  const structuralBuild = buildCost(structural);
  return {
    objects: base.objects.length,
    structural: structural.length,
    props: base.objects.filter((o) => isProp(o.model)).length,
    build,
    upkeepRampup: ramp,
    upkeep: {
      stone: Math.round(structuralBuild.stone * ramp),
      metal: Math.round(structuralBuild.metal * ramp),
      hqm: Math.round(structuralBuild.hqm * ramp),
      wood: Math.round(structuralBuild.wood * ramp),
    },
  };
}

/** Sulfur a raider burns for `n` rockets, crafted from raw sulfur. */
export const sulfurForRockets = (n) => n * SULFUR_PER.rockets;

export { OUTSIDE, isProp };
