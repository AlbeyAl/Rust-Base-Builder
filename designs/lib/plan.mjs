// plan.mjs - top-down SVG floor plans, one panel per storey.

import * as G from "./geometry.mjs";
import { isProp, isStairs } from "./catalog.mjs";

const MAT_COLOR = { Stone: "#8d8d86", Metal: "#7c8c9c", Armored: "#4d5561" };
const ROOM_COLOR = {
  room: "#2c2f36", loot: "#3b3a2a", core: "#4a2f2f", entry: "#2a3a45",
  utility: "#2f3d33", stairs: "#3a3242", peek: "#453a28", honeycomb: "#23252a",
  exterior: "#1b1d21",
};
const PROP_COLOR = {
  ToolCupboard: "#d98b3a", LargeWoodBox: "#c2a35b", WoodStorageBox: "#9a8146",
  Furnace: "#c05a3a", WorkbenchT3: "#5aa0c0", SleepingBag: "#b06a8a",
};
const PROP_SIZE = {
  ToolCupboard: [0.71, 0.55], LargeWoodBox: [1.26, 0.68], WoodStorageBox: [0.65, 0.5],
  Furnace: [0.7, 0.71], WorkbenchT3: [1.44, 0.64], SleepingBag: [1.41, 0.72],
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function materialOf(model) {
  if (model.startsWith("Armored")) return "Armored";
  if (model.startsWith("Metal") && !/^MetalDoor$|^MetalVerticalEmbrasure$/.test(model)) return "Metal";
  if (model.startsWith("Stone")) return "Stone";
  return "Stone";
}

export function renderPlans(base, { scale = 62, pad = 30, gap = 26 } = {}) {
  const levels = [...base.levels.keys()].sort((a, b) => a - b);

  // one shared extent so panels line up
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const lv of base.levels.values()) {
    for (const cell of lv.cells.values()) {
      for (const [x, z] of G.cellCorners(cell)) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
    }
  }
  minX -= 0.6; maxX += 0.6; minZ -= 0.6; maxZ += 0.6;

  const w = (maxX - minX) * scale;
  const h = (maxZ - minZ) * scale;
  const panelW = w + pad * 2;
  const panelH = h + pad * 2 + 26;
  const cols = Math.min(levels.length, 2);
  const rows = Math.ceil(levels.length / cols);
  const totalW = cols * panelW + (cols - 1) * gap + 32;
  const totalH = rows * panelH + (rows - 1) * gap + 74;

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(totalW)}" height="${Math.round(totalH)}" ` +
    `viewBox="0 0 ${Math.round(totalW)} ${Math.round(totalH)}" font-family="ui-monospace,Menlo,Consolas,monospace">`,
  );
  parts.push(`<rect width="100%" height="100%" fill="#14161a"/>`);
  parts.push(
    `<text x="16" y="30" fill="#e8e6e1" font-size="19" font-weight="700">${esc(base.name)}</text>` +
    `<text x="16" y="50" fill="#8b8f98" font-size="12">${esc(base.tagline)}</text>`,
  );

  levels.forEach((k, idx) => {
    const ox = 16 + (idx % cols) * (panelW + gap);
    const oy = 68 + Math.floor(idx / cols) * (panelH + gap);
    parts.push(renderLevel(base, k, { ox, oy, panelW, panelH, pad, scale, minX, maxZ }));
  });

  parts.push(legend(totalW, totalH));
  parts.push("</svg>");
  return parts.join("\n");
}

