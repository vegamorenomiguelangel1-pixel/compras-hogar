'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

global.localStorage = new MemoryStorage();
const L = require('../js/logic');
global.YapaLogic = L;
const D = require('../js/data');
global.YapaData = D;
const Store = require('../js/store');

const TODAY = '2026-10-02';

function fresh() {
  localStorage.removeItem(Store.KEY);
  localStorage.removeItem(Store.SESSION_KEY);
  Store.reload();
  const entered = Store.login('Carla', 'ROJAS-2026');
  if (!entered.ok) throw new Error(entered.error || 'no se pudo entrar');
  return Store.get();
}

test('fechas relativas y formato de dinero', function () {
  assert.equal(L.recentDate('2026-10-02', 8), '2026-10-01');
  assert.equal(L.recentDate('2026-10-02', 0), '2026-10-02');
  assert.equal(L.recentDate('2026-10-20', 4), '2026-10-16');
  assert.equal(L.recentDate('2026-10-01', 5), '2026-10-01');
  assert.equal(L.addDays('2026-10-02', 2), '2026-10-04');
  assert.equal(L.daysUntil('2026-10-06', '2026-10-02'), 4);
  assert.equal(L.daysUntil('2026-10-07', '2026-10-02'), 5);
  assert.equal(L.money(8.5), 'Bs 8,50');
  assert.equal(L.money(1800), 'Bs 1.800,00');
  assert.equal(L.money(265.59), 'Bs 265,59');
  assert.equal(L.formatQty(0.45), '0,45');
  assert.equal(L.formatQty(2), '2');
});

test('semáforo de vencimiento y stock bajo', function () {
  const soon = L.statusOf({ qty: 2, min: 1, expiry: '2026-10-06' }, TODAY);
  assert.equal(soon.level, 'soon');
  assert.equal(soon.low, false);
  const edge = L.statusOf({ qty: 2, min: 1, expiry: '2026-10-07' }, TODAY);
  assert.equal(edge.level, 'ok');
  const expired = L.statusOf({ qty: 1, min: 1, expiry: '2026-10-01' }, TODAY);
  assert.equal(expired.level, 'expired');
  assert.equal(expired.low, true);
  const lowOnly = L.statusOf({ qty: 1, min: 2, expiry: '2026-12-01' }, TODAY);
  assert.equal(lowOnly.level, 'ok');
  assert.equal(lowOnly.low, true);
  assert.equal(L.expiryLabel(0), 'Vence hoy');
  assert.equal(L.expiryLabel(1), 'Vence mañana');
  assert.equal(L.expiryLabel(-1), 'Venció ayer');
});

test('plurales y palabras cortas no se confunden', function () {
  assert.equal(L.hasTerm('Huevos de granja', 'huevo'), true);
  assert.equal(L.hasTerm('Papa', 'pan'), false);
  assert.equal(L.hasTerm('ensalada criolla', 'sal'), false);
  assert.equal(L.hasTerm('se acabó la sal', 'sal'), true);
  assert.equal(L.findProduct('Leche PIL entera', D.CATALOG).id, 'leche');
  assert.equal(L.findProduct('Pan de batalla', D.CATALOG).id, 'pan');
});

test('la despensa de muestra tiene los tres estados', function () {
  const seed = D.buildSeed(TODAY);
  const expired = seed.pantry.filter(function (item) { return L.statusOf(item, TODAY).level === 'expired'; });
  const soon = seed.pantry.filter(function (item) { return L.statusOf(item, TODAY).level === 'soon'; });
  const low = seed.pantry.filter(function (item) { return L.statusOf(item, TODAY).low; });
  const ok = seed.pantry.filter(function (item) {
    const st = L.statusOf(item, TODAY);
    return st.level === 'ok' && !st.low;
  });
  assert.ok(expired.some(function (item) { return item.id === 'p-queso'; }));
  assert.ok(soon.length >= 4);
  assert.ok(low.length >= 4);
  assert.ok(ok.length >= 3);
  const ideas = L.suggestions(seed.pantry, seed.shopping, D.CATALOG, TODAY);
  const names = ideas.map(function (row) { return row.name; });
  assert.ok(names.indexOf('Yogurt PIL frutilla') !== -1);
  assert.ok(names.indexOf('Arroz Grano de Oro') !== -1);
  assert.equal(names.indexOf('Queso criollo'), -1);
  assert.equal(names.indexOf('Fideo Don Vittorio'), -1);
  assert.equal(names.indexOf('Detergente Ace'), -1);
});

