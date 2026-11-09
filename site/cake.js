/*
 * Lovely Layers (showcase site)
 * Copyright (c) 2026 Miloš Milinkov. All rights reserved.
 * Proprietary and confidential. Use, copying, modification or distribution
 * without written permission is prohibited. See the LICENSE file.
 */

// Cake data and the SVG cake renderer. Every cake picture on the page
// (hero, favourites, builder preview, option thumbnails) is drawn here.

const FLAVOURS = {
  chocolate: { name: "Chocolate & salted caramel", sponge: "#5b3426", filling: "#d08a3c", perKg: 3600,
    note: "Dark cocoa sponge, salted caramel and milk chocolate cream." },
  vanilla: { name: "Vanilla & strawberry", sponge: "#f2dc9f", filling: "#e2506b", perKg: 3200,
    note: "Butter vanilla sponge, homemade strawberry jam and mascarpone cream." },
  pistachio: { name: "Pistachio & raspberry", sponge: "#bfd08a", filling: "#d23a5f", perKg: 3900,
    note: "Pistachio sponge with fresh raspberry compote and white chocolate cream." },
  lemon: { name: "Lemon & blueberry", sponge: "#f5e07a", filling: "#5d5fa8", perKg: 3400,
    note: "Zesty lemon sponge, blueberry jam and a light lemon curd cream." },
  redvelvet: { name: "Red velvet", sponge: "#a42a3c", filling: "#fbf3e6", perKg: 3500,
    note: "Soft cocoa and buttermilk sponge layered with cream cheese frosting." },
  carrot: { name: "Carrot & walnut", sponge: "#cf8a45", filling: "#f6ecd9", perKg: 3300,
    note: "Spiced carrot sponge with toasted walnuts and orange cream cheese." },
};

// Tiers are [width, height] in preview units, bottom tier first.
const SIZES = [
  { kg: 1, serves: "6 to 8", tiers: [[150, 78]] },
  { kg: 1.5, serves: "10 to 12", tiers: [[182, 88]] },
  { kg: 2, serves: "14 to 16", tiers: [[212, 94]] },
  { kg: 3, serves: "20 to 24", tiers: [[226, 84], [152, 72]] },
  { kg: 4, serves: "28 to 32", tiers: [[252, 88], [176, 76]] },
  { kg: 5, serves: "36 to 40", tiers: [[262, 80], [190, 70], [126, 60]] },
];

const FROSTINGS = {
  vanilla: { name: "Vanilla buttercream", base: "#fff6e6", side: "#ecdcc0", top: "#fffbf3" },
  pink: { name: "Strawberry pink", base: "#f6b3c6", side: "#e48fa8", top: "#fbcad8" },
  chocolate: { name: "Chocolate ganache", dark: true, base: "#6a3a28", side: "#4f2b1d", top: "#7e4733" },
  pistachio: { name: "Pistachio green", base: "#cfe0ad", side: "#b2c88e", top: "#e0ebc7" },
  lemon: { name: "Lemon yellow", base: "#ffe489", side: "#efcb63", top: "#fff0b5" },
  lilac: { name: "Lilac", base: "#d8c7ef", side: "#bea6de", top: "#e8ddf7" },
};

const DECORATIONS = {
  berries: { name: "Fresh berries", phrase: "fresh berries", price: 600 },
  drip: { name: "Chocolate drip", phrase: "a chocolate drip", price: 500 },
  rosettes: { name: "Piped rosettes", phrase: "piped rosettes", price: 400 },
  pearls: { name: "Sugar pearls", phrase: "sugar pearls", price: 350 },
  sprinkles: { name: "Sprinkles", phrase: "sprinkles", price: 300 },
  macarons: { name: "Macarons", phrase: "macarons", price: 700 },
  candles: { name: "Candles", phrase: "candles", price: 200 },
};

const MESSAGE_PRICE = 300;

const PRESETS = {
  vera: { flavour: "chocolate", kg: 2, frosting: "chocolate", decorations: ["drip", "berries"], message: "" },
  cloud: { flavour: "vanilla", kg: 1.5, frosting: "pink", decorations: ["rosettes", "pearls", "berries"], message: "" },
  garden: { flavour: "pistachio", kg: 3, frosting: "pistachio", decorations: ["rosettes", "pearls", "macarons"], message: "" },
  sunny: { flavour: "lemon", kg: 2, frosting: "lemon", decorations: ["sprinkles", "candles"], message: "Happy birthday" },
};

