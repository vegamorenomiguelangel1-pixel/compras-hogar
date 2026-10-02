(function (global) {
  'use strict';

  var KEY = 'yapa-lang';
  var LANGS = [
    { id: 'es', label: 'Español' },
    { id: 'ay', label: 'Aymara' },
    { id: 'qu', label: 'Quechua' },
    { id: 'gn', label: 'Guaraní' }
  ];

  /* Castellano es la fuente. Aymara, quechua sureño boliviano (j por h)
     y guaraní boliviano solo cubren rótulos seguros. Si falta una clave,
     se usa el castellano. */
  var es = {
    'lang.label': 'Idioma',
    'i18n.note': 'El aymara, el quechua y el guaraní de esta app son una primera versión y conviene que los revise una persona hablante. Si no había una palabra segura, se dejó el castellano: en Bolivia es habitual mezclarlos.',
    'nav.inicio': 'Inicio',
    'nav.despensa': 'Despensa',
    'nav.lista': 'Lista',
    'nav.precios': 'Precios',
    'nav.mas': 'Más',
    'nav.sections': 'Secciones',
    'title.inicio': 'Inicio',
    'title.despensa': 'Despensa',
    'title.lista': 'Lista de compras',
    'title.precios': 'Comparador',
    'title.mas': 'Más',
    'title.presupuesto': 'Presupuesto',
    'title.desperdicio': 'Anti-desperdicio',
    'title.asistente': 'Asistente',
    'title.acerca': 'Acerca del proyecto',
    'login.in': 'Iniciar sesión',
    'login.create': 'Crear familia',
    'login.have': 'Ya tengo un código',
    'login.name': 'Tu nombre',
    'login.surname': 'Apellido de la familia',
    'login.code': 'Código de familia',
    'login.hintSurname': 'Con eso armamos un código como ROJAS-2026.',
    'login.hintCode': 'La familia de ejemplo es ROJAS-2026. El mismo código sirve en otro celular.',
    'login.leadIn': 'Entra con tu nombre y el código de tu casa. El mismo código en otro celular abre la misma despensa.',
    'login.leadCreate': 'Elige tu nombre y el apellido de la casa. Yapa arma un código para compartir la despensa entre celulares.',
    'hello': 'Hola, {name}',
    'tagline': 'Menos desperdicio, más yapa para la casa.',
    'logout': 'Cerrar sesión',
    'family.cloud': 'Familia en la nube',
    'family.name': 'Familia {surname}',
    'code.label': 'Código {code}',
    'joined.none': 'Nadie más entró todavía.',
    'joined.nobody': 'todavía nadie',
    'joined.entered': 'Entraron: {names}',
    'stat.soon': 'Por vencer',
    'stat.low': 'Stock bajo',
    'stat.spent': 'Gastados del mes',
    'stat.saved': 'Comida salvada',
    'section.soon': 'Usar pronto',
    'section.recipes': 'Recetas',
    'section.familyList': 'Lista familiar',
    'section.open': 'Abrir',
    'section.suggestions': 'Sugerencias',
    'section.toBuy': 'Por comprar',
    'section.cart': 'En el carrito',
    'section.byCat': 'Por categoría',
    'section.monthBuys': 'Compras del mes',
    'section.basket': 'Canasta de muestra',
    'section.expired': 'Ya venció',
    'section.urgent': 'Recetas con lo que urge',
    'btn.add': 'Agregar',
    'btn.addAll': 'Agregar todas',
    'btn.addList': 'Agregar a la lista',
    'btn.addAnother': 'Sumar otra unidad',
    'btn.addPantry': 'Agregar a la despensa',
    'btn.save': 'Guardar cambios',
    'btn.saveShort': 'Guardar',
    'btn.search': 'Buscar',
    'btn.back': 'Volver',
    'btn.close': 'Cerrar',
    'btn.register': 'Registrar',
    'btn.note': 'Anotar',
    'btn.remove': 'Quitar',
    'btn.delete': 'Borrar',
    'btn.cancel': 'Cancelar',
    'btn.reset': 'Restablecer datos de ejemplo',
    'btn.buy': 'Comprar',
    'pill.soon': 'Por vencer',
    'pill.expired': 'Vencido',
    'pill.low': 'Stock bajo',
    'pill.ok': 'Bien',
    'pill.none': 'Sin vencimiento',
    'filter.all': 'Todas',
    'filter.alerts': 'Alertas',
    'filter.soon': 'Por vencer',
    'filter.expired': 'Vencidos',
    'filter.low': 'Stock bajo',
    'sync.synced': 'Sincronizado',
    'sync.syncing': 'Sincronizando',
    'sync.offline': 'Sin conexión',
    'offline.banner': 'Estás sin conexión. Yapa sigue disponible en este celular.',
    'search.pantry': 'Buscar en la despensa',
    'search.product': 'Buscar producto',
    'price.cheap': 'más barato',
    'price.save': 'Ahorras {money} frente a {store}.',
    'price.same': 'Mismo precio en todos los locales.',
    'word.price': 'Precio',
    'word.saving': 'Ahorro',
    'word.family': 'Familia',
    'word.list': 'Lista',
    'word.pantry': 'Despensa',
    'word.buy': 'Comprar',
    'menu.budget': 'Tope del mes y compras anotadas',
    'menu.waste': 'Recetas para lo que está por vencer',
    'menu.assistant': 'Respuestas en el celular, sin API',
    'menu.about': 'Caso de estudio y tu grupo',
    'menu.phone': 'En este celular',
    'quick.expire': '¿Qué está por vencer?',
    'quick.buy': '¿Qué hay que comprar?',
    'quick.rice': '¿Dónde sale más barato el arroz?',
    'quick.budget': '¿Cómo va el presupuesto?',
    'quick.tip': 'Dame un tip para ahorrar',
    'chat.placeholder': 'Pregúntale a Yapa',
    'chat.label': 'Mensaje para Yapa',
    'chat.send': 'Enviar',
    'chat.typing': 'Yapa está escribiendo',
    'aria.addProduct': 'Agregar producto',
    'aria.minus': 'Restar',
    'aria.plus': 'Sumar',
    'aria.mark': 'Marcar {name}',
    'aria.month': 'Gasto del mes',
    'skip': 'Saltar al contenido'
  };

  var ay = {
    'lang.label': 'Aru',
    'nav.inicio': 'Qallta',
    'nav.precios': 'Chani',
    'nav.mas': "Juk'ampi",
    'title.inicio': 'Qallta',
    'title.lista': 'Alaña lista',
    'title.precios': 'Chani',
    'title.mas': "Juk'ampi",
    'login.in': 'Mantaña',
    'login.create': 'Wila masi luraña',
    'login.name': 'Sutima',
    'login.surname': 'Wila masin apellido',
    'login.code': 'Wila masin código',
    'hello': 'Kamisaraki, {name}',
    'tagline': "Menos desperdicio, juk'ampi yapa utataki.",
    'logout': 'Mistuña',
    'family.cloud': 'Wila masi en la nube',
    'family.name': 'Wila masi {surname}',
    'stat.saved': "Manq'a salvada",
    'section.familyList': 'Wila masin lista',
    'section.open': "Jist'araña",
    'section.toBuy': 'Alañataki',
    'btn.add': 'Yapaña',
    'btn.addAll': 'Taqpach yapaña',
    'btn.addList': 'Listaru yapaña',
    'btn.addPantry': 'Despensaru yapaña',
    'btn.save': 'Imaña',
    'btn.saveShort': 'Imaña',
    'btn.search': 'Thaqhaña',
    'btn.back': 'Kuttaña',
    'btn.close': "Jist'antaña",
    'btn.buy': 'Alaña',
    'pill.ok': 'Wali',
    'filter.all': 'Taqpacha',
    'price.cheap': 'juspacha',
    'price.save': 'Ahorro {money} ukat {store}.',
    'word.price': 'Chani',
    'word.family': 'Wila masi',
    'word.buy': 'Alaña',
    'search.pantry': 'Despensan thaqhaña',
    'search.product': 'Thaqhaña',
    'quick.buy': '¿Kuna alañasa?',
    'quick.tip': 'Ahorrotaki mä tip churita'
  };

  var qu = {
    'lang.label': 'Simi',
    'nav.inicio': 'Qallariy',
    'nav.precios': 'Chanin',
    'nav.mas': 'Aswan',
    'title.inicio': 'Qallariy',
    'title.lista': 'Rantina lista',
    'title.precios': 'Chanin',
    'title.mas': 'Aswan',
    'login.in': 'Yaykuy',
    'login.create': 'Ayllu ruray',
    'login.name': 'Sutiyki',
    'login.surname': 'Ayllup apellido',
    'login.code': 'Ayllup código',
    'hello': 'Imaynalla, {name}',
    'tagline': 'Menos desperdicio, aswan yapa wasipaq.',
    'logout': 'Lluqsiy',
    'family.cloud': 'Ayllu en la nube',
    'family.name': 'Ayllu {surname}',
    'stat.saved': 'Mikjuna salvada',
    'section.familyList': 'Ayllup lista',
    'section.open': 'Kichay',
    'section.toBuy': 'Rantinapaq',
    'btn.add': 'Yapay',
    'btn.addAll': 'Llapanman yapay',
    'btn.addList': 'Listaman yapay',
    'btn.addPantry': 'Despensaman yapay',
    'btn.save': 'Waqaychay',
    'btn.saveShort': 'Waqaychay',
    'btn.search': 'Maskjay',
    'btn.back': 'Kutiy',
    'btn.close': "Wichq'ay",
    'btn.buy': 'Rantiy',
    'pill.ok': 'Allin',
    'filter.all': 'Llapan',
    'price.cheap': 'aswan barato',
    'price.save': 'Qullqi waqaychay {money}, {store}manta.',
    'word.price': 'Chanin',
    'word.saving': 'Qullqi waqaychay',
    'word.family': 'Ayllu',
    'word.buy': 'Rantiy',
    'search.pantry': 'Despensapi maskjay',
    'search.product': 'Maskjay',
    'quick.buy': '¿Imata rantinapaq?',
    'quick.tip': 'Qullqi waqaychanapaq huk tip'
  };

  var gn = {
    'lang.label': "Ñe'ẽ",
    'nav.inicio': 'Ñepyrũ',
    'nav.precios': 'Tepy',
    'nav.mas': 'Hetave',
    'title.inicio': 'Ñepyrũ',
    'title.lista': 'Jogua lista',
    'title.precios': 'Tepy',
    'title.mas': 'Hetave',
    'login.in': 'Ike',
    'login.create': 'Ogapegua japo',
    'login.name': 'Nde réra',
    'login.surname': 'Téra joapy',
    'login.code': 'Ogapegua código',
    'hello': 'Mbaetïko, {name}',
    'tagline': 'Menos desperdicio, hetave yapa ógape.',
    'logout': 'Sẽ',
    'family.cloud': 'Ogapegua en la nube',
    'family.name': 'Ogapegua {surname}',
    'stat.saved': "Tembi'u salvada",
    'section.familyList': 'Ogapegua lista',
    'section.open': "Pe'a",
    'section.toBuy': 'Jogua haguã',
    'btn.add': 'Mbojoapy',
    'btn.addAll': 'Opavave mbojoapy',
    'btn.addList': 'Listápe mbojoapy',
    'btn.addPantry': 'Despensápe mbojoapy',
    'btn.save': 'Ñongatu',
    'btn.saveShort': 'Ñongatu',
    'btn.search': 'Heka',
    'btn.back': 'Jevy',
    'btn.close': 'Mboty',
    'btn.buy': 'Jogua',
    'pill.ok': 'Porã',
    'filter.all': 'Opavave',
    'word.price': 'Tepy',
    'word.saving': 'Pirapire ñongatu',
    'word.family': 'Ogapegua',
    'word.buy': 'Jogua',
    'search.pantry': 'Despensápe heka',
    'search.product': 'Heka'
  };

  var packs = { es: es, ay: ay, qu: qu, gn: gn };

  function lang() {
    try {
      var saved = localStorage.getItem(KEY);
      if (packs[saved]) return saved;
    } catch (err) { /* sin almacenamiento */ }
    return 'es';
  }

  function apply() {
    var id = lang();
    if (global.document && global.document.documentElement) {
      var htmlLang = { ay: 'ay', qu: 'qu', gn: 'gn' };
      global.document.documentElement.lang = htmlLang[id] || 'es-BO';
    }
  }

  function t(key, vars) {
    var pack = packs[lang()] || es;
    var text = pack[key] != null ? pack[key] : es[key];
    if (text == null) text = key;
    if (!vars) return text;
    return String(text).replace(/\{(\w+)\}/g, function (_, name) {
      return vars[name] == null ? '' : String(vars[name]);
    });
  }

  function phrase(key) {
    return es[key] != null ? es[key] : key;
  }

  function set(id) {
    if (!packs[id]) return;
    try { localStorage.setItem(KEY, id); } catch (err) { /* sigue en memoria */ }
    apply();
  }

  apply();

  global.YapaI18n = {
    KEY: KEY,
    LANGS: LANGS,
    lang: lang,
    set: set,
    t: t,
    phrase: phrase,
    apply: apply
  };
})(window);