test('comparador señala el local más barato y el ahorro', function () {
  const arroz = D.CATALOG.filter(function (row) { return row.id === 'arroz'; })[0];
  assert.deepEqual(L.cheapestStores(arroz.prices).map(function (row) { return row.store; }), ['Mercado Los Pozos']);
  assert.equal(L.spread(arroz.prices).save, 2.3);
  const aceite = D.CATALOG.filter(function (row) { return row.id === 'aceite'; })[0];
  assert.equal(L.cheapestStores(aceite.prices)[0].store, 'Hipermaxi');
  const summary = L.winnerSummary(D.CATALOG);
  assert.ok(summary.ranked.length >= 2);
  assert.ok(summary.ranked[0].count >= 1);
  const basket = L.basketSavings(D.CATALOG);
  assert.ok(basket.save > 0);
  assert.ok(basket.cheap < basket.pricey);
});

test('presupuesto del mes usa solo compras de octubre', function () {
  const seed = D.buildSeed(TODAY);
  const spent = L.monthSpent(seed.purchases, '2026-10');
  const manual = L.round2(seed.purchases.reduce(function (sum, row) { return sum + row.total; }, 0));
  assert.equal(spent, manual);
  assert.ok(spent > 200 && spent < 400);
  const cats = L.spendByCategory(seed.purchases, '2026-10');
  assert.ok(cats.length >= 5);
  assert.ok(cats[0].total >= cats[cats.length - 1].total);
  const outside = L.monthSpent([{ date: '2026-09-30', total: 500, items: [] }], '2026-10');
  assert.equal(outside, 0);
});

test('recetas usan lo que está por vencer y no lo vencido', function () {
  const seed = D.buildSeed(TODAY);
  const matched = L.matchRecipes(seed.pantry, D.RECIPES, TODAY);
  assert.ok(matched.length >= 3);
  const budin = matched.filter(function (row) { return row.recipe.id === 'budin'; })[0];
  assert.ok(budin);
  assert.ok(budin.soon.some(function (item) { return item.id === 'p-pan'; }));
  assert.ok(budin.soon.some(function (item) { return item.id === 'p-leche'; }));
  const fake = { id: 'solo-queso', name: 'Queso', ingredients: [{ key: 'queso', label: 'Queso' }], steps: [] };
  const rotten = L.cookImpact(fake, seed.pantry, TODAY);
  assert.equal(rotten.canCook, false);
  const impact = L.cookImpact(D.RECIPES.filter(function (row) { return row.id === 'budin'; })[0], seed.pantry, TODAY);
  assert.equal(impact.canCook, true);
  assert.ok(impact.bs > 0);
  assert.ok(impact.kg > 0);
  assert.ok(impact.used.every(function (row) { return row.id !== 'p-queso'; }));
});

