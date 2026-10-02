(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YapaStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var KEY = 'yapa-hogar-v2';
  var SESSION_KEY = 'yapa-session-v2';
  var LEGACY_KEYS = ['yapa-hogar-v1', 'lupe-hogar-v1'];
  var DEMO_CODE = 'ROJAS-2026';
  var vault = null;
  var active = null;
  var state = null;

  function L() { return globalThis.YapaLogic; }
  function D() { return globalThis.YapaData; }

  function validFamily(data) {
    return !!(data
      && Array.isArray(data.pantry)
      && Array.isArray(data.shopping)
      && Array.isArray(data.purchases)
      && Array.isArray(data.waste)
      && Array.isArray(data.messages)
      && data.family
      && Array.isArray(data.group));
  }

  function readVault() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== 2 || !data.families || typeof data.families !== 'object') return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function writeVault() {
    try {
      localStorage.setItem(KEY, JSON.stringify(vault));
      return true;
    } catch (err) {
      return false;
    }
  }

  function writeSession() {
    try {
      if (!active) localStorage.removeItem(SESSION_KEY);
      else localStorage.setItem(SESSION_KEY, JSON.stringify(active));
      return true;
    } catch (err) {
      return false;
    }
  }

  function readSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.code || !data.name) return null;
      return { code: String(data.code), name: String(data.name) };
    } catch (err) {
      return null;
    }
  }

  function write() {
    if (!vault || !active || !state) return false;
    vault.families[active.code] = state;
    return writeVault();
  }

  function dropLegacy() {
    LEGACY_KEYS.forEach(function (key) {
      try { localStorage.removeItem(key); } catch (err) { /* la clave vieja ya no se usa */ }
    });
  }

  function seedFamily(surname) {
    var data = D().buildSeed(L().todayISO());
    data.version = 2;
    data.joined = [];
    if (surname) data.family.surname = surname;
    return data;
  }

  function ensureDemo() {
    if (validFamily(vault.families[DEMO_CODE])) return;
    var demo = seedFamily('Rojas');
    demo.family.surname = 'Rojas';
    vault.families[DEMO_CODE] = demo;
  }

  function load() {
    dropLegacy();
    vault = readVault() || { version: 2, families: {} };
    ensureDemo();
    writeVault();
    var saved = readSession();
    if (saved && validFamily(vault.families[saved.code])) {
      active = saved;
      state = vault.families[saved.code];
    } else {
      active = null;
      state = null;
      writeSession();
    }
    return active;
  }

  function init() {
    if (vault) return state;
    load();
    return state;
  }

  function reload() {
    vault = null;
    active = null;
    state = null;
    return init();
  }

  function get() {
    if (!vault) init();
    return state;
  }

  function session() {
    if (!vault) init();
    return active;
  }

  function cleanName(name) {
    var clean = String(name || '').trim().replace(/\s+/g, ' ');
    if (clean.length < 2) return { error: 'Escribe tu nombre.' };
    if (clean.length > 40) return { error: 'El nombre es demasiado largo.' };
    return { value: clean };
  }

  function normalizeCode(code) {
    return String(code || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
  }

  function remember(family, name) {
    if (!Array.isArray(family.joined)) family.joined = [];
    var key = L().norm(name);
    var found = family.joined.some(function (row) { return L().norm(row.name) === key; });
    if (!found) family.joined.push({ name: name, at: L().todayISO() });
  }

  function login(name, code) {
    var person = cleanName(name);
    if (person.error) return { ok: false, error: person.error };
    var id = normalizeCode(code);
    if (id.length < 4) return { ok: false, error: 'Escribe el código de la familia. Por ejemplo, ROJAS-2026.' };
    if (!vault) init();
    var family = vault.families[id];
    if (!validFamily(family)) return { ok: false, error: 'Ese código no está en este navegador. Créalo o revísalo.' };
    remember(family, person.value);
    active = { code: id, name: person.value };
    state = family;
    var saved = write() && writeSession();
    return { ok: true, code: id, name: person.value, saved: saved };
  }

  function titleCase(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').replace(/(^|\s)\S/g, function (chunk) {
      return chunk.toUpperCase();
    });
  }

  function createFamily(name, surname) {
    var person = cleanName(name);
    if (person.error) return { ok: false, error: person.error };
    var label = titleCase(surname);
    if (label.length < 2) return { ok: false, error: 'Escribe el apellido de la familia.' };
    if (label.length > 40) return { ok: false, error: 'El apellido es demasiado largo.' };
    var stem = L().norm(label).replace(/[^a-z0-9]/g, '').toUpperCase();
    if (stem.length < 3) return { ok: false, error: 'El apellido necesita al menos 3 letras.' };
    stem = stem.slice(0, 12);
    if (!vault) init();
    var year = String(L().todayISO()).slice(0, 4);
    var code = stem + '-' + year;
    var n = 2;
    while (vault.families[code]) {
      code = stem + '-' + year + '-' + n;
      n += 1;
    }
    var family = seedFamily(label);
    remember(family, person.value);
    vault.families[code] = family;
    active = { code: code, name: person.value };
    state = family;
    var saved = write() && writeSession();
    return { ok: true, code: code, name: person.value, saved: saved };
  }

  function logout() {
    active = null;
    state = null;
    writeSession();
    return { ok: true };
  }

  function reset() {
    if (!active || !state) return null;
    var joined = Array.isArray(state.joined) ? state.joined.slice() : [];
    var surname = state.family && state.family.surname ? state.family.surname : 'Rojas';
    var next = seedFamily(surname);
    next.joined = joined;
    vault.families[active.code] = next;
    state = next;
    write();
    return state;
  }

  function update(fn) {
    var result = fn(get());
    var saved = write();
    if (result && result.ok && saved === false) result.saved = false;
    return result;
  }

  function cleanPantry(fields) {
    var name = String(fields.name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2) return { error: 'Escribe el nombre del producto.' };
    if (name.length > 80) return { error: 'El nombre es demasiado largo.' };
    var qty = L().num(fields.qty);
    var min = L().num(fields.min);
    var price = L().num(fields.price);
    if (!isFinite(qty) || qty < 0) return { error: 'La cantidad no es válida.' };
    if (!isFinite(min) || min < 0) return { error: 'El stock mínimo no es válido.' };
    if (!isFinite(price) || price < 0) return { error: 'El precio no es válido.' };
    var expiry = fields.expiry ? String(fields.expiry) : '';
    if (expiry && !L().parseISO(expiry)) return { error: 'La fecha de vencimiento no es válida.' };
    var category = String(fields.category || 'Despensa');
    if (D().CATEGORIES.indexOf(category) === -1) category = 'Despensa';
    var unit = String(fields.unit || 'u');
    var unitLabel = String(fields.unitLabel || '').trim();
    var product = L().findProduct(name, D().CATALOG);
    if (!unitLabel) {
      if (product && product.unit === unit) unitLabel = product.unitLabel;
      else unitLabel = unit === 'u' ? 'unid.' : unit;
    }
    var kgEach = null;
    if (fields.kgEach != null && fields.kgEach !== '') {
      var parsedKg = L().num(fields.kgEach);
      kgEach = isFinite(parsedKg) ? parsedKg : null;
    } else if (product && product.unit === unit) {
      kgEach = product.kgEach;
    }
    return {
      value: {
        name: name,
        category: category,
        qty: L().round2(qty),
        unit: unit,
        unitLabel: unitLabel,
        min: L().round2(min),
        expiry: expiry || null,
        price: L().round2(price),
        productId: product ? product.id : null,
        kgEach: kgEach
      }
    };
  }

  function addPantry(fields) {
    var clean = cleanPantry(fields);
    if (clean.error) return { ok: false, error: clean.error };
    return update(function (current) {
      var row = clean.value;
      row.id = L().uid('p');
      current.pantry.unshift(row);
      return { ok: true, id: row.id };
    });
  }

  function updatePantry(id, fields) {
    var clean = cleanPantry(fields);
    if (clean.error) return { ok: false, error: clean.error };
    return update(function (current) {
      var item = current.pantry.filter(function (row) { return row.id === id; })[0];
      if (!item) return { ok: false, error: 'No encontré el producto.' };
      var next = clean.value;
      next.id = item.id;
      Object.keys(next).forEach(function (key) { item[key] = next[key]; });
      return { ok: true, id: id };
    });
  }

  function changeQty(id, delta) {
    return update(function (current) {
      var item = current.pantry.filter(function (row) { return row.id === id; })[0];
      if (!item) return { ok: false, error: 'No encontré el producto.' };
      var step = L().num(delta);
      if (!isFinite(step)) return { ok: false, error: 'La cantidad no es válida.' };
      item.qty = L().round2(Math.max(0, Number(item.qty) + step));
      return { ok: true, qty: item.qty };
    });
  }

  function removePantry(id) {
    return update(function (current) {
      var before = current.pantry.length;
      current.pantry = current.pantry.filter(function (row) { return row.id !== id; });
      if (current.pantry.length === before) return { ok: false, error: 'No encontré el producto.' };
      return { ok: true };
    });
  }

  function upsertShopping(current, item) {
    var existing = current.shopping.filter(function (row) {
      return !row.checked && L().norm(row.name) === L().norm(item.name);
    })[0];
    if (existing) {
      existing.qty = L().round2(Number(existing.qty) + Number(item.qty || 1));
      return { merged: true, id: existing.id };
    }
    current.shopping.unshift(item);
    return { merged: false, id: item.id };
  }

  function shoppingFrom(fields) {
    var name = String(fields.name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2) return { error: 'Escribe qué hay que comprar.' };
    var qty = L().num(fields.qty);
    var price = L().num(fields.price);
    if (!isFinite(qty) || qty <= 0) return { error: 'La cantidad tiene que ser mayor que cero.' };
    if (!isFinite(price) || price < 0) return { error: 'El precio estimado no es válido.' };
    var category = String(fields.category || 'Despensa');
    if (D().CATEGORIES.indexOf(category) === -1) category = 'Despensa';
    var unit = String(fields.unit || 'u');
    var product = fields.productId
      ? D().CATALOG.filter(function (row) { return row.id === fields.productId; })[0]
      : L().findProduct(name, D().CATALOG);
    var unitLabel = String(fields.unitLabel || '').trim();
    if (!unitLabel) unitLabel = product && product.unit === unit ? product.unitLabel : (unit === 'u' ? 'unid.' : unit);
    return {
      value: {
        id: fields.id || L().uid('s'),
        name: name,
        category: product && !fields.category ? product.category : category,
        qty: L().round2(qty),
        unit: unit,
        unitLabel: unitLabel,
        price: L().round2(price),
        checked: false,
        source: fields.source || 'manual',
        by: fields.by || (active && active.name) || 'Yo',
        reason: fields.reason || 'Anotado a mano',
        productId: product ? product.id : (fields.productId || null),
        kgEach: fields.kgEach != null ? fields.kgEach : (product ? product.kgEach : null)
      }
    };
  }

  function addManualItem(fields) {
    var clean = shoppingFrom(fields);
    if (clean.error) return { ok: false, error: clean.error };
    return update(function (current) {
      var result = upsertShopping(current, clean.value);
      return { ok: true, merged: result.merged, id: result.id };
    });
  }

  function addSuggestion(suggestion) {
    return addManualItem({
      name: suggestion.name,
      category: suggestion.category,
      qty: suggestion.qty,
      unit: suggestion.unit,
      unitLabel: suggestion.unitLabel,
      price: suggestion.price,
      source: 'sugerido',
      by: (active && active.name) || 'Yo',
      reason: suggestion.reason,
      productId: suggestion.productId,
      kgEach: suggestion.kgEach
    });
  }

  function addAllSuggestions(today) {
    var current = get();
    var list = L().suggestions(current.pantry, current.shopping, D().CATALOG, today);
    if (!list.length) return { ok: true, count: 0 };
    return update(function (draft) {
      list.forEach(function (suggestion) {
        upsertShopping(draft, shoppingFrom(suggestion).value);
      });
      return { ok: true, count: list.length };
    });
  }

  function addCatalogProduct(productId, qty) {
    var product = D().CATALOG.filter(function (row) { return row.id === productId; })[0];
    if (!product) return { ok: false, error: 'No encontré el producto.' };
    var best = L().cheapestStores(product.prices)[0];
    var amount = L().num(qty);
    if (!isFinite(amount) || amount <= 0) amount = product.unit === 'kg' ? 1 : 1;
    return addManualItem({
      name: product.name,
      category: product.category,
      qty: amount,
      unit: product.unit,
      unitLabel: product.unitLabel,
      price: best ? best.price : 0,
      source: 'comparador',
      by: (active && active.name) || 'Yo',
      reason: best ? 'Precio más bajo en ' + best.store : 'Desde el comparador',
      productId: product.id,
      kgEach: product.kgEach
    });
  }

  function toggleItem(id) {
    return update(function (current) {
      var item = current.shopping.filter(function (row) { return row.id === id; })[0];
      if (!item) return { ok: false, error: 'No encontré el producto en la lista.' };
      item.checked = !item.checked;
      return { ok: true, checked: item.checked };
    });
  }

  function removeItem(id) {
    return update(function (current) {
      var before = current.shopping.length;
      current.shopping = current.shopping.filter(function (row) { return row.id !== id; });
      if (current.shopping.length === before) return { ok: false, error: 'No encontré el producto en la lista.' };
      return { ok: true };
    });
  }

  function checkout(storeName, today) {
    var store = String(storeName || '').trim();
    if (!store) return { ok: false, error: 'Elige un local.' };
    if (!L().parseISO(today)) return { ok: false, error: 'La fecha no es válida.' };
    return update(function (current) {
      var checked = current.shopping.filter(function (row) { return row.checked; });
      if (!checked.length) return { ok: false, error: 'Marca al menos un producto.' };
      var items = checked.map(function (row) {
        var subtotal = L().round2(Number(row.qty) * Number(row.price));
        return {
          name: row.name,
          category: row.category,
          qty: row.qty,
          unit: row.unitLabel || row.unit,
          price: row.price,
          subtotal: subtotal
        };
      });
      var total = L().round2(items.reduce(function (sum, row) { return sum + row.subtotal; }, 0));
      current.purchases.unshift({
        id: L().uid('c'),
        date: today,
        store: store,
        note: 'Desde la lista familiar',
        items: items,
        total: total
      });
      checked.forEach(function (row) {
        var existing = current.pantry.filter(function (item) {
          return (row.productId && item.productId === row.productId) || L().norm(item.name) === L().norm(row.name);
        })[0];
        if (existing) {
          existing.qty = L().round2(Number(existing.qty) + Number(row.qty));
          var st = L().statusOf(existing, today);
          if (!existing.expiry || st.level === 'expired') existing.expiry = L().addDays(today, 21);
        } else {
          current.pantry.unshift({
            id: L().uid('p'),
            name: row.name,
            category: row.category,
            qty: row.qty,
            unit: row.unit,
            unitLabel: row.unitLabel || row.unit,
            min: row.qty,
            expiry: row.category === 'Limpieza' ? null : L().addDays(today, 14),
            price: row.price,
            productId: row.productId || null,
            kgEach: row.kgEach != null ? row.kgEach : null
          });
        }
      });
      var ids = {};
      checked.forEach(function (row) { ids[row.id] = true; });
      current.shopping = current.shopping.filter(function (row) { return !ids[row.id]; });
      return { ok: true, total: total, count: checked.length };
    });
  }

  function addExpense(fields) {
    var store = String(fields.store || '').trim();
    var category = String(fields.category || '').trim();
    var note = String(fields.note || '').trim();
    var amount = L().num(fields.amount);
    var date = String(fields.date || '');
    if (!store) return { ok: false, error: 'Indica el local.' };
    if (D().CATEGORIES.indexOf(category) === -1) return { ok: false, error: 'Elige una categoría.' };
    if (!isFinite(amount) || amount <= 0) return { ok: false, error: 'El monto tiene que ser mayor que cero.' };
    if (!L().parseISO(date)) return { ok: false, error: 'La fecha no es válida.' };
    if (note.length > 80) return { ok: false, error: 'La nota es demasiado larga.' };
    return update(function (current) {
      var subtotal = L().round2(amount);
      current.purchases.unshift({
        id: L().uid('c'),
        date: date,
        store: store,
        note: note || 'Gasto anotado',
        items: [{
          name: note || category,
          category: category,
          qty: 1,
          unit: 'compra',
          price: subtotal,
          subtotal: subtotal
        }],
        total: subtotal
      });
      return { ok: true, total: subtotal };
    });
  }

  function removeExpense(id) {
    return update(function (current) {
      var before = current.purchases.length;
      current.purchases = current.purchases.filter(function (row) { return row.id !== id; });
      if (current.purchases.length === before) return { ok: false, error: 'No encontré esa compra.' };
      return { ok: true };
    });
  }

  function setBudget(limit) {
    var value = L().num(limit);
    if (!isFinite(value) || value <= 0) return { ok: false, error: 'El presupuesto tiene que ser mayor que cero.' };
    if (value > 1000000) return { ok: false, error: 'Ese monto es demasiado alto para este prototipo.' };
    return update(function (current) {
      current.budgetLimit = L().round2(value);
      return { ok: true, budgetLimit: current.budgetLimit };
    });
  }

  function cook(recipeId, today) {
    var recipe = D().RECIPES.filter(function (row) { return row.id === recipeId; })[0];
    if (!recipe) return { ok: false, error: 'No encontré la receta.' };
    var impact = L().cookImpact(recipe, get().pantry, today);
    if (!impact.canCook) {
      return { ok: false, error: 'Esta receta no tiene ingredientes por vencer que se puedan usar. Si ya vencieron, no los cocines.' };
    }
    return update(function (current) {
      impact.used.forEach(function (row) {
        var item = current.pantry.filter(function (p) { return p.id === row.id; })[0];
        if (!item) return;
        item.qty = L().round2(Math.max(0, Number(item.qty) - row.take));
        if (item.qty <= 0) item.expiry = null;
      });
      current.waste.unshift({
        id: L().uid('w'),
        date: today,
        recipeId: recipe.id,
        title: recipe.name,
        bs: impact.bs,
        kg: impact.kg
      });
      return { ok: true, impact: impact };
    });
  }

  function discard(id) {
    return removePantry(id);
  }

  function pushMessage(message) {
    return update(function (current) {
      current.messages.push({
        id: message.id || L().uid('m'),
        role: message.role,
        text: String(message.text || ''),
        at: message.at,
        actions: message.actions || []
      });
      if (current.messages.length > 40) {
        current.messages = current.messages.slice(current.messages.length - 40);
      }
      return { ok: true };
    });
  }

  function setMember(index, name) {
    var i = Number(index);
    var clean = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return update(function (current) {
      if (!current.group[i]) return { ok: false, error: 'No encontré ese lugar del grupo.' };
      current.group[i].name = clean;
      return { ok: true };
    });
  }

  return {
    KEY: KEY,
    SESSION_KEY: SESSION_KEY,
    DEMO_CODE: DEMO_CODE,
    init: init,
    session: session,
    login: login,
    createFamily: createFamily,
    logout: logout,
    reload: reload,
    get: get,
    reset: reset,
    addPantry: addPantry,
    updatePantry: updatePantry,
    changeQty: changeQty,
    removePantry: removePantry,
    addManualItem: addManualItem,
    addSuggestion: addSuggestion,
    addAllSuggestions: addAllSuggestions,
    addCatalogProduct: addCatalogProduct,
    toggleItem: toggleItem,
    removeItem: removeItem,
    checkout: checkout,
    addExpense: addExpense,
    removeExpense: removeExpense,
    setBudget: setBudget,
    cook: cook,
    discard: discard,
    pushMessage: pushMessage,
    setMember: setMember
  };
});
