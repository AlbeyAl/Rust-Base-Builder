// base.mjs - declarative builder that emits Rust Base Builder canvas data.

import * as G from "./geometry.mjs";
import { isProp, propDepth, propWidth } from "./catalog.mjs";

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Deterministic 10-char ids in the same alphabet the app uses. */
function idGen(seed = 1) {
  let s = seed >>> 0;
  return () => {
    let out = "";
    for (let i = 0; i < 10; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      out += ID_CHARS[s % ID_CHARS.length];
    }
    return out;
  };
}

export class Base {
  constructor({ name, slug, tagline, notes = [] }) {
    this.name = name;
    this.slug = slug;
    this.tagline = tagline;
    this.notes = notes;
    this.objects = [];               // { model, p, y, rot, level, part }
    this.levels = new Map();         // k -> level record
    this.nextId = idGen(0xc0ffee);
  }

  _level(k) {
    if (!this.levels.has(k)) {
      this.levels.set(k, {
        k,
        y: G.levelY(k),
        cells: new Map(),      // cellId -> cell  (a walkable space exists here)
        floor: new Map(),      // cellId -> model of its floor/foundation
        cover: new Map(),      // cellId -> model of a roof placed at this level
        openFloor: new Set(),  // cellIds whose floor is an empty frame - a hole
        edges: new Map(),      // edgeKey -> { p, rot, models: [] }
        rooms: new Map(),      // cellId -> { label, kind }
      });
    }
    return this.levels.get(k);
  }

  _push(model, p, y, rot, part) {
    if (!model) throw new Error("missing model name");
    this.objects.push({
      model,
      p: G.roundPt(p),
      y: G.round(y),
      rot: G.norm(rot),
      part,
    });
  }

  _edge(lv, e) {
    const k = G.key(e.p);
    if (!lv.edges.has(k)) lv.edges.set(k, { p: e.p, rot: e.rot, models: [] });
    return lv.edges.get(k);
  }

