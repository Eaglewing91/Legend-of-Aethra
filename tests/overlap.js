// usage: node tests/overlap.js   Draws every menu screen (with long names and big numbers) and reports text that overlaps other text.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/build/dev.html'); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const res = await p.evaluate(() => {
    const G = AE.game; G.stop(); const S0 = AE.S_;
    let boxes = []; const t0 = AE.text;
    AE.text = function (ctx, s, x, y, col, o) {
      s = String(s); const w = AE.textWidth(s), al = o && o.align; let X = x; if (al === 'right') X -= w; else if (al === 'center') X -= Math.floor(w / 2);
      if (s.trim()) boxes.push({ s: s, x: Math.round(X), y: Math.round(y), w: w, h: 8 });
      return t0.apply(this, arguments);
    };
    const cv = document.createElement('canvas'); cv.width = AE.W; cv.height = AE.H; const ctx = cv.getContext('2d');
    const out = [];
    const check = function (name, scene, prep) {
      boxes = []; try { if (prep) prep(scene); scene.draw(ctx); } catch (e) { out.push(name + ': draw error ' + e.message); return; }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], c = boxes[j];
        const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
        if (ox > 1 && oy > 2 && !(a.s === c.s && a.x === c.x && a.y === c.y)) out.push(name + ': "' + a.s + '" @' + a.x + ',' + a.y + ' overlaps "' + c.s + '" @' + c.x + ',' + c.y);
      }
      boxes.forEach(function (a) { if (a.x < 0 || a.x + a.w > AE.W + 1) out.push(name + ': "' + a.s + '" runs off the screen (x ' + a.x + '..' + (a.x + a.w) + ')'); });
    };
    AE.newGame(); const S = AE.S_;
    const ids = Object.keys(AE.CHARS);
    for (const lvSet of [5, 99]) {
      S.m = {}; ids.forEach(id => AE.joinMember(id, lvSet)); S.party = ['kael', 'lyra', 'bram'];
      // longest names, so the widest text is tested
      ids.forEach(id => { const m = S.m[id], wt = (AE.WEAPONS[m.equip.weapon] || {}).type;
        const ws = Object.keys(AE.WEAPONS).filter(k => AE.WEAPONS[k].type === wt).sort((a, c) => AE.WEAPONS[c].name.length - AE.WEAPONS[a].name.length); if (ws[0]) m.equip.weapon = ws[0];
        const as = Object.keys(AE.ARMORS).sort((a, c) => AE.ARMORS[c].name.length - AE.ARMORS[a].name.length); m.equip.armor = as[0];
        m.hp = m.st ? 0 : 0; });
      AE.calcAll(); ids.forEach(id => { S.m[id].hp = S.m[id].maxhp; S.m[id].mp = S.m[id].maxmp; });
      S.gil = 9999999; Object.keys(AE.ITEMS).forEach(k => S.inv[k] = 99);
      Object.keys(AE.PRISMS).forEach(k => AE.addPrism(k));
      const tag = ' (Lv ' + lvSet + ')';
      check('Main menu' + tag, new AE.MainMenu());
      check('Items' + tag, new AE.ItemScreen());
      ids.forEach(id => {
        check('Magic ' + id + tag, new AE.MagicScreen(id));
        check('Status ' + id + tag, new AE.StatusScreen(id));
        check('Equip ' + id + tag, new AE.EquipScreen(id));
        const ps = new AE.PrismScreen(id); check('Prisms ' + id + tag, ps);
        check('Prisms ' + id + ' armour row' + tag, ps, s => { s.row = 1; });
      });
      check('Order' + tag, new AE.OrderScreen());
      check('Config' + tag, new AE.ConfigScreen());
      try { check('Save' + tag, new AE.FileScreen('save')); check('Load' + tag, new AE.FileScreen('load')); } catch (e) {}
      try { check('Cards' + tag, new AE.CardList()); } catch (e) {}
      Object.keys(AE.SHOPS || {}).slice(0, 200).forEach(k => { try { check('Shop ' + k + tag, new AE.Shop(k)); } catch (e) {} });
    }
    try { check('Title', new AE.Title()); } catch (e) {}
    // battles: the longest enemy names, with the command window, spell list and item list open
    const longest = Object.keys(AE.ENEMIES).sort((a, c) => AE.ENEMIES[c].name.length - AE.ENEMIES[a].name.length);
    [[longest[0], longest[1], longest[2]], [longest[3]], [longest[4], longest[5]]].forEach((foes, n) => {
      try {
        G.scenes = []; const B = new AE.Battle({ enemies: foes, bg: 'reactor' }, {}); G.push(B);
        for (let i = 0; i < 400 && !B.menu; i++) B.update(G);
        const M0 = B.menu; B.menu = null; check('Battle ' + n + ' ' + foes.join('+'), B); B.menu = M0;
        if (B.menu) {
          const M = B.menu, f = M.f;
          ['magic', 'item'].forEach(kind => { try { if (M.open) { M.open(kind); check('Battle ' + n + ' ' + kind + ' list', B); M.back && M.back(); } } catch (e) {} });
        }
      } catch (e) { out.push('battle ' + n + ': ' + e.message); }
    });
    // dedupe
    return out.filter((v, i, a) => a.indexOf(v) === i);
  });
  console.log(res.length + ' problems'); res.forEach(r => console.log('  ' + r));
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : 'no errors'); await b.close();
})();
