(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YapaData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CATEGORIES = [
    'Lácteos',
    'Proteínas',
    'Granos y abarrotes',
    'Verduras',
    'Frutas',
    'Panadería',
    'Conservas',
    'Despensa',
    'Limpieza',
    'Bebidas'
  ];

  var STORES = ['Hipermaxi', 'Fidalga', 'IC Norte', 'Mercado Los Pozos', 'Mercado Mutualista', 'Abasto'];

  var UNITS = [
    { id: 'u', label: 'unidad' },
    { id: 'kg', label: 'kg' },
    { id: 'g', label: 'g' },
    { id: 'L', label: 'L' },
    { id: 'ml', label: 'ml' }
  ];

  function P(h, f, i, pozos, mutualista, abasto) {
    return {
      Hipermaxi: h,
      Fidalga: f,
      'IC Norte': i,
      'Mercado Los Pozos': pozos,
      'Mercado Mutualista': mutualista,
      Abasto: abasto
    };
  }

  var CATALOG = [
    { id: 'arroz', name: 'Arroz Grano de Oro', unit: 'kg', unitLabel: 'kg', category: 'Granos y abarrotes', kgEach: null, aliases: ['arroz', 'grano de oro'], prices: P(9.9, 10.5, 9.6, 8.2, 8.6, 8.9) },
    { id: 'aceite', name: 'Aceite Fino', unit: 'u', unitLabel: 'botella', category: 'Despensa', kgEach: 0.9, aliases: ['aceite', 'aceite fino'], prices: P(17.9, 19.8, 18.7, 19.2, 18.5, 19.5) },
    { id: 'azucar', name: 'Azúcar blanca', unit: 'kg', unitLabel: 'kg', category: 'Despensa', kgEach: null, aliases: ['azucar', 'azúcar'], prices: P(7.4, 7.1, 7.6, 6.8, 7, 6.9) },
    { id: 'leche', name: 'Leche PIL', unit: 'u', unitLabel: 'caja', category: 'Lácteos', kgEach: 1.03, aliases: ['leche', 'leche pil'], prices: P(8.5, 8.2, 8.7, 7.9, 8.1, 8.4) },
    { id: 'huevo', name: 'Huevo', unit: 'u', unitLabel: 'unid.', category: 'Proteínas', kgEach: 0.06, aliases: ['huevo', 'huevos'], prices: P(1.3, 1.25, 1.2, 1.1, 1.15, 1.2) },
    { id: 'fideo', name: 'Fideo Don Vittorio', unit: 'u', unitLabel: 'paquete', category: 'Granos y abarrotes', kgEach: 0.4, aliases: ['fideo', 'fideos', 'don vittorio'], prices: P(6.5, 6.9, 6.2, 7.1, 6.8, 6.4) },
    { id: 'atun', name: 'Atún Florida', unit: 'u', unitLabel: 'lata', category: 'Conservas', kgEach: 0.17, aliases: ['atun', 'atún', 'florida'], prices: P(12.9, 11.5, 12.4, 13.2, 12.8, 12.1) },
    { id: 'pollo', name: 'Pollo entero', unit: 'kg', unitLabel: 'kg', category: 'Proteínas', kgEach: null, aliases: ['pollo'], prices: P(20.9, 22.5, 19.8, 21, 20.5, 20.2) },
    { id: 'carne', name: 'Carne molida', unit: 'kg', unitLabel: 'kg', category: 'Proteínas', kgEach: null, aliases: ['carne', 'carne molida', 'molida'], prices: P(47, 49.5, 46, 44.5, 45, 43.5) },
    { id: 'tomate', name: 'Tomate', unit: 'kg', unitLabel: 'kg', category: 'Verduras', kgEach: null, aliases: ['tomate', 'tomates'], prices: P(8.8, 9.4, 8.2, 6.3, 6.6, 7.1) },
    { id: 'papa', name: 'Papa', unit: 'kg', unitLabel: 'kg', category: 'Verduras', kgEach: null, aliases: ['papa', 'papas'], prices: P(6.2, 6.5, 5.9, 4.5, 4.8, 5.1) },
    { id: 'cebolla', name: 'Cebolla', unit: 'kg', unitLabel: 'kg', category: 'Verduras', kgEach: null, aliases: ['cebolla', 'cebollas'], prices: P(7.1, 6.8, 6.4, 5.2, 5.5, 5.8) },
    { id: 'zanahoria', name: 'Zanahoria', unit: 'kg', unitLabel: 'kg', category: 'Verduras', kgEach: null, aliases: ['zanahoria', 'zanahorias'], prices: P(6.4, 6.1, 5.8, 4.7, 5, 5.3) },
    { id: 'platano', name: 'Plátano', unit: 'u', unitLabel: 'unid.', category: 'Frutas', kgEach: 0.12, aliases: ['platano', 'plátano', 'guineo', 'banano'], prices: P(1.4, 1.5, 1.3, 1, 1.1, 1.2) },
    { id: 'pan', name: 'Pan de batalla', unit: 'u', unitLabel: 'unid.', category: 'Panadería', kgEach: 0.04, aliases: ['pan', 'pan de batalla', 'marraqueta'], prices: P(0.5, 0.5, 0.5, 0.4, 0.45, 0.5) },
    { id: 'lenteja', name: 'Lentejas', unit: 'kg', unitLabel: 'kg', category: 'Granos y abarrotes', kgEach: null, aliases: ['lenteja', 'lentejas'], prices: P(14.5, 13.9, 14.2, 12.8, 13.2, 13.1) },
    { id: 'yogurt', name: 'Yogurt PIL', unit: 'u', unitLabel: 'pote', category: 'Lácteos', kgEach: 1, aliases: ['yogurt', 'yogur'], prices: P(14.2, 13.5, 13.9, 15, 14.6, 14.8) },
    { id: 'queso', name: 'Queso criollo', unit: 'kg', unitLabel: 'kg', category: 'Lácteos', kgEach: null, aliases: ['queso', 'queso criollo'], prices: P(52, 49, 50, 46.5, 45.5, 47) },
    { id: 'detergente', name: 'Detergente Ace', unit: 'u', unitLabel: 'bolsa', category: 'Limpieza', kgEach: 0.8, aliases: ['detergente'], prices: P(18.5, 17.2, 16.9, 19, 18.2, 17.8) },
    { id: 'cafe', name: 'Café Illimani', unit: 'u', unitLabel: 'bolsa', category: 'Despensa', kgEach: 0.25, aliases: ['cafe', 'café', 'illimani'], prices: P(27.5, 26, 28, 24.5, 25, 26.5) },
    { id: 'mantequilla', name: 'Mantequilla PIL', unit: 'u', unitLabel: 'pote', category: 'Lácteos', kgEach: 0.1, aliases: ['mantequilla'], prices: P(9.8, 9.4, 9.9, 10.2, 9.7, 10) },
    { id: 'manzana', name: 'Manzana roja', unit: 'kg', unitLabel: 'kg', category: 'Frutas', kgEach: null, aliases: ['manzana', 'manzanas'], prices: P(16.5, 15.9, 16, 13.5, 14, 14.4) },
    { id: 'sal', name: 'Sal yodada', unit: 'u', unitLabel: 'bolsa', category: 'Despensa', kgEach: 1, aliases: ['sal', 'sal yodada'], prices: P(2.8, 2.5, 2.6, 2.2, 2.3, 2.4) },
    { id: 'gaseosa', name: 'Coca-Cola', unit: 'u', unitLabel: 'botella 2 L', category: 'Bebidas', kgEach: 2, aliases: ['gaseosa', 'coca cola', 'coca-cola'], prices: P(12, 12.5, 11.8, 13, 12.8, 12.2) },
    { id: 'harina', name: 'Harina', unit: 'kg', unitLabel: 'kg', category: 'Despensa', kgEach: null, aliases: ['harina'], prices: P(6.8, 6.5, 6.2, 6.9, 6.6, 6.4) }
  ];

  var RECIPES = [
    {
      id: 'budin',
      name: 'Budín de pan',
      minutes: 40,
      note: 'El pan de ayer queda mejor acá que en la basura.',
      ingredients: [
        { key: 'pan', label: 'Pan' },
        { key: 'leche', label: 'Leche' },
        { key: 'huevo', label: 'Huevo' },
        { key: 'azucar', label: 'Azúcar' }
      ],
      steps: [
        'Corta el pan y remójalo en leche tibia hasta que se ablande.',
        'Incorpora huevo y un poco de azúcar. Si hay canela en casa, una pizca alcanza.',
        'Vierte la mezcla en un molde engrasado y hornea a fuego medio hasta que dore.',
        'Déjalo entibiar. Alcanza para la merienda de los cuatro.'
      ]
    },
    {
      id: 'arroz-leche',
      name: 'Arroz con leche',
      minutes: 35,
      note: 'Aprovecha la leche que está por vencer.',
      ingredients: [
        { key: 'arroz', label: 'Arroz' },
        { key: 'leche', label: 'Leche' },
        { key: 'azucar', label: 'Azúcar' }
      ],
      steps: [
        'Cocina el arroz en agua hasta que empiece a soltar almidón.',
        'Agrega la leche y cocina a fuego bajo, revolviendo para que no se pegue.',
        'Endulza al final. Sirve tibio, con canela si tienes.'
      ]
    },
    {
      id: 'licuado',
      name: 'Licuado de yogurt y plátano',
      minutes: 10,
      note: 'Desayuno rápido antes de que el yogurt cumpla la fecha.',
      ingredients: [
        { key: 'yogurt', label: 'Yogurt' },
        { key: 'platano', label: 'Plátano' },
        { key: 'azucar', label: 'Azúcar' }
      ],
      steps: [
        'Pela los plátanos maduros.',
        'Licúa con el yogurt. Endulza solo si hace falta.',
        'Tómalo el mismo día. No lo guardes de un día para otro.'
      ]
    },
    {
      id: 'tostada',
      name: 'Pan con mantequilla',
      minutes: 8,
      note: 'Sale mejor si el pan ya está un poco duro.',
      ingredients: [
        { key: 'pan', label: 'Pan' },
        { key: 'mantequilla', label: 'Mantequilla' }
      ],
      steps: [
        'Parte el pan y tuéstalo en sartén seca hasta que dore.',
        'Unta la mantequilla cuando todavía está caliente.',
        'Acompáñalo con café. Es la merienda más simple de la casa.'
      ]
    },
    {
      id: 'majadito',
      name: 'Majadito',
      minutes: 30,
      note: 'Clásico de la casa cuando hay arroz, huevo y plátano.',
      ingredients: [
        { key: 'arroz', label: 'Arroz' },
        { key: 'platano', label: 'Plátano' },
        { key: 'huevo', label: 'Huevo' },
        { key: 'pollo', label: 'Pollo' }
      ],
      steps: [
        'Dora el plátano en rodajas y reserva.',
        'Saltea el pollo desmenuzado y mezcla con el arroz cocido.',
        'Sirve con huevo frito encima y el plátano a un lado.'
      ]
    },
    {
      id: 'aji-fideo',
      name: 'Ají de fideo',
      minutes: 35,
      note: 'Rinde harto y usa el pollo que hay que cocinar pronto.',
      ingredients: [
        { key: 'fideo', label: 'Fideo' },
        { key: 'pollo', label: 'Pollo' },
        { key: 'tomate', label: 'Tomate' },
        { key: 'cebolla', label: 'Cebolla' },
        { key: 'aceite', label: 'Aceite' }
      ],
      steps: [
        'Sofríe cebolla y tomate en un poco de aceite hasta que suelten jugo.',
        'Agrega el pollo en presas y cocina con agua hasta que ablande.',
        'Suma el fideo y cocina hasta que absorba el caldo. Que quede jugoso, no seco.'
      ]
    },
    {
      id: 'picante',
      name: 'Picante de pollo',
      minutes: 45,
      note: 'Almuerzo cruceño para no dejar el pollo en la heladera.',
      ingredients: [
        { key: 'pollo', label: 'Pollo' },
        { key: 'papa', label: 'Papa' },
        { key: 'arroz', label: 'Arroz' },
        { key: 'cebolla', label: 'Cebolla' }
      ],
      steps: [
        'Cocina el pollo con cebolla, ají y una taza de agua.',
        'Hierve las papas aparte, con cáscara si están enteras.',
        'Sirve con arroz. Si el ají está picante, deja aparte la porción de Mateo.'
      ]
    },
    {
      id: 'silpancho',
      name: 'Silpancho de la casa',
      minutes: 40,
      note: 'Usa la carne molida antes de que cumpla la fecha.',
      ingredients: [
        { key: 'carne', label: 'Carne' },
        { key: 'arroz', label: 'Arroz' },
        { key: 'papa', label: 'Papa' },
        { key: 'huevo', label: 'Huevo' },
        { key: 'tomate', label: 'Tomate' }
      ],
      steps: [
        'Aplasta la carne bien delgada, sazónala y fríela.',
        'Arma el plato con arroz, papa dorada, la carne y un huevo.',
        'Encima va tomate picado con un toque de cebolla, si todavía está firme.'
      ]
    },
    {
      id: 'lentejas',
      name: 'Guiso de lentejas',
      minutes: 40,
      note: 'Las lentejas aguantan, las verduras no. Mételas hoy.',
      ingredients: [
        { key: 'lenteja', label: 'Lentejas' },
        { key: 'zanahoria', label: 'Zanahoria' },
        { key: 'papa', label: 'Papa' },
        { key: 'cebolla', label: 'Cebolla' }
      ],
      steps: [
        'Sofríe cebolla y zanahoria en cuadritos.',
        'Agrega las lentejas remojadas y agua hasta cubrir.',
        'Suma la papa a la mitad de la cocción. Sirve con arroz si queda.'
      ]
    },
    {
      id: 'sopa',
      name: 'Sopa de verduras',
      minutes: 30,
      note: 'Vacía el cajón de verduras en una sola olla.',
      ingredients: [
        { key: 'papa', label: 'Papa' },
        { key: 'zanahoria', label: 'Zanahoria' },
        { key: 'cebolla', label: 'Cebolla' },
        { key: 'tomate', label: 'Tomate' },
        { key: 'fideo', label: 'Fideo' }
      ],
      steps: [
        'Hierve papa, zanahoria y cebolla en agua con sal.',
        'Agrega tomate picado cuando la papa esté casi lista.',
        'Al final echa un puñado de fideo y cocina cinco minutos más.'
      ]
    },
    {
      id: 'tortilla',
      name: 'Tortilla de verduras',
      minutes: 20,
      note: 'Cena liviana con lo que está por vencer.',
      ingredients: [
        { key: 'huevo', label: 'Huevo' },
        { key: 'tomate', label: 'Tomate' },
        { key: 'cebolla', label: 'Cebolla' },
        { key: 'zanahoria', label: 'Zanahoria' }
      ],
      steps: [
        'Saltea cebolla, zanahoria rallada y tomate hasta que suelten agua.',
        'Bate los huevos, mézclalos con la verdura y cuaja en sartén.',
        'Dora de los dos lados. Acompaña con pan si todavía está bueno.'
      ]
    },
    {
      id: 'horno',
      name: 'Pollo al horno con papas',
      minutes: 55,
      note: 'Una bandeja para el almuerzo del domingo.',
      ingredients: [
        { key: 'pollo', label: 'Pollo' },
        { key: 'papa', label: 'Papa' },
        { key: 'zanahoria', label: 'Zanahoria' },
        { key: 'cebolla', label: 'Cebolla' }
      ],
      steps: [
        'Parte el pollo y las papas en trozos parejos.',
        'Mezcla con cebolla, zanahoria, sal y un chorrito de aceite.',
        'Hornea hasta que el pollo suelte jugo claro y la papa esté blanda.'
      ]
    },
    {
      id: 'ensalada',
      name: 'Ensalada criolla',
      minutes: 15,
      note: 'Si el tomate ya está blando, mejor va al guiso que a la ensalada.',
      ingredients: [
        { key: 'tomate', label: 'Tomate' },
        { key: 'cebolla', label: 'Cebolla' }
      ],
      steps: [
        'Pica tomate firme y cebolla en pluma fina.',
        'Aliña con sal, un chorro de limón y una gota de aceite.',
        'Sírvela al momento, al lado del segundo.'
      ]
    },
    {
      id: 'arroz-carne',
      name: 'Arroz con carne',
      minutes: 30,
      note: 'La molida no espera: hoy es el día.',
      ingredients: [
        { key: 'carne', label: 'Carne' },
        { key: 'arroz', label: 'Arroz' },
        { key: 'tomate', label: 'Tomate' },
        { key: 'cebolla', label: 'Cebolla' },
        { key: 'aceite', label: 'Aceite' }
      ],
      steps: [
        'Sofríe cebolla y tomate en poco aceite.',
        'Agrega la carne molida y cocina hasta que cambie de color.',
        'Mezcla con arroz graneado y corrige la sal.'
      ]
    }
  ];

  function item(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      qty: row.qty,
      unit: row.unit,
      unitLabel: row.unitLabel,
      min: row.min,
      expiry: row.expiry,
      price: row.price,
      productId: row.productId,
      kgEach: row.kgEach
    };
  }

  function line(name, category, qty, unit, price) {
    var subtotal = Math.round((qty * price + Number.EPSILON) * 100) / 100;
    return { name: name, category: category, qty: qty, unit: unit, price: price, subtotal: subtotal };
  }

  function purchase(id, date, store, note, items) {
    var total = 0;
    items.forEach(function (row) { total += row.subtotal; });
    total = Math.round((total + Number.EPSILON) * 100) / 100;
    return { id: id, date: date, store: store, note: note, items: items, total: total };
  }

  function buildSeed(today) {
    var L = globalThis.YapaLogic;
    var exp = function (n) { return L.addDays(today, n); };
    var day = function (back) { return L.recentDate(today, back); };

    var pantry = [
      item({ id: 'p-leche', name: 'Leche PIL entera', category: 'Lácteos', qty: 1, unit: 'u', unitLabel: 'caja', min: 2, expiry: exp(2), price: 8.5, productId: 'leche', kgEach: 1.03 }),
      item({ id: 'p-yogurt', name: 'Yogurt PIL frutilla', category: 'Lácteos', qty: 1, unit: 'u', unitLabel: 'pote', min: 1, expiry: exp(1), price: 14.2, productId: 'yogurt', kgEach: 1 }),
      item({ id: 'p-queso', name: 'Queso criollo', category: 'Lácteos', qty: 0.25, unit: 'kg', unitLabel: 'kg', min: 0.2, expiry: exp(-1), price: 46, productId: 'queso', kgEach: null }),
      item({ id: 'p-mantequilla', name: 'Mantequilla PIL', category: 'Lácteos', qty: 1, unit: 'u', unitLabel: 'pote', min: 1, expiry: exp(3), price: 9.9, productId: 'mantequilla', kgEach: 0.1 }),
      item({ id: 'p-huevo', name: 'Huevos de granja', category: 'Proteínas', qty: 4, unit: 'u', unitLabel: 'unid.', min: 12, expiry: exp(12), price: 1.3, productId: 'huevo', kgEach: 0.06 }),
      item({ id: 'p-pollo', name: 'Pollo entero', category: 'Proteínas', qty: 0.8, unit: 'kg', unitLabel: 'kg', min: 1, expiry: exp(2), price: 19.8, productId: 'pollo', kgEach: null }),
      item({ id: 'p-carne', name: 'Carne molida', category: 'Proteínas', qty: 0.5, unit: 'kg', unitLabel: 'kg', min: 0.4, expiry: exp(1), price: 46, productId: 'carne', kgEach: null }),
      item({ id: 'p-arroz', name: 'Arroz Grano de Oro', category: 'Granos y abarrotes', qty: 0.45, unit: 'kg', unitLabel: 'kg', min: 2, expiry: exp(200), price: 10.5, productId: 'arroz', kgEach: null }),
      item({ id: 'p-fideo', name: 'Fideo Don Vittorio', category: 'Granos y abarrotes', qty: 3, unit: 'u', unitLabel: 'paquete', min: 2, expiry: exp(240), price: 6.5, productId: 'fideo', kgEach: 0.4 }),
      item({ id: 'p-lenteja', name: 'Lentejas', category: 'Granos y abarrotes', qty: 0.8, unit: 'kg', unitLabel: 'kg', min: 0.4, expiry: exp(180), price: 13.9, productId: 'lenteja', kgEach: null }),
      item({ id: 'p-aceite', name: 'Aceite Fino', category: 'Despensa', qty: 1, unit: 'u', unitLabel: 'botella', min: 2, expiry: exp(120), price: 19.8, productId: 'aceite', kgEach: 0.9 }),
      item({ id: 'p-azucar', name: 'Azúcar blanca', category: 'Despensa', qty: 0.85, unit: 'kg', unitLabel: 'kg', min: 0.4, expiry: exp(300), price: 7.4, productId: 'azucar', kgEach: null }),
      item({ id: 'p-harina', name: 'Harina', category: 'Despensa', qty: 1, unit: 'kg', unitLabel: 'kg', min: 0.5, expiry: exp(200), price: 6.5, productId: 'harina', kgEach: null }),
      item({ id: 'p-cafe', name: 'Café Illimani', category: 'Despensa', qty: 1, unit: 'u', unitLabel: 'bolsa', min: 1, expiry: exp(90), price: 27.5, productId: 'cafe', kgEach: 0.25 }),
      item({ id: 'p-tomate', name: 'Tomate', category: 'Verduras', qty: 0.7, unit: 'kg', unitLabel: 'kg', min: 0.5, expiry: exp(2), price: 6.3, productId: 'tomate', kgEach: null }),
      item({ id: 'p-papa', name: 'Papa', category: 'Verduras', qty: 2.2, unit: 'kg', unitLabel: 'kg', min: 1, expiry: exp(16), price: 4.5, productId: 'papa', kgEach: null }),
      item({ id: 'p-cebolla', name: 'Cebolla', category: 'Verduras', qty: 0.35, unit: 'kg', unitLabel: 'kg', min: 0.8, expiry: exp(12), price: 5.2, productId: 'cebolla', kgEach: null }),
      item({ id: 'p-zanahoria', name: 'Zanahoria', category: 'Verduras', qty: 0.35, unit: 'kg', unitLabel: 'kg', min: 0.5, expiry: exp(3), price: 4.7, productId: 'zanahoria', kgEach: null }),
      item({ id: 'p-platano', name: 'Plátano', category: 'Frutas', qty: 4, unit: 'u', unitLabel: 'unid.', min: 6, expiry: exp(2), price: 1, productId: 'platano', kgEach: 0.12 }),
      item({ id: 'p-pan', name: 'Pan de batalla', category: 'Panadería', qty: 5, unit: 'u', unitLabel: 'unid.', min: 8, expiry: exp(1), price: 0.4, productId: 'pan', kgEach: 0.04 }),
      item({ id: 'p-atun', name: 'Atún Florida', category: 'Conservas', qty: 1, unit: 'u', unitLabel: 'lata', min: 3, expiry: exp(400), price: 12.9, productId: 'atun', kgEach: 0.17 })
    ];

    var shopping = [
      { id: 's-detergente', name: 'Detergente Ace', category: 'Limpieza', qty: 1, unit: 'u', unitLabel: 'bolsa', price: 16.9, checked: false, source: 'familia', by: 'Carla', reason: 'Pedido de mamá, para la ropa', productId: 'detergente', kgEach: 0.8 },
      { id: 's-gaseosa', name: 'Coca-Cola', category: 'Bebidas', qty: 1, unit: 'u', unitLabel: 'botella 2 L', price: 11.8, checked: false, source: 'familia', by: 'Luis', reason: 'Para el almuerzo del domingo', productId: 'gaseosa', kgEach: 2 },
      { id: 's-manzana', name: 'Manzana roja', category: 'Frutas', qty: 0.5, unit: 'kg', unitLabel: 'kg', price: 13.5, checked: false, source: 'familia', by: 'Ana', reason: 'Para la lonchera', productId: 'manzana', kgEach: null },
      { id: 's-sal', name: 'Sal yodada', category: 'Despensa', qty: 1, unit: 'u', unitLabel: 'bolsa', price: 2.2, checked: true, source: 'familia', by: 'Mateo', reason: 'Se acabó la sal', productId: 'sal', kgEach: 1 }
    ];

    var purchases = [
      purchase('c-hiper', day(1), 'Hipermaxi', 'Compra de la semana', [
        line('Leche PIL', 'Lácteos', 2, 'caja', 8.5),
        line('Yogurt PIL', 'Lácteos', 1, 'pote', 14.2),
        line('Huevos', 'Proteínas', 10, 'unid.', 1.3),
        line('Fideo Don Vittorio', 'Granos y abarrotes', 2, 'paquete', 6.5),
        line('Azúcar blanca', 'Despensa', 1, 'kg', 7.4),
        line('Café Illimani', 'Despensa', 1, 'bolsa', 27.5),
        line('Atún Florida', 'Conservas', 2, 'lata', 12.9)
      ]),
      purchase('c-ic', day(1), 'IC Norte', 'Carnes para la semana', [
        line('Pollo entero', 'Proteínas', 1, 'kg', 19.8),
        line('Carne molida', 'Proteínas', 0.5, 'kg', 46),
        line('Mantequilla PIL', 'Lácteos', 1, 'pote', 9.9)
      ]),
      purchase('c-feria', day(0), 'Mercado Los Pozos', 'Feria en Los Pozos', [
        line('Papa', 'Verduras', 2, 'kg', 4.5),
        line('Tomate', 'Verduras', 0.7, 'kg', 6.3),
        line('Cebolla', 'Verduras', 0.5, 'kg', 5.2),
        line('Zanahoria', 'Verduras', 0.4, 'kg', 4.7),
        line('Plátano', 'Frutas', 6, 'unid.', 1),
        line('Pan de batalla', 'Panadería', 8, 'unid.', 0.4)
      ]),
      purchase('c-fidalga', day(1), 'Fidalga', 'Abarrotes de inicio de mes', [
        line('Aceite Fino', 'Despensa', 1, 'botella', 19.8),
        line('Arroz Grano de Oro', 'Granos y abarrotes', 1, 'kg', 10.5),
        line('Lentejas', 'Granos y abarrotes', 1, 'kg', 13.9),
        line('Harina', 'Despensa', 1, 'kg', 6.5),
        line('Detergente Ace', 'Limpieza', 1, 'bolsa', 17.2)
      ])
    ];

    return {
      version: 2,
      family: {
        surname: 'Rojas',
        city: 'Santa Cruz de la Sierra',
        neighborhood: 'Barrio Los Pozos',
        address: 'Barrio Los Pozos, Santa Cruz de la Sierra',
        people: [
          { name: 'Carla', role: 'Mamá' },
          { name: 'Luis', role: 'Papá' },
          { name: 'Ana', role: 'Hija' },
          { name: 'Mateo', role: 'Hijo' }
        ]
      },
      group: [
        { name: '', role: 'Integrante' },
        { name: '', role: 'Integrante' },
        { name: '', role: 'Integrante' },
        { name: '', role: 'Integrante' }
      ],
      budgetLimit: 1800,
      pantry: pantry,
      shopping: shopping,
      purchases: purchases,
      waste: [
        {
          id: 'w-tortilla',
          date: day(1),
          recipeId: 'tortilla',
          title: 'Tortilla de verduras',
          bs: 6.8,
          kg: 0.38
        }
      ],
      messages: [
        {
          id: 'm-hola',
          role: 'bot',
          at: today,
          text: '¡Hola, Carla! Soy Lupe. Hoy miré la despensa de la familia Rojas, en Santa Cruz de la Sierra: hay cosas por vencer y otras que ya están cortas. Pregúntame o toca una sugerencia. Tus datos se quedan en este celular.',
          actions: [
            { label: 'Qué vence pronto', send: '¿Qué está por vencer?' },
            { label: 'Cómo va el presupuesto', send: '¿Cómo va el presupuesto?' }
          ]
        }
      ]
    };
  }

  return {
    CATEGORIES: CATEGORIES,
    STORES: STORES,
    UNITS: UNITS,
    CATALOG: CATALOG,
    RECIPES: RECIPES,
    buildSeed: buildSeed
  };
});