test('el asistente responde con datos vivos y sin red', function () {
  const seed = D.buildSeed(TODAY);
  const ctx = {
    today: TODAY,
    familyName: 'Rojas',
    city: 'Santa Cruz de la Sierra',
    pantry: seed.pantry,
    shopping: seed.shopping,
    purchases: seed.purchases,
    recipes: D.RECIPES,
    catalog: D.CATALOG,
    budgetLimit: seed.budgetLimit,
    waste: seed.waste
  };
  const soon = L.answer('¿Qué está por vencer?', ctx);
  assert.match(soon.text, /Yogurt|Leche|Pollo/);
  assert.match(soon.text, /no lo consumas/i);
  const price = L.answer('¿Dónde sale más barato el arroz?', ctx);
  assert.match(price.text, /Mercado Los Pozos/);
  assert.match(price.text, /Bs /);
  const budget = L.answer('¿Cómo va el presupuesto?', ctx);
  assert.match(budget.text, /Bs 1\.800,00|1\.800/);
  const salad = L.answer('quiero una ensalada', ctx);
  assert.doesNotMatch(salad.text, /Sal yodada/);
  const hello = L.answer('Hola', ctx);
  assert.match(hello.text, /Yapa/);
  assert.match(hello.text, /Rojas/);
  assert.match(hello.text, /Santa Cruz de la Sierra/);
  const who = L.answer('¿Quién eres?', ctx);
  assert.match(who.text, /Yapa/);
  assert.match(who.text, /Los Pozos/);
  assert.doesNotMatch(who.text, /Lupe|Cochabamba/);
});

test('la tienda persiste lista, compra, cocinado y presupuesto', function () {
  fresh();
  const added = Store.addPantry({
    name: 'Quinua real',
    category: 'Granos y abarrotes',
    qty: '0,5',
    unit: 'kg',
    min: '0,2',
    expiry: '2026-12-01',
    price: '18,5'
  });
  assert.equal(added.ok, true);
  assert.equal(Store.changeQty(added.id, -0.2).ok, true);
  const quinua = Store.get().pantry.filter(function (row) { return row.id === added.id; })[0];
  assert.equal(quinua.qty, 0.3);

  const bad = Store.addPantry({ name: 'A', qty: 1, min: 1, price: 1, unit: 'u', category: 'Despensa' });
  assert.equal(bad.ok, false);

  const day = L.todayISO();
  const month = day.slice(0, 7);
  const before = Store.get().shopping.length;
  const all = Store.addAllSuggestions(day);
  assert.ok(all.count >= 5);
  assert.ok(Store.get().shopping.length > before);
  const again = Store.addAllSuggestions(day);
  assert.equal(again.count, 0);

  Store.toggleItem('s-sal');
  assert.equal(Store.get().shopping.filter(function (row) { return row.id === 's-sal'; })[0].checked, false);
  Store.toggleItem('s-detergente');
  const paid = Store.checkout('Hipermaxi', day);
  assert.equal(paid.ok, true);
  assert.ok(paid.total > 0);
  assert.equal(Store.get().shopping.some(function (row) { return row.id === 's-detergente'; }), false);
  const detergent = Store.get().pantry.filter(function (row) { return row.productId === 'detergente'; })[0];
  assert.ok(detergent);
  assert.equal(detergent.expiry, null);

  const spentBefore = L.monthSpent(Store.get().purchases, month);
  assert.equal(Store.addExpense({ store: 'Fidalga', category: 'Bebidas', amount: '10,50', date: day, note: 'Agua' }).ok, true);
  assert.equal(L.monthSpent(Store.get().purchases, month), L.round2(spentBefore + 10.5));
  assert.equal(Store.setBudget(0).ok, false);
  assert.equal(Store.setBudget(1500).ok, true);
  assert.equal(Store.get().budgetLimit, 1500);

  const cooked = Store.cook('budin', day);
  assert.equal(cooked.ok, true);
  const leche = Store.get().pantry.filter(function (row) { return row.id === 'p-leche'; })[0];
  assert.equal(leche.qty, 0);
  assert.equal(leche.expiry, null);
  assert.ok(L.wasteTotals(Store.get().waste, month).allBs > 6.8);
  assert.equal(Store.cook('solo-queso', day).ok, false);
  assert.equal(Store.discard('p-queso').ok, true);
  assert.equal(Store.get().pantry.some(function (row) { return row.id === 'p-queso'; }), false);

  const raw = localStorage.getItem(Store.KEY);
  Store.reload();
  assert.equal(Store.get().budgetLimit, 1500);
  assert.ok(raw.indexOf('Quinua real') !== -1);

  Store.reset();
  assert.equal(Store.get().budgetLimit, 1800);
  assert.ok(Store.get().pantry.some(function (row) { return row.id === 'p-queso'; }));
});

