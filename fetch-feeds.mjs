// scripts/fetch-feeds.mjs
//
// Builds games.json in two layers:
//   1. CURATED_GAMES  -- your hand-picked/fixed games, always shown first
//   2. Everything else pulled fresh from the GameMonetize feed, appended
//      after, skipping anything already in CURATED_GAMES
//
// Run locally with: node scripts/fetch-feeds.mjs
//
// To curate: add/edit/remove entries in CURATED_GAMES below, then re-run.
// Whatever is in CURATED_GAMES always wins and always sits on top -- the
// feed only fills in the rest underneath.

import fs from 'node:fs/promises';

// format=0 returns JSON. num sets games per page (100 is the feed's max per
// request); fetchGameMonetize() below pages through page=1,2,3... until the
// feed stops returning new games, so this pulls everything available.
const GAMEMONETIZE_PAGE_SIZE = 100;
const GAMEMONETIZE_MAX_PAGES = 50; // safety cap: 50 * 100 = 5000 games max

// Leave blank unless/until you have a working GameDistribution bulk feed URL.
const GAMEDISTRIBUTION_FEED_URL = '';

const CURATED_GAMES = [
  { id: 'gd-fireboy-watergirl-6', title: 'Fireboy and Watergirl 6: Fairy Tales', category: 'Puzzle', thumb: 'https://img.gamedistribution.com/56da8a54fe204845b34ccff750d4a60b-512x384.jpeg', embed: 'https://html5.gamedistribution.com/56da8a54fe204845b34ccff750d4a60b/?gd_sdk_referrer_url=https://unblockedfungames.github.io/game.html', source: 'gamedistribution' },
  { id: 'gm-80316', title: 'Basketball League', category: 'Sports', thumb: 'https://img.gamemonetize.com/tbq36l8p3xem75kh6n4fyua4yrajucnw/512x384.jpg', embed: 'https://html5.gamemonetize.co/tbq36l8p3xem75kh6n4fyua4yrajucnw/', source: 'gamemonetize' },
  { id: 'gm-80103', title: 'Crazy Moto', category: 'Racing', thumb: 'https://img.gamemonetize.com/s74g69865ye0ps8z2bvoc4cyu7r5iock/512x384.jpg', embed: 'https://html5.gamemonetize.co/s74g69865ye0ps8z2bvoc4cyu7r5iock/', source: 'gamemonetize' },
  { id: 'gm-80311', title: 'League of Football', category: 'Sports', thumb: 'https://img.gamemonetize.com/addozt0jok1iovrmxaye4f9k6qgg0lna/512x384.jpg', embed: 'https://html5.gamemonetize.co/addozt0jok1iovrmxaye4f9k6qgg0lna/', source: 'gamemonetize' },
  { id: 'gm-80758', title: 'Head Football 3D', category: 'Sports', thumb: 'https://img.gamemonetize.com/xfl7v3wmq9sfr3smizfho6k4zn22h1qq/512x384.jpg', embed: 'https://html5.gamemonetize.co/xfl7v3wmq9sfr3smizfho6k4zn22h1qq/', source: 'gamemonetize' },
  { id: 'gm-81019', title: 'Stickman Warriors Superhero Fight', category: 'Arcade', thumb: 'https://img.gamemonetize.com/ztnooa2wmbczll7r6hd4kj6vyym4z6x6/512x384.jpg', embed: 'https://html5.gamemonetize.co/ztnooa2wmbczll7r6hd4kj6vyym4z6x6/', source: 'gamemonetize' },
  { id: 'gm-81157', title: 'Dont Get Caught!', category: 'Arcade', thumb: 'https://img.gamemonetize.com/9zv52rjgu4h178mvf2ziukc3jkrcxyxk/512x384.jpg', embed: 'https://html5.gamemonetize.co/9zv52rjgu4h178mvf2ziukc3jkrcxyxk/', source: 'gamemonetize' },
  { id: 'gm-76684', title: 'Geometry Dash Stars', category: 'Hypercasual', thumb: 'https://img.gamemonetize.com/h0yn15shfo0centrh5lpm45c2iun248s/512x384.jpg', embed: 'https://html5.gamemonetize.co/h0yn15shfo0centrh5lpm45c2iun248s/', source: 'gamemonetize' },
  { id: 'gm-70495', title: 'Bloons Battles', category: 'Puzzle', thumb: 'https://img.gamemonetize.com/ydihbdfz3qxevtauhuefdttmlgmxxzvo/512x384.jpg', embed: 'https://html5.gamemonetize.co/ydihbdfz3qxevtauhuefdttmlgmxxzvo/', source: 'gamemonetize' },
  { id: 'gm-78892', title: 'HIll climb Racings 2', category: 'Racing', thumb: 'https://img.gamemonetize.com/1vxk8rfmkpin0l0ex7atiuftp6l3mu6p/512x384.jpg', embed: 'https://html5.gamemonetize.co/1vxk8rfmkpin0l0ex7atiuftp6l3mu6p/', source: 'gamemonetize' },
  { id: 'gm-69855', title: 'Vector Parkour', category: 'Stickman', thumb: 'https://img.gamemonetize.com/gcg6mybdrkv0l5midg3b798bx5h30ltk/512x384.jpg', embed: 'https://html5.gamemonetize.co/gcg6mybdrkv0l5midg3b798bx5h30ltk/', source: 'gamemonetize' },
  { id: 'gm-61990', title: 'Snake Color Challenge', category: 'Hypercasual', thumb: 'https://img.gamemonetize.com/djlhj9byrm6ma3wa7j8kjtgjfgx5mycy/512x384.jpg', embed: 'https://html5.gamemonetize.co/djlhj9byrm6ma3wa7j8kjtgjfgx5mycy/', source: 'gamemonetize' },
  { id: 'gm-420', title: 'Worms Zone a Slithery Snake', category: 'Arcade', thumb: 'https://img.gamemonetize.com/vz6qfngm0al4ggz8f3lrvrfrqrm1q19m/512x384.jpg', embed: 'https://html5.gamemonetize.co/vz6qfngm0al4ggz8f3lrvrfrqrm1q19m/', source: 'gamemonetize' },
  { id: 'gm-68242', title: 'Where is my Water', category: 'Puzzle', thumb: 'https://img.gamemonetize.com/1g5cp5vlxs5vbbvfj5965fd119k19fqv/512x384.jpg', embed: 'https://html5.gamemonetize.co/1g5cp5vlxs5vbbvfj5965fd119k19fqv/', source: 'gamemonetize' },
  { id: 'gm-53456', title: 'Prison Escape Online', category: 'Puzzle', thumb: 'https://img.gamemonetize.com/unr7wb4k4c4tcqxtiknmjrnmqkh844wu/512x384.jpg', embed: 'https://html5.gamemonetize.co/unr7wb4k4c4tcqxtiknmjrnmqkh844wu/', source: 'gamemonetize' },
  { id: 'gm-53523', title: 'Roblox World', category: 'Action', thumb: 'https://img.gamemonetize.com/gbzu2z08rrcwyag4kgnhp2dr0wumvubu/512x384.jpg', embed: 'https://html5.gamemonetize.co/gbzu2z08rrcwyag4kgnhp2dr0wumvubu/', source: 'gamemonetize' }
];

