# Unblocked Fun Games

Static game catalog site. Grid of games on `index.html`, each linking to
`game.html?id=xxx` which iframes the actual game from a licensed feed
(GameDistribution / GameMonetize).

## Files

- `index.html` — homepage, game grid, search + category filter
- `game.html` — player page, iframes the selected game
- `styles.css` — shared styles (arcade / ticket-card theme)
- `app.js` — loads `games.json`, renders grid, handles search/filter
- `games.json` — the game catalog data. Currently **sample/placeholder
  data** — swap this out with real feed data before launch.
- `scripts/fetch-feeds.mjs` — Node script to pull real data from your
  GameDistribution and GameMonetize publisher feeds and regenerate
  `games.json`

## Getting real games in

1. Log into your GameDistribution and GameMonetize publisher dashboards
   and grab your feed URLs (GameMonetize requires publisher approval
   first).
2. Open `scripts/fetch-feeds.mjs` and paste your feed URLs into the two
   constants at the top.
3. Check the actual JSON shape each feed returns (it may differ slightly
   from what's assumed in the script) and adjust the field mapping in
   `fetchGameDistribution()` / `fetchGameMonetize()` if needed.
4. Run:
   ```
   node scripts/fetch-feeds.mjs
   ```
   This overwrites `games.json` with your real catalog.
5. Re-run it periodically (cron job, GitHub Action, or just manually) to
   keep the catalog fresh.

## Deploying to GitHub Pages

1. Create a repo named exactly `unblockedfungames.github.io`
2. Push these files to the `main` branch, root folder
3. Settings → Pages → Source: deploy from `main` / root
4. Live at `https://unblockedfungames.github.io/` within a minute or two

## Notes

- Thumbnails currently point to placeholder images — the real feed data
  will include real thumbnail URLs.
- Category chips are generated automatically from whatever categories
  exist in `games.json`, no manual list to maintain.
- Colors: deep purple/navy background, hot pink + cyan accents. Change
  the CSS variables at the top of `styles.css` to adjust.