function cakePrice(cake) {
  let total = FLAVOURS[cake.flavour].perKg * cake.kg;
  for (const key of cake.decorations) total += DECORATIONS[key].price;
  if (cake.message.trim()) total += MESSAGE_PRICE;
  return Math.round(total / 100) * 100;
}

const formatRSD = (n) => `${n.toLocaleString("en-US")} RSD`;
const formatKg = (kg) => `${String(kg)} kg`;
const sizeFor = (kg) => SIZES.find((s) => s.kg === kg) || SIZES[2];

// ---------- Drawing ----------

// Cakes are drawn in a fixed 420x380 frame so different sizes compare honestly.
// Named crops of that frame; full and thumb fit a 5 kg cake with candles.
const CROPS = {
  full: "0 0 420 380",
  thumb: "30 40 360 340",   // order card and phone mini bar
  hero: "40 76 340 300",    // up to 3 kg
  card: "50 112 320 266",   // favourite cards, up to 3 kg; matches .cake-card-art aspect-ratio
};

const CX = 210;
const INK = "rgba(61, 36, 29, 0.22)";
const SPRINKLE_COLOURS = ["#c42a57", "#ffd56a", "#7fb6dc", "#8ccaa6", "#b99ae0", "#ffffff"];

const escapeXML = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const r1 = (n) => Math.round(n * 10) / 10;
const svgOpen = (viewBox) => `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;

// Small seeded random generator so sprinkles and drips stay put between redraws.
function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Points along the front (visible) half of an ellipse, left to right.
function frontArc(cx, cy, rx, ry, count) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.PI * (1 - (i + 0.5) / count);
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

function layoutTiers(tierSizes, base) {
  const tiers = [];
  let yb = base;
  for (const [w, h] of tierSizes) {
    const t = { w, h, yb, yt: yb - h, ry: w * 0.085, L: CX - w / 2, R: CX + w / 2 };
    tiers.push(t);
    yb = t.yt; // the next tier sits centred on this tier's top
  }
  return tiers;
}

function stand(base, width) {
  const rx = width / 2 + 34;
  const ry = rx * 0.17;
  return `<g stroke="${INK}" stroke-width="1.5">
    <path d="M${CX - 20} ${base + 20} L${CX + 20} ${base + 20} L${CX + 46} ${base + 52} L${CX - 46} ${base + 52} Z" fill="#f4f8fb"/>
    <ellipse cx="${CX}" cy="${base + 52}" rx="54" ry="8" fill="#fffdf8"/>
    <ellipse cx="${CX}" cy="${base + 7}" rx="${rx}" ry="${r1(ry)}" fill="#c3dcee" stroke="none"/>
    <ellipse cx="${CX}" cy="${base}" rx="${rx}" ry="${r1(ry)}" fill="#fffdf8"/>
  </g>`;
}

function tierBody(t, f, gid) {
  const rx = t.w / 2;
  return `<path d="M${t.L} ${t.yt} L${t.L} ${t.yb} A${rx} ${r1(t.ry)} 0 0 0 ${t.R} ${t.yb} L${t.R} ${t.yt} Z" fill="url(#${gid})" stroke="${INK}" stroke-width="1.5"/>` +
    `<ellipse cx="${CX}" cy="${t.yt}" rx="${rx}" ry="${r1(t.ry)}" fill="${f.top}" stroke="${INK}" stroke-width="1.5"/>`;
}

function sprinkles(t, seed, avoid) {
  const rand = seeded(seed);
  const count = Math.round((t.w * t.h) / 230);
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = t.L + 8 + rand() * (t.w - 16);
    const y = t.yt + t.ry + 6 + rand() * (t.h - t.ry - 4);
    const colour = SPRINKLE_COLOURS[Math.floor(rand() * SPRINKLE_COLOURS.length)];
    const angle = Math.round(rand() * 180);
    if (avoid && x > avoid.x - 4 && x < avoid.x + avoid.w + 4 && y > avoid.y - 4 && y < avoid.y + avoid.h + 4) continue;
    s += `<rect x="${r1(x - 1.3)}" y="${r1(y - 4)}" width="2.6" height="8" rx="1.3" fill="${colour}" transform="rotate(${angle} ${r1(x)} ${r1(y)})"/>`;
  }
  return s;
}

function pearls(t) {
  const count = Math.max(6, Math.round(t.w / 9));
  let s = "";
  for (const [x, y] of frontArc(CX, t.yb, t.w / 2 - 2, t.ry, count)) {
    s += `<circle cx="${r1(x)}" cy="${r1(y - 2)}" r="3.6" fill="#fffaf2" stroke="#d4c6b2" stroke-width=".8"/>` +
      `<circle cx="${r1(x - 1.1)}" cy="${r1(y - 3.2)}" r="1" fill="#fff"/>`;
  }
  return s;
}

function drip(t, colour, seed) {
  const rand = seeded(seed);
  const rx = t.w / 2;
  let s = `<ellipse cx="${CX}" cy="${t.yt}" rx="${rx}" ry="${r1(t.ry)}" fill="${colour}"/>`;
  s += `<path d="M${t.L} ${t.yt} A${rx} ${r1(t.ry)} 0 0 0 ${t.R} ${t.yt} L${t.R} ${t.yt + 7} A${rx} ${r1(t.ry)} 0 0 1 ${t.L} ${t.yt + 7} Z" fill="${colour}"/>`;
  const count = Math.max(5, Math.round(t.w / 19));
  for (const [x, y] of frontArc(CX, t.yt + 4, rx - 5, t.ry, count)) {
    const len = (0.16 + rand() * 0.38) * t.h;
    s += `<rect x="${r1(x - 4.3)}" y="${r1(y)}" width="8.6" height="${r1(len)}" rx="4.3" fill="${colour}"/>`;
  }
  return s;
}

function rosettes(t, f) {
  const pipe = f.dark ? "#f3e2c9" : "#fffaf3";
  const count = Math.max(5, Math.round(t.w / 17));
  let s = "";
  for (const [x, y] of frontArc(CX, t.yt, t.w / 2 - 6, t.ry - 1, count)) {
    s += `<circle cx="${r1(x)}" cy="${r1(y - 2)}" r="7" fill="${pipe}" stroke="${INK}" stroke-width="1.2"/>` +
      `<path d="M${r1(x - 3)} ${r1(y - 2)} a3 3 0 1 1 3 3" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  return s;
}