async function fetchGameMonetizePage(page, retries = 5, baseDelay = 2000) {
  const url = `https://gamemonetize.com/feed.php?format=0&num=${GAMEMONETIZE_PAGE_SIZE}&page=${page}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();

      // The feed can come back either as a bare array, or as an object with
      // the array nested under a key (e.g. { items: [...] } / { games: [...] }).
      // Handle both so a feed-shape change doesn't silently zero out results.
      const items = Array.isArray(data)
        ? data
        : data.items || data.games || data.data || [];

      if (!Array.isArray(items)) {
        console.warn(`GameMonetize feed page ${page} came back in an unexpected shape:`, Object.keys(data));
        return [];
      }

      return items;
    }

    if (res.status === 429 && attempt < retries) {
      const waitTime = baseDelay * Math.pow(2, attempt - 1);
      console.log(`  Rate limited (429) on page ${page}. Retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }

    if (res.status === 429) {
      // Exhausted retries. Don't crash the whole run over this -- just tell
      // the caller to stop paginating and keep whatever pages we already got.
      console.warn(`  Still rate limited on page ${page} after ${retries} attempts. Stopping pagination here; keeping games from earlier pages.`);
      return null;
    }

    throw new Error(`GameMonetize feed request failed (page ${page}): ${res.status}`);
  }
}

async function fetchGameMonetize() {
  const seen = new Set();
  const all = [];

  for (let page = 1; page <= GAMEMONETIZE_MAX_PAGES; page++) {
    const items = await fetchGameMonetizePage(page);

    if (items === null) {
      // Gave up on this page after retries -- keep what we have so far.
      break;
    }

    if (!items.length) {
      // No more games left in the feed.
      break;
    }

    let newOnThisPage = 0;
    for (const g of items) {
      if (!g.id || seen.has(g.id)) continue;
      seen.add(g.id);
      newOnThisPage++;
      all.push(g);
    }

    console.log(`  GameMonetize page ${page}: ${items.length} items (${newOnThisPage} new)`);

    // If a page returns nothing we haven't already seen, the feed is
    // wrapping around / exhausted -- stop paginating.
    if (newOnThisPage === 0) break;

    // Feed returned fewer than a full page, so this was the last page.
    if (items.length < GAMEMONETIZE_PAGE_SIZE) break;

    // Pause between requests to avoid tripping the feed's rate limit.
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return all.map(g => ({
    id: `gm-${g.id}`,
    title: g.title,
    category: g.category || 'Arcade',
    thumb: g.thumb,
    embed: g.url,
    source: 'gamemonetize'
  }));
}

async function fetchGameDistribution() {
  if (!GAMEDISTRIBUTION_FEED_URL) return [];
  const res = await fetch(GAMEDISTRIBUTION_FEED_URL);
  if (!res.ok) throw new Error(`GameDistribution feed request failed: ${res.status}`);
  const data = await res.json();
  return data.map(g => ({
    id: `gd-${g.id}`,
    title: g.title,
    category: g.category || 'Arcade',
    thumb: g.thumb || g.assets?.icon,
    embed: g.url,
    source: 'gamedistribution'
  }));
}

async function main() {
  const [gm, gd] = await Promise.all([
    fetchGameMonetize(),
    fetchGameDistribution()
  ]);

  const curatedIds = new Set(CURATED_GAMES.map(g => g.id));

  // Curated games first (in the exact order you listed them), then feed
  // games appended after, skipping anything already curated.
  const combined = [
    ...CURATED_GAMES,
    ...gm.filter(g => !curatedIds.has(g.id)),
    ...gd.filter(g => !curatedIds.has(g.id))
  ];

  await fs.writeFile('games.json', JSON.stringify(combined, null, 2));
  console.log(`Wrote ${combined.length} games to games.json`);
  console.log(`  - ${CURATED_GAMES.length} curated (on top)`);
  console.log(`  - ${combined.length - CURATED_GAMES.length} from feeds (underneath)`);
}

main().catch(err => {
  console.error('Feed fetch failed:', err);
  process.exit(1);
});
