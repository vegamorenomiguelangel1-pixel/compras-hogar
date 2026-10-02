(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YapaStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var KEY = 'yapa-hogar-v1';
  var state = null;

  function L() { return globalThis.YapaLogic; }
  function D() { return globalThis.YapaData; }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== 1) return null;
      if (!Array.isArray(data.pantry) || !Array.isArray(data.shopping) || !Array.isArray(data.purchases)) return null;
      if (!Array.isArray(data.waste) || !Array.isArray(data.messages)) return null;
      if (!data.family || !Array.isArray(data.group)) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  function init() {
    if (state) return state;
    state = read() || D().buildSeed(L().todayISO());
    write();
    return state;
  }

  function reload() {
    state = null;
    return init();
  }

  function get() {
    return state || init();
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (err) { /* sigue en memoria */ }
    state = D().buildSeed(L().todayISO());
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
        by: fields.by || 'Yo',
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
      by: 'Yapa',
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
      by: 'Yapa',
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
    init: init,
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