function plaque(t, text, f) {
  const fontSize = Math.max(9, Math.min(15, (t.w - 40) / (text.length * 0.62)));
  const w = Math.min(t.w - 20, text.length * fontSize * 0.62 + 26);
  const h = fontSize + 14;
  const x = CX - w / 2;
  const y = t.yt + t.ry + (t.h - t.ry - h) / 2 + 2;
  return {
    box: { x, y, w, h },
    svg: `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h / 2)}" fill="${f.dark ? "#fff6e6" : "#4a2a20"}"/>` +
      `<text x="${CX}" y="${r1(y + h / 2 + fontSize * 0.36)}" text-anchor="middle" font-family="Shrikhand, Georgia, serif" font-size="${r1(fontSize)}" fill="${f.dark ? "#4a2a20" : "#fff6e6"}">${escapeXML(text)}</text>`,
  };
}

function candles(t) {
  const scale = Math.min(1, t.w / 150);
  const offsets = t.w >= 140 ? [-0.22, 0, 0.22] : [-0.15, 0.15];
  const colours = ["#7fb6dc", "#c42a57", "#ffd56a"];
  let s = "";
  offsets.forEach((o, i) => {
    const x = CX + o * t.w;
    const base = t.yt - t.ry * (o === 0 ? 0.45 : 0.15);
    const h = 34 * scale;
    s += `<g class="candle">
      <rect x="${r1(x - 4)}" y="${r1(base - h)}" width="8" height="${r1(h)}" rx="2" fill="${colours[i]}" stroke="${INK}" stroke-width="1"/>
      <path d="M${r1(x - 4)} ${r1(base - h * 0.3)} l8 -5 M${r1(x - 4)} ${r1(base - h * 0.65)} l8 -5" stroke="#fff" stroke-width="2" opacity=".75"/>
      <path d="M${r1(x)} ${r1(base - h)} v-4" stroke="#3d241d" stroke-width="1.4"/>
      <path class="flame" d="M${r1(x)} ${r1(base - h - 16)} C${r1(x + 6)} ${r1(base - h - 9)} ${r1(x + 4)} ${r1(base - h - 3)} ${r1(x)} ${r1(base - h - 3)} C${r1(x - 4)} ${r1(base - h - 3)} ${r1(x - 6)} ${r1(base - h - 9)} ${r1(x)} ${r1(base - h - 16)} Z" fill="#ffc94a"/>
    </g>`;
  });
  return s;
}

