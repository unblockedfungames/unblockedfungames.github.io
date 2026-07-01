// Loads games.json (built from your GameDistribution / GameMonetize feeds,
// see scripts/fetch-feeds.mjs) and renders the catalog grid.

async function loadGames() {
  const res = await fetch('games.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load games.json');
  return res.json();
}

function cardTemplate(game) {
  return `
    <a class="card" href="game.html?id=${encodeURIComponent(game.id)}">
      <div class="card__thumb-wrap">
        <img src="${game.thumb}" alt="" loading="lazy" width="300" height="300">
      </div>
      <div class="card__perf"></div>
      <div class="card__label">
        ${game.title}
        <span class="card__cat">${game.category}</span>
      </div>
    </a>
  `;
}

function renderGrid(games) {
  const grid = document.getElementById('grid');
  if (!games.length) {
    grid.innerHTML = '';
    document.getElementById('empty').hidden = false;
    return;
  }
  document.getElementById('empty').hidden = true;
  grid.innerHTML = games.map(cardTemplate).join('');
}

function renderChips(games) {
  const categories = ['All', ...new Set(games.map(g => g.category))];
  const chipsEl = document.getElementById('chips');
  chipsEl.innerHTML = categories
    .map((c, i) => `<button class="chip${i === 0 ? ' active' : ''}" data-cat="${c}">${c}</button>`)
    .join('');
}

(async function init() {
  let allGames = [];
  try {
    allGames = await loadGames();
  } catch (err) {
    document.getElementById('grid').innerHTML = '';
    document.getElementById('empty').hidden = false;
    console.error(err);
    return;
  }

  renderChips(allGames);
  renderGrid(allGames);

  let activeCategory = 'All';
  let searchTerm = '';

  function applyFilters() {
    const filtered = allGames.filter(g => {
      const matchesCat = activeCategory === 'All' || g.category === activeCategory;
      const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });
    renderGrid(filtered);
  }

  document.getElementById('search').addEventListener('input', (e) => {
    searchTerm = e.target.value;
    applyFilters();
  });

  document.getElementById('chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.cat;
    applyFilters();
  });
})();
