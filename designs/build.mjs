// build.mjs - generate base codes, floor plans and the design report.
//
//   node designs/build.mjs            build everything
//   node designs/build.mjs bastion    build one design

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encodeBaseCode, verifyBaseCode } from "./lib/exporter.mjs";
import { renderPlans } from "./lib/plan.mjs";
import { costSummary, raidCosts, openRooms, sulfurForRockets, tcLocation } from "./lib/analyze.mjs";

import * as bastion from "./bases/bastion.mjs";
import * as halberd from "./bases/halberd.mjs";
import * as citadel from "./bases/citadel.mjs";
import * as caltrop from "./bases/caltrop.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESIGNS = [halberd, bastion, citadel, caltrop];

const n = (v) => v.toLocaleString("en-US");

function report(base) {
  const cost = costSummary(base);
  const { nodes, dist, path: pathTo } = raidCosts(base);

  const targets = [];
  for (const [node, meta] of nodes) {
    if (["loot", "core", "utility"].includes(meta.kind)) {
      targets.push({ node, meta, cost: dist.get(node) ?? Infinity });
    }
  }
  targets.sort((a, b) => a.cost - b.cost);

  // the raid number that matters is the room the tool cupboard is actually in
  const loc = tcLocation(base);
  const tc = (loc && targets.find((t) => t.node === loc.node)) || targets[targets.length - 1];

  const leaks = openRooms(base).filter((r) => r.kind !== "exterior" && r.kind !== "entry");

  return { cost, targets, tc, leaks, pathTo, dist, nodes };
}

function printReport(base, r) {
  const { cost, targets, tc, leaks, pathTo } = r;
  console.log(`\n${"=".repeat(78)}\n${base.name} - ${base.tagline}\n${"=".repeat(78)}`);
  console.log(
    `objects ${cost.objects} (${cost.structural} structural, ${cost.props} deployables)   ` +
    `upkeep multiplier ${(cost.upkeepRampup * 100).toFixed(1)}%`,
  );
  console.log(
    `build   stone ${n(cost.build.stone)}  metal ${n(cost.build.metal)}  hqm ${n(cost.build.hqm)}  ` +
    `wood(twig->wood) ${n(cost.build.wood)}`,
  );
  console.log(
    `upkeep  stone ${n(cost.upkeep.stone)}  metal ${n(cost.upkeep.metal)}  hqm ${n(cost.upkeep.hqm)}  ` +
    `wood ${n(cost.upkeep.wood)}   per day`,
  );

  if (leaks.length) {
    console.log(`\n!! UNSEALED SPACES (walk-in, 0 rockets):`);
    for (const l of leaks) console.log(`   L${l.level} ${l.label} [${l.cellId}]`);
  } else {
    console.log(`\nseal check: OK - every room needs explosives`);
  }

  console.log(`\ncheapest rocket routes:`);
  for (const t of targets.slice(0, 14)) {
    console.log(`  ${String(t.cost).padStart(3)} rkt  L${t.meta.level} ${t.meta.label.replace(/\n/g, " ")}`);
  }
  console.log(`\nroute to ${tc.meta.label.replace(/\n/g, " ")} (L${tc.meta.level}) - ${tc.cost} rockets / ` +
    `${n(sulfurForRockets(tc.cost))} sulfur:`);
  for (const step of pathTo(tc.node)) {
    console.log(`   +${String(step.cost).padStart(2)}  ${String(step.via).padEnd(24)} -> ${step.into.replace(/\n/g, " ")}`);
  }
}

function writeOutputs(base) {
  const data = base.toCanvasData();
  const code = encodeBaseCode(data);
  verifyBaseCode(code, data);

  const outDir = path.join(HERE, "out");
  const planDir = path.join(HERE, "plans");
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(planDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, `${base.slug}.txt`), code);
  fs.writeFileSync(path.join(planDir, `${base.slug}.svg`), renderPlans(base));
  return { code, data };
}

const only = process.argv[2];
const summary = [];

for (const mod of DESIGNS) {
  const base = mod.build();
  if (only && base.slug !== only) continue;
  const r = report(base);
  printReport(base, r);
  const { code } = writeOutputs(base);
  summary.push({
    slug: base.slug,
    name: base.name,
    tagline: base.tagline,
    notes: base.notes,
    objects: r.cost.objects,
    structural: r.cost.structural,
    build: r.cost.build,
    upkeep: r.cost.upkeep,
    upkeepRampup: r.cost.upkeepRampup,
    rocketsToTC: r.tc.cost,
    sulfurToTC: sulfurForRockets(r.tc.cost),
    targets: r.targets.map((t) => ({ level: t.meta.level, label: t.meta.label, rockets: t.cost })),
    tcRoute: r.pathTo(r.tc.node),
    leaks: r.leaks.length,
    codeLength: code.length,
  });
}

fs.writeFileSync(path.join(HERE, "out", "report.json"), JSON.stringify(summary, null, 2));
console.log(`\nwrote ${summary.length} design(s) to designs/out and designs/plans`);
