var glowColors = { combat: 'rgba(239, 68, 68, 0.40)', tech: 'rgba(96, 165, 250, 0.40)', materials: 'rgba(134, 239, 172, 0.35)' };
var allItems = [];
var activeCategory = 'all';
var activeSortKey = 'default';

document.getElementById('year').textContent = new Date().getFullYear();

fetch('api.php').then(res => res.json()).then(data => {
  allItems = Object.keys(data).map(id => { var item = data[id]; item.id = id; return item; });
  setupControls(); showItems();
});

function setupControls() {
  document.getElementById('search').addEventListener('input', showItems);
  document.getElementById('sort').addEventListener('change', function() { activeSortKey = this.value; showItems(); });
  document.getElementById('cat-nav').addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    highlightActiveTab(); showItems();
  });
  highlightActiveTab();
}

function highlightActiveTab() {
  document.querySelectorAll('#cat-nav button').forEach(btn => {
    var isActive = btn.dataset.cat === activeCategory;
    btn.classList.toggle('nav-active', isActive);
    btn.classList.toggle('text-amber-300', isActive);
    btn.classList.toggle('text-stone-400', !isActive);
  });
}

function showItems() {
  var searchText = document.getElementById('search').value.toLowerCase();
  var filtered = allItems.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchText === '') return true;
    if (item.name.toLowerCase().indexOf(searchText) !== -1) return true;
    var ingredientIds = Object.keys(item.recipe || {});
    for (var i = 0; i < ingredientIds.length; i++) {
      var ing = allItems.find(a => a.id === ingredientIds[i]);
      var ingName = ing ? ing.name.toLowerCase() : ingredientIds[i];
      if (ingName.indexOf(searchText) !== -1) return true;
    }
    return false;
  });

  var sorted = filtered.slice();
  if (activeSortKey === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (activeSortKey === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name));
  else if (activeSortKey === 'components-asc') sorted.sort((a, b) => Object.keys(a.recipe || {}).length - Object.keys(b.recipe || {}).length);
  else if (activeSortKey === 'components-desc') sorted.sort((a, b) => Object.keys(b.recipe || {}).length - Object.keys(a.recipe || {}).length);
  drawCards(sorted);
}

function drawCards(items) {
  var gridContainer = document.getElementById('card-grid');
  var status = document.getElementById('status');

  status.textContent = (activeCategory === 'all' ? 'All Items' : activeCategory[0].toUpperCase() + activeCategory.slice(1)) + ' — ' + items.length + ' item' + (items.length === 1 ? '' : 's');
  
  gridContainer.innerHTML = '';
  
  if (items.length === 0) {
      gridContainer.innerHTML = '<p class="forge-title text-xs text-stone-600 tracking-widest">No items match your search.</p>';
      return;
  }

  var grouped = { combat: [], tech: [], materials: [] };
  items.forEach(item => {
    if(grouped[item.category]) grouped[item.category].push(item);
  });

  ['combat', 'tech', 'materials'].forEach(cat => {
    if (grouped[cat].length > 0) {
      // Header for category
      var header = document.createElement('div');
      header.className = 'border-b-2 border-stone-700/60 pb-2 mb-4 mt-8 first:mt-0';
      header.innerHTML = '<h2 class="forge-title text-lg text-amber-500 tracking-widest uppercase">' + cat + '</h2>';
      gridContainer.appendChild(header);

      // Inner Grid for columns
      var innerGrid = document.createElement('div');
      innerGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5';
      gridContainer.appendChild(innerGrid);

      grouped[cat].forEach(item => {
        var ingredientIds = Object.keys(item.recipe || {});
        var hasRecipe = ingredientIds.length > 0;
        var ingredientHTML = ingredientIds.map(ingId => {
          var qty = item.recipe[ingId];
          var ing = allItems.find(a => a.id === ingId);
          var name = ing ? ing.name : ingId;
          return '<li class="flex items-center gap-1.5"><span class="w-1 h-1 rounded-full bg-amber-600 inline-block"></span>' + qty + '× ' + name + '</li>';
        }).join('');

        var card = document.createElement('a');
        card.href = 'calculator.html?item=' + item.id;
        card.className = 'card-glow group block bg-stone-900 border border-stone-700/60 rounded-sm p-5 transition-all duration-200 hover:border-amber-700/70 hover:bg-stone-800/70';
        card.style.setProperty('--glow-color', glowColors[item.category] || 'rgba(217,119,6,0.35)');
        card.innerHTML = '<div class="flex items-start justify-between mb-3"><h2 class="forge-title text-sm text-stone-100 group-hover:text-amber-300 transition-colors leading-snug">' + item.name + '</h2><span class="text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wider badge-' + item.category + '">' + item.category + '</span></div>' + (hasRecipe ? '<p class="text-stone-500 text-xs italic mb-3">Requires ' + ingredientIds.length + ' component' + (ingredientIds.length > 1 ? 's' : '') + '</p><ul class="text-xs text-stone-400 space-y-0.5">' + ingredientHTML + '</ul>' : '<p class="text-xs text-stone-600 italic">Raw material — no recipe</p>') + '<div class="mt-4 text-amber-600 text-xs forge-title tracking-widest group-hover:text-amber-400 transition-colors">WORKSPACE →</div>';
        innerGrid.appendChild(card);
      });
    }
  });
}
