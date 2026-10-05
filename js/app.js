(function () {
  'use strict';

  var L = window.YapaLogic;
  var D = window.YapaData;
  var Store = window.YapaStore;
  var I = window.YapaI18n;

  function t(key, vars) { return I.t(key, vars); }

  function langSwitch() {
    var current = I.lang();
    return '<div class="lang-switch" role="group" aria-label="' + esc(t('lang.label')) + '">' + I.LANGS.map(function (row) {
      var on = row.id === current;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-action="lang" data-lang="' + row.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(row.label) + '</button>';
    }).join('') + '</div>';
  }

  var ROUTES = ['inicio', 'despensa', 'lista', 'precios', 'mas', 'presupuesto', 'desperdicio', 'asistente', 'acerca'];
  var ROOT = { inicio: true, despensa: true, lista: true, precios: true, mas: true };
  var TAB_OF = {
    inicio: 'inicio',
    despensa: 'despensa',
    lista: 'lista',
    precios: 'precios',
    mas: 'mas',
    presupuesto: 'mas',
    desperdicio: 'mas',
    asistente: 'mas',
    acerca: 'mas'
  };
  var PEOPLE = { Yapa: '#1F7A44', Carla: '#B33A28', Luis: '#185A8C', Ana: '#8A5400', Mateo: '#6D28D9', Yo: '#1F7A44' };
  var PALETTE = ['#1F7A44', '#B33A28', '#185A8C', '#8A5400', '#6D28D9', '#0F6E6E'];
  var QUICK = ['quick.expire', 'quick.buy', 'quick.rice', 'quick.budget', 'quick.tip'];
  var ui = {
    qPantry: '',
    qPrice: '',
    pantryFilter: 'todas',
    priceCat: 'Todas',
    chatDraft: '',
    typing: false,
    lastRoute: '',
    authMode: 'login'
  };
  var toastTimer = 0;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function icon(name) {
    var paths = {
      home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
      box: '<path d="M3.5 8h17l-1.4 11.2a2 2 0 0 1-2 1.8H6.9a2 2 0 0 1-2-1.8L3.5 8z"/><path d="M8 8V6.2A2.2 2.2 0 0 1 10.2 4h3.6A2.2 2.2 0 0 1 16 6.2V8"/>',
      list: '<path d="M9 7h11M9 12h11M9 17h11"/><path d="m4.5 7 1 1 2-2M4.5 12l1 1 2-2M4.5 17l1 1 2-2"/>',
      tag: '<path d="M3 12V4h8l10 10-8 8z"/><path d="M7.5 7.5h.01"/>',
      more: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
      back: '<path d="M15 5 8 12l7 7"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
      send: '<path d="m4 12 16-8-6 16-2.5-6.5z"/>',
      chev: '<path d="m9 6 6 6-6 6"/>',
      check: '<path d="m5 12 5 5 9-10"/>'
    };
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || '') + '</svg>';
  }

  function logoMark() {
    return '<img class="mark" src="icons/yapa-logo.png" alt="" width="704" height="842">';
  }

  function route() {
    var name = String(location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return ROUTES.indexOf(name) === -1 ? 'inicio' : name;
  }

  function today() { return L.todayISO(); }

  function model() {
    var state = Store.get();
    var day = today();
    var month = L.monthKey(day);
    return {
      state: state,
      today: day,
      month: month,
      spent: L.monthSpent(state.purchases, month),
      cats: L.spendByCategory(state.purchases, month),
      waste: L.wasteTotals(state.waste, month),
      suggestions: L.suggestions(state.pantry, state.shopping, D.CATALOG, day),
      soon: state.pantry.filter(function (item) { return L.statusOf(item, day).level === 'soon' && item.qty > 0; }),
      expired: state.pantry.filter(function (item) { return L.statusOf(item, day).level === 'expired' && item.qty > 0; }),
      low: state.pantry.filter(function (item) { return L.statusOf(item, day).low; })
    };
  }

  function personColor(name) {
    if (PEOPLE[name]) return PEOPLE[name];
    var n = 0;
    String(name || '').split('').forEach(function (ch) { n += ch.charCodeAt(0); });
    return PALETTE[n % PALETTE.length];
  }

  function who(name) {
    var initial = String(name || 'Y').charAt(0).toUpperCase();
    return '<span class="who" style="background:' + personColor(name) + '" title="' + esc(name) + '">' + esc(initial) + '</span>';
  }

  function qtyLabel(row) {
    return L.formatQty(row.qty) + ' ' + (row.unitLabel || row.unit);
  }

  function pills(item, day) {
    var st = L.statusOf(item, day);
    var html = '';
    if (st.level === 'expired') html += '<span class="pill bad">' + esc(t('pill.expired')) + '</span>';
    else if (st.level === 'soon') html += '<span class="pill warn">' + esc(t('pill.soon')) + '</span>';
    else if (!item.expiry) html += '<span class="pill neutral">' + esc(t('pill.none')) + '</span>';
    else html += '<span class="pill ok">' + esc(t('pill.ok')) + '</span>';
    if (st.low) html += '<span class="pill low">' + esc(t('pill.low')) + '</span>';
    return '<div class="pills">' + html + '</div>';
  }

  function tone(item, day) {
    var st = L.statusOf(item, day);
    if (st.level === 'expired') return 'expired';
    if (st.level === 'soon') return 'soon';
    if (st.low) return 'low';
    return 'ok';
  }

  function ring(pct, extra) {
    var r = 28;
    var c = 2 * Math.PI * r;
    var clamped = Math.max(0, Math.min(pct, 1));
    var dash = (c * clamped).toFixed(2);
    var gap = (c - c * clamped).toFixed(2);
    return '<svg class="ring ' + extra + '" viewBox="0 0 72 72" aria-hidden="true"><circle class="track" cx="36" cy="36" r="' + r + '"/><circle class="value" cx="36" cy="36" r="' + r + '" stroke-dasharray="' + dash + ' ' + gap + '" transform="rotate(-90 36 36)"/></svg>';
  }

  function options(list, selected, valueKey, labelKey) {
    return list.map(function (row) {
      var value = valueKey ? row[valueKey] : row;
      var label = labelKey ? row[labelKey] : row;
      return '<option value="' + esc(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + esc(label) + '</option>';
    }).join('');
  }

  function field(label, control, hint) {
    return '<label class="field"><span>' + label + '</span>' + control + (hint ? '<small>' + hint + '</small>' : '') + '</label>';
  }

  function empty(title, text) {
    return '<div class="empty"><strong>' + esc(title) + '</strong><p>' + esc(text) + '</p></div>';
  }

  function pantryCard(item, day) {
    var step = L.qtyStep(item.unit);
    var st = L.statusOf(item, day);
    return '<article class="card ' + tone(item, day) + '">'
      + '<div class="item-line tappable" data-action="edit-pantry" data-id="' + esc(item.id) + '" role="button" tabindex="0">'
      + '<span class="grow"><h3>' + esc(item.name) + '</h3><span class="meta">' + esc(item.category) + ' · mínimo ' + esc(qtyLabel({ qty: item.min, unitLabel: item.unitLabel, unit: item.unit })) + '</span>'
      + '<span class="meta">' + esc(L.expiryLabel(st.days)) + '</span>' + pills(item, day) + '</span>'
      + '<strong class="money">' + esc(L.money(item.price)) + '</strong></div>'
      + '<div class="stepper"><button type="button" data-action="qty" data-id="' + esc(item.id) + '" data-delta="' + (-step) + '" aria-label="' + esc(t('aria.minus')) + '">−</button><strong>' + esc(qtyLabel(item)) + '</strong><button type="button" data-action="qty" data-id="' + esc(item.id) + '" data-delta="' + step + '" aria-label="' + esc(t('aria.plus')) + '">+</button></div>'
      + '</article>';
  }

  function paintPantryList() {
    var box = document.getElementById('pantry-list');
    if (!box) return;
    var m = model();
    var rows = L.filterPantry(m.state.pantry, { query: ui.qPantry, filter: ui.pantryFilter, today: m.today });
    box.innerHTML = rows.length ? rows.map(function (item) { return pantryCard(item, m.today); }).join('') : empty('Sin resultados', 'Prueba otro filtro o agrega el producto con el botón naranja.');
  }

  function priceCard(product, shopping) {
    var best = L.cheapestStores(product.prices);
    var high = L.priciest(product.prices);
    var span = L.spread(product.prices);
    if (!best.length) return '';
    var onList = shopping.some(function (row) { return !row.checked && row.productId === product.id; });
    var rows = D.STORES.map(function (store) {
      var price = product.prices[store];
      var isBest = best.some(function (row) { return row.store === store; });
      var width = span.max ? Math.max(8, Math.round(price / span.max * 100)) : 0;
      return '<div class="store ' + (isBest ? 'is-best' : '') + '"><div class="store-top"><span>' + esc(store) + (isBest ? ' <em class="best">' + esc(t('price.cheap')) + '</em>' : '') + '</span><strong>' + esc(L.money(price)) + '</strong></div><div class="meter"><span style="width:' + width + '%"></span></div></div>';
    }).join('');
    var save = span.save > 0 && high
      ? t('price.save', { money: L.money(span.save), store: high.store })
      : t('price.same');
    return '<article class="card"><h3>' + esc(product.name) + '</h3><p class="meta">' + esc(product.category) + ' · ' + esc(product.unitLabel) + '</p>'
      + rows + '<p class="note">' + esc(save) + '</p>'
      + '<button class="btn" type="button" data-action="add-catalog" data-id="' + esc(product.id) + '">' + (onList ? t('btn.addAnother') : t('btn.addList')) + ' · ' + esc(L.money(best[0].price)) + '</button></article>';
  }

  function paintPriceList() {
    var box = document.getElementById('price-list');
    if (!box) return;
    var rows = L.filterCatalog(D.CATALOG, ui.qPrice, ui.priceCat)
      .slice()
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); });
    var shopping = Store.get().shopping;
    box.innerHTML = rows.length ? rows.map(function (product) { return priceCard(product, shopping); }).join('') : empty('No hay coincidencias', 'Busca arroz, pollo, leche o el nombre de un local.');
  }

  function viewInicio(m) {
    var limit = m.state.budgetLimit;
    var pct = limit ? m.spent / limit : 0;
    var left = L.round2(limit - m.spent);
    var pace = left < 0 ? 'Superaste el presupuesto por ' + L.money(Math.abs(left)) + '.' : 'Te quedan ' + L.money(Math.max(left, 0)) + ' este mes.';
    var klass = pct > 1 ? 'is-over' : pct > 0.8 ? 'is-tight' : '';
    var session = Store.session();
    var name = (session && session.name) || 'familia';
    var code = (session && session.code) || '';
    var banner = m.expired.length
      ? '<a class="banner" href="#/despensa">' + (m.expired.length === 1
        ? '1 producto venció. No lo consumas: revísalo en la despensa.'
        : m.expired.length + ' productos vencieron. No los consumas: revísalos en la despensa.') + '</a>'
      : '';
    var soonCards = m.soon.slice(0, 8).map(function (item) {
      var st = L.statusOf(item, m.today);
      return '<a class="mini" href="#/desperdicio"><strong>' + esc(item.name) + '</strong><span class="meta">' + esc(L.expiryLabel(st.days)) + '</span></a>';
    }).join('');
    var pending = m.state.shopping.filter(function (row) { return !row.checked; }).slice(0, 3);
    var listPreview = pending.map(function (row) {
      return '<p class="meta">' + who(row.by) + ' ' + esc(row.name) + ' · ' + esc(row.reason) + '</p>';
    }).join('');
    var place = [m.state.family.neighborhood, m.state.family.city].filter(Boolean).join(', ');
    var joined = (m.state.joined || []).map(function (row) { return row.name; });
    var joinedLine = joined.length
      ? joined.map(function (person) { return who(person) + ' ' + esc(person); }).join(' ')
      : t('joined.none');
    return '<section class="hero"><div class="hero-brand">' + logoMark() + '<span>Yapa</span></div><h1>' + esc(t('hello', { name: name })) + '</h1><p>' + esc(L.formatLong(m.today)) + '</p><p>' + esc(place) + '</p><p class="hero-code">' + esc(t('code.label', { code: code })) + '</p><p>' + esc(t('tagline')) + '</p></section>'
      + '<div class="card session-card"><p class="meta">' + esc(t('family.cloud')) + ' ' + syncPill() + '</p><strong>' + esc(name) + '</strong><p class="meta">' + esc(t('family.name', { surname: m.state.family.surname })) + ' · ' + esc(code) + '</p><div class="joined">' + joinedLine + '</div><button class="btn ghost" type="button" data-action="logout">' + esc(t('logout')) + '</button></div>'
      + '<div class="stack">' + banner
      + '<div class="stats">'
      + stat(m.soon.length, t('stat.soon'), 'desperdicio')
      + stat(m.low.length, t('stat.low'), 'despensa')
      + stat(L.money(m.spent), t('stat.spent'), 'presupuesto')
      + stat(L.money(m.waste.allBs), t('stat.saved'), 'desperdicio')
      + '</div>'
      + '<a class="card" href="#/presupuesto"><div class="ring-wrap">' + ring(pct, klass) + '<span class="grow"><strong>' + esc(Math.round(pct * 100)) + '%</strong> del presupuesto de ' + esc(L.money(limit)) + '<span class="meta">' + esc(pace) + '</span></span></div><div class="progress ' + klass + '" style="margin-top:12px"><span style="width:' + Math.min(100, Math.round(pct * 100)) + '%"></span></div></a>'
      + '</div>'
      + (soonCards ? '<div class="section-title"><h2>' + esc(t('section.soon')) + '</h2><button class="linkish" type="button" data-action="go" data-route="desperdicio">' + esc(t('section.recipes')) + '</button></div><div class="scroller">' + soonCards + '</div>' : '')
      + '<div class="section-title"><h2>' + esc(t('section.familyList')) + '</h2><button class="linkish" type="button" data-action="go" data-route="lista">' + esc(t('section.open')) + '</button></div>'
      + '<div class="card"><p class="meta">Yapa sugiere reponer ' + m.suggestions.length + ' productos.</p>' + (listPreview || '<p class="meta">No hay pedidos pendientes.</p>') + '<p class="note">Por comprar: ' + esc(L.money(L.listTotal(m.state.shopping, false))) + '. Cada pedido muestra quién lo anotó. Quien entre con ' + esc(code) + ' en otro celular ve la misma lista.</p></div>';
  }

  function stat(value, label, dest) {
    return '<a class="stat" href="#/' + dest + '"><strong>' + esc(value) + '</strong><span>' + esc(label) + '</span></a>';
  }

  function viewDespensa(m) {
    var counts = {
      todas: m.state.pantry.length,
      alertas: L.alertItems(m.state.pantry, m.today).length,
      pronto: m.soon.length,
      vencidos: m.expired.length,
      bajo: m.low.length
    };
    var filters = [
      ['todas', t('filter.all')],
      ['alertas', t('filter.alerts')],
      ['pronto', t('filter.soon')],
      ['vencidos', t('filter.expired')],
      ['bajo', t('filter.low')]
    ].map(function (row) {
      var on = ui.pantryFilter === row[0] ? ' on' : '';
      return '<button type="button" class="' + on + '" data-action="pantry-filter" data-filter="' + row[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + row[1] + ' ' + counts[row[0]] + '</button>';
    }).join('');
    return '<div class="stack"><input id="q-pantry" class="search" type="search" placeholder="' + esc(t('search.pantry')) + '" value="' + esc(ui.qPantry) + '" autocomplete="off" aria-label="' + esc(t('search.pantry')) + '"><div class="filters" role="toolbar">' + filters + '</div><div id="pantry-list" class="stack"></div><p class="note">El color marca el estado: rojo si está vencido, amarillo si vence pronto (en ' + L.SOON_DAYS + ' días) y verde si está bien. El aviso de stock bajo aparece cuando la cantidad llega al mínimo.</p></div>'
      + '<button class="fab" type="button" data-action="open-add-pantry" aria-label="' + esc(t('aria.addProduct')) + '">' + icon('plus') + '</button>';
  }

  function viewLista(m) {
    var session = Store.session();
    var joined = (m.state.joined || []).map(function (row) { return row.name; });
    var people = (joined.length ? joined : m.state.family.people.map(function (person) { return person.name; })).map(function (person) {
      return '<span class="avatar" style="background:' + personColor(person) + '" title="' + esc(person) + '">' + esc(person.charAt(0)) + '</span>';
    }).join('');
    var whoJoined = joined.length ? joined.join(', ') : t('joined.nobody');
    var ideas = m.suggestions.map(function (row) {
      return '<article class="card"><div class="item-line">' + who('Yapa') + '<span class="grow"><h3>' + esc(row.name) + '</h3><p class="meta">' + esc(row.reason) + ' · ' + esc(qtyLabel(row)) + '</p></span><strong class="money">' + esc(L.money(row.qty * row.price)) + '</strong></div><button class="btn tiny" type="button" data-action="add-suggestion" data-id="' + esc(row.pantryId) + '">' + esc(t('btn.add')) + '</button></article>';
    }).join('');
    var open = m.state.shopping.filter(function (row) { return !row.checked; });
    var done = m.state.shopping.filter(function (row) { return row.checked; });
    function rows(list, muted) {
      return list.map(function (row) {
        return '<article class="card ' + (muted ? 'checked-item' : '') + '"><div class="item-line"><button class="check ' + (row.checked ? 'on' : '') + '" type="button" data-action="toggle-item" data-id="' + esc(row.id) + '" aria-pressed="' + (row.checked ? 'true' : 'false') + '" aria-label="' + esc(t('aria.mark', { name: row.name })) + '">' + icon('check') + '</button>'
          + '<span class="grow"><h3>' + esc(row.name) + '</h3><p class="meta">' + who(row.by) + ' ' + esc(row.by) + ' · ' + esc(row.reason) + '</p><p class="meta">' + esc(qtyLabel(row)) + ' · ' + esc(L.money(row.price)) + ' c/u</p></span>'
          + '<strong class="money">' + esc(L.money(row.qty * row.price)) + '</strong></div>'
          + '<button class="linkish" type="button" data-action="remove-item" data-id="' + esc(row.id) + '">' + esc(t('btn.remove')) + '</button></article>';
      }).join('');
    }
    var suggestTotal = L.round2(m.suggestions.reduce(function (sum, row) { return sum + row.qty * row.price; }, 0));
    return '<div class="card"><div class="split"><div class="avatars" aria-hidden="true">' + people + '</div><span class="grow"><strong>' + esc(t('family.name', { surname: m.state.family.surname })) + '</strong><p class="meta">' + esc(t('code.label', { code: session ? session.code : '' })) + ' · ' + esc(t('joined.entered', { names: whoJoined })) + '</p></span></div><p class="note">' + esc(t('section.toBuy')) + ' ' + esc(L.money(L.listTotal(m.state.shopping, false))) + ' · ' + esc(t('section.cart')) + ' ' + esc(L.money(L.listTotal(m.state.shopping, true))) + '. Lo que agregues queda a tu nombre y se ve en los otros celulares con este código.</p></div>'
      + '<div class="section-title"><h2>' + esc(t('section.suggestions')) + '</h2>' + (m.suggestions.length ? '<button class="linkish" type="button" data-action="add-all">' + esc(t('btn.addAll')) + '</button>' : '') + '</div>'
      + '<div class="stack">' + (ideas || '<div class="card"><p class="meta">No hay reposiciones urgentes. La despensa está tranquila o ya pasaste las sugerencias a la lista.</p></div>') + '</div>'
      + (m.suggestions.length ? '<p class="note">Si agregas todas, suman cerca de ' + esc(L.money(suggestTotal)) + ' al precio más bajo de la muestra.</p>' : '')
      + '<div class="section-title"><h2>' + esc(t('section.toBuy')) + '</h2></div><div class="stack">' + (rows(open, false) || '<div class="card"><p class="meta">Nada pendiente. Agrega un pedido de la familia o una sugerencia.</p></div>') + '</div>'
      + (done.length ? '<div class="section-title"><h2>' + esc(t('section.cart')) + '</h2></div><div class="stack">' + rows(done, true) + '</div>' : '')
      + '<div class="dock"><div><strong>' + esc(L.money(L.listTotal(m.state.shopping, true))) + '</strong><p>' + done.length + ' listos para registrar</p></div><button class="btn tiny" type="button" data-action="open-checkout"' + (done.length ? '' : ' disabled') + '>' + esc(t('btn.register')) + '</button></div>';
  }

  function viewPrecios() {
    var summary = L.winnerSummary(D.CATALOG);
    var basket = L.basketSavings(D.CATALOG);
    var max = summary.ranked.length ? summary.ranked[0].count : 1;
    var bars = summary.ranked.map(function (row) {
      return '<div class="chart-row"><span>' + esc(row.store) + '</span><span class="chart-track"><span style="width:' + Math.round(row.count / max * 100) + '%"></span></span><strong class="money">' + row.count + '</strong></div>';
    }).join('');
    var cats = ['Todas'].concat(D.CATEGORIES.filter(function (cat) {
      return D.CATALOG.some(function (product) { return product.category === cat; });
    }));
    var chips = cats.map(function (cat) {
      return '<button type="button" class="' + (ui.priceCat === cat ? 'on' : '') + '" data-action="price-cat" data-cat="' + esc(cat) + '">' + esc(cat === 'Todas' ? t('filter.all') : cat) + '</button>';
    }).join('');
    var lead = summary.ranked[0]
      ? summary.ranked[0].store + ' tiene el menor precio en ' + summary.ranked[0].count + ' de ' + D.CATALOG.length + ' productos.'
      : '';
    return '<div class="card"><h2>' + esc(t('section.basket')) + '</h2><p class="meta">' + esc(lead) + '</p>' + bars + '<p class="note">Una unidad de cada producto sale ' + esc(L.money(basket.cheap)) + ' si eliges siempre el local más barato, y ' + esc(L.money(basket.pricey)) + ' si eliges el más caro. Diferencia: ' + esc(L.money(basket.save)) + '. Precios referenciales, no cotización en vivo.</p></div>'
      + '<div class="stack" style="margin-top:12px"><input id="q-price" class="search" type="search" placeholder="' + esc(t('search.product')) + '" value="' + esc(ui.qPrice) + '" autocomplete="off" aria-label="' + esc(t('search.product')) + '"><div class="filters">' + chips + '</div><div id="price-list" class="stack"></div></div>';
  }

  function viewMas() {
    var rows = [
      ['presupuesto', t('title.presupuesto'), t('menu.budget')],
      ['desperdicio', t('title.desperdicio'), t('menu.waste')],
      ['asistente', t('title.asistente'), t('menu.assistant')],
      ['acerca', t('title.acerca'), t('menu.about')]
    ].map(function (row) {
      return '<a class="menu-row" href="#/' + row[0] + '"><span class="menu-ico">' + esc(row[1].charAt(0)) + '</span><span class="grow">' + esc(row[1]) + '<small>' + esc(row[2]) + '</small></span>' + icon('chev') + '</a>';
    }).join('');
    var install = '<p class="note">Desde el celular: menú Compartir o los tres puntos, y luego Agregar a la pantalla de inicio. En el escritorio, el ícono de instalar aparece en la barra de direcciones.</p>';
    var session = Store.session();
    return '<div class="menu">' + rows + '</div><div class="card" style="margin-top:12px"><h2>' + esc(t('menu.phone')) + '</h2>' + langSwitch() + '<p class="meta">' + esc(session ? session.name : '') + ' · ' + esc(session ? session.code : '') + '</p>' + install + '<button class="btn ghost" type="button" data-action="logout">' + esc(t('logout')) + '</button><button class="btn danger" type="button" data-action="open-reset">' + esc(t('btn.reset')) + '</button></div>';
  }

  function viewPresupuesto(m) {
    var limit = m.state.budgetLimit;
    var pct = limit ? m.spent / limit : 0;
    var left = L.round2(limit - m.spent);
    var klass = pct > 1 ? 'is-over' : pct > 0.8 ? 'is-tight' : '';
    var text = left < 0
      ? 'Pasaste el tope por ' + L.money(Math.abs(left)) + '. Conviene priorizar la lista de reposición, no los antojos.'
      : 'Todavía tienes ' + L.money(left) + ' de ' + L.money(limit) + ' en ' + L.monthLabel(m.today) + '.';
    var max = m.cats.length ? m.cats[0].total : 1;
    var bars = m.cats.map(function (row) {
      return '<div class="chart-row"><span>' + esc(row.category) + '</span><span class="chart-track"><span style="width:' + Math.max(6, Math.round(row.total / max * 100)) + '%"></span></span><strong class="money">' + esc(L.money(row.total)) + '</strong></div>';
    }).join('');
    var list = m.state.purchases.filter(function (row) { return L.monthKey(row.date) === m.month; }).map(function (row) {
      var detail = row.items.map(function (item) { return item.name; }).slice(0, 3).join(', ');
      return '<article class="card"><div class="item-line"><span class="grow"><h3>' + esc(row.store) + '</h3><p class="meta">' + esc(L.formatShort(row.date)) + ' · ' + esc(row.note) + '</p><p class="meta">' + esc(detail) + '</p></span><strong class="money">' + esc(L.money(row.total)) + '</strong></div><button class="linkish" type="button" data-action="remove-expense" data-id="' + esc(row.id) + '">' + esc(t('btn.delete')) + '</button></article>';
    }).join('');
    return '<div class="card"><p class="eyebrow">' + esc(L.monthLabel(m.today)) + '</p><div class="ring-wrap">' + ring(pct, klass) + '<span class="grow"><strong style="font-size:1.6rem">' + esc(L.money(m.spent)) + '</strong><p class="meta">de ' + esc(L.money(limit)) + '</p></span></div><div class="progress ' + klass + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + limit + '" aria-valuenow="' + m.spent + '" aria-label="' + esc(t('aria.month')) + '" style="margin-top:12px"><span style="width:' + Math.min(100, Math.round(pct * 100)) + '%"></span></div><p class="note">' + esc(text) + '</p><button class="btn ghost" type="button" data-action="open-budget">Cambiar presupuesto mensual</button></div>'
      + '<div class="section-title"><h2>' + esc(t('section.byCat')) + '</h2></div>'
      + (bars ? '<div class="card">' + bars + '</div>' : '<div class="card"><p class="meta">Todavía no hay compras este mes.</p></div>')
      + '<div class="section-title"><h2>' + esc(t('section.monthBuys')) + '</h2><button class="linkish" type="button" data-action="open-expense">' + esc(t('btn.note')) + '</button></div><div class="stack">' + (list || '<div class="card"><p class="meta">Cuando registres la lista o anotes un gasto, aparece aquí.</p></div>') + '</div>';
  }

  function viewDesperdicio(m) {
    var w = m.waste;
    var expired = m.expired.map(function (item) {
      return '<article class="card expired"><h3>' + esc(item.name) + '</h3><p class="meta">' + esc(L.expiryLabel(L.statusOf(item, m.today).days)) + ' · ' + esc(qtyLabel(item)) + '</p><p class="note">No lo cocines ni lo sirvas. Sácalo de la despensa. Esto no suma al ahorro.</p><button class="btn danger" type="button" data-action="open-discard" data-id="' + esc(item.id) + '">Ya lo saqué</button></article>';
    }).join('');
    var matches = L.matchRecipes(m.state.pantry, D.RECIPES, m.today);
    var recipes = matches.map(function (row) {
      var impact = L.cookImpact(row.recipe, m.state.pantry, m.today);
      var chips = row.recipe.ingredients.map(function (ing) {
        var hit = row.soon.some(function (item) { return L.hasTerm(item.name, ing.key); });
        return '<span class="pill ' + (hit ? 'warn' : 'neutral') + '">' + esc(ing.label) + '</span>';
      }).join('');
      var steps = row.recipe.steps.map(function (step) { return '<li>' + esc(step) + '</li>'; }).join('');
      return '<details class="recipe"><summary><h3>' + esc(row.recipe.name) + '</h3><span class="meta">' + row.recipe.minutes + ' min · aprovecha ' + row.soon.length + (row.soon.length === 1 ? ' producto' : ' productos') + '</span><div class="pills">' + chips + '</div></summary><div class="body"><p>' + esc(row.recipe.note) + '</p><ol>' + steps + '</ol><button class="btn" type="button" data-action="open-cook" data-id="' + esc(row.recipe.id) + '">Cociné esta receta · ' + esc(L.money(impact.bs)) + '</button></div></details>';
    }).join('');
    return '<div class="stats"><div class="stat"><strong>' + esc(L.money(w.allBs)) + '</strong><span>salvados en total</span></div><div class="stat"><strong>' + esc(L.formatQty(w.allKg)) + ' kg</strong><span>que no se botaron</span></div></div>'
      + '<p class="note">Este mes: ' + esc(L.money(w.monthBs)) + ' y ' + esc(L.formatQty(w.monthKg)) + ' kg. La cifra usa el precio anotado en la despensa por la cantidad de la receta, y un peso aproximado. No es una balanza.</p>'
      + (expired ? '<div class="section-title"><h2>' + esc(t('section.expired')) + '</h2></div><div class="stack">' + expired + '</div>' : '')
      + '<div class="section-title"><h2>' + esc(t('section.urgent')) + '</h2></div><div class="stack">' + (recipes || '<div class="card"><p class="meta">Nada por vencer en los próximos ' + L.SOON_DAYS + ' días. Buen momento para no comprar de más.</p></div>') + '</div>';
  }

  function viewAsistente(m) {
    var messages = m.state.messages.map(function (msg) {
      var actions = (msg.actions || []).map(function (action, index) {
        if (action.route) return '<button type="button" class="chip" data-action="go" data-route="' + esc(action.route) + '">' + esc(action.label) + '</button>';
        return '<button type="button" class="chip" data-action="bot-send" data-text="' + esc(action.send || action.label) + '">' + esc(action.label) + '</button>';
      }).join('');
      return '<div class="msg ' + (msg.role === 'user' ? 'user' : 'bot') + '"><div class="bubble"><p>' + esc(msg.text) + '</p>' + (actions ? '<div class="chips">' + actions + '</div>' : '') + '</div></div>';
    }).join('');
    var typing = ui.typing ? '<div class="msg bot"><div class="bubble typing" aria-label="' + esc(t('chat.typing')) + '"><i></i><i></i><i></i></div></div>' : '';
    var quick = QUICK.map(function (key, index) {
      return '<button type="button" class="chip" data-action="quick" data-i="' + index + '">' + esc(t(key)) + '</button>';
    }).join('');
    return '<div id="chat-log">' + messages + typing + '</div>'
      + '<div class="composer"><div class="quick">' + quick + '</div><form data-action="send-chat"><div class="composer-row"><input id="chat-input" name="text" value="' + esc(ui.chatDraft) + '" placeholder="' + esc(t('chat.placeholder')) + '" autocomplete="off" aria-label="' + esc(t('chat.label')) + '"' + (ui.typing ? ' disabled' : '') + '><button class="send" type="submit" aria-label="' + esc(t('chat.send')) + '"' + (ui.typing ? ' disabled' : '') + '>' + icon('send') + '</button></div></form></div>';
  }

  function viewAcerca(m) {
    var members = m.state.group.map(function (member, index) {
      return field('Integrante ' + (index + 1), '<input class="member-name" data-index="' + index + '" name="m' + index + '" value="' + esc(member.name) + '" placeholder="Nombre y apellido" maxlength="60" autocomplete="name">');
    }).join('');
    var home = m.state.family;
    var where = home.address || [home.neighborhood, home.city].filter(Boolean).join(', ');
    return '<div class="about stack"><div class="card"><div class="hero-brand">' + logoMark() + '<strong>Yapa</strong></div>' + langSwitch() + '<p class="note">' + esc(t('i18n.note')) + '</p><p>Prototipo para el caso de estudio <strong>App de Gestión Inteligente de Compras para Hogares</strong>. La familia Rojas vive en ' + esc(where) + '. Es un ejemplo ficticio. El código de muestra es <strong>ROJAS-2026</strong>.</p><p>Compara precios en <strong>Hipermaxi</strong>, <strong>Fidalga</strong>, <strong>IC Norte</strong>, <strong>Mercado Los Pozos</strong>, <strong>Mercado Mutualista</strong> y <strong>Abasto</strong>.</p><p>El referente de clase es Minimkt, un minimarket chileno con control de stock, alertas, analítica, pedidos recurrentes y asistente. Yapa pasa esas ideas a la cocina de una casa cruceña. No es una app comercial: no hay servidor, no hay cuentas y los precios no se consultan en vivo.</p><p>El mismo código sincroniza la despensa, la lista, el presupuesto y los integrantes entre celulares con Firebase. Si no hay internet, Yapa sigue con la copia de este navegador y marca Sin conexión. Al volver la red, los cambios se envían solos.</p></div>'
      + '<ul class="map"><li><strong>Stock de Minimkt</strong><span>Despensa con cantidad, mínimo y vencimiento.</span></li><li><strong>Alertas de quiebre</strong><span>Avisos de stock bajo, por vencer y vencido.</span></li><li><strong>Analítica</strong><span>Presupuesto del mes y gasto por categoría.</span></li><li><strong>Pedidos recurrentes</strong><span>Sugerencias y lista con pedidos de la familia.</span></li><li><strong>Asistente</strong><span>Respuestas por reglas, con los datos de tu despensa, sin clave de API.</span></li></ul>'
      + '<div class="card"><h2>Integrantes del grupo</h2><p class="meta">Completa los nombres. Se guardan con la familia, en este navegador y en la nube.</p>' + members + '<p class="note">Tecnología: HTML, CSS y JavaScript, con Firebase (Auth anónima y Firestore) para sincronizar. localStorage queda como copia sin conexión. Se puede instalar como PWA. Pensada para publicarse en GitHub Pages con rutas relativas.</p></div></div>';
  }

  function renderTopbar(name, m) {
    var bar = document.getElementById('topbar');
    if (name === 'inicio') {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }
    bar.hidden = false;
    var back = ROOT[name]
      ? '<span class="top-mark">' + logoMark() + '</span>'
      : '<button class="icon-btn" type="button" data-action="go" data-route="mas" aria-label="' + esc(t('btn.back')) + '">' + icon('back') + '</button>';
    var action = '';
    if (name === 'lista') action = '<button class="btn tiny" type="button" data-action="open-manual">' + esc(t('btn.add')) + '</button>';
    if (name === 'presupuesto') action = '<button class="btn tiny" type="button" data-action="open-expense">' + esc(t('btn.note')) + '</button>';
    if (name === 'despensa') action = '<button class="icon-btn" type="button" data-action="open-add-pantry" aria-label="' + esc(t('aria.addProduct')) + '">' + icon('plus') + '</button>';
    var session = Store.session();
    var whoNow = session ? session.name + ' · ' + session.code : 'Yapa';
    bar.innerHTML = '<div class="topbar-row">' + back + '<div class="grow"><p class="eyebrow">' + esc(whoNow) + '</p><h1>' + esc(t('title.' + name)) + '</h1></div><span class="top-side">' + syncPill() + action + '</span></div>';
  }

  function renderTabs(name, m) {
    var pending = m.state.shopping.filter(function (row) { return !row.checked; }).length;
    var tabs = [
      ['inicio', 'nav.inicio', 'home'],
      ['despensa', 'nav.despensa', 'box'],
      ['lista', 'nav.lista', 'list'],
      ['precios', 'nav.precios', 'tag'],
      ['mas', 'nav.mas', 'more']
    ];
    document.getElementById('tabbar').setAttribute('aria-label', t('nav.sections'));
    document.getElementById('tabbar').innerHTML = tabs.map(function (tab) {
      var on = TAB_OF[name] === tab[0];
      var badge = tab[0] === 'lista' && pending ? '<span class="badge">' + pending + '</span>' : '';
      return '<button class="tab' + (on ? ' on' : '') + '" type="button" data-action="go" data-route="' + tab[0] + '" aria-current="' + (on ? 'page' : 'false') + '">' + icon(tab[2]) + badge + '<span>' + esc(t(tab[1])) + '</span></button>';
    }).join('');
  }

  var views = {
    inicio: viewInicio,
    despensa: viewDespensa,
    lista: viewLista,
    precios: viewPrecios,
    mas: viewMas,
    presupuesto: viewPresupuesto,
    desperdicio: viewDesperdicio,
    asistente: viewAsistente,
    acerca: viewAcerca
  };

  function syncLabel(status) {
    if (status === 'synced') return t('sync.synced');
    if (status === 'syncing') return t('sync.syncing');
    return t('sync.offline');
  }

  function syncPill() {
    var status = Store.syncStatus ? Store.syncStatus() : 'syncing';
    var label = syncLabel(status);
    var klass = status === 'synced' ? 'is-on' : status === 'syncing' ? 'is-wait' : 'is-off';
    return '<span class="sync ' + klass + '" data-sync>' + esc(label) + '</span>';
  }

  function paintSync() {
    var status = Store.syncStatus ? Store.syncStatus() : 'offline';
    var label = syncLabel(status);
    var klass = status === 'synced' ? 'is-on' : status === 'syncing' ? 'is-wait' : 'is-off';
    document.querySelectorAll('[data-sync]').forEach(function (el) {
      el.textContent = label;
      el.className = 'sync ' + klass;
    });
    var banner = document.getElementById('offline');
    if (banner) {
      banner.textContent = t('offline.banner');
      banner.hidden = navigator.onLine;
    }
  }

  function paintChrome() {
    var skip = document.querySelector('.skip');
    if (skip) skip.textContent = t('skip');
    var banner = document.getElementById('offline');
    if (banner) banner.textContent = t('offline.banner');
  }

  function signedIn() {
    return !!(Store.session() && Store.get());
  }

  function renderLogin() {
    closeSheet();
    var app = document.getElementById('app');
    app.classList.remove('with-dock', 'with-composer');
    var bar = document.getElementById('topbar');
    bar.hidden = true;
    bar.innerHTML = '';
    var tabs = document.getElementById('tabbar');
    tabs.hidden = true;
    tabs.innerHTML = '';
    var view = document.getElementById('view');
    view.className = 'view is-gate';
    var creating = ui.authMode === 'create';
    var form = creating
      ? '<form data-action="auth-create">' + field(t('login.name'), '<input name="name" required maxlength="40" autocomplete="name" placeholder="Ana">')
        + field(t('login.surname'), '<input name="surname" required maxlength="40" autocomplete="family-name" placeholder="Rojas">', t('login.hintSurname'))
        + '<button class="btn" type="submit">' + esc(t('login.create')) + '</button><p class="form-error" hidden></p></form>'
        + '<button class="btn ghost" type="button" data-action="auth-mode" data-mode="login">' + esc(t('login.have')) + '</button>'
      : '<form data-action="auth-login">' + field(t('login.name'), '<input name="name" required maxlength="40" autocomplete="name" placeholder="Carla">')
        + field(t('login.code'), '<input name="code" required maxlength="24" autocapitalize="characters" spellcheck="false" autocomplete="off" placeholder="ROJAS-2026">', t('login.hintCode'))
        + '<button class="btn" type="submit">' + esc(t('login.in')) + '</button><p class="form-error" hidden></p></form>'
        + '<button class="btn ghost" type="button" data-action="auth-mode" data-mode="create">' + esc(t('login.create')) + '</button>';
    var heading = creating ? t('login.create') : t('login.in');
    var lead = creating ? t('login.leadCreate') : t('login.leadIn');
    view.innerHTML = '<section class="gate"><img class="gate-logo" src="icons/yapa-logo.png" alt="Yapa" width="704" height="842"><p class="gate-word" aria-hidden="true">Yapa</p>' + langSwitch() + syncPill() + '<h1>' + esc(heading) + '</h1><p class="lead">' + esc(lead) + '</p>' + form + '</section>';
    paintChrome();
    document.getElementById('offline').hidden = navigator.onLine;
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', '#FFF8EE');
    document.title = 'Yapa · ' + heading;
  }

  function render() {
    if (!signedIn()) {
      renderLogin();
      return;
    }
    document.getElementById('tabbar').hidden = false;
    var name = route();
    var m = model();
    var view = document.getElementById('view');
    var klass = 'view';
    if (name === 'lista') klass += ' has-dock';
    if (name === 'asistente') klass += ' has-composer';
    if (name === 'despensa') klass += ' has-fab';
    view.className = klass;
    view.innerHTML = views[name](m);
    document.getElementById('app').classList.toggle('with-dock', name === 'lista');
    document.getElementById('app').classList.toggle('with-composer', name === 'asistente');
    renderTopbar(name, m);
    renderTabs(name, m);
    paintChrome();
    document.getElementById('offline').hidden = navigator.onLine;
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', name === 'inicio' ? '#1F7A44' : '#FFF8EE');
    document.title = 'Yapa · ' + t('title.' + name);
    if (name === 'despensa') paintPantryList();
    if (name === 'precios') paintPriceList();
    if (name !== ui.lastRoute) {
      window.scrollTo(0, 0);
      ui.lastRoute = name;
      closeSheet();
    }
    if (name === 'asistente') window.scrollTo(0, document.body.scrollHeight);
  }

  function toast(text) {
    var el = document.getElementById('toast');
    el.hidden = false;
    el.textContent = text;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.hidden = true; }, 2600);
  }

  function closeSheet() {
    var root = document.getElementById('sheet');
    if (!root || root.hidden) return;
    root.hidden = true;
    root.innerHTML = '';
    document.body.classList.remove('sheet-open');
  }

  function openSheet(title, body, formAction) {
    var root = document.getElementById('sheet');
    root.hidden = false;
    root.innerHTML = '<div class="backdrop" data-action="close-sheet"></div><div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-handle"></div><div class="sheet-head"><h2 id="sheet-title">' + esc(title) + '</h2><button class="icon-btn" type="button" data-action="close-sheet" aria-label="' + esc(t('btn.close')) + '">' + icon('x') + '</button></div>'
      + (formAction ? '<form data-action="' + formAction + '">' + body + '<p class="form-error" hidden></p></form>' : body)
      + '</div>';
    document.body.classList.add('sheet-open');
    var fieldEl = root.querySelector('input, select, textarea');
    if (fieldEl) fieldEl.focus();
  }

  function showFormError(message) {
    var el = document.querySelector('.form-error');
    if (!el) {
      toast(message);
      return;
    }
    el.hidden = false;
    el.textContent = message;
  }

  function finish(result, message) {
    if (!result || !result.ok) {
      showFormError((result && result.error) || 'No se pudo guardar.');
      return false;
    }
    closeSheet();
    toast(result.saved === false ? 'Se ve en pantalla, pero este navegador no dejó guardarlo.' : message);
    render();
    return true;
  }

  function go(name) {
    var next = '#/' + name;
    if (location.hash === next) render();
    else location.hash = next;
  }

  function pantryForm(item) {
    var row = item || { name: '', category: 'Verduras', qty: 1, unit: 'kg', unitLabel: 'kg', min: 1, expiry: L.addDays(today(), 7), price: '' };
    return field('Producto', '<input name="name" required maxlength="80" value="' + esc(row.name) + '" placeholder="Ej. Papa">')
      + field('Categoría', '<select name="category">' + options(D.CATEGORIES, row.category) + '</select>')
      + '<div class="grid-2">' + field('Cantidad', '<input name="qty" required inputmode="decimal" step="any" min="0" value="' + esc(row.qty) + '">')
      + field('Unidad', '<select name="unit">' + options(D.UNITS, row.unit, 'id', 'label') + '</select>') + '</div>'
      + field('Cómo se cuenta', '<input name="unitLabel" maxlength="24" value="' + esc(row.unitLabel || '') + '" placeholder="kg, botella, lata">', 'Sirve para leer la cantidad: 1 botella, 0,5 kg.')
      + '<div class="grid-2">' + field('Stock mínimo', '<input name="min" required inputmode="decimal" step="any" min="0" value="' + esc(row.min) + '">')
      + field('Precio por unidad (Bs)', '<input name="price" required inputmode="decimal" step="any" min="0" value="' + esc(row.price) + '">') + '</div>'
      + field('Vencimiento', '<input name="expiry" type="date" value="' + esc(row.expiry || '') + '">', 'Vacío si no vence, como la limpieza.')
      + '<button class="btn" type="submit">' + (item ? 'Guardar cambios' : 'Agregar a la despensa') + '</button>'
      + (item ? '<button class="btn danger" type="button" data-action="delete-pantry" data-id="' + esc(item.id) + '">Eliminar de la despensa</button>' : '');
  }

  function openPantry(id) {
    var item = id ? Store.get().pantry.filter(function (row) { return row.id === id; })[0] : null;
    openSheet(item ? 'Editar producto' : 'Nuevo producto', pantryForm(item), item ? 'save-pantry' : 'save-pantry');
    if (item) {
      var form = document.querySelector('#sheet form');
      if (form) form.dataset.id = item.id;
    }
  }

  function openManual() {
    var session = Store.session();
    var me = session ? session.name : 'Yo';
    var people = [];
    function addPerson(person) {
      if (!person) return;
      if (people.some(function (row) { return L.norm(row) === L.norm(person); })) return;
      people.push(person);
    }
    addPerson(me);
    Store.get().family.people.forEach(function (person) { addPerson(person.name); });
    (Store.get().joined || []).forEach(function (row) { addPerson(row.name); });
    addPerson('Yo');
    openSheet('Pedido de la familia', field('Qué falta', '<input name="name" required maxlength="80" placeholder="Ej. Manzana">')
      + field('Categoría', '<select name="category">' + options(D.CATEGORIES, 'Frutas') + '</select>')
      + '<div class="grid-2">' + field('Cantidad', '<input name="qty" required inputmode="decimal" step="any" min="0" value="1">')
      + field('Unidad', '<select name="unit">' + options(D.UNITS, 'u', 'id', 'label') + '</select>') + '</div>'
      + field('Precio estimado (Bs)', '<input name="price" required inputmode="decimal" step="any" min="0" value="0">', 'Si el producto está en el comparador, al guardar usamos el menor precio.')
      + field('¿Quién lo pidió?', '<select name="by">' + options(people, me) + '</select>')
      + field('Nota', '<input name="reason" maxlength="80" placeholder="Para la lonchera">')
      + '<button class="btn" type="submit">Agregar a la lista</button>', 'save-manual');
  }

  function openCheckout() {
    var checked = Store.get().shopping.filter(function (row) { return row.checked; });
    if (!checked.length) {
      toast('Marca al menos un producto.');
      return;
    }
    var lines = checked.map(function (row) {
      return '<p class="meta">' + esc(row.name) + ' · ' + esc(qtyLabel(row)) + ' · ' + esc(L.money(row.qty * row.price)) + '</p>';
    }).join('');
    openSheet('Registrar compra', '<p>Esto suma el gasto de hoy, repone la despensa y saca del carrito lo marcado.</p>' + lines
      + '<p><strong>Total ' + esc(L.money(L.listTotal(Store.get().shopping, true))) + '</strong></p>'
      + field('Local', '<select name="store">' + options(D.STORES, 'Mercado Los Pozos') + '</select>')
      + '<button class="btn" type="submit">Guardar compra</button>', 'save-checkout');
  }

  function openExpense() {
    openSheet('Anotar gasto', field('Local', '<select name="store">' + options(D.STORES, 'Hipermaxi') + '</select>')
      + field('Categoría', '<select name="category">' + options(D.CATEGORIES, 'Despensa') + '</select>')
      + field('Monto (Bs)', '<input name="amount" required inputmode="decimal" step="any" min="0" placeholder="25,50">')
      + field('Fecha', '<input name="date" type="date" required value="' + today() + '">')
      + field('Nota', '<input name="note" maxlength="80" placeholder="Pan y huevos">')
      + '<button class="btn" type="submit">Guardar gasto</button>', 'save-expense');
  }

  function openBudget() {
    openSheet('Presupuesto del mes', field('Límite en bolivianos', '<input name="limit" required inputmode="decimal" step="any" min="1" value="' + esc(Store.get().budgetLimit) + '">', 'Un hogar de cuatro en Santa Cruz de la Sierra puede moverse cerca de Bs 1.800 en comida, según cómo compren.')
      + '<button class="btn" type="submit">Guardar límite</button>', 'save-budget');
  }

  function openCook(id) {
    var recipe = D.RECIPES.filter(function (row) { return row.id === id; })[0];
    if (!recipe) return;
    var impact = L.cookImpact(recipe, Store.get().pantry, today());
    if (!impact.canCook) {
      toast('No hay ingredientes por vencer para esta receta. Si ya vencieron, no los cocines.');
      return;
    }
    var lines = impact.used.map(function (row) {
      return '<p class="meta">' + esc(row.name) + ' · ' + esc(L.formatQty(row.take)) + ' ' + esc(row.unitLabel) + ' · ' + esc(L.money(row.bs)) + '</p>';
    }).join('');
    openSheet(recipe.name, '<p>Vamos a descontar de la despensa solo lo que está por vencer. Lo vencido no entra.</p>' + lines
      + '<p><strong>Ahorro estimado ' + esc(L.money(impact.bs)) + ' · ' + esc(L.formatQty(impact.kg)) + ' kg</strong></p>'
      + '<button class="btn" type="button" data-action="cook-confirm" data-id="' + esc(recipe.id) + '">Confirmar receta</button>');
  }

  function openDiscard(id) {
    var item = Store.get().pantry.filter(function (row) { return row.id === id; })[0];
    if (!item) return;
    openSheet('Sacar de la despensa', '<p><strong>' + esc(item.name) + '</strong> ya venció. No lo aproveches en una receta. Al sacarlo se limpia la alerta y no suma bolivianos ni kilos salvados.</p><button class="btn danger" type="button" data-action="discard-confirm" data-id="' + esc(item.id) + '">Sacar de la despensa</button>');
  }

  function openReset() {
    var session = Store.session();
    openSheet('Restablecer datos', '<p>Se borran los cambios de ' + esc(session ? session.code : 'esta familia') + ' y vuelve la despensa de ejemplo. Las otras familias de este navegador no se tocan.</p><button class="btn danger" type="button" data-action="reset-confirm">Restablecer</button><button class="btn ghost" type="button" data-action="close-sheet">Cancelar</button>');
  }

  function suggestionByPantry(id) {
    return model().suggestions.filter(function (row) { return row.pantryId === id; })[0];
  }

  function sendChat(text) {
    var trimmed = String(text || '').trim();
    if (!trimmed || ui.typing) return;
    var day = today();
    Store.pushMessage({ role: 'user', text: trimmed, at: day, actions: [] });
    ui.chatDraft = '';
    ui.typing = true;
    render();
    window.setTimeout(function () {
      var state = Store.get();
      var reply = L.answer(trimmed, {
        today: day,
        familyName: state.family.surname,
        city: state.family.city,
        pantry: state.pantry,
        shopping: state.shopping,
        purchases: state.purchases,
        recipes: D.RECIPES,
        catalog: D.CATALOG,
        budgetLimit: state.budgetLimit,
        waste: state.waste
      });
      Store.pushMessage({ role: 'bot', text: reply.text, at: day, actions: reply.actions || [] });
      ui.typing = false;
      render();
    }, 280);
  }

  function readForm(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    return data;
  }

  function handleForm(action, data, form) {
    if (action === 'auth-login' || action === 'auth-create') {
      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      var pending = action === 'auth-login'
        ? Store.enter(data.name, data.code)
        : Store.startFamily(data.name, data.surname);
      pending.then(function (result) {
        if (submit) submit.disabled = false;
        if (!result || !result.ok) {
          showFormError((result && result.error) || 'No se pudo entrar.');
          return;
        }
        toast(action === 'auth-login' ? 'Hola, ' + result.name + '.' : 'Familia creada. El código es ' + result.code + '.');
        go('inicio');
      }).catch(function () {
        if (submit) submit.disabled = false;
        showFormError('No se pudo conectar. Intenta de nuevo.');
      });
    } else if (action === 'save-pantry') {
      var id = form && form.dataset.id;
      finish(id ? Store.updatePantry(id, data) : Store.addPantry(data), id ? 'Producto actualizado.' : 'Producto agregado a la despensa.');
    } else if (action === 'save-manual') {
      var name = data.name;
      var product = L.findProduct(name, D.CATALOG);
      var price = L.num(data.price);
      if (product && (!isFinite(price) || price === 0)) {
        var best = L.cheapestStores(product.prices)[0];
        data.price = best ? best.price : data.price;
        data.productId = product.id;
        data.unit = product.unit;
        data.unitLabel = product.unitLabel;
        data.category = product.category;
        data.kgEach = product.kgEach;
      }
      data.source = 'familia';
      data.reason = data.reason || 'Pedido de la familia';
      finish(Store.addManualItem(data), 'Pedido anotado en la lista.');
    } else if (action === 'save-checkout') {
      finish(Store.checkout(data.store, today()), 'Compra registrada y despensa actualizada.');
    } else if (action === 'save-expense') {
      finish(Store.addExpense(data), 'Gasto anotado en el presupuesto.');
    } else if (action === 'save-budget') {
      finish(Store.setBudget(data.limit), 'Presupuesto actualizado.');
    } else if (action === 'send-chat') {
      sendChat(data.text);
    }
  }

  function onClick(event) {
    var el = event.target.closest('[data-action]');
    if (!el || !document.getElementById('app').contains(el)) return;
    var action = el.dataset.action;
    if (action === 'lang') {
      I.set(el.dataset.lang);
      render();
    } else if (action === 'auth-mode') {
      ui.authMode = el.dataset.mode === 'create' ? 'create' : 'login';
      renderLogin();
    } else if (action === 'logout') {
      Store.logout();
      closeSheet();
      ui.authMode = 'login';
      toast('Sesión cerrada. La familia sigue en la nube y en este celular.');
      render();
    } else if (action === 'go') go(el.dataset.route);
    else if (action === 'close-sheet') closeSheet();
    else if (action === 'pantry-filter') { ui.pantryFilter = el.dataset.filter; render(); }
    else if (action === 'price-cat') { ui.priceCat = el.dataset.cat; render(); }
    else if (action === 'open-add-pantry') openPantry(null);
    else if (action === 'edit-pantry') openPantry(el.dataset.id);
    else if (action === 'qty') {
      var result = Store.changeQty(el.dataset.id, el.dataset.delta);
      if (!result.ok) toast(result.error);
      else render();
    } else if (action === 'delete-pantry') {
      finish(Store.removePantry(el.dataset.id), 'Producto eliminado.');
    } else if (action === 'add-suggestion') {
      var suggestion = suggestionByPantry(el.dataset.id);
      if (!suggestion) toast('Esa sugerencia ya no está.');
      else finish(Store.addSuggestion(suggestion), suggestion.name + ' pasó a la lista.');
    } else if (action === 'add-all') {
      var all = Store.addAllSuggestions(today());
      toast(all.count ? 'Se agregaron ' + all.count + ' sugerencias.' : 'No había sugerencias nuevas.');
      render();
    } else if (action === 'toggle-item') { Store.toggleItem(el.dataset.id); render(); }
    else if (action === 'remove-item') { finish(Store.removeItem(el.dataset.id), 'Quitado de la lista.'); }
    else if (action === 'open-manual') openManual();
    else if (action === 'open-checkout') openCheckout();
    else if (action === 'add-catalog') {
      finish(Store.addCatalogProduct(el.dataset.id, 1), 'Listo. Quedó en la lista al precio más bajo.');
    } else if (action === 'open-expense') openExpense();
    else if (action === 'open-budget') openBudget();
    else if (action === 'remove-expense') { finish(Store.removeExpense(el.dataset.id), 'Compra borrada del mes.'); }
    else if (action === 'open-cook') openCook(el.dataset.id);
    else if (action === 'cook-confirm') {
      var cooked = Store.cook(el.dataset.id, today());
      if (!cooked.ok) showFormError(cooked.error);
      else {
        closeSheet();
        toast('Receta anotada. Ahorro estimado ' + L.money(cooked.impact.bs) + ' y ' + L.formatQty(cooked.impact.kg) + ' kg.');
        render();
      }
    } else if (action === 'open-discard') openDiscard(el.dataset.id);
    else if (action === 'discard-confirm') finish(Store.discard(el.dataset.id), 'Listo. No sumó al ahorro porque ya estaba vencido.');
    else if (action === 'open-reset') openReset();
    else if (action === 'reset-confirm') {
      Store.reset();
      closeSheet();
      toast('Volvió la despensa de ejemplo de esta familia.');
      render();
    } else if (action === 'quick') sendChat(I.phrase(QUICK[Number(el.dataset.i)] || ''));
    else if (action === 'bot-send') sendChat(el.dataset.text || '');
  }

  function boot() {
    if (boot.started) {
      if (Store.attachCloud) Store.attachCloud();
      paintSync();
      return;
    }
    boot.started = true;
    Store.init();
    if (Store.onRemote) Store.onRemote(function () { render(); });
    if (Store.onStatus) Store.onStatus(paintSync);
    if (Store.attachCloud) Store.attachCloud();
    var app = document.getElementById('app');
    app.addEventListener('click', onClick);
    app.addEventListener('submit', function (event) {
      var form = event.target;
      if (!form || !form.dataset || !form.dataset.action) return;
      event.preventDefault();
      handleForm(form.dataset.action, readForm(form), form);
    });
    app.addEventListener('input', function (event) {
      if (event.target.id === 'q-pantry') {
        ui.qPantry = event.target.value;
        paintPantryList();
      } else if (event.target.id === 'q-price') {
        ui.qPrice = event.target.value;
        paintPriceList();
      } else if (event.target.id === 'chat-input') {
        ui.chatDraft = event.target.value;
      }
    });
    app.addEventListener('change', function (event) {
      if (!event.target.classList || !event.target.classList.contains('member-name')) return;
      Store.setMember(event.target.dataset.index, event.target.value);
      toast('Nombre guardado en este navegador.');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeSheet();
        return;
      }
      var tag = event.target && event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (event.target && event.target.isContentEditable)) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var el = event.target.closest('[data-action]');
      if (!el || el.tagName === 'BUTTON' || el.tagName === 'A') return;
      event.preventDefault();
      el.click();
    });
    window.addEventListener('hashchange', render);
    window.addEventListener('online', paintSync);
    window.addEventListener('offline', paintSync);
    if (!location.hash) history.replaceState(null, '', '#/inicio');
    render();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin HTTPS o file:// no hay service worker */ });
    }
  }

  window.addEventListener('yapa-cloud-ready', boot);
  window.addEventListener('yapa-cloud-failed', boot);
  if (window.YapaCloud) boot();
  window.setTimeout(boot, 8000);
})();
