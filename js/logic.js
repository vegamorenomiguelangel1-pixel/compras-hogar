(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YapaLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SOON_DAYS = 4;
  var STORES = ['Hipermaxi', 'Fidalga', 'IC Norte', 'Mercado Los Pozos', 'Mercado Mutualista', 'Abasto'];

  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function num(v) {
    if (typeof v === 'number') return v;
    var s = String(v == null ? '' : v).trim().replace(/\s/g, '').replace(',', '.');
    if (!s) return NaN;
    return Number(s);
  }

  function parseISO(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var parts = iso.split('-').map(Number);
    var dt = new Date(parts[0], parts[1] - 1, parts[2]);
    if (dt.getFullYear() !== parts[0] || dt.getMonth() !== parts[1] - 1 || dt.getDate() !== parts[2]) return null;
    return dt;
  }

  function todayISO(date) {
    var d = date || new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function addDays(iso, n) {
    var d = parseISO(iso);
    if (!d) throw new Error('Fecha inválida');
    d.setDate(d.getDate() + n);
    return todayISO(d);
  }

  function recentDate(today, daysBack) {
    var day = Number(String(today).slice(8, 10));
    var shift = Math.min(daysBack, Math.max(day - 1, 0));
    return addDays(today, -shift);
  }

  function daysUntil(iso, today) {
    var a = parseISO(iso);
    var b = parseISO(today);
    if (!a || !b) return null;
    return Math.round((a.getTime() - b.getTime()) / 86400000);
  }

  function monthKey(iso) {
    return String(iso || '').slice(0, 7);
  }

  function cap(s) {
    s = String(s || '');
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function formatLong(iso) {
    var d = parseISO(iso);
    if (!d) return '';
    return cap(d.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  function formatShort(iso) {
    var d = parseISO(iso);
    if (!d) return '';
    return d.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
  }

  function monthLabel(today) {
    var d = parseISO(monthKey(today) + '-01');
    if (!d) return '';
    return cap(d.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }));
  }

  function money(n) {
    var v = round2(num(n) || 0);
    var negative = v < 0;
    var fixed = Math.abs(v).toFixed(2).split('.');
    var withDots = fixed[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (negative ? '-' : '') + 'Bs ' + withDots + ',' + fixed[1];
  }

  function formatQty(n) {
    var v = round2(num(n) || 0);
    if (Object.is(v, -0)) v = 0;
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
  }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeReg(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function hasTerm(text, term) {
    var q = norm(text);
    var t = norm(term);
    if (!q || !t) return false;
    function matches(token) {
      var re = new RegExp('(^|[^a-z0-9])' + escapeReg(token) + '([^a-z0-9]|$)');
      return re.test(q);
    }
    if (matches(t)) return true;
    if (t.length >= 4 && t.charAt(t.length - 1) !== 's' && matches(t + 's')) return true;
    if (t.length > 4 && t.charAt(t.length - 1) === 's' && matches(t.slice(0, -1))) return true;
    return false;
  }

  function normalizeUnit(unit) {
    var u = norm(unit);
    if (u === 'kg' || u.indexOf('kg') === 0) return 'kg';
    if (u === 'g' || u === 'gr' || u === 'gramo' || u === 'gramos') return 'g';
    if (u === 'l' || u === 'lt' || u === 'litro' || u === 'litros') return 'l';
    if (u === 'ml') return 'ml';
    if (u === 'u' || u === 'un' || u === 'unid' || u === 'unidad' || u === 'unidades') return 'u';
    return 'other';
  }

  function statusOf(item, today) {
    var days = item && item.expiry ? daysUntil(item.expiry, today) : null;
    var level = 'ok';
    if (days != null) {
      if (days < 0) level = 'expired';
      else if (days <= SOON_DAYS) level = 'soon';
    }
    var low = Number(item && item.qty) <= Number(item && item.min);
    return { level: level, days: days, low: low };
  }

  function expiryLabel(days) {
    if (days == null) return 'Sin fecha de vencimiento';
    if (days < 0) {
      var n = Math.abs(days);
      return n === 1 ? 'Venció ayer' : 'Venció hace ' + n + ' días';
    }
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return 'Vence en ' + days + ' días';
  }

  function statusRank(st) {
    if (st.level === 'expired') return 0;
    if (st.level === 'soon') return 1;
    if (st.low) return 2;
    return 3;
  }

  function isAlert(st) {
    return st.level === 'expired' || st.level === 'soon' || st.low;
  }

  function alertItems(pantry, today) {
    return (pantry || []).filter(function (item) {
      return isAlert(statusOf(item, today));
    });
  }

  function filterPantry(items, opts) {
    var query = norm(opts && opts.query);
    var filter = (opts && opts.filter) || 'todas';
    var today = opts.today;
    return (items || []).filter(function (item) {
      var st = statusOf(item, today);
      if (query && norm(item.name).indexOf(query) === -1 && norm(item.category).indexOf(query) === -1) return false;
      if (filter === 'vencidos') return st.level === 'expired';
      if (filter === 'pronto') return st.level === 'soon';
      if (filter === 'bajo') return st.low;
      if (filter === 'alertas') return isAlert(st);
      return true;
    }).sort(function (a, b) {
      var ra = statusRank(statusOf(a, today));
      var rb = statusRank(statusOf(b, today));
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name, 'es');
    });
  }

  function qtyStep(unit) {
    var u = normalizeUnit(unit);
    if (u === 'kg' || u === 'l') return 0.1;
    if (u === 'g' || u === 'ml') return 50;
    return 1;
  }

  function suggestedQty(item) {
    var gap = round2(Number(item.min) - Number(item.qty));
    var base = gap > 0 ? gap : Math.max(Number(item.min) || 1, 1);
    var u = normalizeUnit(item.unit);
    if (u === 'u' || u === 'other') return Math.max(1, Math.ceil(base - 1e-9));
    if (u === 'kg' || u === 'l') return Math.max(0.1, round2(Math.ceil(base * 10 - 1e-9) / 10));
    if (u === 'g' || u === 'ml') return Math.max(50, Math.ceil(base / 50) * 50);
    return Math.max(1, Math.ceil(base));
  }

  function shouldSuggest(st) {
    if (st.low) return true;
    if (st.level === 'soon') return true;
    return false;
  }

  function reasonFor(st) {
    if (st.level === 'expired' && st.low) return 'Stock bajo: retira lo vencido antes de reponer';
    if (st.level === 'soon' && st.low) return 'Por vencer y queda poco';
    if (st.level === 'soon') return 'Por vencer';
    if (st.low) return 'Stock bajo';
    return '';
  }

  function findProduct(name, catalog) {
    var q = norm(name);
    var best = null;
    var bestLen = 0;
    (catalog || []).forEach(function (product) {
      var labels = [product.name].concat(product.aliases || []);
      labels.forEach(function (alias) {
        if (hasTerm(q, alias) && norm(alias).length > bestLen) {
          best = product;
          bestLen = norm(alias).length;
        }
      });
    });
    return best;
  }

  function cheapestStores(prices) {
    var entries = Object.keys(prices || {}).map(function (store) {
      return { store: store, price: Number(prices[store]) };
    });
    if (!entries.length) return [];
    var min = entries.reduce(function (acc, row) { return Math.min(acc, row.price); }, Infinity);
    return entries.filter(function (row) { return row.price === min; });
  }

  function priciest(prices) {
    var entries = Object.keys(prices || {}).map(function (store) {
      return { store: store, price: Number(prices[store]) };
    });
    return entries.reduce(function (best, row) {
      if (!best || row.price > best.price) return row;
      return best;
    }, null);
  }

  function spread(prices) {
    var vals = Object.keys(prices || {}).map(function (k) { return Number(prices[k]); });
    if (!vals.length) return { min: 0, max: 0, save: 0 };
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    return { min: round2(min), max: round2(max), save: round2(max - min) };
  }

  function unitPriceFor(item, catalog) {
    var product = null;
    if (item.productId) {
      product = (catalog || []).filter(function (p) { return p.id === item.productId; })[0] || null;
    }
    if (!product) product = findProduct(item.name, catalog);
    if (product) {
      var best = cheapestStores(product.prices)[0];
      if (best) return { price: best.price, product: product, store: best.store };
    }
    return { price: Number(item.price) || 0, product: product, store: null };
  }

  function suggestions(pantry, shopping, catalog, today) {
    var taken = {};
    (shopping || []).forEach(function (row) {
      if (!row.checked) taken[norm(row.name)] = true;
    });
    var out = [];
    (pantry || []).forEach(function (item) {
      var st = statusOf(item, today);
      if (!shouldSuggest(st)) return;
      if (taken[norm(item.name)]) return;
      var priced = unitPriceFor(item, catalog);
      out.push({
        pantryId: item.id,
        productId: (priced.product && priced.product.id) || item.productId || null,
        name: item.name,
        category: item.category,
        qty: suggestedQty(item),
        unit: item.unit,
        unitLabel: item.unitLabel || item.unit,
        price: priced.price,
        kgEach: item.kgEach || (priced.product && priced.product.kgEach) || null,
        reason: reasonFor(st),
        source: 'sugerido',
        by: 'Yapa',
        level: st.level,
        low: st.low
      });
    });
    var rank = { 'Por vencer y queda poco': 0, 'Por vencer': 1, 'Stock bajo: retira lo vencido antes de reponer': 2, 'Stock bajo': 3 };
    out.sort(function (a, b) {
      return (rank[a.reason] == null ? 9 : rank[a.reason]) - (rank[b.reason] == null ? 9 : rank[b.reason])
        || a.name.localeCompare(b.name, 'es');
    });
    return out;
  }

  function winnerSummary(catalog) {
    var tally = {};
    (catalog || []).forEach(function (product) {
      cheapestStores(product.prices).forEach(function (row) {
        tally[row.store] = (tally[row.store] || 0) + 1;
      });
    });
    var ranked = Object.keys(tally).map(function (store) {
      return { store: store, count: tally[store] };
    }).sort(function (a, b) { return b.count - a.count || a.store.localeCompare(b.store, 'es'); });
    return { tally: tally, ranked: ranked };
  }

  function basketSavings(catalog) {
    var cheap = 0;
    var pricey = 0;
    (catalog || []).forEach(function (product) {
      var span = spread(product.prices);
      cheap += span.min;
      pricey += span.max;
    });
    return { cheap: round2(cheap), pricey: round2(pricey), save: round2(pricey - cheap) };
  }

  function filterCatalog(catalog, query, category) {
    var q = norm(query);
    return (catalog || []).filter(function (product) {
      if (category && category !== 'Todas' && product.category !== category) return false;
      if (!q) return true;
      if (norm(product.name).indexOf(q) !== -1) return true;
      if (norm(product.category).indexOf(q) !== -1) return true;
      return (product.aliases || []).some(function (alias) { return norm(alias).indexOf(q) !== -1; });
    });
  }

  function monthSpent(purchases, month) {
    return round2((purchases || []).filter(function (p) {
      return monthKey(p.date) === month;
    }).reduce(function (sum, p) { return sum + Number(p.total || 0); }, 0));
  }

  function spendByCategory(purchases, month) {
    var map = {};
    (purchases || []).forEach(function (p) {
      if (monthKey(p.date) !== month) return;
      (p.items || []).forEach(function (item) {
        var key = item.category || 'Otros';
        map[key] = round2((map[key] || 0) + Number(item.subtotal != null ? item.subtotal : item.qty * item.price));
      });
    });
    return Object.keys(map).map(function (category) {
      return { category: category, total: map[category] };
    }).sort(function (a, b) { return b.total - a.total; });
  }

  function listTotal(items, checked) {
    return round2((items || []).filter(function (item) {
      return checked ? item.checked : !item.checked;
    }).reduce(function (sum, item) {
      return sum + Number(item.qty) * Number(item.price);
    }, 0));
  }

  function ingredientHit(recipe, item) {
    return (recipe.ingredients || []).some(function (ing) {
      return hasTerm(item.name, ing.key) || hasTerm(ing.label, item.name);
    });
  }

  function matchRecipes(pantry, recipes, today) {
    var soon = (pantry || []).filter(function (item) { return statusOf(item, today).level === 'soon' && item.qty > 0; });
    var expired = (pantry || []).filter(function (item) { return statusOf(item, today).level === 'expired' && item.qty > 0; });
    return (recipes || []).map(function (recipe) {
      var usedSoon = soon.filter(function (item) { return ingredientHit(recipe, item); });
      var usedExpired = expired.filter(function (item) { return ingredientHit(recipe, item); });
      return { recipe: recipe, soon: usedSoon, expired: usedExpired, score: usedSoon.length };
    }).filter(function (row) {
      return row.score > 0;
    }).sort(function (a, b) {
      return b.score - a.score || a.recipe.name.localeCompare(b.recipe.name, 'es');
    });
  }

  function estimateKg(qty, unit, kgEach) {
    var u = normalizeUnit(unit);
    var q = Number(qty) || 0;
    if (u === 'kg') return q;
    if (u === 'g') return q / 1000;
    if (u === 'l') return q;
    if (u === 'ml') return q / 1000;
    if (kgEach) return q * Number(kgEach);
    if (u === 'u') return q * 0.12;
    return q * 0.25;
  }

  function portion(item) {
    var q = Number(item.qty) || 0;
    if (q <= 0) return 0;
    var u = normalizeUnit(item.unit);
    if (u === 'kg') return Math.min(q, 0.3);
    if (u === 'g') return Math.min(q, 150);
    if (u === 'l') return Math.min(q, 0.5);
    if (u === 'ml') return Math.min(q, 250);
    if (item.kgEach && Number(item.kgEach) <= 0.2) return Math.min(q, 2);
    return Math.min(q, 1);
  }

  function cookImpact(recipe, pantry, today) {
    var used = [];
    if (!recipe) return { used: used, bs: 0, kg: 0, canCook: false };
    (pantry || []).forEach(function (item) {
      if (statusOf(item, today).level !== 'soon') return;
      if (!ingredientHit(recipe, item)) return;
      var take = portion(item);
      if (take <= 0) return;
      used.push({
        id: item.id,
        name: item.name,
        take: round2(take),
        unit: item.unit,
        unitLabel: item.unitLabel || item.unit,
        bs: round2(take * (Number(item.price) || 0)),
        kg: round2(estimateKg(take, item.unit, item.kgEach))
      });
    });
    var bs = round2(used.reduce(function (s, row) { return s + row.bs; }, 0));
    var kg = round2(used.reduce(function (s, row) { return s + row.kg; }, 0));
    return { used: used, bs: bs, kg: kg, canCook: used.length > 0 };
  }

  function wasteTotals(waste, month) {
    var allBs = 0;
    var allKg = 0;
    var monthBs = 0;
    var monthKg = 0;
    (waste || []).forEach(function (row) {
      allBs += Number(row.bs) || 0;
      allKg += Number(row.kg) || 0;
      if (monthKey(row.date) === month) {
        monthBs += Number(row.bs) || 0;
        monthKg += Number(row.kg) || 0;
      }
    });
    return { allBs: round2(allBs), allKg: round2(allKg), monthBs: round2(monthBs), monthKg: round2(monthKg) };
  }

  var uidN = 0;
  function uid(prefix) {
    uidN += 1;
    return prefix + '-' + uidN.toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function linesOf(items, mapLine) {
    return items.map(mapLine).join('\n');
  }

  function priceAnswer(product) {
    var best = cheapestStores(product.prices);
    var high = priciest(product.prices);
    var span = spread(product.prices);
    var lines = Object.keys(product.prices).map(function (store) {
      var mark = best.some(function (row) { return row.store === store; }) ? ' · más barato' : '';
      return '· ' + store + ': ' + money(product.prices[store]) + mark;
    });
    var where = best.map(function (row) { return row.store; }).join(' y ');
    var extra = span.save > 0 && high
      ? ' Si lo compras en ' + where + ' en vez de ' + high.store + ', ahorras ' + money(span.save) + ' por ' + (product.unitLabel || 'unidad') + '.'
      : ' El precio es el mismo en los locales de la muestra.';
    return product.name + ' (' + (product.unitLabel || product.unit) + '):\n' + lines.join('\n') + '\n' + extra;
  }

  function answer(raw, ctx) {
    var q = norm(raw);
    var actions = [];
    ctx = ctx || {};
    var today = ctx.today;
    var pantry = ctx.pantry || [];
    var catalog = ctx.catalog || [];
    var recipes = ctx.recipes || [];

    if (!q) {
      return { text: 'Escribe una pregunta o toca una sugerencia.', actions: actions };
    }

    if (/^(hola|buenas|buenos dias|buen dia|hey|que tal)\b/.test(q)) {
      return {
        text: '¡Hola! Soy Yapa, la asistente de la familia ' + (ctx.familyName || 'Rojas') + (ctx.city ? ' en ' + ctx.city : '') + '. Reviso la despensa, armo la lista y comparo precios en bolivianos. Todo queda en este celular: no envío tus datos a internet.',
        actions: [
          { label: 'Qué vence pronto', send: '¿Qué está por vencer?' },
          { label: 'Ver presupuesto', route: 'presupuesto' }
        ]
      };
    }

    if (q.indexOf('gracias') !== -1) {
      return { text: 'Con gusto. Si quieres, te armo la lista con lo que está bajo o por vencer.', actions: [{ label: 'Armar lista', route: 'lista' }] };
    }

    if (q.indexOf('minimkt') !== -1 || q.indexOf('caso de estudio') !== -1 || q.indexOf('universidad') !== -1 || q.indexOf('prototipo') !== -1) {
      return {
        text: 'Yapa es un prototipo para un caso de estudio universitario. Toma ideas de Minimkt (stock, alertas, analítica, pedidos recurrentes y asistente) y las adapta a la cocina de un hogar en Santa Cruz de la Sierra. Los precios son de muestra y no hay conexión con tiendas reales.',
        actions: [{ label: 'Acerca del proyecto', route: 'acerca' }]
      };
    }

    if (q.indexOf('quien eres') !== -1 || q.indexOf('que eres') !== -1 || q === 'yapa' || q.indexOf('que es yapa') !== -1 || q.indexOf('que significa') !== -1) {
      return {
        text: 'Yapa es esa porción extra que te dan en el mercado. Aquí ayudo a comprar mejor en Santa Cruz de la Sierra: comparo Hipermaxi, Fidalga, IC Norte, Mercado Los Pozos, Mercado Mutualista y Abasto. Funciono con reglas en tu celular, sin una API externa.',
        actions: [{ label: 'Cómo funciona', send: '¿Cómo funciona la app?' }]
      };
    }

    if (q.indexOf('como funciona') !== -1 || q.indexOf('ayuda') !== -1 || q.indexOf('que puedes') !== -1) {
      return {
        text: 'Puedo hacer esto, siempre con los datos guardados en este navegador:\n· Despensa: cantidades, vencimiento y stock bajo.\n· Lista: sugiere lo que falta y deja anotar pedidos de la familia.\n· Precios: compara Hipermaxi, Fidalga, IC Norte, Mercado Los Pozos, Mercado Mutualista y Abasto.\n· Presupuesto: lo gastado del mes frente a tu límite.\n· Anti-desperdicio: recetas para lo que está por vencer.\nPregúntame por un producto, por ejemplo: ¿dónde sale más barato el arroz?',
        actions: [
          { label: 'Ver despensa', route: 'despensa' },
          { label: 'Comparar precios', route: 'precios' }
        ]
      };
    }

    var soon = pantry.filter(function (item) { return statusOf(item, today).level === 'soon' && item.qty > 0; });
    var expired = pantry.filter(function (item) { return statusOf(item, today).level === 'expired' && item.qty > 0; });
    var low = pantry.filter(function (item) { return statusOf(item, today).low; });

    if (q.indexOf('vence') !== -1 || q.indexOf('venc') !== -1 || q.indexOf('caduc') !== -1) {
      var soonLines = soon.length
        ? linesOf(soon, function (item) {
          var st = statusOf(item, today);
          return '· ' + item.name + ' — ' + expiryLabel(st.days);
        })
        : '· Nada por vencer en los próximos ' + SOON_DAYS + ' días.';
      var expLines = expired.length
        ? '\n\nYa venció, no lo consumas:\n' + linesOf(expired, function (item) { return '· ' + item.name; })
        : '';
      var recipeHint = '';
      var matched = matchRecipes(pantry, recipes, today);
      if (matched.length) {
        recipeHint = '\n\nUna receta que aprovecha lo que está por vencer: ' + matched[0].recipe.name + '.';
      }
      return {
        text: 'Productos por vencer:\n' + soonLines + expLines + recipeHint,
        actions: [{ label: 'Ver recetas', route: 'desperdicio' }, { label: 'Abrir despensa', route: 'despensa' }]
      };
    }

    if (q.indexOf('stock') !== -1 || q.indexOf('queda poco') !== -1 || q.indexOf('se acabo') !== -1 || q.indexOf('agot') !== -1) {
      var lowLines = low.length
        ? linesOf(low, function (item) {
          return '· ' + item.name + ' — tienes ' + formatQty(item.qty) + ' ' + (item.unitLabel || item.unit) + ', mínimo ' + formatQty(item.min);
        })
        : '· No hay productos en stock bajo.';
      return {
        text: 'Stock bajo:\n' + lowLines + '\n\nPuedo pasarlos a la lista de compras.',
        actions: [{ label: 'Ver lista', route: 'lista' }]
      };
    }

    if (q.indexOf('presupuesto') !== -1 || q.indexOf('gasto') !== -1 || (q.indexOf('plata') !== -1 && q.indexOf('precio') === -1)) {
      var month = monthKey(today);
      var spent = monthSpent(ctx.purchases || [], month);
      var limit = Number(ctx.budgetLimit) || 0;
      var left = round2(limit - spent);
      var cats = spendByCategory(ctx.purchases || [], month);
      var top = cats[0] ? ' Donde más se fue la plata: ' + cats[0].category + ' (' + money(cats[0].total) + ').' : '';
      var pace = left < 0
        ? 'Ya pasaste el límite por ' + money(Math.abs(left)) + '.'
        : 'Te quedan ' + money(left) + ' de ' + money(limit) + ' en ' + monthLabel(today) + '.';
      return {
        text: 'Este mes llevas ' + money(spent) + '. ' + pace + top,
        actions: [{ label: 'Abrir presupuesto', route: 'presupuesto' }]
      };
    }

    if (q.indexOf('desperd') !== -1 || q.indexOf('receta') !== -1 || q.indexOf('basura') !== -1 || q.indexOf('botar') !== -1) {
      var totals = wasteTotals(ctx.waste || [], monthKey(today));
      var ideas = matchRecipes(pantry, recipes, today).slice(0, 3);
      var ideaText = ideas.length
        ? linesOf(ideas, function (row) { return '· ' + row.recipe.name + ' (usa ' + row.soon.length + ' por vencer)'; })
        : '· Hoy no hay recetas con productos por vencer.';
      return {
        text: 'Llevas ' + money(totals.allBs) + ' estimados en comida salvada y ' + formatQty(totals.allKg) + ' kg que no se botaron.\n\nRecetas para lo que urge:\n' + ideaText + '\n\nSi un producto ya venció, no lo cocines: sácalo de la despensa.',
        actions: [{ label: 'Anti-desperdicio', route: 'desperdicio' }]
      };
    }

    if (q.indexOf('tip') !== -1 || q.indexOf('consejo') !== -1 || q.indexOf('ahorr') !== -1) {
      return {
        text: 'Tres hábitos que ayudan en casa:\n· Compara feria y supermercado: la verdura suele salir mejor en Mercado Los Pozos o Mercado Mutualista, y la carne a veces en Abasto.\n· El domingo mira qué vence esta semana y arma el menú con eso.\n· No repongas un producto por vencer si todavía tienes bastante: primero cocínalo.\n· Anota la compra apenas llegas, así el presupuesto no se escapa.',
        actions: [{ label: 'Comparar precios', route: 'precios' }]
      };
    }

    var products = [];
    catalog.forEach(function (product) {
      var labels = [product.name].concat(product.aliases || []);
      var hit = labels.some(function (alias) { return hasTerm(q, alias); });
      if (hit) products.push(product);
    });

    var asksPrice = q.indexOf('precio') !== -1 || q.indexOf('barat') !== -1 || q.indexOf('caro') !== -1
      || q.indexOf('conviene') !== -1 || q.indexOf('donde') !== -1 || q.indexOf('hipermaxi') !== -1
      || q.indexOf('fidalga') !== -1 || q.indexOf('norte') !== -1 || q.indexOf('mercado') !== -1
      || q.indexOf('feria') !== -1 || q.indexOf('pozos') !== -1 || q.indexOf('mutualista') !== -1 || q.indexOf('abasto') !== -1 || q.indexOf('compr') !== -1;

    if (products.length && (asksPrice || q.indexOf('cuanto') !== -1)) {
      var body = products.slice(0, 3).map(priceAnswer).join('\n\n');
      body += '\n\nPrecios de muestra para el caso de estudio, no son una cotización en vivo.';
      return { text: body, actions: [{ label: 'Abrir comparador', route: 'precios' }] };
    }

    if (asksPrice && (q.indexOf('barat') !== -1 || q.indexOf('conviene') !== -1 || q.indexOf('donde') !== -1 || q.indexOf('precio') !== -1)) {
      var summary = winnerSummary(catalog);
      var basket = basketSavings(catalog);
      var lead = summary.ranked[0]
        ? summary.ranked[0].store + ' tiene el menor precio en ' + summary.ranked[0].count + ' de ' + catalog.length + ' productos de la muestra.'
        : 'Todavía no hay precios cargados.';
      return {
        text: lead + ' Si compras una unidad de cada producto en su local más barato, la canasta sale ' + money(basket.cheap) + ' frente a ' + money(basket.pricey) + ' comprando siempre en el más caro. Diferencia: ' + money(basket.save) + '.\n\nEn Santa Cruz la feria de Los Pozos y Mutualista suele ganar en papa, tomate y fruta; Abasto a veces conviene en carne, y el súper gana con aceite, fideos o atún en oferta.',
        actions: [{ label: 'Ver comparador', route: 'precios' }]
      };
    }

    if (q.indexOf('lista') !== -1 || q.indexOf('pedido') !== -1 || q.indexOf('compras') !== -1) {
      var pending = (ctx.shopping || []).filter(function (item) { return !item.checked; });
      var ideasBuy = suggestions(pantry, ctx.shopping || [], catalog, today);
      var names = pending.slice(0, 6).map(function (item) { return '· ' + item.name + ' (' + (item.by || 'familia') + ')'; }).join('\n');
      return {
        text: 'En la lista hay ' + pending.length + ' productos por comprar' + (pending.length ? ':\n' + names : '.') + '\n\nYapa sugiere reponer ' + ideasBuy.length + ' ítems que están bajos o por vencer. Cada pedido lleva el nombre de quien lo anotó. Con el mismo código, la lista se sincroniza entre celulares cuando hay internet.',
        actions: [{ label: 'Abrir lista', route: 'lista' }]
      };
    }

    if (q.indexOf('borrar') !== -1 || q.indexOf('reinici') !== -1 || q.indexOf('restablec') !== -1) {
      return {
        text: 'Puedes volver a los datos de la familia Rojas desde Acerca del proyecto, con el botón Restablecer datos de ejemplo. Eso borra lo que hayas cambiado en este navegador.',
        actions: [{ label: 'Ir a Acerca', route: 'acerca' }]
      };
    }

    return {
      text: 'No tengo una respuesta armada para eso. Prueba con despensa, lista, precios, presupuesto, desperdicio o un producto como leche, pollo o arroz. También puedo darte un tip para ahorrar.',
      actions: [
        { label: 'Qué vence pronto', send: '¿Qué está por vencer?' },
        { label: 'Tip de ahorro', send: 'Dame un tip para ahorrar' }
      ]
    };
  }

  return {
    SOON_DAYS: SOON_DAYS,
    STORES: STORES,
    parseISO: parseISO,
    todayISO: todayISO,
    addDays: addDays,
    recentDate: recentDate,
    daysUntil: daysUntil,
    monthKey: monthKey,
    cap: cap,
    formatLong: formatLong,
    formatShort: formatShort,
    monthLabel: monthLabel,
    round2: round2,
    num: num,
    money: money,
    formatQty: formatQty,
    norm: norm,
    hasTerm: hasTerm,
    normalizeUnit: normalizeUnit,
    statusOf: statusOf,
    expiryLabel: expiryLabel,
    statusRank: statusRank,
    isAlert: isAlert,
    alertItems: alertItems,
    filterPantry: filterPantry,
    qtyStep: qtyStep,
    suggestedQty: suggestedQty,
    shouldSuggest: shouldSuggest,
    reasonFor: reasonFor,
    findProduct: findProduct,
    cheapestStores: cheapestStores,
    priciest: priciest,
    spread: spread,
    unitPriceFor: unitPriceFor,
    suggestions: suggestions,
    winnerSummary: winnerSummary,
    basketSavings: basketSavings,
    filterCatalog: filterCatalog,
    monthSpent: monthSpent,
    spendByCategory: spendByCategory,
    listTotal: listTotal,
    ingredientHit: ingredientHit,
    matchRecipes: matchRecipes,
    estimateKg: estimateKg,
    portion: portion,
    cookImpact: cookImpact,
    wasteTotals: wasteTotals,
    uid: uid,
    answer: answer
  };
});
