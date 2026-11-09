/*
 * Lovely Layers (showcase site)
 * Copyright (c) 2026 Miloš Milinkov. All rights reserved.
 * Proprietary and confidential. Use, copying, modification or distribution
 * without written permission is prohibited. See the LICENSE file.
 */

// Needs cake.js (FLAVOURS, SIZES, FROSTINGS, DECORATIONS, PRESETS and the SVG helpers).

const TIME_ZONE = "Europe/Belgrade";
const listFormat = new Intl.ListFormat("en", { type: "conjunction" });
const $ = (sel) => document.querySelector(sel);

// ---------- Cake builder ----------
const builder = $("[data-builder]");

function buildOptions() {
  const groups = {
    flavour: Object.entries(FLAVOURS).map(([value, f]) => ({
      value, type: "radio", name: f.name, meta: `${formatRSD(f.perKg)} per kg`,
    })),
    size: SIZES.map((s) => ({ value: String(s.kg), type: "radio", name: formatKg(s.kg), meta: `serves ${s.serves}` })),
    frosting: Object.entries(FROSTINGS).map(([value, f]) => ({ value, type: "radio", name: f.name })),
    decorations: Object.entries(DECORATIONS).map(([value, d]) => ({
      value, type: "checkbox", name: d.name, meta: `+${formatRSD(d.price)}`,
    })),
  };
  for (const [group, options] of Object.entries(groups)) {
    $(`[data-options="${group}"]`).innerHTML = options.map((o) => `
      <label class="opt">
        <input type="${o.type}" name="${group}" value="${o.value}">
        <span class="opt-art" data-art="${group}:${o.value}"></span>
        <span class="opt-name">${o.name}</span>
        ${o.meta ? `<span class="opt-meta">${o.meta}</span>` : ""}
      </label>`).join("");
  }
  // Size and frosting thumbnails never change; flavour and decoration ones follow the frosting (see render).
  for (const el of builder.querySelectorAll('[data-art^="size:"]')) el.innerHTML = sizeSVG(Number(el.dataset.art.slice(5)));
  for (const el of builder.querySelectorAll('[data-art^="frosting:"]')) el.innerHTML = frostingSVG(el.dataset.art.slice(9));
}

function goToBuilder() {
  const heading = $("#build-title");
  heading.scrollIntoView(); // smooth or instant per the CSS scroll-behavior (off for reduced motion)
  heading.focus({ preventScroll: true });
}

function setCake(cake) {
  builder.elements.flavour.value = cake.flavour;
  builder.elements.size.value = String(cake.kg);
  builder.elements.frosting.value = cake.frosting;
  for (const box of builder.querySelectorAll('input[name="decorations"]')) box.checked = cake.decorations.includes(box.value);
  builder.elements.message.value = cake.message;
}

function readCake() {
  return {
    flavour: builder.elements.flavour.value,
    kg: Number(builder.elements.size.value),
    frosting: builder.elements.frosting.value,
    decorations: [...builder.querySelectorAll('input[name="decorations"]:checked')].map((b) => b.value),
    message: builder.elements.message.value.trim(),
  };
}

function describe(cake) {
  const size = sizeFor(cake.kg);
  const title = `${formatKg(cake.kg)} ${FLAVOURS[cake.flavour].name.toLowerCase()} cake`;
  const decos = cake.decorations.map((d) => DECORATIONS[d].phrase);
  let detail = `Serves ${size.serves}. ${FROSTINGS[cake.frosting].name}`;
  detail += decos.length ? `, with ${listFormat.format(decos)}.` : ", nice and simple.";
  if (cake.message) detail += ` Written on the front: “${cake.message}”.`;
  return { title, detail };
}

let thumbsFrosting = null; // frosting the flavour and decoration thumbnails were last drawn with

function render({ bump = true } = {}) {
  const cake = readCake();
  const { title, detail } = describe(cake);
  const price = formatRSD(cakePrice(cake));

  const preview = $("[data-preview]");
  preview.innerHTML = cakeSVG(cake);
  preview.setAttribute("aria-label", `Picture of your cake: ${title}. ${detail}`);
  if (bump) {
    preview.classList.remove("is-bumped");
    void preview.offsetWidth; // restart the animation
    preview.classList.add("is-bumped");
  }
  $("[data-inside]").innerHTML = sliceSVG(cake.flavour, cake.frosting);
  $("[data-sum-title]").textContent = title;
  $("[data-sum-detail]").textContent = detail;
  $("[data-sum-price]").textContent = price;
  $("[data-flavour-note]").textContent = FLAVOURS[cake.flavour].note;

  if (cake.frosting !== thumbsFrosting) {
    thumbsFrosting = cake.frosting;
    for (const el of builder.querySelectorAll('[data-art^="flavour:"]')) el.innerHTML = sliceSVG(el.dataset.art.slice(8), cake.frosting);
    for (const el of builder.querySelectorAll('[data-art^="decorations:"]')) el.innerHTML = decorationSVG(el.dataset.art.slice(12), cake.frosting);
  }

  // Phone mini bar and order card mirror the builder.
  const thumb = cakeSVG(cake, { viewBox: CROPS.thumb });
  $("[data-mini-art]").innerHTML = thumb;
  $("[data-mini-title]").textContent = title;
  $("[data-mini-price]").textContent = price;
  $("[data-order-art]").innerHTML = thumb;
  $("[data-order-title]").textContent = title;
  $("[data-order-text]").textContent = `${detail} About ${price}.`;
}

