/* ===================== Huishoudboekje ===================== */

const STORAGE_KEY = 'huishoudboekje_v1';

const DEFAULT_CATEGORIES = [
  { id: 'woning',       name: 'Woning',                    color: '#3C5A47', isTransfer: false },
  { id: 'boodschappen', name: 'Boodschappen',               color: '#AD7E24', isTransfer: false },
  { id: 'verzekeringen',name: 'Verzekeringen',              color: '#4B6584', isTransfer: false },
  { id: 'kleding',      name: 'Kleding',                    color: '#C98A96', isTransfer: false },
  { id: 'hobby',        name: 'Hobby',                      color: '#4E8B8B', isTransfer: false },
  { id: 'uiteten',      name: 'Uit eten',                   color: '#AE5138', isTransfer: false },
  { id: 'vervoer',      name: 'Vervoer',                    color: '#7C8B4A', isTransfer: false },
  { id: 'abonnementen', name: 'Abonnementen',               color: '#7E6A8F', isTransfer: false },
  { id: 'zorg',         name: 'Zorg',                       color: '#6E9BB5', isTransfer: false },
  { id: 'verzorging',   name: 'Persoonlijke verzorging',    color: '#D89A7A', isTransfer: false },
  { id: 'inkomen',      name: 'Inkomen',                    color: '#2A4534', isTransfer: false },
  { id: 'sparen',       name: 'Sparen (naar spaarrekening)',color: '#C9A227', isTransfer: true  },
  { id: 'onderling',    name: 'Onderlinge overboeking',     color: '#B5AC94', isTransfer: true  },
  { id: 'overig',       name: 'Overig',                     color: '#96A0A6', isTransfer: false },
];

const DEFAULT_RULES = [
  { keyword: 'albert heijn', category: 'boodschappen' },
  { keyword: 'ah to go', category: 'boodschappen' },
  { keyword: 'jumbo', category: 'boodschappen' },
  { keyword: 'lidl', category: 'boodschappen' },
  { keyword: 'plus ', category: 'boodschappen' },
  { keyword: 'aldi', category: 'boodschappen' },
  { keyword: 'dirk', category: 'boodschappen' },
  { keyword: 'ziggo', category: 'abonnementen' },
  { keyword: 'kpn', category: 'abonnementen' },
  { keyword: 'netflix', category: 'abonnementen' },
  { keyword: 'spotify', category: 'abonnementen' },
  { keyword: 'videoland', category: 'abonnementen' },
  { keyword: 'zilveren kruis', category: 'verzekeringen' },
  { keyword: 'vgz', category: 'verzekeringen' },
  { keyword: ' cz ', category: 'verzekeringen' },
  { keyword: 'centraal beheer', category: 'verzekeringen' },
  { keyword: 'ns groep', category: 'vervoer' },
  { keyword: 'ns-zakelijk', category: 'vervoer' },
  { keyword: 'shell', category: 'vervoer' },
  { keyword: 'q-park', category: 'vervoer' },
  { keyword: 'esso', category: 'vervoer' },
  { keyword: 'h&m', category: 'kleding' },
  { keyword: 'zalando', category: 'kleding' },
  { keyword: 'bijenkorf', category: 'kleding' },
  { keyword: 'thuisbezorgd', category: 'uiteten' },
  { keyword: 'uber eats', category: 'uiteten' },
  { keyword: 'uber   eats', category: 'uiteten' },
  { keyword: 'salaris', category: 'inkomen' },
  { keyword: 'loon', category: 'inkomen' },
];

let state = loadState();

