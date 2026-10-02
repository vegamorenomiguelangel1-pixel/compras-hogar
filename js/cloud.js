var SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';

var firebaseConfig = {
  apiKey: 'AIzaSyAydaiKVHdcdBVnBtprK__7CuwBgSklL5A',
  authDomain: 'yapa-compras.firebaseapp.com',
  projectId: 'yapa-compras',
  storageBucket: 'yapa-compras.firebasestorage.app',
  messagingSenderId: '789046527472',
  appId: '1:789046527472:web:6c76e077f581b8bc630935',
  measurementId: 'G-9GFKDF1CJT'
};

function emit(name) {
  try { window.dispatchEvent(new Event(name)); } catch (err) { /* el arranque igual sigue */ }
}

function start() {
  return Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-auth.js'),
    import(SDK + 'firebase-firestore.js')
  ]).then(function (mods) {
    var appMod = mods[0];
    var authMod = mods[1];
    var fs = mods[2];
    var app = appMod.initializeApp(firebaseConfig);
    var auth = authMod.getAuth(app);
    var db;
    try {
      db = fs.initializeFirestore(app, {
        localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
      });
    } catch (err) {
      db = fs.getFirestore(app);
    }

    var status = 'syncing';
    var hooks = [];
    var unsub = null;

    function notify() {
      hooks.forEach(function (fn) {
        try { fn(status); } catch (err) { /* un indicador no debe frenar la sync */ }
      });
    }

    function setStatus(next) {
      if (status === next) return;
      status = next;
      notify();
    }

    function refreshStatus(meta) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) setStatus('offline');
      else if (meta && meta.hasPendingWrites) setStatus('syncing');
      else setStatus('synced');
    }

    window.addEventListener('online', function () { refreshStatus(null); });
    window.addEventListener('offline', function () { setStatus('offline'); });

    var ready = new Promise(function (resolve, reject) {
      var stop = authMod.onAuthStateChanged(auth, function (user) {
        if (!user) return;
        stop();
        refreshStatus(null);
        resolve(user);
      }, reject);
      authMod.signInAnonymously(auth).catch(reject);
    });

    function refFor(code) {
      return fs.doc(db, 'familias', code);
    }

    var api = {
      available: true,
      ready: function () { return ready; },
      status: function () { return status; },
      onStatus: function (fn) { hooks.push(fn); },
      load: function (code) {
        return ready.then(function () { return fs.getDoc(refFor(code)); }).then(function (snap) {
          return snap.exists() ? snap.data() : null;
        });
      },
      claim: function (code, build) {
        var ref = refFor(code);
        return ready.then(function () {
          return fs.runTransaction(db, function (tx) {
            return tx.get(ref).then(function (snap) {
              var current = snap.exists() ? snap.data() : null;
              var next = build(current);
              if (next === false || !next) return next;
              tx.set(ref, next);
              return next;
            });
          });
        });
      },
      save: function (code, data) {
        return ready.then(function () { return fs.setDoc(refFor(code), data); }).then(function () {
          refreshStatus(null);
        });
      },
      watch: function (code, onData) {
        if (unsub) unsub();
        unsub = fs.onSnapshot(refFor(code), { includeMetadataChanges: true }, function (snap) {
          refreshStatus(snap.metadata);
          if (snap.exists()) onData(snap.data());
        }, function () { setStatus('offline'); });
      },
      unwatch: function () {
        if (unsub) unsub();
        unsub = null;
      }
    };

    window.YapaCloud = api;
    emit('yapa-cloud-ready');
  }).catch(function () {
    window.YapaCloud = { available: false, status: function () { return 'offline'; } };
    emit('yapa-cloud-failed');
  });
}

start();