function initBuilder() {
  buildOptions();
  setCake(PRESETS.cloud);
  render({ bump: false });
  // Typing on the cake redraws it without the "settle" bump, so it doesn't jiggle per keystroke.
  builder.addEventListener("input", (e) => render({ bump: e.target.name !== "message" }));
  builder.addEventListener("submit", (e) => e.preventDefault());

  // The phone-only mini bar shows while the big preview is off screen.
  const miniBar = $("[data-mini-bar]");
  new IntersectionObserver(([entry]) => miniBar.classList.toggle("is-hidden", entry.isIntersecting), { threshold: 0.15 })
    .observe($("#cake-preview"));

  $("[data-surprise]").addEventListener("click", () => {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const decoKeys = Object.keys(DECORATIONS).sort(() => Math.random() - 0.5);
    setCake({
      flavour: pick(Object.keys(FLAVOURS)),
      kg: pick(SIZES).kg,
      frosting: pick(Object.keys(FROSTINGS)),
      decorations: decoKeys.slice(0, 1 + Math.floor(Math.random() * 3)),
      message: builder.elements.message.value,
    });
    render();
  });

  for (const button of document.querySelectorAll("[data-preset]")) {
    button.addEventListener("click", () => {
      setCake(PRESETS[button.dataset.preset]);
      render({ bump: false });
      goToBuilder();
    });
  }
}

function renderShowcase() {
  $("[data-hero-cake]").innerHTML = cakeSVG({
    flavour: "vanilla", kg: 3, frosting: "pink", decorations: ["rosettes", "berries", "candles", "pearls"], message: "",
  }, { viewBox: CROPS.hero });
  for (const el of document.querySelectorAll("[data-preset-art]")) el.innerHTML = cakeSVG(PRESETS[el.dataset.presetArt], { viewBox: CROPS.card });
  for (const el of document.querySelectorAll("[data-preset-price]")) el.textContent = formatRSD(cakePrice(PRESETS[el.dataset.presetPrice]));
}

// ---------- Order request (demo: nothing is sent) ----------
function isoDaysFromToday(days) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function initOrder() {
  const form = $("[data-order-form]");
  const done = $("[data-order-done]");
  const { name, phone, day } = form.elements;
  day.min = isoDaysFromToday(2);

  const checks = [
    [name, () => name.value.trim() !== ""],
    [phone, () => phone.value.replace(/\D/g, "").length >= 6],
    [day, () => day.value !== "" && day.value >= day.min], // ISO dates compare as strings
  ];
  const showError = (input, show) => {
    const error = document.getElementById(`${input.id}-error`);
    input.setAttribute("aria-invalid", String(show));
    error.hidden = !show;
    if (show) input.setAttribute("aria-describedby", error.id);
    else input.removeAttribute("aria-describedby");
  };
  for (const [input, ok] of checks) input.addEventListener("input", () => { if (ok()) showError(input, false); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const failed = checks.filter(([, ok]) => !ok()).map(([input]) => input);
    for (const [input] of checks) showError(input, failed.includes(input));
    if (failed.length) { failed[0].focus(); return; }

    const cake = readCake();
    const when = new Date(`${day.value}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const handover = form.elements.handover.value === "delivery" ? "delivered to you" : "ready for pickup";
    $("[data-order-done-title]").textContent = `Thanks, ${name.value.trim()}!`;
    $("[data-order-done-text]").textContent =
      `We've got your request for a ${describe(cake).title}, ${handover} on ${when}. ` +
      `Dunja will call you on ${phone.value.trim()} within a day to go over the details and the final price.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  $("[data-order-again]").addEventListener("click", () => {
    form.reset();
    for (const [input] of checks) showError(input, false);
    form.hidden = false;
    done.hidden = true;
    goToBuilder();
  });
}

// ---------- Opening hours ----------
// The hours table in index.html is the single source of opening hours.
// A row without data-open is a closed day.
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad = (h) => `${String(h).padStart(2, "0")}:00`;

function initHours() {
  const rows = [...document.querySelectorAll(".hours tr[data-days]")].map((row) => ({
    row,
    days: row.dataset.days.split(",").map(Number),
    hours: row.dataset.open ? [Number(row.dataset.open), Number(row.dataset.close)] : null,
  }));
  const hours = {};
  for (const r of rows) for (const d of r.days) hours[d] = r.hours;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE, weekday: "long", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  const day = WEEKDAYS.indexOf(get("weekday"));
  const hour = Number(get("hour")) + Number(get("minute")) / 60;

  const nextOpening = () => {
    for (let ahead = 1; ahead <= 7; ahead++) {
      const d = (day + ahead) % 7;
      if (hours[d]) return `${ahead === 1 ? "tomorrow" : WEEKDAYS[d]} at ${pad(hours[d][0])}`;
    }
    return "soon";
  };
  const today = hours[day];
  let open = false, text;
  if (today && hour >= today[0] && hour < today[1]) { open = true; text = `Open now, until ${pad(today[1])}`; }
  else if (today && hour < today[0]) text = `Closed now, opens today at ${pad(today[0])}`;
  else text = `Closed now, opens ${nextOpening()}`;

  for (const el of document.querySelectorAll("[data-status]")) {
    el.classList.toggle("is-open", open);
    el.querySelector("[data-status-text]").textContent = text;
  }
  for (const r of rows) r.row.classList.toggle("is-today", r.days.includes(day));
}

// ---------- Mobile navigation ----------
function initNav() {
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
  });
}

renderShowcase();
initBuilder();
initOrder();
initHours();
initNav();
for (const el of document.querySelectorAll("[data-year]")) el.textContent = new Date().getFullYear();