function defaultState(){
  return {
    people: { p1: 'Persoon 1', p2: 'Persoon 2' },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
    transactions: [], // {id, date, person, description, tegenrekening, amount, category}
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // basic shape guard
    if(!parsed.people || !parsed.categories || !parsed.transactions) return defaultState();
    if(!parsed.rules) parsed.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    return parsed;
  }catch(e){
    console.error('Kon opgeslagen data niet lezen, begin opnieuw.', e);
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ===================== Helpers ===================== */

function formatEUR(n){
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

function monthKey(dateStr){ return dateStr.slice(0,7); }
function yearKey(dateStr){ return dateStr.slice(0,4); }

function monthLabel(key){
  const [y,m] = key.split('-');
  const names = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
  return `${names[parseInt(m,10)-1]} ${y}`;
}

function categoryById(id){
  return state.categories.find(c => c.id === id);
}

function simpleHash(str){
  let h = 5381;
  for(let i=0;i<str.length;i++){
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & h;
  }
  return (h >>> 0).toString(36);
}

function uid(prefix){
  return prefix + '_' + Math.random().toString(36).slice(2,9);
}

/* ===================== CSV parsing ===================== */

function parseCSV(text, delimiter){
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  text = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  for(let i=0;i<text.length;i++){
    const c = text[i];
    if(inQuotes){
      if(c === '"'){
        if(text[i+1] === '"'){ field += '"'; i++; }
        else{ inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if(c === '"'){ inQuotes = true; }
      else if(c === delimiter){ row.push(field); field = ''; }
      else if(c === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
      else{ field += c; }
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length===1 && r[0].trim() !== ''));
}

function parseINGAmount(str){
  if(!str) return 0;
  let s = str.trim();
  // Some ING exports use a stray whitespace/tab instead of a comma as decimal
  // separator (e.g. "24\t90" meaning 24,90). Normalise that to a comma first.
  s = s.replace(/(\d)[\t ]+(\d{1,2})$/, '$1,$2');
  // Remove thousands separators (dots), then use comma as decimal point.
  s = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(s) || 0;
}

function parseINGDate(str){
  str = str.trim();
  if(str.length === 8){
    return `${str.slice(0,4)}-${str.slice(4,6)}-${str.slice(6,8)}`;
  }
  return str;
}

function findColumnIndex(header, ...names){
  const lower = header.map(h => h.trim().toLowerCase());
  for(const name of names){
    const idx = lower.indexOf(name);
    if(idx !== -1) return idx;
  }
  return -1;
}

function findCategoryForDescription(desc){
  const lower = desc.toLowerCase();
  for(const rule of state.rules){
    if(lower.includes(rule.keyword.toLowerCase())){
      return rule.category;
    }
  }
  return null;
}

function rowLooksLikeHeader(row){
  // A header row contains column names like "Datum"; a data row starts with
  // an 8-digit date (yyyymmdd). Some newer ING exports have no header at all.
  const first = (row[0] || '').trim();
  if(/^\d{8}$/.test(first)) return false;
  return row.some(c => c.trim().toLowerCase().includes('datum'));
}

function parseINGFile(text, personKey){
  const rows = parseCSV(text, ';');
  if(rows.length < 1) return { added: 0, duplicates: 0, needsCategory: 0 };

  const hasHeader = rowLooksLikeHeader(rows[0]);
  let idxDatum, idxNaam, idxTegen, idxAfBij, idxBedrag, idxMeded, dataStart;

  if(hasHeader){
    const header = rows[0];
    idxDatum = findColumnIndex(header, 'datum');
    idxNaam = findColumnIndex(header, 'naam / omschrijving', 'naam/omschrijving');
    idxTegen = findColumnIndex(header, 'tegenrekening');
    idxAfBij = findColumnIndex(header, 'af bij', 'af/bij');
    idxBedrag = findColumnIndex(header, 'bedrag (eur)', 'bedrag');
    idxMeded = findColumnIndex(header, 'mededelingen');
    dataStart = 1;
  } else {
    // No header present: fall back to the fixed ING column order
    // Datum;Naam/Omschrijving;Rekening;Tegenrekening;Code;Af Bij (of Debit/Credit);Bedrag;Mutatiesoort;Mededelingen;...
    idxDatum = 0; idxNaam = 1; idxTegen = 3; idxAfBij = 5; idxBedrag = 6; idxMeded = 8;
    dataStart = 0;
  }

  let added = 0, duplicates = 0, needsCategory = 0;
  const existingIds = new Set(state.transactions.map(t => t.id));

  for(let i=dataStart;i<rows.length;i++){
    const r = rows[i];
    if(!r || r.length < 2) continue;
    const date = parseINGDate(r[idxDatum] || '');
    const naam = (r[idxNaam] || '').trim();
    const tegen = idxTegen !== -1 ? (r[idxTegen] || '').trim() : '';
    const afbij = idxAfBij !== -1 ? (r[idxAfBij] || '').trim().toLowerCase() : '';
    let amount = parseINGAmount(r[idxBedrag] || '0');
    if(afbij === 'af' || afbij === 'debit') amount = -Math.abs(amount);
    else if(afbij === 'bij' || afbij === 'credit') amount = Math.abs(amount);
    const mededelingen = idxMeded !== -1 ? (r[idxMeded] || '').trim() : '';
    const fullDesc = (naam + ' ' + mededelingen).trim();

    if(!date || !naam) continue;

    const id = simpleHash([personKey, date, amount.toFixed(2), naam, tegen, mededelingen].join('|'));
    if(existingIds.has(id)){ duplicates++; continue; }

    const category = findCategoryForDescription(fullDesc);
    if(!category) needsCategory++;

    state.transactions.push({
      id, date, person: personKey,
      description: naam,
      details: mededelingen,
      tegenrekening: tegen,
      amount,
      category,
    });
    existingIds.add(id);
    added++;
  }
  return { added, duplicates, needsCategory };
}

/* ===================== Aggregation ===================== */

function getMonthsAvailable(){
  return [...new Set(state.transactions.map(t => monthKey(t.date)))].sort();
}
function getYearsAvailable(){
  return [...new Set(state.transactions.map(t => yearKey(t.date)))].sort();
}

function aggregate(transactions){
  const incomeByPerson = { p1: 0, p2: 0 };
  const expenseByPerson = { p1: 0, p2: 0 };
  const categoryTotals = {}; // catId -> total expense (abs)
  const categoryByPerson = {}; // catId -> {p1,p2}

  for(const t of transactions){
    const cat = t.category ? categoryById(t.category) : null;
    if(cat && cat.isTransfer) continue; // skip internal transfers/savings moves from totals

    if(t.amount >= 0){
      incomeByPerson[t.person] = (incomeByPerson[t.person] || 0) + t.amount;
    } else {
      const abs = Math.abs(t.amount);
      expenseByPerson[t.person] = (expenseByPerson[t.person] || 0) + abs;
      const catId = t.category || 'overig';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + abs;
      if(!categoryByPerson[catId]) categoryByPerson[catId] = { p1: 0, p2: 0 };
      categoryByPerson[catId][t.person] = (categoryByPerson[catId][t.person] || 0) + abs;
    }
  }
  const totalIncome = incomeByPerson.p1 + incomeByPerson.p2;
  const totalExpense = expenseByPerson.p1 + expenseByPerson.p2;
  return {
    incomeByPerson, expenseByPerson, categoryTotals, categoryByPerson,
    totalIncome, totalExpense, net: totalIncome - totalExpense,
  };
}

/* ===================== Rendering: shared ===================== */

const charts = {}; // key -> Chart instance
function destroyChart(key){
  if(charts[key]){ charts[key].destroy(); delete charts[key]; }
}

function renderSaldoBand(el, agg, extraLabel){
  const netClass = agg.net >= 0 ? 'pos' : 'neg';
  el.innerHTML = `
    <div class="cell">
      <div class="k">Inkomsten</div>
      <div class="v pos">${formatEUR(agg.totalIncome)}</div>
    </div>
    <div class="cell">
      <div class="k">Uitgaven</div>
      <div class="v neg">${formatEUR(agg.totalExpense)}</div>
    </div>
    <div class="cell">
      <div class="k">${extraLabel || 'Spaarsaldo'}</div>
      <div class="v ${netClass}">${formatEUR(agg.net)}</div>
    </div>
  `;
}

function renderCategoryTable(el, agg){
  const rows = Object.entries(agg.categoryTotals)
    .sort((a,b) => b[1]-a[1]);
  const p1 = state.people.p1, p2 = state.people.p2;
  let html = `<thead><tr><th>Categorie</th><th class="num">${p1}</th><th class="num">${p2}</th><th class="num">Totaal</th></tr></thead><tbody>`;
  if(rows.length === 0){
    html += `<tr><td colspan="4" class="empty-state">Nog geen uitgaven in deze periode.</td></tr>`;
  }
  for(const [catId, total] of rows){
    const cat = categoryById(catId) || { name: catId, color: '#999' };
    const byP = agg.categoryByPerson[catId] || { p1:0, p2:0 };
    html += `<tr>
      <td><span class="cat-dot" style="background:${cat.color}"></span>${cat.name}</td>
      <td class="num">${formatEUR(byP.p1 || 0)}</td>
      <td class="num">${formatEUR(byP.p2 || 0)}</td>
      <td class="num">${formatEUR(total)}</td>
    </tr>`;
  }
  html += '</tbody>';
  el.innerHTML = html;
}

function renderCategoryPieChart(canvasId, agg){
  try{
    const ctx = document.getElementById(canvasId);
    destroyChart(canvasId);
    const entries = Object.entries(agg.categoryTotals).sort((a,b)=>b[1]-a[1]);
    const labels = entries.map(([id]) => (categoryById(id)||{name:id}).name);
    const data = entries.map(([,v]) => v);
    const colors = entries.map(([id]) => (categoryById(id)||{color:'#999'}).color);
    charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#FBFAF6' }] },
      options: {
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'IBM Plex Sans', size: 11 } } } },
        cutout: '58%',
      }
    });
  }catch(err){
    console.error('Kon grafiek niet tekenen:', err);
  }
}

