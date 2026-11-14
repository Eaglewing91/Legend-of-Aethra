/* test content */
AE.E('t_slime', 'Gel', 2, 40, 12, 8, 6, 6, 12, 14, 2, 10, { mon: 'Slime' }, { weak: ['fire'], drop: [['potion', 0.3]], steal: [['potion', 1]] });
AE.E('t_bat', 'Cave Bat', 3, 34, 14, 6, 6, 8, 22, 16, 2, 8, { mon: 'BlueBat' }, { weak: ['wind'], ai: [[3, 'attack'], [1, 'bite']] });
AE.K('bite', { name: 'Bite', kind: 'phys', power: 1.4, fx: 'bite' });
AE.E('t_boss', 'Cave Warden', 6, 600, 22, 14, 14, 12, 16, 200, 20, 300, { boss: 'GiantSlime', anim: 'Idle', fw: 62, fh: 52, k: 2 }, { boss: 1, weak: ['fire'], ai: [[3, 'attack'], [1, 'bite'], [1, 'fire']] });
AE.ENC.test_field = { bg: 'grass', sets: [{ enemies: ['t_slime', 't_slime'] }, { enemies: ['t_slime', 't_bat', 't_slime'], w: 1 }] };
AE.ENC.test_cave = { bg: 'cave', sets: [{ enemies: ['t_bat', 't_bat'] }, { enemies: ['t_slime', 't_bat', 't_bat', 't_slime'] }] };
AE.SHOPS.test_shop = { name: 'Trader', items: ['potion', 'antidote', 'phoenix_down', 'steel_saber', 'iron_bangle', 'prism:restore', 'prism:ice', 'prism:all'] };
AE.START = { map: 'test', x: 12, y: 12, inv: { potion: 3 } };
AE.EV.testboss = async function () { const r = await AE.startBattle({ enemies: ['t_boss'], bg: 'cave', boss: 1, noRun: 1 }); if (r === 'win') await AE.say('The warden falls!'); };
AE.EV.newgame = async function () { AE.joinMember('lyra', 1); AE.joinMember('bram', 1); AE.S_.party = ['kael', 'lyra', 'bram']; AE.addPrism('restore'); AE.addPrism('fire'); AE.addPrism('bolt'); await AE.say('Test start: party of three.'); };
