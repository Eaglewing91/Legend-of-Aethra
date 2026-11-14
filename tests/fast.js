window.LOGS = [];
AE.say = function (t, o) { window.LOGS.push((o && o.name ? o.name + ': ' : '') + t); return Promise.resolve(o && o.choices ? (window.pickChoice || 0) : undefined); };
AE.notice = function (t) { window.LOGS.push('[' + t + ']'); return Promise.resolve(); };
AE.cs.narrate = function (L) { window.LOGS.push('~ ' + L.join(' / ')); return Promise.resolve(); };
AE.cs.title = function (t, s) { window.LOGS.push('# ' + t + ' ' + (s || '')); return Promise.resolve(); };
const sb = AE.startBattle;
AE.startBattle = function (form, o) { window.LOGS.push('BATTLE ' + form.enemies.join(',')); if (window.realBattles) return sb(form, o); return Promise.resolve('win'); };
'fast'
AE.chase = function () { window.LOGS.push('CHASE'); return Promise.resolve('win'); };