  /** Level handle with the placement verbs. */
  storey(k) {
    const lv = this._level(k);
    const self = this;
    const y = lv.y;

    const registerCell = (cell, model) => {
      lv.cells.set(cell.id, cell);
      lv.floor.set(cell.id, model);
    };

    return {
      k,
      y,

      /** Low foundations (level 0). Accepts square and triangle cells. */
      foundations(cells, mat = "Stone") {
        for (const c of [].concat(cells)) {
          const model = c.kind === "sq"
            ? `${mat}FoundationSquareLow`
            : `${mat}FoundationTriangleLow`;
          self._push(model, c.kind === "sq" ? c.c : c.p, 0, c.kind === "sq" ? 0 : c.rot, "foundation");
          registerCell(c, model);
        }
        return this;
      },

      /** Floors (= the ceiling of the storey below). */
      floors(cells, mat = "Stone") {
        for (const c of [].concat(cells)) {
          const model = c.kind === "sq" ? `${mat}FloorSquare` : `${mat}FloorTriangle`;
          self._push(model, c.kind === "sq" ? c.c : c.p, y, c.kind === "sq" ? 0 : c.rot, "floor");
          registerCell(c, model);
        }
        return this;
      },

      /**
       * A floor frame with nothing in it: you stand on the ring and shoot
       * straight down through the hole. Counts as a floor for standing on and
       * as an opening for the seal check.
       */
      floorFrames(cells, mat = "Stone") {
        for (const c of [].concat(cells)) {
          const model = c.kind === "sq" ? `${mat}FloorFrameSquare` : `${mat}FloorFrameTriangle`;
          self._push(model, c.kind === "sq" ? c.c : c.p, y, c.kind === "sq" ? 0 : c.rot, "floor");
          registerCell(c, model);
          lv.openFloor.add(c.id);
        }
        return this;
      },

      /** Sloped triangle roof capping a honeycomb triangle of the storey below. */
      roofTri(tris, mat = "Stone") {
        for (const t of [].concat(tris)) {
          const pl = G.triRoofPlacement(t);
          self._push(`${mat}RoofTriangle`, pl.p, y, pl.rot, "roof");
          lv.cover.set(t.id, `${mat}RoofTriangle`);
        }
        return this;
      },

      /** Sloped square roof over `cell`, low edge facing `lowDeg`. */
      roofSq(cells, lowDeg, mat = "Stone") {
        for (const c of [].concat(cells)) {
          const p = G.add(c.c, G.dir(lowDeg));
          self._push(`${mat}RoofSquare`, p, y, G.norm(lowDeg + 180), "roof");
          lv.cover.set(c.id, `${mat}RoofSquare`);
        }
        return this;
      },

      wall(edges, mat = "Stone", height = "High") {
        for (const e of [].concat(edges)) {
          const model = `${mat}Wall${height}`;
          self._push(model, e.p, y, e.rot, "wall");
          self._edge(lv, e).models.push(model);
        }
        return this;
      },

      /** Doorway + (optional) metal door. */
      doorway(edges, mat = "Stone", door = "MetalDoor") {
        for (const e of [].concat(edges)) {
          const model = `${mat}Doorway`;
          self._push(model, e.p, y, e.rot, "wall");
          self._edge(lv, e).models.push(model);
          if (door) {
            self._push(door, e.p, y, e.rot, "door");
            self._edge(lv, e).models.push(door);
          }
        }
        return this;
      },

      /** Wall frame + (optional) garage door. */
      frame(edges, mat = "Stone", insert = "GarageDoor") {
        for (const e of [].concat(edges)) {
          const model = `${mat}WallFrame`;
          self._push(model, e.p, y, e.rot, "wall");
          self._edge(lv, e).models.push(model);
          if (insert) {
            self._push(insert, e.p, y, e.rot, "door");
            self._edge(lv, e).models.push(insert);
          }
        }
        return this;
      },

      /** Window wall + (optional) embrasure / glass. Not walkable when broken. */
      window(edges, mat = "Stone", insert = "MetalVerticalEmbrasure") {
        for (const e of [].concat(edges)) {
          const model = `${mat}Window`;
          self._push(model, e.p, y, e.rot, "wall");
          self._edge(lv, e).models.push(model);
          if (insert) {
            self._push(insert, e.p, y, e.rot, "insert");
            self._edge(lv, e).models.push(insert);
          }
        }
        return this;
      },

      /** U-shape staircase filling one square cell, climbing towards `climbDeg`. */
      stairs(cell, climbDeg = 0, mat = "Stone") {
        self._push(`${mat}StairsUShape`, cell.c, y, G.norm(climbDeg + 180), "stairs");
        return this;
      },

      prop(model, p, rot = 0) {
        self._push(model, p, y, rot, "prop");
        return this;
      },

      /**
       * Put a deployable flush against the `deg` wall of `cell`, facing in.
       * `along` slides it sideways; `n` places n of them evenly spaced, which is
       * only useful for narrow models such as furnaces.
       */
      against(model, cell, deg, { along = 0, n = 1 } = {}) {
        const depth = propDepth(model);
        const w = propWidth(model);
        for (let i = 0; i < n; i++) {
          const off = along + (n === 1 ? 0 : (i - (n - 1) / 2) * (w + 0.14));
          self._push(model, G.slot(cell, deg, depth, off), y, G.norm(deg + 180), "prop");
        }
        return this;
      },

      /**
       * A walkable space with no floor of its own - the opening a staircase
       * climbs through. Registers the space so it is still sealed-checked, but
       * leaves it deliberately open to the storey below.
       */
      shaft(cell, label = "stairwell", kind = "stairs") {
        lv.cells.set(cell.id, cell);
        lv.rooms.set(cell.id, { label, kind });
        return this;
      },

      /** Name a space for the floor plans and the raid analysis. */
      room(cell, label, kind = "room") {
        lv.rooms.set(cell.id, { label, kind });
        return this;
      },
    };
  }

  /** Objects in the app's `canvas_models_data` shape. */
  toCanvasData() {
    const out = {};
    for (const o of this.objects) {
      out[this.nextId()] = {
        position: { x: o.p[0], z: o.p[1], y: o.y },
        rotation: { isEuler: true, _x: 0, _y: (o.rot * Math.PI) / 180, _z: 0, _order: "XYZ" },
        model: o.model,
      };
    }
    return out;
  }

  get structuralModels() {
    return this.objects.filter((o) => !isProp(o.model)).map((o) => o.model);
  }

  get allModels() {
    return this.objects.map((o) => o.model);
  }

  countOf(model) {
    return this.objects.filter((o) => o.model === model).length;
  }
}
