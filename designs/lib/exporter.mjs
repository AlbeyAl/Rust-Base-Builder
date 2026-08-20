// exporter.mjs - produce the base code the app's "Import -> via code" accepts.
//
// TransferModelsData.tsx does:
//   pako.deflate(JSON.stringify(canvas_models_data, null, 2))  ->  btoa(bytes)
// pako's default output is zlib-wrapped deflate, i.e. exactly zlib.deflateSync,
// so no extra dependency is needed here.

import zlib from "node:zlib";

export function encodeBaseCode(canvasData) {
  const json = JSON.stringify(canvasData, null, 2);
  return zlib.deflateSync(Buffer.from(json, "utf8")).toString("base64");
}

export function decodeBaseCode(code) {
  return JSON.parse(zlib.inflateSync(Buffer.from(code, "base64")).toString("utf8"));
}

/** Round-trips the code and re-checks every object survived intact. */
export function verifyBaseCode(code, canvasData) {
  const back = decodeBaseCode(code);
  const a = Object.values(canvasData);
  const b = Object.values(back);
  if (a.length !== b.length) throw new Error(`round-trip lost objects: ${a.length} -> ${b.length}`);
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.model !== y.model) throw new Error(`round-trip model mismatch at ${i}`);
    if (x.position.x !== y.position.x || x.position.y !== y.position.y || x.position.z !== y.position.z) {
      throw new Error(`round-trip position mismatch at ${i}`);
    }
    if (Math.abs(x.rotation._y - y.rotation._y) > 1e-9) throw new Error(`round-trip rotation mismatch at ${i}`);
  }
  return true;
}
