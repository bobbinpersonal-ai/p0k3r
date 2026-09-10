// Regenerates the printed QR codes in public/qr. Run it when a link changes:
//   node scripts/gen-qr.mjs
// The SVGs are committed so nothing has to encode a QR at build or request
// time — see scripts/qr.mjs for why the encoder is this small.

import { writeFileSync, mkdirSync } from "node:fs";
import { toSvg } from "./qr.mjs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lovemeafter.com";

const CODES = {
  "yard-door-knock": `${SITE}/yard?source=door-knock`,
  "drive-door-knock": `${SITE}/drive?source=door-knock`,
};

mkdirSync("public/qr", { recursive: true });
for (const [name, url] of Object.entries(CODES)) {
  writeFileSync(`public/qr/${name}.svg`, toSvg(url) + "\n");
  console.log(`public/qr/${name}.svg  ${url}`);
}