function renderPersonBarChart(canvasId, agg){
  try{
    const ctx = document.getElementById(canvasId);
    destroyChart(canvasId);
    const entries = Object.entries(agg.categoryTotals).sort((a,b)=>b[1]-a[1]);
    const labels = entries.map(([id]) => (categoryById(id)||{name:id}).name);
    const p1data = entries.map(([id]) => (agg.categoryByPerson[id]||{}).p1 || 0);
    const p2data = entries.map(([id]) => (agg.categoryByPerson[id]||{}).p2 || 0);
    charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: state.people.p1, data: p1data, backgroundColor: '#3C5A47' },
          { label: state.people.p2, data: p2data, backgroundColor: '#AE5138' },
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'IBM Plex Sans', size: 11 } } } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { callback: v => formatEUR(v) } }
        }
      }
    });
  }catch(err){
    console.error('Kon grafiek niet tekenen:', err);
  }
}

/* ===================== Tab: Invoer (upload) ===================== */

function handleFileUpload(personKey, file){
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const result = parseINGFile(text, personKey);
    saveState();
    const resultEl = document.getElementById('uploadResult');
    resultEl.hidden = false;
    resultEl.innerHTML = `<strong>${state.people[personKey]}:</strong> ${result.added} nieuwe transacties toegevoegd, ${result.duplicates} overgeslagen (al bekend)${result.needsCategory ? `, <strong>${result.needsCategory}</strong> moeten nog gecategoriseerd worden` : ''}.`;
    refreshAll();
  };
  reader.readAsText(file, 'utf-8');
}

