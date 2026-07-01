// scripts/fetch-feeds.mjs
//
// Pulls your game catalog from GameDistribution and GameMonetize and writes
// it out as games.json for the site to consume.
//
// Run locally with: node scripts/fetch-feeds.mjs
//
// You need real feed URLs before this will produce real data:
//  - GameDistribution: log into your publisher dashboard to get your feed URL
//  - GameMonetize: log into your publisher dashboard to get your feed URL / API key
//
// Fill in the two URLs below, then run the script. It overwrites games.json
// in the project root.

import fs from 'node:fs/promises';

const GAMEDISTRIBUTION_FEED_URL = 'REPLACE_WITH_YOUR_GAMEDISTRIBUTION_FEED_URL';
const GAMEMONETIZE_FEED_URL = 'REPLACE_WITH_YOUR_GAMEMONETIZE_FEED_URL';

async function fetchGameDistribution() {
  if (GAMEDISTRIBUTION_FEED_URL.startsWith('REPLACE')) return [];
  const res = await fetch(GAMEDISTRIBUTION_FEED_URL);
  const data = await res.json();
  // Adjust field mapping below to match the actual shape of your feed response.
  return data.map(g => ({
    id: `gd-${g.id}`,
    title: g.title,
    category: g.category || 'Arcade',
    thumb: g.thumb || g.assets?.icon,
    embed: g.url,
    source: 'gamedistribution'
  }));
}

async function fetchGameMonetize() {
  if (GAMEMONETIZE_FEED_URL.startsWith('REPLACE')) return [];
  const res = await fetch(GAMEMONETIZE_FEED_URL);
  const data = await res.json();
  // Adjust field mapping below to match the actual shape of your feed response.
  return data.map(g => ({
    id: `gm-${g.id}`,
    title: g.title,
    category: g.category || 'Arcade',
    thumb: g.thumb,
    embed: g.url,
    source: 'gamemonetize'
  }));
}

async function main() {
  const [gd, gm] = await Promise.all([
    fetchGameDistribution(),
    fetchGameMonetize()
  ]);

  const combined = [...gd, ...gm];

  if (!combined.length) {
    console.log('No feed URLs configured yet — leaving games.json untouched.');
    console.log('Fill in GAMEDISTRIBUTION_FEED_URL / GAMEMONETIZE_FEED_URL at the top of this script.');
    return;
  }

  await fs.writeFile('games.json', JSON.stringify(combined, null, 2));
  console.log(`Wrote ${combined.length} games to games.json`);
}

main().catch(err => {
  console.error('Feed fetch failed:', err);
  process.exit(1);
});
