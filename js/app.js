(function () {
  'use strict';

  var L = window.YapaLogic;
  var D = window.YapaData;
  var Store = window.YapaStore;

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
  var TITLES = {
    inicio: 'Inicio',
    despensa: 'Despensa',
    lista: 'Lista de compras',
    precios: 'Comparador',
    mas: 'Más',
    presupuesto: 'Presupuesto',
    desperdicio: 'Anti-desperdicio',
    asistente: 'Asistente',
    acerca: 'Acerca del proyecto'
  };
  var PEOPLE = { Yapa: '#0E7A56', Carla: '#9E2B1F', Luis: '#185A8C', Ana: '#8A5400', Mateo: '#6D28D9', Yo: '#0E7A56' };
  var PALETTE = ['#0E7A56', '#9E2B1F', '#185A8C', '#8A5400', '#6D28D9', '#0F6E6E'];
  var QUICK = [
    '¿Qué está por vencer?',
    '¿Qué hay que comprar?',
    '¿Dónde sale más barato el arroz?',
    '¿Cómo va el presupuesto?',
    'Dame un tip para ahorrar'
  ];
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
    return '<svg class="mark" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="14" fill="#0E7A56"/><path d="M15 23h18l-1.3 11.4a3 3 0 0 1-3 2.6H19.3a3 3 0 0 1-3-2.6L15 23z" fill="#F6F3EC"/><path d="M19 23c0-4.2 2.1-7 5-7s5 2.8 5 7" fill="none" stroke="#F6F3EC" stroke-width="2.4" stroke-linecap="round"/><circle cx="33.5" cy="16" r="3.2" fill="#E8A317"/></svg>';
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
    if (st.level === 'expired') html += '<span class="pill bad">Vencido</span>';
    else if (st.level === 'soon') html += '<span class="pill warn">Por vencer</span>';
    else if (!item.expiry) html += '<span class="pill neutral">Sin vencimiento</span>';
    else html += '<span class="pill ok">Bien</span>';
    if (st.low) html += '<span class="pill low">Stock bajo</span>';
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
      + '<div class="stepper"><button type="button" data-action="qty" data-id="' + esc(item.id) + '" data-delta="' + (-step) + '" aria-label="Restar">−</button><strong>' + esc(qtyLabel(item)) + '</strong><button type="button" data-action="qty" data-id="' + esc(item.id) + '" data-delta="' + step + '" aria-label="Sumar">+</button></div>'
      + '</article>';
  }

  function paintPantryList() {
    var box = document.getElementById('pantry-list');
    if (!box) return;
    var m = model();
    var rows = L.filterPantry(m.state.pantry, { query: ui.qPantry, filter: ui.pantryFilter, today: m.today });
    box.innerHTML = rows.length ? rows.map(function (item) { return pantryCard(item, m.today); }).join('') : empty('Sin resultados', 'Prueba otro filtro o agrega el producto con el botón verde.');
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
      return '<div class="store ' + (isBest ? 'is-best' : '') + '"><div class="store-top"><span>' + esc(store) + (isBest ? ' <em class="best">más barato</em>' : '') + '</span><strong>' + esc(L.money(price)) + '</strong></div><div class="meter"><span style="width:' + width + '%"></span></div></div>';
    }).join('');
    var save = span.save > 0 && high
      ? 'Ahorras ' + L.money(span.save) + ' frente a ' + high.store + '.'
      : 'Mismo precio en todos los locales.';
    return '<article class="card"><h3>' + esc(product.name) + '</h3><p class="meta">' + esc(product.category) + ' · ' + esc(product.unitLabel) + '</p>'
      + rows + '<p class="note">' + esc(save) + '</p>'
      + '<button class="btn" type="button" data-action="add-catalog" data-id="' + esc(product.id) + '">' + (onList ? 'Sumar otra unidad' : 'Agregar a la lista') + ' · ' + esc(L.money(best[0].price)) + '</button></article>';
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
      : 'Nadie más entró todavía.';
    return '<section class="hero"><div class="hero-brand">' + logoMark() + '<span>Yapa</span></div><h1>Hola, ' + esc(name) + '</h1><p>' + esc(L.formatLong(m.today)) + '</p><p>' + esc(place) + '</p><p class="hero-code">Código ' + esc(code) + '</p><p>Menos desperdicio, más yapa para la casa.</p></section>'
      + '<div class="card session-card"><p class="meta">En este navegador</p><strong>' + esc(name) + '</strong><p class="meta">Familia ' + esc(m.state.family.surname) + ' · ' + esc(code) + '</p><div class="joined">' + joinedLine + '</div><button class="btn ghost" type="button" data-action="logout">Cerrar sesión</button></div>'
      + '<div class="stack">' + banner
      + '<div class="stats">'
      + stat(m.soon.length, 'Por vencer', 'desperdicio')
      + stat(m.low.length, 'Stock bajo', 'despensa')
      + stat(L.money(m.spent), 'Gastados del mes', 'presupuesto')
      + stat(L.money(m.waste.allBs), 'Comida salvada', 'desperdicio')
      + '</div>'
      + '<a class="card" href="#/presupuesto"><div class="ring-wrap">' + ring(pct, klass) + '<span class="grow"><strong>' + esc(Math.round(pct * 100)) + '%</strong> del presupuesto de ' + esc(L.money(limit)) + '<span class="meta">' + esc(pace) + '</span></span></div><div class="progress ' + klass + '" style="margin-top:12px"><span style="width:' + Math.min(100, Math.round(pct * 100)) + '%"></span></div></a>'
      + '</div>'
      + (soonCards ? '<div class="section-title"><h2>Usar pronto</h2><button class="linkish" type="button" data-action="go" data-route="desperdicio">Recetas</button></div><div class="scroller">' + soonCards + '</div>' : '')
      + '<div class="section-title"><h2>Lista familiar</h2><button class="linkish" type="button" data-action="go" data-route="lista">Abrir</button></div>'
      + '<div class="card"><p class="meta">Yapa sugiere reponer ' + m.suggestions.length + ' productos.</p>' + (listPreview || '<p class="meta">No hay pedidos pendientes.</p>') + '<p class="note">Por comprar: ' + esc(L.money(L.listTotal(m.state.shopping, false))) + '. Cada pedido muestra quién lo anotó. Quien entre con ' + esc(code) + ' en este navegador ve la misma lista.</p></div>';
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
      ['todas', 'Todas'],
      ['alertas', 'Alertas'],
      ['pronto', 'Por vencer'],
      ['vencidos', 'Vencidos'],
      ['bajo', 'Stock bajo']
    ].map(function (row) {
      var on = ui.pantryFilter === row[0] ? ' on' : '';
      return '<button type="button" class="' + on + '" data-action="pantry-filter" data-filter="' + row[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + row[1] + ' ' + counts[row[0]] + '</button>';
    }).join('');
    return '<div class="stack"><input id="q-pantry" class="search" type="search" placeholder="Buscar en la despensa" value="' + esc(ui.qPantry) + '" autocomplete="off" aria-label="Buscar en la despensa"><div class="filters" role="toolbar">' + filters + '</div><div id="pantry-list" class="stack"></div><p class="note">El color marca el estado: vencido, por vencer (en ' + L.SOON_DAYS + ' días) o bien. El aviso azul es stock bajo, cuando la cantidad llega al mínimo.</p></div>'
      + '<button class="fab" type="button" data-action="open-add-pantry" aria-label="Agregar producto">' + icon('plus') + '</button>';
  }

  function viewLista(m) {
    var session = Store.session();
    var joined = (m.state.joined || []).map(function (row) { return row.name; });
    var people = (joined.length ? joined : m.state.family.people.map(function (person) { return person.name; })).map(function (person) {
      return '<span class="avatar" style="background:' + personColor(person) + '" title="' + esc(person) + '">' + esc(person.charAt(0)) + '</span>';
    }).join('');
    var whoJoined = joined.length ? joined.join(', ') : 'todavía nadie';
    var ideas = m.suggestions.map(function (row) {
      return '<article class="card"><div class="item-line">' + who('Yapa') + '<span class="grow"><h3>' + esc(row.name) + '</h3><p class="meta">' + esc(row.reason) + ' · ' + esc(qtyLabel(row)) + '</p></span><strong class="money">' + esc(L.money(row.qty * row.price)) + '</strong></div><button class="btn tiny" type="button" data-action="add-suggestion" data-id="' + esc(row.pantryId) + '">Agregar</button></article>';
    }).join('');
    var open = m.state.shopping.filter(function (row) { return !row.checked; });
    var done = m.state.shopping.filter(function (row) { return row.checked; });
    function rows(list, muted) {
      return list.map(function (row) {
        return '<article class="card ' + (muted ? 'checked-item' : '') + '"><div class="item-line"><button class="check ' + (row.checked ? 'on' : '') + '" type="button" data-action="toggle-item" data-id="' + esc(row.id) + '" aria-pressed="' + (row.checked ? 'true' : 'false') + '" aria-label="Marcar ' + esc(row.name) + '">' + icon('check') + '</button>'
          + '<span class="grow"><h3>' + esc(row.name) + '</h3><p class="meta">' + who(row.by) + ' ' + esc(row.by) + ' · ' + esc(row.reason) + '</p><p class="meta">' + esc(qtyLabel(row)) + ' · ' + esc(L.money(row.price)) + ' c/u</p></span>'
          + '<strong class="money">' + esc(L.money(row.qty * row.price)) + '</strong></div>'
          + '<button class="linkish" type="button" data-action="remove-item" data-id="' + esc(row.id) + '">Quitar</button></article>';
      }).join('');
    }
    var suggestTotal = L.round2(m.suggestions.reduce(function (sum, row) { return sum + row.qty * row.price; }, 0));
    return '<div class="card"><div class="split"><div class="avatars" aria-hidden="true">' + people + '</div><span class="grow"><strong>Familia ' + esc(m.state.family.surname) + '</strong><p class="meta">Código ' + esc(session ? session.code : '') + ' · Entraron: ' + esc(whoJoined) + '</p></span></div><p class="note">Por comprar ' + esc(L.money(L.listTotal(m.state.shopping, false))) + ' · En el carrito ' + esc(L.money(L.listTotal(m.state.shopping, true))) + '. Lo que agregues queda a tu nombre.</p></div>'
      + '<div class="section-title"><h2>Sugerencias</h2>' + (m.suggestions.length ? '<button class="linkish" type="button" data-action="add-all">Agregar todas</button>' : '') + '</div>'
      + '<div class="stack">' + (ideas || '<div class="card"><p class="meta">No hay reposiciones urgentes. La despensa está tranquila o ya pasaste las sugerencias a la lista.</p></div>') + '</div>'
      + (m.suggestions.length ? '<p class="note">Si agregas todas, suman cerca de ' + esc(L.money(suggestTotal)) + ' al precio más bajo de la muestra.</p>' : '')
      + '<div class="section-title"><h2>Por comprar</h2></div><div class="stack">' + (rows(open, false) || '<div class="card"><p class="meta">Nada pendiente. Agrega un pedido de la familia o una sugerencia.</p></div>') + '</div>'
      + (done.length ? '<div class="section-title"><h2>En el carrito</h2></div><div class="stack">' + rows(done, true) + '</div>' : '')
      + '<div class="dock"><div><strong>' + esc(L.money(L.listTotal(m.state.shopping, true))) + '</strong><p>' + done.length + ' listos para registrar</p></div><button class="btn tiny" type="button" data-action="open-checkout"' + (done.length ? '' : ' disabled') + '>Registrar</button></div>';
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
      return '<button type="button" class="' + (ui.priceCat === cat ? 'on' : '') + '" data-action="price-cat" data-cat="' + esc(cat) + '">' + esc(cat) + '</button>';
    }).join('');
    var lead = summary.ranked[0]
      ? summary.ranked[0].store + ' tiene el menor precio en ' + summary.ranked[0].count + ' de ' + D.CATALOG.length + ' productos.'
      : '';
    return '<div class="card"><h2>Canasta de muestra</h2><p class="meta">' + esc(lead) + '</p>' + bars + '<p class="note">Una unidad de cada producto sale ' + esc(L.money(basket.cheap)) + ' si eliges siempre el local más barato, y ' + esc(L.money(basket.pricey)) + ' si eliges el más caro. Diferencia: ' + esc(L.money(basket.save)) + '. Precios referenciales, no cotización en vivo.</p></div>'
      + '<div class="stack" style="margin-top:12px"><input id="q-price" class="search" type="search" placeholder="Buscar producto" value="' + esc(ui.qPrice) + '" autocomplete="off" aria-label="Buscar producto"><div class="filters">' + chips + '</div><div id="price-list" class="stack"></div></div>';
  }

  function viewMas() {
    var rows = [
      ['presupuesto', 'Presupuesto', 'Tope del mes y compras anotadas'],
      ['desperdicio', 'Anti-desperdicio', 'Recetas para lo que está por vencer'],
      ['asistente', 'Asistente', 'Respuestas en el celular, sin API'],
      ['acerca', 'Acerca del proyecto', 'Caso de estudio y tu grupo']
    ].map(function (row) {
      return '<a class="menu-row" href="#/' + row[0] + '"><span class="menu-ico">' + esc(row[1].charAt(0)) + '</span><span class="grow">' + esc(row[1]) + '<small>' + esc(row[2]) + '</small></span>' + icon('chev') + '</a>';
    }).join('');
    var install = '<p class="note">Desde el celular: menú Compartir o los tres puntos, y luego Agregar a la pantalla de inicio. En el escritorio, el ícono de instalar aparece en la barra de direcciones.</p>';
    var session = Store.session();
    return '<div class="menu">' + rows + '</div><div class="card" style="margin-top:12px"><h2>En este celular</h2><p class="meta">' + esc(session ? session.name : '') + ' · ' + esc(session ? session.code : '') + '</p>' + install + '<button class="btn ghost" type="button" data-action="logout">Cerrar sesión</button><button class="btn danger" type="button" data-action="open-reset">Restablecer datos de ejemplo</button></div>';
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
      return '<article class="card"><div class="item-line"><span class="grow"><h3>' + esc(row.store) + '</h3><p class="meta">' + esc(L.formatShort(row.date)) + ' · ' + esc(row.note) + '</p><p class="meta">' + esc(detail) + '</p></span><strong class="money">' + esc(L.money(row.total)) + '</strong></div><button class="linkish" type="button" data-action="remove-expense" data-id="' + esc(row.id) + '">Borrar</button></article>';
    }).join('');
    return '<div class="card"><p class="eyebrow">' + esc(L.monthLabel(m.today)) + '</p><div class="ring-wrap">' + ring(pct, klass) + '<span class="grow"><strong style="font-size:1.6rem">' + esc(L.money(m.spent)) + '</strong><p class="meta">de ' + esc(L.money(limit)) + '</p></span></div><div class="progress ' + klass + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + limit + '" aria-valuenow="' + m.spent + '" aria-label="Gasto del mes" style="margin-top:12px"><span style="width:' + Math.min(100, Math.round(pct * 100)) + '%"></span></div><p class="note">' + esc(text) + '</p><button class="btn ghost" type="button" data-action="open-budget">Cambiar presupuesto mensual</button></div>'
      + '<div class="section-title"><h2>Por categoría</h2></div>'
      + (bars ? '<div class="card">' + bars + '</div>' : '<div class="card"><p class="meta">Todavía no hay compras este mes.</p></div>')
      + '<div class="section-title"><h2>Compras del mes</h2><button class="linkish" type="button" data-action="open-expense">Anotar</button></div><div class="stack">' + (list || '<div class="card"><p class="meta">Cuando registres la lista o anotes un gasto, aparece aquí.</p></div>') + '</div>';
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
      + (expired ? '<div class="section-title"><h2>Ya venció</h2></div><div class="stack">' + expired + '</div>' : '')
      + '<div class="section-title"><h2>Recetas con lo que urge</h2></div><div class="stack">' + (recipes || '<div class="card"><p class="meta">Nada por vencer en los próximos ' + L.SOON_DAYS + ' días. Buen momento para no comprar de más.</p></div>') + '</div>';
  }

  function viewAsistente(m) {
    var messages = m.state.messages.map(function (msg) {
      var actions = (msg.actions || []).map(function (action, index) {
        if (action.route) return '<button type="button" class="chip" data-action="go" data-route="' + esc(action.route) + '">' + esc(action.label) + '</button>';
        return '<button type="button" class="chip" data-action="bot-send" data-text="' + esc(action.send || action.label) + '">' + esc(action.label) + '</button>';
      }).join('');
      return '<div class="msg ' + (msg.role === 'user' ? 'user' : 'bot') + '"><div class="bubble"><p>' + esc(msg.text) + '</p>' + (actions ? '<div class="chips">' + actions + '</div>' : '') + '</div></div>';
    }).join('');
    var typing = ui.typing ? '<div class="msg bot"><div class="bubble typing" aria-label="Yapa está escribiendo"><i></i><i></i><i></i></div></div>' : '';
    var quick = QUICK.map(function (text, index) {
      return '<button type="button" class="chip" data-action="quick" data-i="' + index + '">' + esc(text) + '</button>';
    }).join('');
    return '<div id="chat-log">' + messages + typing + '</div>'
      + '<div class="composer"><div class="quick">' + quick + '</div><form data-action="send-chat"><div class="composer-row"><input id="chat-input" name="text" value="' + esc(ui.chatDraft) + '" placeholder="Pregúntale a Yapa" autocomplete="off" aria-label="Mensaje para Yapa"' + (ui.typing ? ' disabled' : '') + '><button class="send" type="submit" aria-label="Enviar"' + (ui.typing ? ' disabled' : '') + '>' + icon('send') + '</button></div></form></div>';
  }

  function viewAcerca(m) {
    var members = m.state.group.map(function (member, index) {
      return field('Integrante ' + (index + 1), '<input class="member-name" data-index="' + index + '" name="m' + index + '" value="' + esc(member.name) + '" placeholder="Nombre y apellido" maxlength="60" autocomplete="name">');
    }).join('');
    var home = m.state.family;
    var where = home.address || [home.neighborhood, home.city].filter(Boolean).join(', ');
    return '<div class="about stack"><div class="card"><div class="hero-brand">' + logoMark() + '<strong>Yapa</strong></div><p>Prototipo para el caso de estudio <strong>App de Gestión Inteligente de Compras para Hogares</strong>. La familia Rojas vive en ' + esc(where) + '. Es un ejemplo ficticio. El código de muestra es <strong>ROJAS-2026</strong>.</p><p>Compara precios en <strong>Hipermaxi</strong>, <strong>Fidalga</strong>, <strong>IC Norte</strong>, <strong>Mercado Los Pozos</strong>, <strong>Mercado Mutualista</strong> y <strong>Abasto</strong>.</p><p>El referente de clase es Minimkt, un minimarket chileno con control de stock, alertas, analítica, pedidos recurrentes y asistente. Yapa pasa esas ideas a la cocina de una casa cruceña. No es una app comercial: no hay servidor, no hay cuentas y los precios no se consultan en vivo.</p><p>El inicio de sesión guarda cada familia en este navegador. Quien escribe el mismo código en este celular ve los mismos datos. Para sincronizar de verdad entre dispositivos haría falta un servidor, por ejemplo Firebase o Supabase.</p></div>'
      + '<ul class="map"><li><strong>Stock de Minimkt</strong><span>Despensa con cantidad, mínimo y vencimiento.</span></li><li><strong>Alertas de quiebre</strong><span>Avisos de stock bajo, por vencer y vencido.</span></li><li><strong>Analítica</strong><span>Presupuesto del mes y gasto por categoría.</span></li><li><strong>Pedidos recurrentes</strong><span>Sugerencias y lista con pedidos de la familia.</span></li><li><strong>Asistente</strong><span>Respuestas por reglas, con los datos de tu despensa, sin clave de API.</span></li></ul>'
      + '<div class="card"><h2>Integrantes del grupo</h2><p class="meta">Completa los nombres. Se guardan solo en este navegador, como el resto de Yapa.</p>' + members + '<p class="note">Tecnología: HTML, CSS y JavaScript. Los datos viven en localStorage, separados por código de familia. Se puede instalar como PWA y, después de la primera visita, abre sin conexión. Pensada para publicarse en GitHub Pages con rutas relativas.</p></div></div>';
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
      : '<button class="icon-btn" type="button" data-action="go" data-route="mas" aria-label="Volver">' + icon('back') + '</button>';
    var action = '';
    if (name === 'lista') action = '<button class="btn tiny" type="button" data-action="open-manual">Añadir</button>';
    if (name === 'presupuesto') action = '<button class="btn tiny" type="button" data-action="open-expense">Anotar</button>';
    if (name === 'despensa') action = '<button class="icon-btn" type="button" data-action="open-add-pantry" aria-label="Agregar producto">' + icon('plus') + '</button>';
    var session = Store.session();
    var whoNow = session ? session.name + ' · ' + session.code : 'Yapa';
    bar.innerHTML = '<div class="topbar-row">' + back + '<div class="grow"><p class="eyebrow">' + esc(whoNow) + '</p><h1>' + esc(TITLES[name]) + '</h1></div><span class="top-side">' + action + '</span></div>';
  }

  function renderTabs(name, m) {
    var pending = m.state.shopping.filter(function (row) { return !row.checked; }).length;
    var tabs = [
      ['inicio', 'Inicio', 'home'],
      ['despensa', 'Despensa', 'box'],
      ['lista', 'Lista', 'list'],
      ['precios', 'Precios', 'tag'],
      ['mas', 'Más', 'more']
    ];
    document.getElementById('tabbar').innerHTML = tabs.map(function (tab) {
      var on = TAB_OF[name] === tab[0];
      var badge = tab[0] === 'lista' && pending ? '<span class="badge">' + pending + '</span>' : '';
      return '<button class="tab' + (on ? ' on' : '') + '" type="button" data-action="go" data-route="' + tab[0] + '" aria-current="' + (on ? 'page' : 'false') + '">' + icon(tab[2]) + badge + '<span>' + tab[1] + '</span></button>';
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
      ? '<form data-action="auth-create">' + field('Tu nombre', '<input name="name" required maxlength="40" autocomplete="name" placeholder="Ana">')
        + field('Apellido de la familia', '<input name="surname" required maxlength="40" autocomplete="family-name" placeholder="Rojas">', 'Con eso armamos un código como ROJAS-2026.')
        + '<button class="btn" type="submit">Crear familia</button><p class="form-error" hidden></p></form>'
        + '<button class="btn ghost" type="button" data-action="auth-mode" data-mode="login">Ya tengo un código</button>'
      : '<form data-action="auth-login">' + field('Tu nombre', '<input name="name" required maxlength="40" autocomplete="name" placeholder="Carla">')
        + field('Código de familia', '<input name="code" required maxlength="24" autocapitalize="characters" spellcheck="false" autocomplete="off" placeholder="ROJAS-2026">', 'La familia de ejemplo ya está en este navegador: ROJAS-2026.')
        + '<button class="btn" type="submit">Iniciar sesión</button><p class="form-error" hidden></p></form>'
        + '<button class="btn ghost" type="button" data-action="auth-mode" data-mode="create">Crear familia</button>';
    var heading = creating ? 'Crear familia' : 'Iniciar sesión';
    var lead = creating
      ? 'Elige tu nombre y el apellido de la casa. Yapa arma un código para que, en este navegador, otros entren a la misma despensa.'
      : 'Entra con tu nombre y el código de tu casa. En este navegador, el mismo código abre la misma despensa.';
    view.innerHTML = '<section class="gate"><div class="hero-brand">' + logoMark() + '<span>Yapa</span></div><h1>' + heading + '</h1><p>' + lead + '</p>' + form + '</section>';
    document.getElementById('offline').hidden = navigator.onLine;
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', '#F4F1EA');
    document.title = creating ? 'Yapa · Crear familia' : 'Yapa · Iniciar sesión';
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
    document.getElementById('offline').hidden = navigator.onLine;
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', name === 'inicio' ? '#0E7A56' : '#F4F1EA');
    document.title = 'Yapa · ' + TITLES[name];
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
    root.innerHTML = '<div class="backdrop" data-action="close-sheet"></div><div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-handle"></div><div class="sheet-head"><h2 id="sheet-title">' + esc(title) + '</h2><button class="icon-btn" type="button" data-action="close-sheet" aria-label="Cerrar">' + icon('x') + '</button></div>'
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
    if (action === 'auth-login') {
      var entered = Store.login(data.name, data.code);
      if (!entered.ok) {
        showFormError(entered.error);
        return;
      }
      toast('Hola, ' + entered.name + '.');
      go('inicio');
    } else if (action === 'auth-create') {
      var created = Store.createFamily(data.name, data.surname);
      if (!created.ok) {
        showFormError(created.error);
        return;
      }
      toast('Familia creada. El código es ' + created.code + '.');
      go('inicio');
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
    if (action === 'auth-mode') {
      ui.authMode = el.dataset.mode === 'create' ? 'create' : 'login';
      renderLogin();
    } else if (action === 'logout') {
      Store.logout();
      closeSheet();
      ui.authMode = 'login';
      toast('Sesión cerrada. Los datos siguen en este navegador.');
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
    } else if (action === 'quick') sendChat(QUICK[Number(el.dataset.i)] || '');
    else if (action === 'bot-send') sendChat(el.dataset.text || '');
  }

  function boot() {
    Store.init();
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
    window.addEventListener('online', render);
    window.addEventListener('offline', render);
    if (!location.hash) history.replaceState(null, '', '#/inicio');
    render();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin HTTPS o file:// no hay service worker */ });
    }
  }

  boot();
})();
