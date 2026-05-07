document.getElementById('year').textContent = new Date().getFullYear();

const params = new URLSearchParams(window.location.search);
const itemId = params.get('item');
let qty = parseInt(params.get('qty')) || 1;

if (!itemId) window.location.href = 'index.html';

let currentData = null;
let inventory = JSON.parse(localStorage.getItem('forge_inventory')) || {};

function saveInventory() {
    localStorage.setItem('forge_inventory', JSON.stringify(inventory));
}

function fetchCalc() {
  fetch('calculate_api.php?item=' + itemId + '&qty=' + qty)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById('calc-container').innerHTML = '<p class="text-red-500 forge-title">' + data.error + '</p>';
        return;
      }
      currentData = data;
      document.title = "The Forge — Workspace: " + data.item.name;
      renderUI();
    });
}

function handleQuantitySubmit(e) {
  e.preventDefault();
  let inputVal = parseInt(document.getElementById('qty-input').value);
  if (isNaN(inputVal) || inputVal < 1) inputVal = 1;
  if (inputVal > 999) inputVal = 999;
  
  const url = new URL(window.location);
  url.searchParams.set('qty', inputVal);
  window.history.pushState({}, '', url);

  qty = inputVal;
  fetchCalc();
}

function renderUI() {
  if(!currentData) return;
  const container = document.getElementById('calc-container');
  let html = `
    <div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h2 class="forge-title text-4xl text-stone-100">${currentData.item.name}</h2>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wider badge-${currentData.item.category}">
            ${currentData.item.category}
          </span>
        </div>
      </div>
    </div>

    <form id="qty-form" class="flex items-center gap-3 mb-8 bg-stone-900 border border-stone-700/60 rounded-sm px-5 py-4">
      <label class="forge-title text-xs tracking-widest text-stone-400 uppercase">Target Quantity</label>
      <input type="number" id="qty-input" value="${currentData.qty}" min="1" max="999"
             class="w-20 bg-stone-800 border border-stone-600 text-amber-300 forge-title text-center text-sm rounded-sm px-2 py-1 focus:outline-none focus:border-amber-600">
      <button type="submit"
              class="forge-title text-xs tracking-widest px-4 py-1.5 bg-stone-800 border border-stone-600 hover:border-amber-600 hover:text-amber-400 text-stone-300 rounded-sm transition-colors uppercase">
        Update Plan
      </button>
    </form>

    <div id="status-banner" class="mb-8"></div>
  `;

  if(currentData.raw_materials.length > 0) {
      html += `
        <div class="bg-stone-900 border border-stone-700/60 rounded-sm overflow-hidden overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                <thead class="bg-stone-950 border-b border-stone-700/60 forge-title text-stone-400 text-xs tracking-widest">
                    <tr>
                        <th class="p-4 w-12 text-center">Found</th>
                        <th class="p-4">Material</th>
                        <th class="p-4 w-24 text-center">Needed</th>
                        <th class="p-4 w-32 text-center">Your Stock</th>
                        <th class="p-4 w-48">Progress</th>
                    </tr>
                </thead>
                <tbody id="materials-body">
      `;
      
      currentData.raw_materials.forEach(mat => {
          let locationTooltip = mat.location ? `title="Found in: ${mat.location}"` : '';
          let nameDisplay = mat.location ? `<span class="cursor-help border-b border-dotted border-stone-500 hover:text-amber-300 transition-colors" ${locationTooltip}>${mat.name}</span>` : mat.name;

          html += `
            <tr class="border-b border-stone-800/50 mat-row transition-colors duration-300" data-id="${mat.id}">
                <td class="p-4 text-center">
                    <input type="checkbox" class="stock-checkbox cursor-pointer" data-id="${mat.id}" data-required="${mat.amount}">
                </td>
                <td class="p-4 font-semibold text-stone-200 mat-name">${nameDisplay}</td>
                <td class="p-4 text-center forge-title text-amber-400 font-bold">${mat.amount}</td>
                <td class="p-4 text-center">
                    <input type="number" min="0" class="stock-input w-20 bg-stone-950 text-amber-300 text-center border border-stone-600 rounded-sm px-2 py-1 focus:outline-none focus:border-amber-500 transition-colors" data-id="${mat.id}" data-required="${mat.amount}">
                </td>
                <td class="p-4">
                    <div class="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                        <div class="h-full bg-stone-600 transition-all duration-300 progress-fill" id="progress-${mat.id}" style="width: 0%"></div>
                    </div>
                </td>
            </tr>
          `;
      });
      html += `</tbody></table></div>`;
  } else {
      html += `<p class="text-stone-500 italic">No raw materials required.</p>`;
  }

  container.innerHTML = html;
  document.getElementById('qty-form').addEventListener('submit', handleQuantitySubmit);

  if(currentData.raw_materials.length > 0) {
      const inputs = document.querySelectorAll('.stock-input');
      const checks = document.querySelectorAll('.stock-checkbox');

      inputs.forEach(input => {
          input.value = inventory[input.dataset.id] || 0;
          input.addEventListener('input', (e) => {
              let id = e.target.dataset.id;
              let val = parseInt(e.target.value) || 0;
              inventory[id] = val;
              saveInventory();
              updateDynamicUI();
          });
      });

      checks.forEach(check => {
          check.addEventListener('change', (e) => {
              let id = e.target.dataset.id;
              let required = parseInt(e.target.dataset.required);
              inventory[id] = e.target.checked ? required : 0;
              saveInventory();
              updateDynamicUI();
          });
      });
      
      updateDynamicUI();
  }
}

