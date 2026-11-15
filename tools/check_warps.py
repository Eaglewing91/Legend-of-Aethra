"""Every door and stairs can be walked onto from where you arrive (not counting arriving through it): python3 tools/check_warps.py [build/maps.json]"""
import json,sys
from collections import deque
M=json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'build/maps.json')); WALK=(0,6,8)
for k,m in M.items():
    W,H=m['w'],m['h']; col=m['col'][:]
    for v in m.get('variants',[]):
        for i,c in v.get('col',[]): col[i]=c
    for w in m['warps']:
        others=[(ww['tx'],ww['ty']) for mk,mm in M.items() if mk!=w['to'] for ww in mm['warps'] if ww['to']==k]
        arr=[tuple(m['entry'])]+others
        seen=set(); q=deque()
        for a in arr:
            if 0<=a[0]<W and 0<=a[1]<H and col[a[1]*W+a[0]] in WALK: seen.add(a); q.append(a)
        while q:
            x,y=q.popleft()
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                n=(x+dx,y+dy)
                if 0<=n[0]<W and 0<=n[1]<H and n not in seen and col[n[1]*W+n[0]] in WALK: seen.add(n); q.append(n)
        if (w['x'],w['y']) not in seen: print(k, (w['x'],w['y']), '->', w['to'])
print('checked warps')