/* ===================== Tab: Categoriseren ===================== */

function renderCategorizeTab(){
  const list = document.getElementById('categorizeList');
  const empty = document.getElementById('categorizeEmpty');
  const uncategorized = state.transactions.filter(t => !t.category && t.amount < 0);
  const badge = document.getElementById('uncategorizedBadge');
  if(uncategorized.length){ badge.hidden = false; badge.textContent = uncategorized.length; }
  else{ badge.hidden = true; }

  if(uncategorized.length === 0){
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  uncategorized.sort((a,b) => b.date.localeCompare(a.date));

  list.innerHTML = uncategorized.map(t => {
    const options = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    return `
      <div class="categorize-item" data-id="${t.id}">
        <div class="desc">
          <div class="main">${escapeHtml(t.description)}</div>
          <div class="meta">${t.date} · ${state.people[t.person]}${t.details ? ' · ' + escapeHtml(t.details) : ''}</div>
        </div>
        <div class="amount num neg">${formatEUR(t.amount)}</div>
        <select class="select-input cat-select">
          <option value="">Kies categorie…</option>
          ${options}
        </select>
        <label class="remember">
          <input type="checkbox" class="remember-check" checked> onthoud dit
        </label>
        <button class="btn btn-solid btn-small save-cat">Opslaan</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.save-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.categorize-item');
      const id = item.dataset.id;
      const select = item.querySelector('.cat-select');
      const remember = item.querySelector('.remember-check').checked;
      const catId = select.value;
      if(!catId) { select.focus(); return; }
      const tx = state.transactions.find(t => t.id === id);
      tx.category = catId;
      if(remember){
        const keyword = tx.description.trim().toLowerCase().slice(0, 40);
        if(keyword && !state.rules.some(r => r.keyword.toLowerCase() === keyword)){
          state.rules.push({ keyword, category: catId });
        }
      }
      saveState();
      refreshAll();
    });
  });
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===================== Tab: Maand ===================== */

function renderMaandTab(){
  const select = document.getElementById('maandSelect');
  const months = getMonthsAvailable();
  const prevValue = select.value;
  select.innerHTML = months.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join('');
  if(months.length === 0){ select.innerHTML = '<option value="">Geen data</option>'; }
  else if(months.includes(prevValue)) select.value = prevValue;
  else select.value = months[months.length-1];

  const key = select.value;
  const txs = state.transactions.filter(t => monthKey(t.date) === key);
  const agg = aggregate(txs);

  renderSaldoBand(document.getElementById('maandSaldoBand'), agg);
  renderPersonBarChart('chartMaandPersonen', agg);
  renderCategoryPieChart('chartMaandCategorie', agg);
  renderCategoryTable(document.getElementById('tableMaandCategorie'), agg);

  const tableEl = document.getElementById('tableMaandTransacties');
  const sorted = [...txs].sort((a,b) => b.date.localeCompare(a.date));
  let html = `<thead><tr><th>Datum</th><th>Omschrijving</th><th>Wie</th><th>Categorie</th><th class="num">Bedrag</th></tr></thead><tbody>`;
  if(sorted.length === 0){
    html += `<tr><td colspan="5" class="empty-state">Geen transacties.</td></tr>`;
  }
  for(const t of sorted){
    const cat = t.category ? categoryById(t.category) : null;
    html += `<tr>
      <td>${t.date}</td>
      <td>${escapeHtml(t.description)}</td>
      <td><span class="person-tag">${state.people[t.person]}</span></td>
      <td>${cat ? `<span class="cat-dot" style="background:${cat.color}"></span>${cat.name}` : '<em>onbekend</em>'}</td>
      <td class="num ${t.amount >= 0 ? 'pos' : 'neg'}">${formatEUR(t.amount)}</td>
    </tr>`;
  }
  html += '</tbody>';
  tableEl.innerHTML = html;
}

/* ===================== Tab: Jaar ===================== */

function renderJaarTab(){
  const select = document.getElementById('jaarSelect');
  const years = getYearsAvailable();
  const prevValue = select.value;
  select.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  if(years.length === 0){ select.innerHTML = '<option value="">Geen data</option>'; }
  else if(years.includes(prevValue)) select.value = prevValue;
  else select.value = years[years.length-1];

  const year = select.value;
  const txs = state.transactions.filter(t => yearKey(t.date) === year);
  const agg = aggregate(txs);

  renderSaldoBand(document.getElementById('jaarSaldoBand'), agg, 'Gespaard dit jaar');
  renderCategoryPieChart('chartJaarCategorie', agg);
  renderPersonBarChart('chartJaarPersonen', agg);
  renderCategoryTable(document.getElementById('tableJaarCategorie'), agg);

  // Per-month breakdown within year
  const monthsInYear = [...new Set(txs.map(t => monthKey(t.date)))].sort();
  const labels = monthsInYear.map(m => monthLabel(m).split(' ')[0]);
  const incomeData = [], expenseData = [], netData = [];
  for(const m of monthsInYear){
    const mAgg = aggregate(txs.filter(t => monthKey(t.date) === m));
    incomeData.push(mAgg.totalIncome);
    expenseData.push(mAgg.totalExpense);
    netData.push(mAgg.net);
  }
  destroyChart('chartJaarMaanden');
  try{
    charts['chartJaarMaanden'] = new Chart(document.getElementById('chartJaarMaanden'), {
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'Inkomsten', data: incomeData, backgroundColor: '#B7D0BD' },
          { type: 'bar', label: 'Uitgaven', data: expenseData, backgroundColor: '#E3B7A7' },
          { type: 'line', label: 'Gespaard', data: netData, borderColor: '#AD7E24', backgroundColor: '#AD7E24', tension: 0.25, borderWidth: 2, pointRadius: 3 },
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'IBM Plex Sans', size: 11 } } } },
        scales: { y: { ticks: { callback: v => formatEUR(v) } } }
      }
    });
  }catch(err){
    console.error('Kon grafiek niet tekenen:', err);
  }
}

/* ===================== Tab: Totaal ===================== */

function renderTotaalTab(){
  const txs = state.transactions;
  const agg = aggregate(txs);
  renderSaldoBand(document.getElementById('totaalSaldoBand'), agg, 'Totaal gespaard');
  renderCategoryPieChart('chartTotaalCategorie', agg);
  renderPersonBarChart('chartTotaalPersonen', agg);
  renderCategoryTable(document.getElementById('tableTotaalCategorie'), agg);

  const months = getMonthsAvailable();
  const labels = months.map(monthLabel);
  let running = 0;
  const cumulative = [];
  const netPerMonth = [];
  for(const m of months){
    const mAgg = aggregate(txs.filter(t => monthKey(t.date) === m));
    running += mAgg.net;
    cumulative.push(running);
    netPerMonth.push(mAgg.net);
  }
  destroyChart('chartTotaalTijdlijn');
  try{
    charts['chartTotaalTijdlijn'] = new Chart(document.getElementById('chartTotaalTijdlijn'), {
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'Gespaard per maand', data: netPerMonth, backgroundColor: netPerMonth.map(v => v>=0 ? '#B7D0BD' : '#E3B7A7') },
          { type: 'line', label: 'Cumulatief spaarsaldo', data: cumulative, borderColor: '#2A4534', backgroundColor: '#2A4534', tension: 0.2, borderWidth: 2, pointRadius: 2 },
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'IBM Plex Sans', size: 11 } } } },
        scales: { y: { ticks: { callback: v => formatEUR(v) } }, x: { ticks: { maxRotation: 60, minRotation: 40, font: { size: 10 } } } }
      }
    });
  }catch(err){
    console.error('Kon grafiek niet tekenen:', err);
  }
}

/* ===================== Tab: Instellingen ===================== */

function renderInstellingenTab(){
  document.getElementById('nameInputP1').value = state.people.p1;
  document.getElementById('nameInputP2').value = state.people.p2;

  const catList = document.getElementById('categoryManageList');
  catList.innerHTML = state.categories.map(c => `
    <div class="category-manage-row" data-id="${c.id}">
      <input type="color" value="${c.color}" class="cat-color">
      <input type="text" value="${escapeHtml(c.name)}" class="text-input name-input">
      <label style="font-size:11.5px;color:var(--ink-soft);display:flex;align-items:center;gap:4px;">
        <input type="checkbox" class="cat-transfer" ${c.isTransfer ? 'checked' : ''}> telt niet mee in saldo
      </label>
      <button class="remove-btn" title="Verwijderen">✕</button>
    </div>
  `).join('');

  catList.querySelectorAll('.category-manage-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('.cat-color').addEventListener('input', (e) => {
      const cat = categoryById(id);
      if(cat){ cat.color = e.target.value; saveState(); refreshAll(); }
    });
    row.querySelector('.name-input').addEventListener('change', (e) => {
      const cat = categoryById(id);
      const newName = e.target.value.trim();
      if(cat && newName){ cat.name = newName; saveState(); refreshAll(); }
    });
    row.querySelector('.cat-transfer').addEventListener('change', (e) => {
      const cat = categoryById(id);
      if(cat){ cat.isTransfer = e.target.checked; saveState(); refreshAll(); }
    });
    row.querySelector('.remove-btn').addEventListener('click', () => {
      if(state.transactions.some(t => t.category === id)){
        alert('Deze categorie is nog in gebruik bij transacties en kan niet verwijderd worden. Ken die transacties eerst een andere categorie toe.');
        return;
      }
      const cat = categoryById(id);
      if(!confirm(`Categorie "${cat ? cat.name : id}" verwijderen?`)) return;
      state.categories = state.categories.filter(c => c.id !== id);
      state.rules = state.rules.filter(r => r.category !== id);
      saveState(); refreshAll();
    });
  });

  const ruleSelect = document.getElementById('newRuleCategory');
  ruleSelect.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const ruleList = document.getElementById('ruleManageList');
  ruleList.innerHTML = state.rules.map((r, i) => `
    <div class="rule-manage-row" data-i="${i}">
      <span class="kw">${escapeHtml(r.keyword)}</span>
      <span class="cat">→ ${(categoryById(r.category)||{name:'?'}).name}</span>
      <button class="remove-btn" title="Verwijderen">✕</button>
    </div>
  `).join('');
  ruleList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.closest('.rule-manage-row').dataset.i, 10);
      state.rules.splice(i, 1);
      saveState(); refreshAll();
    });
  });
}

/* ===================== Header saldo strip ===================== */

function renderHeaderStrip(){
  const el = document.getElementById('headerSaldoStrip');
  const months = getMonthsAvailable();
  const totalAgg = aggregate(state.transactions);
  let html = `<div class="saldo-chip"><span class="k">Totaal gespaard</span><span class="v ${totalAgg.net>=0?'pos':'neg'}">${formatEUR(totalAgg.net)}</span></div>`;
  if(months.length){
    const lastMonth = months[months.length-1];
    const mAgg = aggregate(state.transactions.filter(t => monthKey(t.date) === lastMonth));
    html += `<div class="saldo-chip"><span class="k">${monthLabel(lastMonth)}</span><span class="v ${mAgg.net>=0?'pos':'neg'}">${formatEUR(mAgg.net)}</span></div>`;
  }
  el.innerHTML = html;
}

/* ===================== Refresh / Tabs ===================== */

function refreshAll(){
  const steps = [
    ['header', renderHeaderStrip],
    ['categoriseren', renderCategorizeTab],
    ['maand', renderMaandTab],
    ['jaar', renderJaarTab],
    ['totaal', renderTotaalTab],
    ['instellingen', renderInstellingenTab],
  ];
  for(const [name, fn] of steps){
    try{
      fn();
    }catch(err){
      // A failure in one section (e.g. a chart) must never block the others
      // from rendering, otherwise the whole app can appear "stuck".
      console.error(`Fout bij het bijwerken van "${name}":`, err);
    }
  }
}

function switchTab(tabName){
  document.querySelectorAll('.tab-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + tabName));
}

/* ===================== Event wiring ===================== */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('labelPerson1').textContent = state.people.p1;
  document.getElementById('labelPerson2').textContent = state.people.p2;

  document.getElementById('tabRail').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-tab');
    if(btn) switchTab(btn.dataset.tab);
  });

  document.getElementById('btnPerson1').addEventListener('click', () => document.getElementById('filePerson1').click());
  document.getElementById('btnPerson2').addEventListener('click', () => document.getElementById('filePerson2').click());
  document.getElementById('filePerson1').addEventListener('change', (e) => {
    const f = e.target.files[0]; if(!f) return;
    document.getElementById('filenamePerson1').textContent = f.name;
    handleFileUpload('p1', f);
  });
  document.getElementById('filePerson2').addEventListener('change', (e) => {
    const f = e.target.files[0]; if(!f) return;
    document.getElementById('filenamePerson2').textContent = f.name;
    handleFileUpload('p2', f);
  });

  document.getElementById('maandSelect').addEventListener('change', renderMaandTab);
  document.getElementById('jaarSelect').addEventListener('change', renderJaarTab);

  document.getElementById('nameInputP1').addEventListener('input', (e) => {
    state.people.p1 = e.target.value || 'Persoon 1';
    document.getElementById('labelPerson1').textContent = state.people.p1;
    saveState(); refreshAll();
  });
  document.getElementById('nameInputP2').addEventListener('input', (e) => {
    state.people.p2 = e.target.value || 'Persoon 2';
    document.getElementById('labelPerson2').textContent = state.people.p2;
    saveState(); refreshAll();
  });

  document.getElementById('btnAddCategory').addEventListener('click', () => {
    const nameInput = document.getElementById('newCategoryName');
    const colorInput = document.getElementById('newCategoryColor');
    const name = nameInput.value.trim();
    if(!name) return;
    const id = uid('cat');
    state.categories.push({ id, name, color: colorInput.value, isTransfer: false });
    nameInput.value = '';
    saveState(); refreshAll();
  });

  document.getElementById('btnAddRule').addEventListener('click', () => {
    const kwInput = document.getElementById('newRuleKeyword');
    const catSelect = document.getElementById('newRuleCategory');
    const keyword = kwInput.value.trim().toLowerCase();
    if(!keyword) return;
    state.rules.unshift({ keyword, category: catSelect.value });
    kwInput.value = '';
    saveState(); refreshAll();
  });

  document.getElementById('btnExportData').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `huishoudboekje-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btnImportData').addEventListener('click', () => document.getElementById('fileImportData').click());
  document.getElementById('fileImportData').addEventListener('change', (e) => {
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try{
        const imported = JSON.parse(ev.target.result);
        if(!imported.transactions || !imported.categories || !imported.people){
          alert('Dit bestand lijkt geen geldige back-up te zijn.');
          return;
        }
        state = imported;
        if(!state.rules) state.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
        saveState();
        document.getElementById('labelPerson1').textContent = state.people.p1;
        document.getElementById('labelPerson2').textContent = state.people.p2;
        refreshAll();
        alert('Back-up ingeladen.');
      }catch(err){
        alert('Kon het bestand niet lezen: ' + err.message);
      }
    };
    reader.readAsText(f, 'utf-8');
  });

  document.getElementById('btnResetData').addEventListener('click', () => {
    if(confirm('Weet je zeker dat je alle data wilt wissen? Maak eerst een back-up als je die nog wilt bewaren.')){
      state = defaultState();
      saveState();
      document.getElementById('labelPerson1').textContent = state.people.p1;
      document.getElementById('labelPerson2').textContent = state.people.p2;
      refreshAll();
    }
  });

  refreshAll();
});