function macarons(t) {
  const m = 14 * Math.min(1, t.w / 150);
  const shells = [["#f2a7bd", "#e2879f"], ["#bcd98f", "#9fbe72"]];
  let s = "";
  [-0.12, 0.12].forEach((o, i) => {
    const x = CX + o * t.w;
    const base = t.yt + t.ry * 0.15;
    const [shell, edge] = shells[i];
    s += `<g transform="rotate(${i ? 8 : -8} ${r1(x)} ${r1(base)})" stroke="${INK}" stroke-width="1">
      <ellipse cx="${r1(x)}" cy="${r1(base - m * 0.35)}" rx="${r1(m)}" ry="${r1(m * 0.36)}" fill="${edge}"/>
      <rect x="${r1(x - m + 1.5)}" y="${r1(base - m * 0.85)}" width="${r1(2 * m - 3)}" height="${r1(m * 0.4)}" rx="2" fill="#fff6e6"/>
      <ellipse cx="${r1(x)}" cy="${r1(base - m)}" rx="${r1(m)}" ry="${r1(m * 0.45)}" fill="${shell}"/>
    </g>`;
  });
  return s;
}

function strawberry(x, y, k) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(k)})">
    <path d="M0 -9 C6 -9 9 -4 7 2 C5 7 1 10 0 10 C-1 10 -5 7 -7 2 C-9 -4 -6 -9 0 -9Z" fill="#d7263d" stroke="${INK}" stroke-width="1"/>
    <g fill="#ffe3a0"><circle cx="-3" cy="-2" r=".9"/><circle cx="3" cy="-3" r=".9"/><circle cx="0" cy="2" r=".9"/><circle cx="-3" cy="4" r=".9"/><circle cx="3" cy="4" r=".9"/></g>
    <path d="M-6 -9 L0 -6 L6 -9 L2 -11 L0 -14 L-2 -11Z" fill="#5c9a4a"/>
  </g>`;
}

function blueberry(x, y, k) {
  return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(4.6 * k)}" fill="#4a4f9c" stroke="${INK}" stroke-width=".8"/>` +
    `<circle cx="${r1(x - 1.4 * k)}" cy="${r1(y - 1.5 * k)}" r="${r1(1.1 * k)}" fill="#8f93d6"/>`;
}

function berries(t, centred) {
  const k = Math.min(1, t.w / 150);
  const spots = centred ? [0] : t.w >= 140 ? [-0.31, 0.31] : [-0.26, 0.26];
  let s = "";
  for (const o of spots) {
    const x = CX + o * t.w;
    const y = t.yt + t.ry * 0.25;
    s += blueberry(x - 9 * k, y - 2 * k, k) + strawberry(x, y - 4 * k, k) + blueberry(x + 8 * k, y + 2 * k, k) + blueberry(x - 1 * k, y + 5 * k, k);
  }
  return s;
}

/**
 * Draw a whole cake. `cake` is { flavour, kg, frosting, decorations, message }.
 * Options: tiers (override the size), base (y of the bottom tier), viewBox, stand.
 */
function cakeSVG(cake, opts = {}) {
  const size = sizeFor(cake.kg);
  const f = FROSTINGS[cake.frosting];
  const deco = new Set(cake.decorations);
  const base = opts.base ?? 312;
  const tiers = layoutTiers(opts.tiers || size.tiers, base);
  const gid = `frost-${cake.frosting}`;
  const dripColour = f.dark ? "#f4e6cf" : "#4a2718";
  const message = (cake.message || "").trim();
  const top = tiers[tiers.length - 1];

  let s = svgOpen(opts.viewBox || CROPS.full);
  s += `<defs><linearGradient id="${gid}" x1="0" x2="1">` +
    `<stop offset="0" stop-color="${f.side}"/><stop offset=".3" stop-color="${f.base}"/>` +
    `<stop offset=".72" stop-color="${f.base}"/><stop offset="1" stop-color="${f.side}"/></linearGradient></defs>`;
  if (opts.stand !== false) s += stand(base, tiers[0].w);

  tiers.forEach((t, i) => {
    s += tierBody(t, f, gid);
    const label = i === 0 && message ? plaque(t, message, f) : null;
    if (deco.has("sprinkles")) s += sprinkles(t, 97 + i * 31, label && label.box);
    if (deco.has("drip")) s += drip(t, dripColour, 13 + i * 7);
    if (deco.has("pearls")) s += pearls(t);
    if (label) s += label.svg;
  });
  // Front rims are drawn after all tiers so they sit in front of the tier above.
  if (deco.has("rosettes")) for (const t of tiers) s += rosettes(t, f);

  if (deco.has("candles")) s += candles(top);
  if (deco.has("macarons")) s += macarons(top);
  if (deco.has("berries")) s += berries(top, !deco.has("candles") && !deco.has("macarons"));
  return s + "</svg>";
}