test('el mismo código comparte la casa y el nombre queda en la lista', function () {
  localStorage.setItem('yapa-hogar-v1', JSON.stringify({ version: 1, family: { city: 'Cochabamba' } }));
  localStorage.setItem('lupe-hogar-v1', JSON.stringify({ version: 2, family: { city: 'Lupe' } }));
  localStorage.removeItem(Store.KEY);
  localStorage.removeItem(Store.SESSION_KEY);
  Store.reload();
  assert.equal(Store.session(), null);
  assert.equal(Store.get(), null);
  assert.equal(localStorage.getItem('yapa-hogar-v1'), null);
  assert.equal(localStorage.getItem('lupe-hogar-v1'), null);
  const missing = Store.login('Ana', 'NO-EXISTE');
  assert.equal(missing.ok, false);
  const carla = Store.login('Carla', 'rojas-2026');
  assert.equal(carla.ok, true);
  assert.equal(carla.code, 'ROJAS-2026');
  assert.equal(Store.get().family.city, 'Santa Cruz de la Sierra');
  assert.equal(Store.get().family.neighborhood, 'Barrio Los Pozos');
  assert.deepEqual(Store.get().joined.map(function (row) { return row.name; }), ['Carla']);
  const added = Store.addManualItem({
    name: 'Pan casero',
    category: 'Panadería',
    qty: 2,
    unit: 'u',
    price: 0.5,
    reason: 'Para el café'
  });
  assert.equal(added.ok, true);
  Store.logout();
  assert.equal(Store.session(), null);
  const luis = Store.login('Luis', 'ROJAS-2026');
  assert.equal(luis.ok, true);
  const names = Store.get().joined.map(function (row) { return row.name; });
  assert.deepEqual(names, ['Carla', 'Luis']);
  const pan = Store.get().shopping.filter(function (row) { return row.name === 'Pan casero'; })[0];
  assert.equal(pan.by, 'Carla');
  const luisItem = Store.addManualItem({
    name: 'Sal yodada extra',
    category: 'Despensa',
    qty: 1,
    unit: 'u',
    price: 2.2
  });
  assert.equal(luisItem.ok, true);
  assert.equal(Store.get().shopping.filter(function (row) { return row.name === 'Sal yodada extra'; })[0].by, 'Luis');
  const created = Store.createFamily('Ana', 'Vega');
  assert.equal(created.ok, true);
  assert.match(created.code, /^VEGA-\d{4}$/);
  assert.equal(Store.get().shopping.some(function (row) { return row.name === 'Pan casero'; }), false);
  Store.login('Carla', 'ROJAS-2026');
  assert.equal(Store.get().shopping.some(function (row) { return row.name === 'Pan casero'; }), true);
  const saved = localStorage.getItem(Store.KEY);
  assert.match(saved, /Mercado Los Pozos/);
  assert.doesNotMatch(saved, /Cochabamba|Lupe|Mercado local/);
  assert.deepEqual(D.STORES, ['Hipermaxi', 'Fidalga', 'IC Norte', 'Mercado Los Pozos', 'Mercado Mutualista', 'Abasto']);
});

test('el chat no crece sin límite', function () {
  fresh();
  for (var i = 0; i < 50; i += 1) {
    Store.pushMessage({ role: 'user', text: 'msg ' + i, at: TODAY, actions: [] });
  }
  assert.ok(Store.get().messages.length <= 40);
});
