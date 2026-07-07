/* ===================== Huishoudboekje ===================== */

const STORAGE_KEY = 'huishoudboekje_v1';

const DEFAULT_CATEGORIES = [
  { id: 'woning',       name: 'Woning',                    color: '#3C5A47', isTransfer: false, isFixed: true  },
  { id: 'boodschappen', name: 'Boodschappen',               color: '#AD7E24', isTransfer: false, isFixed: false },
  { id: 'verzekeringen',name: 'Verzekeringen',              color: '#4B6584', isTransfer: false, isFixed: true  },
  { id: 'kleding',      name: 'Kleding',                    color: '#C98A96', isTransfer: false, isFixed: false },
  { id: 'hobby',        name: 'Hobby',                      color: '#4E8B8B', isTransfer: false, isFixed: false },
  { id: 'uiteten',      name: 'Uit eten',                   color: '#AE5138', isTransfer: false, isFixed: false },
  { id: 'vervoer',      name: 'Vervoer',                    color: '#7C8B4A', isTransfer: false, isFixed: false },
  { id: 'abonnementen', name: 'Abonnementen',               color: '#7E6A8F', isTransfer: false, isFixed: true  },
  { id: 'zorg',         name: 'Zorg',                       color: '#6E9BB5', isTransfer: false, isFixed: false },
  { id: 'verzorging',   name: 'Persoonlijke verzorging',    color: '#D89A7A', isTransfer: false, isFixed: false },
  { id: 'inkomen',      name: 'Inkomen',                    color: '#2A4534', isTransfer: false, isFixed: false },
  { id: 'sparen',       name: 'Sparen (naar spaarrekening)',color: '#C9A227', isTransfer: true,  isFixed: false },
  { id: 'aflossing',    name: 'Aflossing schuld',           color: '#8A6E5C', isTransfer: true,  isFixed: false },
  { id: 'onderling',    name: 'Onderlinge overboeking',     color: '#B5AC94', isTransfer: true,  isFixed: false },
  { id: 'overig',       name: 'Overig',                     color: '#96A0A6', isTransfer: false, isFixed: false },
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
  { keyword: 'duo', category: 'aflossing' },
];

let state = loadState();

function defaultState(){
  return {
    people: { p1: 'Persoon 1', p2: 'Persoon 2' },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
    transactions: [], // {id, date, person, description, tegenrekening, amount, category, potId, debtId}
    pots: [], // {id, name, owner: 'p1'|'p2'|'samen', startBalance, color}
    potRules: [], // {keyword, potId} matched against tegenrekening + omschrijving
    debts: [], // {id, name, owner, type:'lening'|'hypotheek', referenceDate, referenceBalance, interestRate, monthlyPayment, wozValue}
    debtRules: [], // {keyword, debtId}
    dismissedSubscriptions: [], // normalized description keys the user hid from the abonnementen-detector
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
    if(!parsed.pots) parsed.pots = [];
    if(!parsed.potRules) parsed.potRules = [];
    if(!parsed.debts) parsed.debts = [];
    if(!parsed.debtRules) parsed.debtRules = [];
    if(!parsed.dismissedSubscriptions) parsed.dismissedSubscriptions = [];
    // categories saved before the 'Aflossing schuld' category / isFixed flag existed
    if(!parsed.categories.some(c => c.id === 'aflossing')){
      parsed.categories.push({ id: 'aflossing', name: 'Aflossing schuld', color: '#8A6E5C', isTransfer: true, isFixed: false });
    }
    for(const c of parsed.categories){ if(typeof c.isFixed !== 'boolean') c.isFixed = false; }
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

function reapplyRules(){
  let changed = 0;
  for(const t of state.transactions){
    if(t.amount >= 0) continue; // rules are only meant for expenses
    const fullDesc = (t.description + ' ' + (t.details || '')).trim();
    const matched = findCategoryForDescription(fullDesc);
    if(matched && matched !== t.category){
      t.category = matched;
      changed++;
    }
    maybeAutoAssignPot(t);
    maybeAutoAssignDebt(t);
  }
  return changed;
}

/* ----- Spaarpotjes (Vermogensopbouw) ----- */

function potById(id){
  return state.pots.find(p => p.id === id);
}

function findPotForTransaction(t){
  const haystack = [t.tegenrekening || '', t.description || '', t.details || ''].join(' ').toLowerCase();
  for(const rule of state.potRules){
    if(rule.keyword && haystack.includes(rule.keyword.toLowerCase())){
      return rule.potId;
    }
  }
  return null;
}

function maybeAutoAssignPot(t){
  if(t.category === 'sparen' && !t.potId){
    const matched = findPotForTransaction(t);
    if(matched) t.potId = matched;
  }
}

function reapplyPotRules(){
  let changed = 0;
  for(const t of state.transactions){
    if(t.category !== 'sparen') continue;
    const matched = findPotForTransaction(t);
    if(matched && matched !== t.potId){
      t.potId = matched;
      changed++;
    }
  }
  return changed;
}

function getSparenTransactions(){
  return state.transactions.filter(t => t.category === 'sparen');
}

function computePotBalance(potId){
  const pot = potById(potId);
  if(!pot) return 0;
  let balance = pot.startBalance || 0;
  for(const t of state.transactions){
    if(t.potId === potId) balance += -t.amount; // money leaving checking = deposit into pot
  }
  return balance;
}

/* ----- Schulden (leningen, hypotheek) ----- */

function debtById(id){
  return state.debts.find(d => d.id === id);
}

function findDebtForTransaction(t){
  const haystack = [t.tegenrekening || '', t.description || '', t.details || ''].join(' ').toLowerCase();
  for(const rule of state.debtRules){
    if(rule.keyword && haystack.includes(rule.keyword.toLowerCase())){
      return rule.debtId;
    }
  }
  return null;
}

function maybeAutoAssignDebt(t){
  if(t.category === 'aflossing' && !t.debtId){
    const matched = findDebtForTransaction(t);
    if(matched) t.debtId = matched;
  }
}

function reapplyDebtRules(){
  let changed = 0;
  for(const t of state.transactions){
    if(t.category !== 'aflossing') continue;
    const matched = findDebtForTransaction(t);
    if(matched && matched !== t.debtId){
      t.debtId = matched;
      changed++;
    }
  }
  return changed;
}

function getAflossingTransactions(){
  return state.transactions.filter(t => t.category === 'aflossing');
}

/**
 * Openstaand saldo = het handmatig ingevoerde referentiesaldo op de
 * referentiedatum, plus/min alle gekoppelde aflossingen ÉN latere transacties.
 * Transacties vóór de referentiedatum tellen niet mee, zodat je het saldo
 * altijd kunt "resetten" aan de hand van een officieel jaaroverzicht zonder
 * dubbeltellingen.
 */
function computeDebtBalance(debtId){
  const debt = debtById(debtId);
  if(!debt) return 0;
  let balance = debt.referenceBalance || 0;
  const refDate = debt.referenceDate || '0000-00-00';
  for(const t of state.transactions){
    if(t.debtId === debtId && t.date > refDate) balance += t.amount;
  }
  return balance;
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

    const newTx = {
      id, date, person: personKey,
      description: naam,
      details: mededelingen,
      tegenrekening: tegen,
      amount,
      category,
      potId: null,
      debtId: null,
    };
    maybeAutoAssignPot(newTx);
    maybeAutoAssignDebt(newTx);
    state.transactions.push(newTx);
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
  let fixedExpense = 0, variableExpense = 0;

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
      if(cat && cat.isFixed) fixedExpense += abs; else variableExpense += abs;
    }
  }
  const totalIncome = incomeByPerson.p1 + incomeByPerson.p2;
  const totalExpense = expenseByPerson.p1 + expenseByPerson.p2;
  return {
    incomeByPerson, expenseByPerson, categoryTotals, categoryByPerson,
    totalIncome, totalExpense, net: totalIncome - totalExpense,
    fixedExpense, variableExpense,
  };
}

