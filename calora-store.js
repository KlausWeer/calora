/* Calora — shared catalogue store (browser-persistent).
   Exposes window.CaloraStore for the Admin dashboard and the Shop page.
   Data lives in localStorage so it survives reloads on the same browser.
   Use the Admin "Export" button to back up / migrate the catalogue. */
(function () {
  var CATEGORIES = ['Rings', 'Earrings', 'Necklaces', 'Bracelets', 'Pendants'];
  var MATERIALS  = ['925 Silver', 'Vermeil', 'Stone-set', 'Moissanite'];
  var KEY = 'calora.catalogue.v1';

  var SEED = [
    { id:'p01', name:'Aria Band',      category:'Rings',     price:58,  material:'925 Silver', featured:true,  status:'active', image:'', description:'A clean band that disappears into everyday wear.' },
    { id:'p02', name:'Onyx Signet',    category:'Rings',     price:112, material:'Stone-set',  featured:true,  status:'active', image:'', description:'Flat black onyx set in a weighted signet.' },
    { id:'p03', name:'Lune Solitaire', category:'Rings',     price:138, material:'Moissanite', featured:false, status:'active', image:'', description:'A single moissanite, held low and quiet.' },
    { id:'p04', name:'Twist Stack',    category:'Rings',     price:46,  material:'925 Silver', featured:false, status:'active', image:'', description:'A thin rope twist made to layer.' },
    { id:'p05', name:'Selva Hoops',    category:'Earrings',  price:74,  material:'925 Silver', featured:true,  status:'active', image:'', description:'Lightly textured hoops, hammered by hand.' },
    { id:'p06', name:'Drop Studs',     category:'Earrings',  price:52,  material:'925 Silver', featured:false, status:'active', image:'', description:'Small hammered studs that catch the light.' },
    { id:'p07', name:'Thread Line',    category:'Earrings',  price:64,  material:'Vermeil',    featured:false, status:'active', image:'', description:'A fine threader that traces the ear.' },
    { id:'p08', name:'Pearl Huggie',   category:'Earrings',  price:68,  material:'Stone-set',  featured:false, status:'active', image:'', description:'A snug huggie with a single freshwater pearl.' },
    { id:'p09', name:'Cove Chain',     category:'Necklaces', price:88,  material:'925 Silver', featured:false, status:'active', image:'', description:'An everyday chain with a soft drape.' },
    { id:'p10', name:'Rope Collar',    category:'Necklaces', price:124, material:'Vermeil',    featured:false, status:'active', image:'', description:'A heavier rope that sits at the collarbone.' },
    { id:'p11', name:'Tide Lariat',    category:'Necklaces', price:96,  material:'925 Silver', featured:false, status:'active', image:'', description:'An open lariat that moves as you do.' },
    { id:'p12', name:'Station Chain',  category:'Necklaces', price:102, material:'Stone-set',  featured:false, status:'active', image:'', description:'Tiny set stones spaced along a fine chain.' },
    { id:'p13', name:'Bay Bangle',     category:'Bracelets', price:84,  material:'925 Silver', featured:false, status:'active', image:'', description:'A smooth solid bangle, kept simple.' },
    { id:'p14', name:'Link Chain',     category:'Bracelets', price:92,  material:'Vermeil',    featured:false, status:'active', image:'', description:'A flat link bracelet with a warm gold tone.' },
    { id:'p15', name:'Cuff No.3',      category:'Bracelets', price:118, material:'925 Silver', featured:false, status:'active', image:'', description:'An open cuff, hand-formed and weighty.' },
    { id:'p16', name:'Charm Chain',    category:'Bracelets', price:78,  material:'Stone-set',  featured:false, status:'active', image:'', description:'A delicate chain ready for a single charm.' },
    { id:'p17', name:'Janet Pendant',  category:'Pendants',  price:96,  material:'Vermeil',    featured:true,  status:'active', image:'', description:'A small engraved disc on a fine chain.' },
    { id:'p18', name:'Locket Oval',    category:'Pendants',  price:108, material:'925 Silver', featured:false, status:'active', image:'', description:'A plain oval locket, made to be opened.' },
    { id:'p19', name:'Gem Drop',       category:'Pendants',  price:132, material:'Stone-set',  featured:false, status:'active', image:'', description:'A single stone suspended on a thread chain.' },
    { id:'p20', name:'Initial Disc',   category:'Pendants',  price:72,  material:'Vermeil',    featured:false, status:'active', image:'', description:'A round tag, ready for your initial.' }
  ];

  function clone(list) { return list.map(function (x) { return Object.assign({}, x); }); }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return clone(SEED);
  }

  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { console.warn('Calora store: save failed', e); return false; }
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    return clone(SEED);
  }

  function uid() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function seed() { return clone(SEED); }

  /* localStorage edits made via the in-page Admin (this browser only). */
  function loadLocal() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function hasLocal() { return loadLocal() !== null; }

  /* The catalogue published for everyone via Decap CMS (committed to the repo
     at data/products.json, then served by Netlify). */
  function loadPublished() {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    return fetch('data/products.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return null;
        if (Array.isArray(d.products)) return d.products;
        if (Array.isArray(d)) return d;
        return null;
      })
      .catch(function () { return null; });
  }

  /* Storefront source of truth, in order of precedence:
     1) local edits on this browser (in-page Admin)  → instant preview
     2) the Decap-published data/products.json        → live for everyone
     3) the built-in sample catalogue                 → first-run fallback   */
  function resolveCatalogue() {
    var local = loadLocal();
    if (local) return Promise.resolve(local);
    return loadPublished().then(function (pub) { return pub || seed(); });
  }

  window.CaloraStore = {
    CATEGORIES: CATEGORIES,
    MATERIALS: MATERIALS,
    SEED: SEED,
    load: load,
    save: save,
    reset: reset,
    uid: uid,
    seed: seed,
    loadLocal: loadLocal,
    hasLocal: hasLocal,
    loadPublished: loadPublished,
    resolveCatalogue: resolveCatalogue,
    KEY: KEY
  };
})();
