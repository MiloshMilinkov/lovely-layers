# Lovely Layers

> **⚠️ View only — not open source.**
> This code is public for viewing only. Copying, modifying, deploying, redistributing or reusing any part of it (code, design, texts or branding), or using it to train AI models, is not allowed without written permission. See [LICENSE](LICENSE).

A showcase website for a made-up cake bakery in Novi Sad, built to show local businesses what their site could look like.

## What's on the page

- Hero with an illustrated two-tier cake and flickering candles
- Four favourite cakes, each one a starting point for the builder
- **Cake builder:** pick the flavour, the size (1 to 5 kg, one to three tiers), the frosting colour, decorations and writing on the cake. A drawn preview, a cut slice showing the layers inside, and the estimated price update as you choose. "Surprise me" picks a random cake.
- How ordering works, plus an order request form (demo: nothing is sent)
- Reviews, address and opening hours with a live "open now / closed" badge (Belgrade time)

Every cake picture is SVG drawn in the browser from the same renderer (`site/cake.js`), so there are no photos. Plain HTML, CSS and JavaScript, no build step. Hosted as static assets on Cloudflare Workers.

## Run locally

```bash
npm install
npm run dev      # http://127.0.0.1:8792
```

## Deploy

```bash
npm run deploy   # wrangler deploy, needs `wrangler login`
```

## License

Copyright © 2026 Miloš Milinkov. All rights reserved.

This project is proprietary and **not** open source. No licence is granted to use, copy, modify, deploy or distribute it. See [LICENSE](LICENSE) for the full terms. For permission requests, contact milos300399@gmail.com.

Security issues: see [SECURITY.md](SECURITY.md).