/* ===================== Rendering: shared ===================== */

function renderFixedVariableBar(mountId, agg){
  const el = document.getElementById(mountId);
  if(!el) return;
  const total = agg.fixedExpense + agg.variableExpense;
  if(total <= 0){
    el.innerHTML = '<p class="empty-state">Nog geen uitgaven in deze periode.</p>';
    return;
  }
  const fixedPct = Math.round((agg.fixedExpense / total) * 100);
  const varPct = 100 - fixedPct;
  el.innerHTML = `
    <div class="fixed-var-bar">
      <div class="fixed-var-seg fixed" style="width:${fixedPct}%"></div>
      <div class="fixed-var-seg variable" style="width:${varPct}%"></div>
    </div>
    <div class="fixed-var-legend">
      <span><span class="cat-dot" style="background:#3C5A47"></span>Vaste lasten &mdash; ${formatEUR(agg.fixedExpense)} (${fixedPct}%)</span>
      <span><span class="cat-dot" style="background:#C9A227"></span>Variabele uitgaven &mdash; ${formatEUR(agg.variableExpense)} (${varPct}%)</span>
    </div>
  `;
}

function escapeAttr(str){
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

function renderCategoryDonut(mountId, agg){
  const el = document.getElementById(mountId);
  if(!el) return;
  const entries = Object.entries(agg.categoryTotals).sort((a,b) => b[1]-a[1]);
  const total = entries.reduce((s,[,v]) => s+v, 0);
  if(entries.length === 0 || total <= 0){
    el.innerHTML = '<p class="empty-state">Nog geen uitgaven in deze periode.</p>';
    return;
  }
  const size = 176, radius = 68, stroke = 24, c = size/2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  let arcs = '';
  for(const [id, val] of entries){
    const cat = categoryById(id) || { name: id, color: '#96A0A6' };
    const frac = val / total;
    const dash = Math.max(frac * circumference, 0.6); // keep tiny slivers visible
    arcs += `<circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="${cat.color}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${c} ${c})"><title>${escapeAttr(cat.name)}: ${formatEUR(val)}</title></circle>`;
    offset += dash;
  }
  const legend = entries.map(([id, val]) => {
    const cat = categoryById(id) || { name: id, color: '#96A0A6' };
    const pct = Math.round((val/total) * 100);
    return `<div class="legend-row"><span class="cat-dot" style="background:${cat.color}"></span>${cat.name}<span class="legend-val">${formatEUR(val)} · ${pct}%</span></div>`;
  }).join('');
  el.innerHTML = `
    <div class="donut-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Uitgaven per categorie">${arcs}</svg>
      <div class="donut-legend">${legend}</div>
    </div>
  `;
}

/**
 * Zelfde donut+legende-vorm als renderCategoryDonut, maar het aandeel wordt
 * berekend t.o.v. het verdiende inkomen in plaats van t.o.v. de totale
 * uitgaven. Geeft ook een "resterend inkomen"-segment, of een waarschuwing
 * als er in deze periode meer is uitgegeven dan er is binnengekomen.
 */
function renderCategoryDonutVsIncome(mountId, agg){
  const el = document.getElementById(mountId);
  if(!el) return;
  const entries = Object.entries(agg.categoryTotals).sort((a,b) => b[1]-a[1]);
  if(agg.totalIncome <= 0){
    el.innerHTML = '<p class="empty-state">Geen inkomen bekend in deze periode om uitgaven tegen af te zetten.</p>';
    return;
  }
  if(entries.length === 0){
    el.innerHTML = '<p class="empty-state">Nog geen uitgaven in deze periode.</p>';
    return;
  }

  const denom = agg.totalIncome;
  const overspent = agg.totalExpense > denom;
  const visualScale = overspent ? denom / agg.totalExpense : 1; // keep the circle whole even when overspent

  const size = 176, radius = 68, stroke = 24, c = size/2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  let arcs = '';
  for(const [id, val] of entries){
    const cat = categoryById(id) || { name: id, color: '#96A0A6' };
    const frac = (val / denom) * visualScale;
    const dash = Math.max(frac * circumference, 0.6);
    const realPct = Math.round((val/denom) * 100);
    arcs += `<circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="${cat.color}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${c} ${c})"><title>${escapeAttr(cat.name)}: ${formatEUR(val)} (${realPct}% van inkomen)</title></circle>`;
    offset += dash;
  }
  let remainingRow = '';
  if(!overspent){
    const remaining = denom - agg.totalExpense;
    const remFrac = remaining / denom;
    const dash = Math.max(remFrac * circumference, 0.6);
    arcs += `<circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="#D8D0BC" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${c} ${c})"><title>Nog niet uitgegeven: ${formatEUR(remaining)}</title></circle>`;
    const remPct = Math.round(remFrac * 100);
    remainingRow = `<div class="legend-row"><span class="cat-dot" style="background:#D8D0BC"></span>Resterend (niet uitgegeven)<span class="legend-val">${formatEUR(remaining)} · ${remPct}%</span></div>`;
  }

  const legend = entries.map(([id, val]) => {
    const cat = categoryById(id) || { name: id, color: '#96A0A6' };
    const pct = Math.round((val/denom) * 100);
    return `<div class="legend-row"><span class="cat-dot" style="background:${cat.color}"></span>${cat.name}<span class="legend-val">${formatEUR(val)} · ${pct}%</span></div>`;
  }).join('') + remainingRow;

  const warning = overspent
    ? `<p class="panel-lead-small" style="color:var(--brick);margin-top:10px;">Let op: de uitgaven deze periode (${formatEUR(agg.totalExpense)}) zijn hoger dan het inkomen (${formatEUR(agg.totalIncome)}). De percentages hierboven zijn t.o.v. het inkomen; de taartpunten zijn naar verhouding verkleind zodat ze in de cirkel passen.</p>`
    : '';

  el.innerHTML = `
    <div class="donut-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Uitgaven per categorie t.o.v. inkomen">${arcs}</svg>
      <div class="donut-legend">${legend}</div>
    </div>
    ${warning}
  `;
}

function renderPersonBars(mountId, agg){
  const el = document.getElementById(mountId);
  if(!el) return;
  const entries = Object.entries(agg.categoryTotals).sort((a,b) => b[1]-a[1]);
  if(entries.length === 0){
    el.innerHTML = '<p class="empty-state">Nog geen uitgaven in deze periode.</p>';
    return;
  }
  const max = Math.max(1, ...entries.map(([id]) => {
    const bp = agg.categoryByPerson[id] || {};
    return Math.max(bp.p1 || 0, bp.p2 || 0);
  }));
  const blocks = entries.map(([id]) => {
    const cat = categoryById(id) || { name: id };
    const bp = agg.categoryByPerson[id] || {};
    const w1 = Math.round(((bp.p1 || 0) / max) * 100);
    const w2 = Math.round(((bp.p2 || 0) / max) * 100);
    return `
      <div class="bar-block">
        <div class="bar-cat-label">${cat.name}</div>
        <div class="bar-row"><div class="bar-track"><div class="bar-fill p1" style="width:${w1}%"></div></div><span class="bar-val">${formatEUR(bp.p1 || 0)}</span></div>
        <div class="bar-row"><div class="bar-track"><div class="bar-fill p2" style="width:${w2}%"></div></div><span class="bar-val">${formatEUR(bp.p2 || 0)}</span></div>
      </div>
    `;
  }).join('');
  el.innerHTML = `
    <div class="bar-legend">
      <span><span class="cat-dot" style="background:#3C5A47"></span>${state.people.p1}</span>
      <span><span class="cat-dot" style="background:#AE5138"></span>${state.people.p2}</span>
    </div>
    ${blocks}
  `;
}

/**
 * Dependency-free combo chart (grouped/overlaid bars + an optional line),
 * drawn as plain SVG so it never depends on an external charting library.
 * bars: [{ label, color, data: number[] }]
 * line: { label, color, data: number[] } | null
 */
function renderComboChart(mountId, labels, bars, line){
  const el = document.getElementById(mountId);
  if(!el) return;
  if(labels.length === 0){
    el.innerHTML = '<p class="empty-state">Nog geen data.</p>';
    return;
  }
  const width = Math.max(460, labels.length * 74);
  const height = 250;
  const padL = 58, padR = 14, padT = 12, padB = 46;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allVals = bars.flatMap(b => b.data).concat(line ? line.data : []);
  const maxVal = Math.max(0, ...allVals);
  const minVal = Math.min(0, ...allVals);
  const range = (maxVal - minVal) || 1;
  const yOf = v => padT + plotH - ((v - minVal) / range) * plotH;
  const zeroY = yOf(0);

  const slotW = plotW / labels.length;
  const groupW = slotW * 0.68;
  const barW = bars.length ? groupW / bars.length : 0;

  let rects = '';
  labels.forEach((lab, i) => {
    const groupX = padL + i * slotW + (slotW - groupW) / 2;
    bars.forEach((b, bi) => {
      const val = b.data[i] || 0;
      const x = groupX + bi * barW;
      const y = Math.min(yOf(val), zeroY);
      const h = Math.max(Math.abs(yOf(val) - zeroY), 0.6);
      const fill = typeof b.colorFn === 'function' ? b.colorFn(val) : b.color;
      rects += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(barW - 3, 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" rx="1.5">
        <title>${escapeAttr(b.label)} — ${escapeAttr(lab)}: ${formatEUR(val)}</title></rect>`;
    });
  });

  let linePath = '';
  if(line){
    const pts = labels.map((lab, i) => {
      const x = padL + i * slotW + slotW / 2;
      const y = yOf(line.data[i] || 0);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const circles = labels.map((lab, i) => {
      const x = padL + i * slotW + slotW / 2;
      const y = yOf(line.data[i] || 0);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${line.color}">
        <title>${escapeAttr(line.label)} — ${escapeAttr(lab)}: ${formatEUR(line.data[i] || 0)}</title></circle>`;
    }).join('');
    linePath = `<polyline points="${pts.join(' ')}" fill="none" stroke="${line.color}" stroke-width="2.5"/>${circles}`;
  }

  const ticks = 4;
  let gridLines = '';
  for(let t=0; t<=ticks; t++){
    const val = minVal + (range * t / ticks);
    const y = yOf(val);
    gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width-padR}" y2="${y.toFixed(1)}" stroke="#E9E3D5" stroke-width="1"/>
      <text x="${padL - 8}" y="${(y+3).toFixed(1)}" font-size="9.5" fill="#96A0A6" text-anchor="end">${Math.round(val).toLocaleString('nl-NL')}</text>`;
  }
  gridLines += `<line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${width-padR}" y2="${zeroY.toFixed(1)}" stroke="#B5AC94" stroke-width="1.2"/>`;

  const xLabels = labels.map((lab, i) => {
    const x = padL + i * slotW + slotW / 2;
    return `<text x="${x.toFixed(1)}" y="${height-10}" font-size="9.5" fill="#62707A" text-anchor="end" transform="rotate(-40 ${x.toFixed(1)} ${height-10})">${lab}</text>`;
  }).join('');

  const legend = bars.map(b => `<span><span class="cat-dot" style="background:${b.color}"></span>${b.label}</span>`).join('')
    + (line ? `<span><span class="cat-dot" style="background:${line.color}"></span>${line.label}</span>` : '');

  el.innerHTML = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
      ${gridLines}
      ${rects}
      ${linePath}
      ${xLabels}
    </svg>
    <div class="combo-chart-legend">${legend}</div>
  `;
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
      maybeAutoAssignPot(tx);
      maybeAutoAssignDebt(tx);
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
  renderFixedVariableBar('fixedVarMaand', agg);
  renderPersonBars('chartMaandPersonen', agg);
  renderCategoryDonut('chartMaandCategorie', agg);
  renderCategoryDonutVsIncome('chartMaandCategorieInkomen', agg);
  renderCategoryTable(document.getElementById('tableMaandCategorie'), agg);

  // Sparen-transacties zijn uitgesloten van het spaarsaldo (het zijn geen
  // echte uitgaven), maar moeten wel gewoon zichtbaar zijn in dit overzicht.
  const sparenTxs = txs.filter(t => t.category === 'sparen').sort((a,b) => b.date.localeCompare(a.date));
  const sparenEl = document.getElementById('tableMaandSparen');
  if(sparenTxs.length === 0){
    sparenEl.innerHTML = `<tbody><tr><td class="empty-state">Geen overboekingen naar spaarpotjes deze maand.</td></tr></tbody>`;
  } else {
    const sparenTotal = sparenTxs.reduce((s,t) => s + (-t.amount), 0);
    let sHtml = `<thead><tr><th>Datum</th><th>Omschrijving</th><th>Wie</th><th>Potje</th><th class="num">Bedrag</th></tr></thead><tbody>`;
    for(const t of sparenTxs){
      const pot = t.potId ? potById(t.potId) : null;
      sHtml += `<tr>
        <td>${t.date}</td>
        <td>${escapeHtml(t.description)}</td>
        <td><span class="person-tag">${state.people[t.person]}</span></td>
        <td>${pot ? pot.name : '<em>nog niet gekoppeld</em>'}</td>
        <td class="num ${(-t.amount) >= 0 ? 'pos' : 'neg'}">${formatEUR(-t.amount)}</td>
      </tr>`;
    }
    sHtml += `</tbody><tfoot><tr><td colspan="4" style="font-weight:600;">Totaal naar potjes</td><td class="num pos" style="font-weight:600;">${formatEUR(sparenTotal)}</td></tr></tfoot>`;
    sparenEl.innerHTML = sHtml;
  }

  // Categoriefilter voor de onderstaande transactietabel
  const filterSelect = document.getElementById('maandCategorieFilter');
  const prevFilter = filterSelect.value;
  filterSelect.innerHTML = `<option value="">Alle categorieën</option>` +
    state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('') +
    `<option value="__none__">Zonder categorie</option>`;
  filterSelect.value = [...filterSelect.options].some(o => o.value === prevFilter) ? prevFilter : '';

  const activeFilter = filterSelect.value;
  const filteredTxs = txs.filter(t => {
    if(!activeFilter) return true;
    if(activeFilter === '__none__') return !t.category;
    return t.category === activeFilter;
  });

  const tableEl = document.getElementById('tableMaandTransacties');
  const sorted = [...filteredTxs].sort((a,b) => b.date.localeCompare(a.date));
  let html = `<thead><tr><th>Datum</th><th>Omschrijving</th><th>Wie</th><th>Categorie</th><th class="num">Bedrag</th></tr></thead><tbody>`;
  if(sorted.length === 0){
    html += `<tr><td colspan="5" class="empty-state">Geen transacties${activeFilter ? ' voor deze filter' : ''}.</td></tr>`;
  }
  const catOptions = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  for(const t of sorted){
    html += `<tr data-id="${t.id}">
      <td>${t.date}</td>
      <td>${escapeHtml(t.description)}</td>
      <td><span class="person-tag">${state.people[t.person]}</span></td>
      <td>
        <select class="select-input edit-cat-select">
          <option value="">&mdash; geen categorie &mdash;</option>
          ${catOptions}
        </select>
      </td>
      <td class="num ${t.amount >= 0 ? 'pos' : 'neg'}">${formatEUR(t.amount)}</td>
    </tr>`;
  }
  html += '</tbody>';
  tableEl.innerHTML = html;

  tableEl.querySelectorAll('tr[data-id]').forEach(row => {
    const select = row.querySelector('.edit-cat-select');
    const tx = txs.find(t => t.id === row.dataset.id);
    if(!select || !tx) return;
    select.value = tx.category || '';
    select.addEventListener('change', (e) => {
      tx.category = e.target.value || null;
      maybeAutoAssignPot(tx);
      maybeAutoAssignDebt(tx);
      saveState();
      refreshAll();
    });
  });
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
  renderFixedVariableBar('fixedVarJaar', agg);
  renderCategoryDonut('chartJaarCategorie', agg);
  renderCategoryDonutVsIncome('chartJaarCategorieInkomen', agg);
  renderPersonBars('chartJaarPersonen', agg);
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
  renderComboChart(
    'chartJaarMaanden',
    labels,
    [
      { label: 'Inkomsten', color: '#B7D0BD', data: incomeData },
      { label: 'Uitgaven', color: '#E3B7A7', data: expenseData },
    ],
    { label: 'Gespaard', color: '#AD7E24', data: netData }
  );
}

/* ===================== Tab: Vermogensopbouw ===================== */

function ownerLabel(owner){
  if(owner === 'p1') return state.people.p1;
  if(owner === 'p2') return state.people.p2;
  return 'Samen';
}

function populateOwnerSelect(selectEl, selected){
  selectEl.innerHTML = `
    <option value="p1">${state.people.p1}</option>
    <option value="p2">${state.people.p2}</option>
    <option value="samen">Samen</option>
  `;
  if(selected) selectEl.value = selected;
}

function renderVermogenTab(){
  // Saldo band: totaal vermogen + per eigenaar
  const balances = state.pots.map(p => ({ pot: p, balance: computePotBalance(p.id) }));
  const total = balances.reduce((s, b) => s + b.balance, 0);
  const byOwner = { p1: 0, p2: 0, samen: 0 };
  for(const b of balances) byOwner[b.pot.owner] = (byOwner[b.pot.owner] || 0) + b.balance;

  const bandEl = document.getElementById('vermogenSaldoBand');
  bandEl.innerHTML = `
    <div class="cell"><div class="k">Totaal vermogen</div><div class="v ${total>=0?'pos':'neg'}">${formatEUR(total)}</div></div>
    <div class="cell"><div class="k">${state.people.p1}</div><div class="v ${byOwner.p1>=0?'pos':'neg'}">${formatEUR(byOwner.p1)}</div></div>
    <div class="cell"><div class="k">${state.people.p2}</div><div class="v ${byOwner.p2>=0?'pos':'neg'}">${formatEUR(byOwner.p2)}</div></div>
    <div class="cell"><div class="k">Samen</div><div class="v ${byOwner.samen>=0?'pos':'neg'}">${formatEUR(byOwner.samen)}</div></div>
  `;

  // Pot cards
  const potListEl = document.getElementById('potList');
  if(state.pots.length === 0){
    potListEl.innerHTML = '<p class="empty-state">Nog geen spaarpotjes toegevoegd. Voeg er hieronder een toe.</p>';
  } else {
    potListEl.innerHTML = balances.map(({pot, balance}) => `
      <div class="pot-card" data-id="${pot.id}">
        <input type="text" class="pot-name-input" value="${escapeAttr(pot.name)}">
        <div class="pot-balance ${balance>=0?'pos':'neg'}">${formatEUR(balance)}</div>
        <div class="pot-card-row">
          <label>Van</label>
          <select class="select-input pot-owner-select"></select>
        </div>
        <div class="pot-card-row">
          <label>Start</label>
          <input type="number" step="0.01" class="text-input pot-start-input" value="${pot.startBalance || 0}">
          <button class="remove-btn" title="Potje verwijderen">✕</button>
        </div>
      </div>
    `).join('');

    potListEl.querySelectorAll('.pot-card').forEach(card => {
      const id = card.dataset.id;
      const pot = potById(id);
      const ownerSelect = card.querySelector('.pot-owner-select');
      populateOwnerSelect(ownerSelect, pot.owner);

      card.querySelector('.pot-name-input').addEventListener('change', (e) => {
        const val = e.target.value.trim();
        if(val){ pot.name = val; saveState(); refreshAll(); }
      });
      ownerSelect.addEventListener('change', (e) => {
        pot.owner = e.target.value; saveState(); refreshAll();
      });
      card.querySelector('.pot-start-input').addEventListener('change', (e) => {
        pot.startBalance = parseFloat(e.target.value) || 0; saveState(); refreshAll();
      });
      card.querySelector('.remove-btn').addEventListener('click', () => {
        if(state.transactions.some(t => t.potId === id)){
          alert('Dit potje is nog gekoppeld aan transacties en kan niet verwijderd worden. Koppel die transacties eerst aan een ander potje.');
          return;
        }
        if(!confirm(`Potje "${pot.name}" verwijderen?`)) return;
        state.pots = state.pots.filter(p => p.id !== id);
        state.potRules = state.potRules.filter(r => r.potId !== id);
        saveState(); refreshAll();
      });
    });
  }

  populateOwnerSelect(document.getElementById('newPotOwner'));

  // Nog te koppelen
  const unlinked = getSparenTransactions().filter(t => !t.potId).sort((a,b) => b.date.localeCompare(a.date));
  const unlinkedEl = document.getElementById('potUnlinkedList');
  const unlinkedEmpty = document.getElementById('potUnlinkedEmpty');
  if(unlinked.length === 0){
    unlinkedEl.innerHTML = '';
    unlinkedEmpty.hidden = state.pots.length === 0; // don't nag before any pot exists
  } else {
    unlinkedEmpty.hidden = true;
    const potOptions = state.pots.map(p => `<option value="${p.id}">${p.name} (${ownerLabel(p.owner)})</option>`).join('');
    unlinkedEl.innerHTML = unlinked.map(t => `
      <div class="categorize-item" data-id="${t.id}">
        <div class="desc">
          <div class="main">${escapeHtml(t.description)}</div>
          <div class="meta">${t.date} · ${state.people[t.person]}${t.tegenrekening ? ' · ' + escapeHtml(t.tegenrekening) : ''}</div>
        </div>
        <div class="amount num pos">${formatEUR(-t.amount)}</div>
        <select class="select-input pot-select">
          <option value="">Kies potje…</option>
          ${potOptions}
        </select>
        <label class="remember">
          <input type="checkbox" class="remember-check" checked> onthoud dit
        </label>
        <button class="btn btn-solid btn-small save-pot">Opslaan</button>
      </div>
    `).join('');

    unlinkedEl.querySelectorAll('.save-pot').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.categorize-item');
        const id = item.dataset.id;
        const potSelect = item.querySelector('.pot-select');
        const remember = item.querySelector('.remember-check').checked;
        const potId = potSelect.value;
        if(!potId){ potSelect.focus(); return; }
        const tx = state.transactions.find(t => t.id === id);
        tx.potId = potId;
        if(remember){
          const ruleValue = (tx.tegenrekening || tx.description || '').trim().toLowerCase();
          if(ruleValue && !state.potRules.some(r => r.keyword.toLowerCase() === ruleValue)){
            state.potRules.push({ keyword: ruleValue, potId });
          }
        }
        saveState(); refreshAll();
      });
    });
  }

  // Alle spaartransacties (altijd handmatig corrigeerbaar)
  const allSparen = getSparenTransactions().sort((a,b) => b.date.localeCompare(a.date));
  const tableEl = document.getElementById('tableVermogenTransacties');
  if(allSparen.length === 0){
    tableEl.innerHTML = `<tbody><tr><td class="empty-state">Nog geen transacties in de categorie "Sparen".</td></tr></tbody>`;
  } else {
    const potOptions = state.pots.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    let html = `<thead><tr><th>Datum</th><th>Omschrijving</th><th>Wie</th><th class="num">Bedrag</th><th>Potje</th></tr></thead><tbody>`;
    for(const t of allSparen){
      html += `<tr data-id="${t.id}">
        <td>${t.date}</td>
        <td>${escapeHtml(t.description)}</td>
        <td><span class="person-tag">${state.people[t.person]}</span></td>
        <td class="num pos">${formatEUR(-t.amount)}</td>
        <td>
          <select class="select-input pot-edit-select">
            <option value="">&mdash; geen potje &mdash;</option>
            ${potOptions}
          </select>
        </td>
      </tr>`;
    }
    html += '</tbody>';
    tableEl.innerHTML = html;
    tableEl.querySelectorAll('tr[data-id]').forEach(row => {
      const sel = row.querySelector('.pot-edit-select');
      const tx = allSparen.find(t => t.id === row.dataset.id);
      if(!sel || !tx) return;
      sel.value = tx.potId || '';
      sel.addEventListener('change', (e) => {
        tx.potId = e.target.value || null;
        saveState(); refreshAll();
      });
    });
  }

  // Koppelregels beheren
  const ruleTargetSelect = document.getElementById('newPotRuleTarget');
  ruleTargetSelect.innerHTML = state.pots.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  const ruleListEl = document.getElementById('potRuleManageList');
  ruleListEl.innerHTML = state.potRules.map((r, i) => `
    <div class="rule-manage-row" data-i="${i}">
      <span class="kw">${escapeHtml(r.keyword)}</span>
      <span class="cat">→ ${(potById(r.potId)||{name:'?'}).name}</span>
      <button class="remove-btn" title="Verwijderen">✕</button>
    </div>
  `).join('');
  ruleListEl.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.closest('.rule-manage-row').dataset.i, 10);
      state.potRules.splice(i, 1);
      saveState(); refreshAll();
    });
  });
}

/* ===================== Tab: Schulden ===================== */

function renderSchuldenTab(){
  const balances = state.debts.map(d => ({ debt: d, balance: computeDebtBalance(d.id) }));
  const total = balances.reduce((s, b) => s + b.balance, 0);
  const byOwner = { p1: 0, p2: 0, samen: 0 };
  for(const b of balances) byOwner[b.debt.owner] = (byOwner[b.debt.owner] || 0) + b.balance;

  const bandEl = document.getElementById('schuldenSaldoBand');
  bandEl.innerHTML = `
    <div class="cell"><div class="k">Totaal openstaand</div><div class="v neg">${formatEUR(total)}</div></div>
    <div class="cell"><div class="k">${state.people.p1}</div><div class="v neg">${formatEUR(byOwner.p1)}</div></div>
    <div class="cell"><div class="k">${state.people.p2}</div><div class="v neg">${formatEUR(byOwner.p2)}</div></div>
    <div class="cell"><div class="k">Samen</div><div class="v neg">${formatEUR(byOwner.samen)}</div></div>
  `;

  const listEl = document.getElementById('debtList');
  if(state.debts.length === 0){
    listEl.innerHTML = '<p class="empty-state">Nog geen schulden toegevoegd. Voeg er hieronder een toe.</p>';
  } else {
    listEl.innerHTML = balances.map(({debt, balance}) => {
      const overwaarde = debt.type === 'hypotheek' && debt.wozValue ? (debt.wozValue - balance) : null;
      return `
      <div class="pot-card" data-id="${debt.id}">
        <input type="text" class="pot-name-input" value="${escapeAttr(debt.name)}">
        <div class="pot-balance neg">${formatEUR(balance)} <span style="font-size:11px;font-weight:400;color:var(--ink-faint);">openstaand</span></div>
        <div class="pot-card-row">
          <label>Type</label>
          <select class="select-input debt-type-select">
            <option value="lening" ${debt.type==='lening'?'selected':''}>Lening</option>
            <option value="hypotheek" ${debt.type==='hypotheek'?'selected':''}>Hypotheek</option>
          </select>
        </div>
        <div class="pot-card-row">
          <label>Van</label>
          <select class="select-input debt-owner-select"></select>
        </div>
        <div class="pot-card-row">
          <label>Peildatum</label>
          <input type="date" class="text-input debt-refdate-input" value="${debt.referenceDate || ''}">
        </div>
        <div class="pot-card-row">
          <label>Saldo</label>
          <input type="number" step="0.01" class="text-input debt-refbalance-input" value="${debt.referenceBalance || 0}">
        </div>
        <div class="pot-card-row">
          <label>Rente %</label>
          <input type="number" step="0.01" class="text-input debt-interest-input" value="${debt.interestRate ?? ''}" placeholder="optioneel">
        </div>
        <div class="pot-card-row">
          <label>Maandlast</label>
          <input type="number" step="0.01" class="text-input debt-monthly-input" value="${debt.monthlyPayment ?? ''}" placeholder="optioneel">
        </div>
        ${debt.type === 'hypotheek' ? `
        <div class="pot-card-row">
          <label>WOZ-waarde</label>
          <input type="number" step="0.01" class="text-input debt-woz-input" value="${debt.wozValue ?? ''}" placeholder="optioneel">
        </div>
        ${overwaarde !== null ? `<div class="pot-card-row" style="font-size:12px;color:var(--ink-soft);">Overwaarde: <strong style="margin-left:4px;color:${overwaarde>=0?'var(--forest)':'var(--brick)'}">${formatEUR(overwaarde)}</strong></div>` : ''}
        ` : ''}
        <div class="pot-card-row">
          <button class="remove-btn" title="Verwijderen" style="margin-left:auto;">✕ Verwijderen</button>
        </div>
      </div>
    `;}).join('');

    listEl.querySelectorAll('.pot-card').forEach(card => {
      const id = card.dataset.id;
      const debt = debtById(id);
      const ownerSelect = card.querySelector('.debt-owner-select');
      populateOwnerSelect(ownerSelect, debt.owner);

      card.querySelector('.pot-name-input').addEventListener('change', (e) => {
        const val = e.target.value.trim();
        if(val){ debt.name = val; saveState(); refreshAll(); }
      });
      card.querySelector('.debt-type-select').addEventListener('change', (e) => {
        debt.type = e.target.value; saveState(); refreshAll();
      });
      ownerSelect.addEventListener('change', (e) => {
        debt.owner = e.target.value; saveState(); refreshAll();
      });
      card.querySelector('.debt-refdate-input').addEventListener('change', (e) => {
        debt.referenceDate = e.target.value || ''; saveState(); refreshAll();
      });
      card.querySelector('.debt-refbalance-input').addEventListener('change', (e) => {
        debt.referenceBalance = parseFloat(e.target.value) || 0; saveState(); refreshAll();
      });
      card.querySelector('.debt-interest-input').addEventListener('change', (e) => {
        debt.interestRate = e.target.value === '' ? null : parseFloat(e.target.value); saveState(); refreshAll();
      });
      card.querySelector('.debt-monthly-input').addEventListener('change', (e) => {
        debt.monthlyPayment = e.target.value === '' ? null : parseFloat(e.target.value); saveState(); refreshAll();
      });
      const wozInput = card.querySelector('.debt-woz-input');
      if(wozInput){
        wozInput.addEventListener('change', (e) => {
          debt.wozValue = e.target.value === '' ? null : parseFloat(e.target.value); saveState(); refreshAll();
        });
      }
      card.querySelector('.remove-btn').addEventListener('click', () => {
        if(state.transactions.some(t => t.debtId === id)){
          alert('Deze schuld is nog gekoppeld aan transacties en kan niet verwijderd worden. Koppel die transacties eerst aan een andere schuld.');
          return;
        }
        if(!confirm(`"${debt.name}" verwijderen?`)) return;
        state.debts = state.debts.filter(d => d.id !== id);
        state.debtRules = state.debtRules.filter(r => r.debtId !== id);
        saveState(); refreshAll();
      });
    });
  }

  populateOwnerSelect(document.getElementById('newDebtOwner'));

  // Nog te koppelen
  const unlinked = getAflossingTransactions().filter(t => !t.debtId).sort((a,b) => b.date.localeCompare(a.date));
  const unlinkedEl = document.getElementById('debtUnlinkedList');
  const unlinkedEmpty = document.getElementById('debtUnlinkedEmpty');
  if(unlinked.length === 0){
    unlinkedEl.innerHTML = '';
    unlinkedEmpty.hidden = state.debts.length === 0;
  } else {
    unlinkedEmpty.hidden = true;
    const debtOptions = state.debts.map(d => `<option value="${d.id}">${d.name} (${ownerLabel(d.owner)})</option>`).join('');
    unlinkedEl.innerHTML = unlinked.map(t => `
      <div class="categorize-item" data-id="${t.id}">
        <div class="desc">
          <div class="main">${escapeHtml(t.description)}</div>
          <div class="meta">${t.date} · ${state.people[t.person]}${t.tegenrekening ? ' · ' + escapeHtml(t.tegenrekening) : ''}</div>
        </div>
        <div class="amount num neg">${formatEUR(t.amount)}</div>
        <select class="select-input debt-select">
          <option value="">Kies schuld…</option>
          ${debtOptions}
        </select>
        <label class="remember">
          <input type="checkbox" class="remember-check" checked> onthoud dit
        </label>
        <button class="btn btn-solid btn-small save-debt">Opslaan</button>
      </div>
    `).join('');

    unlinkedEl.querySelectorAll('.save-debt').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.categorize-item');
        const id = item.dataset.id;
        const debtSelect = item.querySelector('.debt-select');
        const remember = item.querySelector('.remember-check').checked;
        const debtId = debtSelect.value;
        if(!debtId){ debtSelect.focus(); return; }
        const tx = state.transactions.find(t => t.id === id);
        tx.debtId = debtId;
        if(remember){
          const ruleValue = (tx.tegenrekening || tx.description || '').trim().toLowerCase();
          if(ruleValue && !state.debtRules.some(r => r.keyword.toLowerCase() === ruleValue)){
            state.debtRules.push({ keyword: ruleValue, debtId });
          }
        }
        saveState(); refreshAll();
      });
    });
  }

  // Alle aflossingen (altijd handmatig corrigeerbaar)
  const allAflossingen = getAflossingTransactions().sort((a,b) => b.date.localeCompare(a.date));
  const tableEl = document.getElementById('tableSchuldenTransacties');
  if(allAflossingen.length === 0){
    tableEl.innerHTML = `<tbody><tr><td class="empty-state">Nog geen transacties in de categorie "Aflossing schuld".</td></tr></tbody>`;
  } else {
    const debtOptions = state.debts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    let html = `<thead><tr><th>Datum</th><th>Omschrijving</th><th>Wie</th><th class="num">Bedrag</th><th>Schuld</th></tr></thead><tbody>`;
    for(const t of allAflossingen){
      html += `<tr data-id="${t.id}">
        <td>${t.date}</td>
        <td>${escapeHtml(t.description)}</td>
        <td><span class="person-tag">${state.people[t.person]}</span></td>
        <td class="num neg">${formatEUR(t.amount)}</td>
        <td>
          <select class="select-input debt-edit-select">
            <option value="">&mdash; geen schuld &mdash;</option>
            ${debtOptions}
          </select>
        </td>
      </tr>`;
    }
    html += '</tbody>';
    tableEl.innerHTML = html;
    tableEl.querySelectorAll('tr[data-id]').forEach(row => {
      const sel = row.querySelector('.debt-edit-select');
      const tx = allAflossingen.find(t => t.id === row.dataset.id);
      if(!sel || !tx) return;
      sel.value = tx.debtId || '';
      sel.addEventListener('change', (e) => {
        tx.debtId = e.target.value || null;
        saveState(); refreshAll();
      });
    });
  }

  // Koppelregels beheren
  const ruleTargetSelect = document.getElementById('newDebtRuleTarget');
  ruleTargetSelect.innerHTML = state.debts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

  const ruleListEl = document.getElementById('debtRuleManageList');
  ruleListEl.innerHTML = state.debtRules.map((r, i) => `
    <div class="rule-manage-row" data-i="${i}">
      <span class="kw">${escapeHtml(r.keyword)}</span>
      <span class="cat">→ ${(debtById(r.debtId)||{name:'?'}).name}</span>
      <button class="remove-btn" title="Verwijderen">✕</button>
    </div>
  `).join('');
  ruleListEl.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.closest('.rule-manage-row').dataset.i, 10);
      state.debtRules.splice(i, 1);
      saveState(); refreshAll();
    });
  });
}

/* ===================== Tab: Abonnementen ===================== */

function normalizeSubscriptionKey(description){
  return description
    .toLowerCase()
    .replace(/\d{3,}/g, '')   // strip reference/order numbers
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSubscriptions(){
  const groups = {};
  for(const t of state.transactions){
    if(t.amount >= 0) continue;
    const cat = t.category ? categoryById(t.category) : null;
    if(cat && cat.isTransfer) continue; // sparen/aflossing/onderling zijn geen "abonnement"
    const key = normalizeSubscriptionKey(t.description);
    if(!key) continue;
    if(!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const results = [];
  for(const key in groups){
    if(state.dismissedSubscriptions.includes(key)) continue;
    const txs = groups[key];
    const months = new Set(txs.map(t => monthKey(t.date)));
    if(months.size < 2) continue; // minstens 2 verschillende maanden gezien
    const amounts = txs.map(t => Math.abs(t.amount));
    const avg = amounts.reduce((s,a) => s+a, 0) / amounts.length;
    const maxDiff = Math.max(...amounts) - Math.min(...amounts);
    // bedrag moet redelijk stabiel zijn: binnen €1,50 of 12% van het gemiddelde
    if(maxDiff > Math.max(1.5, avg * 0.12)) continue;
    const sorted = [...txs].sort((a,b) => b.date.localeCompare(a.date));
    results.push({
      key,
      name: sorted[0].description,
      avgAmount: avg,
      timesSeen: months.size,
      lastSeen: sorted[0].date,
      category: sorted[0].category,
      person: sorted[0].person,
    });
  }
  return results.sort((a,b) => b.avgAmount - a.avgAmount);
}

function renderAbonnementenTab(){
  const subs = detectSubscriptions();
  const tableEl = document.getElementById('tableAbonnementen');
  const emptyEl = document.getElementById('abonnementenEmpty');
  const bandEl = document.getElementById('abonnementenSaldoBand');

  const totalPerMonth = subs.reduce((s, sub) => s + sub.avgAmount, 0);
  bandEl.innerHTML = `
    <div class="cell"><div class="k">Aantal gevonden</div><div class="v">${subs.length}</div></div>
    <div class="cell"><div class="k">Geschat per maand</div><div class="v neg">${formatEUR(totalPerMonth)}</div></div>
    <div class="cell"><div class="k">Geschat per jaar</div><div class="v neg">${formatEUR(totalPerMonth * 12)}</div></div>
  `;

  if(subs.length === 0){
    tableEl.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  let html = `<thead><tr><th>Omschrijving</th><th>Wie</th><th>Categorie</th><th class="num">Gem. bedrag/maand</th><th>Keer gezien</th><th>Laatst gezien</th><th></th></tr></thead><tbody>`;
  for(const sub of subs){
    const cat = sub.category ? categoryById(sub.category) : null;
    html += `<tr data-key="${escapeAttr(sub.key)}">
      <td>${escapeHtml(sub.name)}</td>
      <td><span class="person-tag">${state.people[sub.person]}</span></td>
      <td>${cat ? `<span class="cat-dot" style="background:${cat.color}"></span>${cat.name}` : '<em>onbekend</em>'}</td>
      <td class="num neg">${formatEUR(sub.avgAmount)}</td>
      <td>${sub.timesSeen}×</td>
      <td>${sub.lastSeen}</td>
      <td><button class="remove-btn dismiss-sub" title="Verbergen">✕</button></td>
    </tr>`;
  }
  html += '</tbody>';
  tableEl.innerHTML = html;

  tableEl.querySelectorAll('.dismiss-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.closest('tr').dataset.key;
      if(!state.dismissedSubscriptions.includes(key)){
        state.dismissedSubscriptions.push(key);
      }
      saveState(); refreshAll();
    });
  });
}

/* ===================== Tab: Totaal ===================== */

function renderTotaalTab(){
  const txs = state.transactions;
  const agg = aggregate(txs);
  renderSaldoBand(document.getElementById('totaalSaldoBand'), agg, 'Totaal gespaard');
  renderCategoryDonut('chartTotaalCategorie', agg);
  renderPersonBars('chartTotaalPersonen', agg);
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
  renderComboChart(
    'chartTotaalTijdlijn',
    labels,
    [
      { label: 'Gespaard per maand', color: '#C9B98C', colorFn: v => v >= 0 ? '#B7D0BD' : '#E3B7A7', data: netPerMonth },
    ],
    { label: 'Cumulatief spaarsaldo', color: '#2A4534', data: cumulative }
  );
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
        <input type="checkbox" class="cat-fixed" ${c.isFixed ? 'checked' : ''}> vaste last
      </label>
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
    row.querySelector('.cat-fixed').addEventListener('change', (e) => {
      const cat = categoryById(id);
      if(cat){ cat.isFixed = e.target.checked; saveState(); refreshAll(); }
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
    ['vermogen', renderVermogenTab],
    ['schulden', renderSchuldenTab],
    ['abonnementen', renderAbonnementenTab],
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

const TAB_RENDERERS = {
  categoriseren: renderCategorizeTab,
  maand: renderMaandTab,
  jaar: renderJaarTab,
  vermogen: renderVermogenTab,
  schulden: renderSchuldenTab,
  abonnementen: renderAbonnementenTab,
  totaal: renderTotaalTab,
  instellingen: renderInstellingenTab,
};

function switchTab(tabName){
  document.querySelectorAll('.tab-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + tabName));
  // Charts can only size themselves correctly once their canvas is actually
  // visible, so re-render this tab now that its pane is no longer display:none.
  const renderFn = TAB_RENDERERS[tabName];
  if(renderFn){
    try{ renderFn(); }catch(err){ console.error(`Fout bij het tekenen van "${tabName}":`, err); }
  }
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
  document.getElementById('maandCategorieFilter').addEventListener('change', renderMaandTab);

  document.getElementById('btnReapplyRules').addEventListener('click', () => {
    if(!confirm('Dit controleert alle uitgaven opnieuw tegen je huidige herkenningsregels en kan al toegekende categorieën overschrijven als een regel ze anders indeelt. Doorgaan?')) return;
    const changed = reapplyRules();
    saveState();
    refreshAll();
    alert(changed > 0 ? `${changed} transactie(s) opnieuw ingedeeld.` : 'Geen wijzigingen: alle transacties komen al overeen met je huidige regels.');
  });

  document.getElementById('btnAddPot').addEventListener('click', () => {
    const nameInput = document.getElementById('newPotName');
    const ownerSelect = document.getElementById('newPotOwner');
    const startInput = document.getElementById('newPotStart');
    const name = nameInput.value.trim();
    if(!name) return;
    state.pots.push({
      id: uid('pot'),
      name,
      owner: ownerSelect.value || 'samen',
      startBalance: parseFloat(startInput.value) || 0,
    });
    nameInput.value = '';
    startInput.value = '0';
    saveState(); refreshAll();
  });

  document.getElementById('btnReapplyPotRules').addEventListener('click', () => {
    if(state.pots.length === 0){ alert('Voeg eerst een spaarpotje toe.'); return; }
    if(!confirm('Dit controleert alle "Sparen"-transacties opnieuw tegen je huidige koppelregels en kan al gekoppelde potjes overschrijven. Doorgaan?')) return;
    const changed = reapplyPotRules();
    saveState();
    refreshAll();
    alert(changed > 0 ? `${changed} transactie(s) opnieuw gekoppeld.` : 'Geen wijzigingen: alle transacties komen al overeen met je huidige regels.');
  });

  document.getElementById('btnAddPotRule').addEventListener('click', () => {
    const kwInput = document.getElementById('newPotRuleKeyword');
    const targetSelect = document.getElementById('newPotRuleTarget');
    const keyword = kwInput.value.trim().toLowerCase();
    if(!keyword || !targetSelect.value) return;
    state.potRules.unshift({ keyword, potId: targetSelect.value });
    kwInput.value = '';
    saveState(); refreshAll();
  });

  document.getElementById('btnAddDebt').addEventListener('click', () => {
    const nameInput = document.getElementById('newDebtName');
    const typeSelect = document.getElementById('newDebtType');
    const ownerSelect = document.getElementById('newDebtOwner');
    const refDateInput = document.getElementById('newDebtRefDate');
    const refBalanceInput = document.getElementById('newDebtRefBalance');
    const interestInput = document.getElementById('newDebtInterest');
    const monthlyInput = document.getElementById('newDebtMonthly');
    const wozInput = document.getElementById('newDebtWoz');
    const name = nameInput.value.trim();
    if(!name) return;
    state.debts.push({
      id: uid('debt'),
      name,
      type: typeSelect.value || 'lening',
      owner: ownerSelect.value || 'samen',
      referenceDate: refDateInput.value || '',
      referenceBalance: parseFloat(refBalanceInput.value) || 0,
      interestRate: interestInput.value === '' ? null : parseFloat(interestInput.value),
      monthlyPayment: monthlyInput.value === '' ? null : parseFloat(monthlyInput.value),
      wozValue: wozInput.value === '' ? null : parseFloat(wozInput.value),
    });
    nameInput.value = '';
    refDateInput.value = '';
    refBalanceInput.value = '';
    interestInput.value = '';
    monthlyInput.value = '';
    wozInput.value = '';
    saveState(); refreshAll();
  });

  document.getElementById('btnReapplyDebtRules').addEventListener('click', () => {
    if(state.debts.length === 0){ alert('Voeg eerst een schuld toe.'); return; }
    if(!confirm('Dit controleert alle "Aflossing schuld"-transacties opnieuw tegen je huidige koppelregels en kan al gekoppelde schulden overschrijven. Doorgaan?')) return;
    const changed = reapplyDebtRules();
    saveState();
    refreshAll();
    alert(changed > 0 ? `${changed} transactie(s) opnieuw gekoppeld.` : 'Geen wijzigingen: alle transacties komen al overeen met je huidige regels.');
  });

  document.getElementById('btnAddDebtRule').addEventListener('click', () => {
    const kwInput = document.getElementById('newDebtRuleKeyword');
    const targetSelect = document.getElementById('newDebtRuleTarget');
    const keyword = kwInput.value.trim().toLowerCase();
    if(!keyword || !targetSelect.value) return;
    state.debtRules.unshift({ keyword, debtId: targetSelect.value });
    kwInput.value = '';
    saveState(); refreshAll();
  });

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
    state.categories.push({ id, name, color: colorInput.value, isTransfer: false, isFixed: false });
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