// A single slice standing on a plate, showing sponge and filling layers.
function sliceSVG(flavourKey, frostingKey) {
  const fl = FLAVOURS[flavourKey];
  const f = FROSTINGS[frostingKey];
  const x0 = 26, x1 = 138, top = 46, tipX = 196, tipY = 22;
  const layers = [[f.top, 7], [fl.sponge, 19], [fl.filling, 8], [fl.sponge, 19], [fl.filling, 8], [fl.sponge, 19]];
  const bottom = top + layers.reduce((n, [, h]) => n + h, 0);
  const rand = seeded(flavourKey.length * 101);

  let s = svgOpen("0 0 220 160");
  s += `<ellipse cx="110" cy="${bottom + 6}" rx="104" ry="18" fill="#fffdf8" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<path d="M${x1} ${top} L${tipX} ${tipY} L${tipX} ${tipY + bottom - top} L${x1} ${bottom} Z" fill="${f.side}" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<path d="M${x0} ${top} L${x1} ${top} L${tipX} ${tipY} L${x0 + 40} ${tipY} Z" fill="${f.top}" stroke="${INK}" stroke-width="1.5"/>`;
  let y = top;
  for (const [colour, h] of layers) {
    s += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" fill="${colour}"/>`;
    if (colour === fl.sponge) {
      for (let i = 0; i < 9; i++) {
        s += `<circle cx="${r1(x0 + 6 + rand() * (x1 - x0 - 12))}" cy="${r1(y + 4 + rand() * (h - 8))}" r="${r1(0.8 + rand() * 1.1)}" fill="#000" opacity=".14"/>`;
      }
    }
    y += h;
  }
  s += `<rect x="${x0}" y="${top}" width="5" height="${bottom - top}" fill="${f.base}"/>`;
  s += `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bottom - top}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
  return s + "</svg>";
}

// Thumbnail for a size option: silhouettes drawn to the same scale as each other.
function sizeSVG(kg) {
  const size = sizeFor(kg);
  const k = 0.36;
  let y = 76;
  let s = svgOpen("0 0 120 80");
  s += `<rect class="size-plate" x="6" y="76" width="108" height="3" rx="1.5"/>`;
  for (const [w, h] of size.tiers) {
    const tw = w * k, th = h * k;
    s += `<rect class="size-tier" x="${r1(60 - tw / 2)}" y="${r1(y - th)}" width="${r1(tw)}" height="${r1(th)}" rx="3"/>`;
    y -= th;
  }
  return s + "</svg>";
}

// Thumbnail for a frosting option.
function frostingSVG(key) {
  const f = FROSTINGS[key];
  return `${svgOpen("0 0 60 48")}
    <path d="M8 16 V36 A22 6 0 0 0 52 36 V16 Z" fill="${f.base}" stroke="${INK}" stroke-width="1.5"/>
    <path d="M8 16 V36 A22 6 0 0 0 16 40.6 V20.6 A22 6 0 0 1 8 16Z" fill="${f.side}"/>
    <ellipse cx="30" cy="16" rx="22" ry="6" fill="${f.top}" stroke="${INK}" stroke-width="1.5"/>
  </svg>`;
}

// Thumbnail for a decoration: a small one-tier cake with just that decoration.
function decorationSVG(key, frosting) {
  return cakeSVG(
    { flavour: "vanilla", kg: 1, frosting, decorations: [key], message: "" },
    { tiers: [[150, 66]], base: 150, viewBox: "124 28 172 148", stand: false },
  );
}