function updateDynamicUI() {
    let allReady = true;
    let totalMissing = 0;

    currentData.raw_materials.forEach(mat => {
        let stock = inventory[mat.id] || 0;
        let required = mat.amount;
        let isDone = stock >= required;
        
        if (!isDone) {
            allReady = false;
            totalMissing += (required - stock);
        }

        let progress = Math.min(100, (stock / required) * 100);
        
        let row = document.querySelector(`.mat-row[data-id="${mat.id}"]`);
        let checkbox = document.querySelector(`.stock-checkbox[data-id="${mat.id}"]`);
        let input = document.querySelector(`.stock-input[data-id="${mat.id}"]`);
        let bar = document.getElementById(`progress-${mat.id}`);
        let nameContainer = row.querySelector('.mat-name');

        if (row) {
            if (isDone) {
                row.classList.add('bg-stone-900/50', 'opacity-60');
                checkbox.checked = true;
                if(nameContainer.firstElementChild) {
                    nameContainer.firstElementChild.classList.add('line-through', 'text-stone-500');
                    nameContainer.firstElementChild.classList.remove('text-stone-200');
                } else {
                    nameContainer.classList.add('line-through', 'text-stone-500');
                    nameContainer.classList.remove('text-stone-200');
                }
                bar.classList.add('bg-amber-600');
                bar.classList.remove('bg-stone-600');
                input.classList.add('border-amber-800');
                input.classList.remove('border-stone-600');
            } else {
                row.classList.remove('bg-stone-900/50', 'opacity-60');
                checkbox.checked = false;
                if(nameContainer.firstElementChild) {
                    nameContainer.firstElementChild.classList.remove('line-through', 'text-stone-500');
                    nameContainer.firstElementChild.classList.add('text-stone-200');
                } else {
                    nameContainer.classList.remove('line-through', 'text-stone-500');
                    nameContainer.classList.add('text-stone-200');
                }
                bar.classList.remove('bg-amber-600');
                bar.classList.add('bg-stone-600');
                input.classList.remove('border-amber-800');
                input.classList.add('border-stone-600');
            }
            bar.style.width = progress + '%';
        }
        
        if(document.activeElement !== input) {
            input.value = stock;
        }
    });

    let banner = document.getElementById('status-banner');
    if (allReady) {
        banner.innerHTML = `
            <div class="p-4 bg-amber-900/20 border border-amber-600/50 rounded-sm flex items-center justify-center gap-3 ready-glow transition-all duration-500">
               <span class="forge-title text-amber-400 text-lg tracking-[0.2em]">READY TO FORGE</span>
               <span class="text-2xl">⚒</span>
            </div>
        `;
    } else {
        banner.innerHTML = `
            <div class="p-4 bg-stone-900 border border-stone-700/60 rounded-sm flex items-center justify-between gap-3">
               <span class="forge-title text-stone-400 text-xs tracking-widest uppercase">Missing Materials</span>
               <span class="forge-title text-amber-500 text-xl font-bold">${totalMissing}</span>
            </div>
        `;
    }
}

fetchCalc();