function renderLevel(base, k, o) {
  const lv = base.levels.get(k);
  const { ox, oy, panelW, panelH, pad, scale, minX, maxZ } = o;
  const X = (x) => ox + pad + (x - minX) * scale;
  const Y = (z) => oy + pad + 22 + (maxZ - z) * scale;
  const out = [];
  const labels = [];
  const props = [];

  out.push(`<rect x="${ox}" y="${oy}" width="${panelW}" height="${panelH}" rx="8" fill="#191c21" stroke="#2b2f36"/>`);
  out.push(
    `<text x="${ox + 12}" y="${oy + 20}" fill="#e8e6e1" font-size="13" font-weight="700">` +
    `L${k} &#183; y=${lv.y}</text>`,
  );

  // cells
  for (const [cellId, cell] of lv.cells) {
    const room = lv.rooms.get(cellId);
    const kind = room ? room.kind : "honeycomb";
    const pts = G.cellCorners(cell).map(([x, z]) => `${X(x).toFixed(1)},${Y(z).toFixed(1)}`).join(" ");
    out.push(`<polygon points="${pts}" fill="${ROOM_COLOR[kind] || ROOM_COLOR.room}" stroke="#33383f" stroke-width="1"/>`);
    if (room && room.label) {
      const [cx, cz] = G.cellCentre(cell);
      const lines = String(room.label).split("\n");
      const emph = ["core", "peek"].includes(kind);
      lines.forEach((ln, i) => {
        const ly = Y(cz) - (lines.length - 1) * 7 + i * 14;
        labels.push(
          `<text x="${X(cx).toFixed(1)}" y="${ly.toFixed(1)}" fill="#0d0f12" fill-opacity="0.75" ` +
          `font-size="11.5" text-anchor="middle" stroke="#0d0f12" stroke-opacity="0.75" stroke-width="4" ` +
          `paint-order="stroke">${esc(ln)}</text>`,
          `<text x="${X(cx).toFixed(1)}" y="${ly.toFixed(1)}" fill="${emph ? "#ffd9a0" : "#e4e1da"}" ` +
          `font-size="11.5" font-weight="${emph ? 700 : 400}" text-anchor="middle">${esc(ln)}</text>`,
        );
      });
    }
  }

  // walls / doors / windows
  for (const obj of base.objects) {
    if (obj.y !== lv.y) continue;
    const [px, pz] = obj.p;
    const s = G.side(obj.rot);
    const a = [px + s[0], pz + s[1]];
    const b = [px - s[0], pz - s[1]];
    const seg = `x1="${X(a[0]).toFixed(1)}" y1="${Y(a[1]).toFixed(1)}" x2="${X(b[0]).toFixed(1)}" y2="${Y(b[1]).toFixed(1)}"`;
    const mat = MAT_COLOR[materialOf(obj.model)];

    if (/Wall(High|Mid|Low)$/.test(obj.model)) {
      out.push(`<line ${seg} stroke="${mat}" stroke-width="8" stroke-linecap="round"/>`);
    } else if (/Doorway$|WallFrame$/.test(obj.model)) {
      out.push(`<line ${seg} stroke="${mat}" stroke-width="8" stroke-linecap="round" stroke-dasharray="6 8"/>`);
    } else if (/Window$/.test(obj.model)) {
      out.push(`<line ${seg} stroke="${mat}" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 5"/>`);
    } else if (obj.model === "MetalDoor" || obj.model === "GarageDoor") {
      const c = obj.model === "GarageDoor" ? "#e0b23c" : "#e07a3c";
      out.push(`<line ${seg} stroke="${c}" stroke-width="5" stroke-linecap="round"/>`);
      // swing marker showing which side the door faces
      const d = G.dir(obj.rot);
      out.push(
        `<line x1="${X(px).toFixed(1)}" y1="${Y(pz).toFixed(1)}" ` +
        `x2="${X(px + d[0] * 0.45).toFixed(1)}" y2="${Y(pz + d[1] * 0.45).toFixed(1)}" stroke="${c}" stroke-width="1.4"/>`,
      );
    } else if (obj.model === "MetalVerticalEmbrasure" || obj.model === "StrenghtenedGlassWindow") {
      const c = obj.model === "MetalVerticalEmbrasure" ? "#5ad1c0" : "#7fb2e8";
      const d = G.dir(obj.rot);
      out.push(`<line ${seg} stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>`);
      out.push(
        `<line x1="${X(px).toFixed(1)}" y1="${Y(pz).toFixed(1)}" ` +
        `x2="${X(px + d[0] * 1.15).toFixed(1)}" y2="${Y(pz + d[1] * 1.15).toFixed(1)}" ` +
        `stroke="${c}" stroke-width="1.2" stroke-dasharray="3 3"/>`,
      );
    } else if (isStairs(obj.model)) {
      const d = G.dir(G.norm(obj.rot + 180));
      for (let i = -3; i <= 3; i++) {
        const c0 = [px + s[0] * (i / 3.4) - d[0] * 0.95, pz + s[1] * (i / 3.4) - d[1] * 0.95];
        const c1 = [px + s[0] * (i / 3.4) + d[0] * 0.95, pz + s[1] * (i / 3.4) + d[1] * 0.95];
        out.push(
          `<line x1="${X(c0[0]).toFixed(1)}" y1="${Y(c0[1]).toFixed(1)}" x2="${X(c1[0]).toFixed(1)}" ` +
          `y2="${Y(c1[1]).toFixed(1)}" stroke="#6f7784" stroke-width="1"/>`,
        );
      }
      out.push(
        `<text x="${X(px).toFixed(1)}" y="${(Y(pz) + 4).toFixed(1)}" fill="#aeb4bd" font-size="9" ` +
        `text-anchor="middle">stairs &#8593;</text>`,
      );
    } else if (isProp(obj.model)) {
      // collected below so labels stay readable on top of furniture
      const [pw, pd] = PROP_SIZE[obj.model] || [0.6, 0.6];
      props.push(
        `<g transform="translate(${X(px).toFixed(1)},${Y(pz).toFixed(1)}) rotate(${(-obj.rot).toFixed(1)})">` +
        `<rect x="${(-pw / 2 * scale).toFixed(1)}" y="${(-pd / 2 * scale).toFixed(1)}" ` +
        `width="${(pw * scale).toFixed(1)}" height="${(pd * scale).toFixed(1)}" rx="2" ` +
        `fill="${PROP_COLOR[obj.model] || "#999"}" fill-opacity="0.85" stroke="#11131600"/></g>`,
      );
    } else if (/Roof(Square|Triangle)$/.test(obj.model)) {
      const d = G.dir(obj.rot);
      out.push(
        `<line x1="${X(px).toFixed(1)}" y1="${Y(pz).toFixed(1)}" ` +
        `x2="${X(px + d[0] * (obj.model.endsWith("Square") ? 2 : G.TRI_H)).toFixed(1)}" ` +
        `y2="${Y(pz + d[1] * (obj.model.endsWith("Square") ? 2 : G.TRI_H)).toFixed(1)}" ` +
        `stroke="#6d5f4a" stroke-width="2" stroke-dasharray="2 4"/>`,
      );
    }
  }

  return [...out, ...props, ...labels].join("\n");
}

function legend(totalW, totalH) {
  const items = [
    ["#8d8d86", "stone"], ["#7c8c9c", "metal"], ["#4d5561", "armored"],
    ["#e07a3c", "metal door"], ["#e0b23c", "garage door"],
    ["#5ad1c0", "embrasure peek"], ["#7fb2e8", "glass"],
    ["#d98b3a", "TC"], ["#c2a35b", "large box"], ["#c05a3a", "furnace"],
    ["#5aa0c0", "workbench"], ["#b06a8a", "bag"],
  ];
  const y = totalH - 16;
  let x = 16;
  const out = [];
  for (const [c, label] of items) {
    out.push(`<rect x="${x}" y="${y - 9}" width="11" height="11" rx="2" fill="${c}"/>`);
    out.push(`<text x="${x + 16}" y="${y}" fill="#8b8f98" font-size="10.5">${esc(label)}</text>`);
    x += 26 + label.length * 6.4;
  }
  return out.join("\n");
}
