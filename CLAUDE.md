# Lovely Layers (showcase site)

Demo website for a fictional cake bakery in Novi Sad, with a live cake builder. Used as a sales showcase for local-business websites. Proprietary (see LICENSE), owner Miloš Milinkov. Sibling showcases with the same setup: `../CoffeBarShowcase`, `../HairSalonShowcase`.

## Stack

- Plain static site: `site/index.html`, `site/styles.css`, `site/cake.js`, `site/main.js`. No framework, no build step.
- Fonts from Google Fonts: Shrikhand (h1/h2, prices, writing on the cake) and Nunito (everything else).
- No photos: every cake is SVG drawn by `cake.js`.
- Hosting: Cloudflare Workers static assets (`wrangler.jsonc`, assets dir `./site`, `404-page` handling).
- Planned live URL: https://lovely-layers.milos300399.workers.dev (not deployed yet). Planned repo: MiloshMilinkov/lovely-layers.

## Commands

```bash
npm install        # only dependency is wrangler
npm run dev        # wrangler dev on http://127.0.0.1:8792 (also .claude/launch.json "site")
npm run deploy     # wrangler deploy (wrangler is already logged in on this machine)
```

No tests, lint or typecheck. Verify changes in the browser at desktop and 375px mobile width (no horizontal scroll).

## Layout

```
site/
  index.html   hero, #cakes favourites, #build builder (#cake-preview + options form),
               #order (how it works + request form), reviews, #visit (hours table)
  styles.css   design tokens on :root, then sections in page order, responsive at the end
  cake.js      cake data (FLAVOURS, SIZES, FROSTINGS, DECORATIONS, PRESETS), cakePrice(),
               SVG renderers: cakeSVG, sliceSVG, sizeSVG, frostingSVG, decorationSVG
  main.js      builder (options are generated from cake.js data), presets, phone mini bar,
               order form (client-side validation, demo confirmation, nothing sent),
               open-now badge (Europe/Belgrade), mobile nav
  404.html, favicon.svg
```

## Rules and gotchas

- `cake.js` is the single source for flavours, sizes, prices and decorations. Add an option there and the builder, thumbnails and price follow. Favourite cards in `index.html` read their art and price from `PRESETS` via `data-preset-art` / `data-preset-price`; only their names and blurbs are in the HTML.
- `cakeSVG` draws in a fixed 420x380 frame so sizes compare honestly. Crops live in `CROPS` in `cake.js` (full, thumb, hero, card); `card` must match `.cake-card-art` aspect-ratio in CSS. Hero and card crops only fit cakes up to 3 kg; 5 kg cakes reach up to y of about 50.
- Contrast colours for dark frosting (plaque, rosettes, drip) key off `dark: true` in `FROSTINGS`, not the frosting name.
- Draw order inside `cakeSVG` matters: tier body, sprinkles, drip, pearls, plaque, then rosettes for all tiers, then candles, macarons, berries.
- Gradient ids are `frost-<frosting>` and are shared by every SVG on the page; same key always means same colours, so keep it that way.
- Opening hours live only in the hours table (`data-days`, `data-open`/`data-close`). Update the visible text in the same row too.
- The order form never sends anything. The confirmation says so; keep that demo note. Earliest order date is today + 2 days (Belgrade time).
- Keep the demo notice bar and footer credit: they link prospective clients to the portfolio (milos-milinkov.milos300399.workers.dev).
- Design: powder-blue "cake box" page, cocoa ink, raspberry buttons, butter-yellow accents and selected states, scalloped doily edges (`.scallop`). Avoid cream + terracotta, all-caps eyebrows and decorative numbering (the 1-2-3 in "How ordering works" is a real sequence).
- The only automatic motion is the hero candle flicker; the preview "settle" bump only follows a user's choice. Both respect `prefers-reduced-motion`.
- `[hidden] { display: none !important }` is needed because the order form is `display: grid`.
- After edits the browser pane serves cached CSS/JS; refetch with `fetch(url, {cache: "reload"})` then reload.
- Copyright header goes only in `index.html`, `styles.css`, `cake.js`, `main.js`.
