'use strict';
const get = id => document.getElementById(id);
const field = get('field'), ctx = field.getContext('2d');
const art = 'assets/game/village/';
const models = ['general','tint','pyae','guard'];
const sprites = new Map();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const techniques = { Fists:'Twin Palm', Sword:'Crescent Cut', Spear:'Driving Thrust' };
const fmt = n => n.toLocaleString('en-US');
let battle, selected, inspected, mode, busy, cursor, keyboard = false;
let visual = null;
for (const model of models) {
  for (const suffix of ['', '-hit']) {
    const key = model + suffix, img = new Image();
    img.onload = () => { if (battle) paint(); };
    img.src = art + key + '.webp';
    sprites.set(key, img);
  }
}
function project(x, y) { return { x: 200 + 52*x + 18*y, y: 391 - 9.7*x + 25.4*y }; }
function tilePath(x,y) {
  const corners = [[x-.5,y-.5],[x+.5,y-.5],[x+.5,y+.5],[x-.5,y+.5]];
  const path = new Path2D();
  corners.forEach(([a,b],i) => { const p=project(a,b); if(i) path.lineTo(p.x,p.y); else path.moveTo(p.x,p.y); });
  path.closePath(); return path;
}
function ring(p, rx, ry, stroke, fill, width = 2) {
  ctx.beginPath(); ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=width; ctx.strokeStyle=stroke; ctx.stroke();
}
function actorPosition(u) {
  if (visual?.kind === 'move' && visual.unit === u) {
    const {points, t} = visual, travel = Math.min(t * (points.length-1), points.length-1);
    const i=Math.min(Math.floor(travel),points.length-2), f=travel-i;
    const a=points[i], b=points[i+1], p=project(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);
    p.y-=Math.sin(Math.PI*f)*4;
    return p;
  }
  return project(u.x,u.y);
}
function pose(u) {
  const p=actorPosition(u);
  let hit=false;
  if (visual?.kind === 'strike') {
    const {attacker,target,t}=visual, a=project(attacker.x,attacker.y), b=project(target.x,target.y);
    const dx=b.x-a.x, dy=b.y-a.y;
    if (attacker===u) {
      // Wind up, extend the weapon, then settle back onto the actor's tile.
      let thrust = Math.sin(Math.PI * Math.max(0,Math.min(1,(t-.14)/.68)));
      if (u.weapon==='Fists') thrust *= .82 + .18*Math.cos(4*Math.PI*t);
      const advance = u.weapon==='Spear' ? .39 : .65;
      p.x+=dx*advance*thrust; p.y+=dy*advance*thrust-5*thrust;
      hit=t>.22 && t<.79;
    }
    if (target===u && t>.46) {
      const recoil=Math.sin(Math.PI*(t-.46)/.54);
      p.x+=Math.sign(dx || 1)*10*recoil; p.y-=4*recoil;
    }
  }
  return {p,hit};
}
function drawUnit(u) {
  const {p,hit}=pose(u), active=selected===u && !u.enemy;
  const color=u.enemy?'#ee7666':active?'#a5f4ff':'#8ed7ef';
  ring(p,19,6,color,'#22130f70',active?3:1.5);
  const img=sprites.get(u.model+(hit?'-hit':''));
  const h=(u.model === 'general' ? 66 : 64) * (hit ? 0.91 : 1);
  if (img.complete && img.naturalWidth) {
    const w=h*img.naturalWidth/img.naturalHeight;
    ctx.save(); ctx.translate(p.x,p.y); ctx.scale(u.facing,1);
    ctx.drawImage(img,-w/2,-h+2,w,h); ctx.restore();
  } else { ctx.fillStyle=color; ctx.fillRect(p.x-6,p.y-25,12,23); }
  const barWidth=30;
  ctx.fillStyle='#211812cf'; ctx.fillRect(p.x-barWidth/2-1,p.y+9,barWidth+2,4);
  ctx.fillStyle=u.enemy?'#f27864':'#79c6a0'; ctx.fillRect(p.x-barWidth/2,p.y+10,barWidth*u.hp/u.maxHp,2);
  if (active && !busy) {
    ctx.beginPath(); ctx.moveTo(p.x-5,p.y-h-8); ctx.lineTo(p.x+5,p.y-h-8); ctx.lineTo(p.x,p.y-h-2);
    ctx.closePath(); ctx.fillStyle='#fff1ac'; ctx.fill();
  }
}
function impact() {
  if (visual?.kind!=='strike') return;
  const { t,attacker,target,damage,skill }=visual;
  const p=project(target.x,target.y), sign=attacker.facing;
  const f=(t-.39)/.5;
  if (f<0 || f>1) return;
  ctx.save(); ctx.translate(p.x,p.y-38); ctx.scale(sign,1);
  ctx.globalAlpha=Math.sin(Math.PI*f);
  ctx.strokeStyle=skill?'#ffe5a1':'#fff5d0'; ctx.lineWidth=3.5; ctx.shadowColor='#fee3a0'; ctx.shadowBlur=7;
  if(attacker.weapon==='Sword') {
    ctx.beginPath();ctx.moveTo(-33,-31);ctx.quadraticCurveTo(18,-18,22,28);ctx.quadraticCurveTo(4,5,-33,-31);ctx.fillStyle='#fff0c8a0';ctx.fill();ctx.stroke();
  } else if(attacker.weapon==='Spear') {
    for(let i=0;i<3;i++) { ctx.beginPath();ctx.moveTo(-55,-3+i*4);ctx.lineTo(17-i*9,-9+i*3);ctx.stroke(); }
  } else {
    for(let i=0;i<2;i++) ring({x:i*13-8,y:4-i*10},4+f*12,4+f*10,'#fff4bb','#ffe2a033',2.5);
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha=Math.min(1,2*(1-f)); ctx.font='bold 24px Georgia';ctx.textAlign='center';ctx.lineWidth=4;
  ctx.strokeStyle='#45251b';ctx.fillStyle='#fff1bd';const label='−'+fmt(damage);
  ctx.strokeText(label,p.x,p.y-67-f*24);ctx.fillText(label,p.x,p.y-67-f*24);ctx.restore();
}
function paint() {
  ctx.clearRect(0,0,field.width,field.height);
  const canChoose=!busy && !battle.result && battle.phase==='family' && standing(selected);
  const routes=canChoose && mode==='move' && !selected.moved ? battle.routes(selected) : new Map();
  const targets=canChoose && (mode==='attack'||mode==='skill') ? battle.targets(selected) : [];
  for(let y=0;y<villageHeight;y++) for(let x=0;x<villageWidth;x++) {
    const u=battle.at(x,y), tile=tilePath(x,y), gate=isGate(x,y);
    let fill='#251a150a', edge='#ffe1a344', width=1;
    if(gate) {fill='#e8b13e65';edge='#ffeaad';width=2;}
    else if(u?.enemy) {fill='#b22d286e';edge='#dc655c';}
    else if(routes.has(squareKey(x,y))) {fill='#2580a96b';edge='#8bcbe8';width=1.6;}
    if(targets.includes(u)) {fill='#d750348f';edge='#ffe59c';width=3;}
    if(!busy && x===selected.x&&y===selected.y && standing(selected)) {edge='#d6fcff';width=3;}
    ctx.fillStyle=fill;ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.fill(tile);ctx.stroke(tile);
    if(gate) {const p=project(x,y);ctx.textAlign='center';ctx.fillStyle='#fff0b1';ctx.font='bold 23px Georgia';ctx.fillText('✦',p.x,p.y+6);}
    if(keyboard && cursor.x===x && cursor.y===y) {ctx.strokeStyle='white';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.stroke(tile);ctx.setLineDash([]);}
  }
  const visible=battle.units.filter(u=>standing(u) || (visual?.kind==='move' && visual.unit===u));
  visible.sort((a,b)=>actorPosition(a).y-actorPosition(b).y).forEach(drawUnit);
  impact();
}
function showStatus(text) { get('message').textContent=text; }
function display() {
  const u=inspected;
  get('portrait').src=art+u.model+'.webp'; get('rank').textContent=u.rank+' · Lv. '+u.level;
  get('unitName').textContent=u.name; get('weapon').textContent=u.weapon;
  for(const [id,value,max] of [['hp',u.hp,u.maxHp],['mp',u.mp,u.maxMp]]) {
    get(id).max=max;get(id).value=value;get(id+'Value').textContent=fmt(value)+' / '+fmt(max);
  }
  get('strength').textContent=fmt(u.str);get('defense').textContent=fmt(u.def);
  get('phase').textContent='Turn '+battle.turn+' · '+(battle.phase==='guards'?'Royal guards':'Family');
  get('progress').textContent=battle.family.filter(a=>a.escaped).length+'/3 escaped · '+battle.guards.filter(a=>a.hp<=0).length+'/6 guards defeated';
  const locked=busy || !!battle.result || battle.phase!=='family' || !standing(selected);
  for(const button of document.querySelectorAll('[data-command]')) {
    const cmd=button.dataset.command;
    button.disabled=locked || (cmd==='move' ? selected.moved : (cmd==='wait' ? selected.acted && selected.moved : selected.acted)) ||
      (cmd==='herb' && (!battle.herbs || selected.hp===selected.maxHp)) || (cmd==='skill' && selected.mp<skillCost(selected));
    button.setAttribute('aria-pressed',String(mode===cmd));
    if(cmd==='herb') button.textContent='Herb ×'+battle.herbs;
    if(cmd==='skill') button.title=techniques[selected.weapon]+' · '+skillCost(selected)+' MP';
  }
  get('endTurn').disabled=busy || Boolean(battle.result) || battle.phase !== 'family';
  for(const btn of get('roster').children) {
    const a=battle.units.find(t=>t.id===btn.dataset.unit);
    btn.disabled=!standing(a)||busy||!!battle.result;
    btn.classList.toggle('spent',a.moved&&a.acted);
    btn.setAttribute('aria-pressed',String(a===inspected));
    btn.title=a.name+' · '+a.rank+' Lv. '+a.level+' · '+a.hp+' HP';
  }
  const result=battle.result;
  get('outcome').hidden=!result;
  if(result) {
    get('resultTitle').textContent=result==='lost'?'Mission failed':'Mission complete';
    get('resultBody').textContent={escaped:'All three made it through the village gate.','defeated-guards':'All six royal guards have been defeated. The road is open.',lost:'No family member remains on the field to complete the escape.'}[result];
  }
  paint();
}
function selectHero(u) {
  if(busy || !standing(u) || battle.result) return;
  inspected=u;
  if(!u.enemy) {
    selected=u; mode=u.moved?'attack':'move'; cursor={x:u.x,y:u.y};
    showStatus(u.name+' · '+(mode==='move'?'Choose a blue tile to move.':'Choose a highlighted enemy to attack.'));
  } else showStatus(u.name+' · '+u.rank+' Lv. '+u.level+' · '+u.weapon+' · '+fmt(u.hp)+' HP.');
  display();
}
function setMode(cmd) {
  if(busy || battle.result || !standing(selected)) return;
  inspected=selected;
  if(cmd==='wait') {
    selected.moved=selected.acted=true;showStatus(selected.name+' waits. Choose another relative or end the turn.');
  } else if(cmd==='herb') {
    const healed=battle.heal(selected);showStatus(selected.name+' recovered '+fmt(healed)+' HP.');
  } else {
    mode=cmd;
    const action=cmd==='skill'?techniques[selected.weapon]+' · '+skillCost(selected)+' MP':cmd==='attack'?selected.weapon:'';
    showStatus(cmd==='move'?'Choose a blue tile. Gold tiles mark the escape gate.':action+' · '+(battle.targets(selected).length?'Choose a highlighted guard.':'Move closer to a guard.'));
  }
  display();
}
function tween(effect, duration, session) {
  if(reduced.matches) return Promise.resolve();
  return new Promise(resolve=>{
    const start=performance.now();
    function frame(time) {
      if(battle!==session) {resolve();return;}
      effect.t=Math.max(0, Math.min(1, (time - start) / duration));visual=effect;paint();
      if(effect.t<1 && !reduced.matches) requestAnimationFrame(frame);
      else {visual=null;resolve();}
    }
    requestAnimationFrame(frame);
  });
}
async function walk(u,x,y,session) {
  const movement=battle.move(u,x,y);
  if(!movement) return false;
  const points=[movement.from,...movement.path];
  await tween({kind:'move',unit:u,points},Math.min(650,points.length*125),session);
  return true;
}
async function hit(u,target,skill,session) {
  const amount=villageDamage(u,target,skill);
  if(u.x!==target.x) u.facing=Math.sign(target.x-u.x);
  else u.facing=target.y>u.y?1:-1;
  await tween({kind:'strike',attacker:u,target,damage:amount,skill},u.enemy?470:650,session);
  if(session!==battle) return;
  const damage=battle.strike(u,target,skill);
  if(damage===null) return;
  showStatus(u.name+' · '+(skill?techniques[u.weapon]:u.weapon)+' · '+fmt(damage)+' damage to '+target.name+(target.hp?' (remaining HP '+fmt(target.hp)+').':' · defeated.'));
}
async function activate(x,y,unit=battle.at(x,y)) {
  if(busy || battle.result || battle.phase!=='family') return;
  if(unit && (!unit.enemy || (mode!=='attack' && mode!=='skill'))) {selectHero(unit);return;}
  if(!standing(selected)) return;
  const session=battle;
  if(unit?.enemy) {
    const skill=mode==='skill';
    if(selected.acted || (skill && selected.mp<skillCost(selected)) || !inReach(selected,unit)) {
      inspected=unit;showStatus(unit.name+' · Out of reach or action unavailable.');display();return;
    }
    busy=true;inspected=selected;display();await hit(selected,unit,skill,session);
  } else if(mode==='move' && !selected.moved && battle.routes(selected).get(squareKey(x,y))?.length) {
    busy=true;display();await walk(selected,x,y,session);
    if(session!==battle) return;
    showStatus(selected.name+(selected.escaped?' reached the village gate.':' moved. Choose an action or another relative.'));
    if(selected.escaped) selected=battle.family.find(standing) || selected;
    inspected=selected;mode=selected.moved?'attack':'move';
  } else {showStatus(mode==='move'?'Choose an unoccupied blue tile within three steps.':'Choose a guard highlighted in gold.');return;}
  if(session===battle){busy=false;display();}
}
async function endTurn() {
  if(busy || !battle.startGuards()) return;
  const session=battle;busy=true;showStatus('The royal guards advance.');display();
  for(const guard of battle.guards.filter(standing)) {
    if(battle!==session || battle.result) break;
    const dest=battle.guardDestination(guard);
    if(dest) await walk(guard,dest.x,dest.y,session);
    if(battle!==session) return;
    const target=battle.targets(guard).sort((a,b)=>distance(guard,a)-distance(guard,b)||a.hp-b.hp)[0];
    if(target) await hit(guard,target,false,session);
    if(battle!==session) return;
    display();
  }
  if(session!==battle) return;
  battle.nextRound();busy=false;
  selected=battle.family.find(standing)||selected;inspected=selected;mode='move';
  if(!battle.result) showStatus('Turn '+battle.turn+' · Choose a relative, then move or attack.');
  display();
}
function start() {
  battle=new VillageBattle();busy=false;visual=null;selected=battle.family[0];inspected=selected;
  cursor={x:selected.x,y:selected.y};mode='move';keyboard=false;
  const roster=get('roster');roster.replaceChildren();
  for(const unit of battle.units) {
    const b=document.createElement('button');b.type='button';b.dataset.unit=unit.id;b.setAttribute('aria-label',unit.name);
    if(unit.enemy) b.className='enemy';
    const img=document.createElement('img');img.src=art+unit.model+'.webp';img.alt='';b.append(img);
    b.onclick=()=>activate(unit.x,unit.y,unit);roster.append(b);
  }
  showStatus('Three guards ahead. Three behind. Get everyone to the gold gate or defeat all six.');
  display();
}
function pick(event) {
  const r=field.getBoundingClientRect(),x=(event.clientX-r.left)*1200/r.width,y=(event.clientY-r.top)*675/r.height;
  const bodies=battle.units.filter(standing).sort((a,b)=>project(b.x,b.y).y-project(a.x,a.y).y);
  const u=bodies.find(u=>{const p=project(u.x,u.y);return Math.abs(p.x-x)<18 && y<p.y+4 && y>p.y-56;});
  if(u) return {x:u.x,y:u.y,unit:u};
  for(let ty=0;ty<villageHeight;ty++) for(let tx=0;tx<villageWidth;tx++) if(ctx.isPointInPath(tilePath(tx,ty),x,y)) return {x:tx,y:ty};
}
field.addEventListener('click',e=>{keyboard=false;const p=pick(e);if(p) activate(p.x,p.y,p.unit);});
field.addEventListener('pointermove',e=>{
  if(busy) return; const p=pick(e), u=p && battle.at(p.x,p.y);
  field.title=u?u.name+' · Lv. '+u.level+(u.enemy && inReach(selected,u)?' · '+fmt(villageDamage(selected,u,mode==='skill'))+' forecast damage':''):'';
});
field.addEventListener('keydown',e=>{
  const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(dir){e.preventDefault();keyboard=true;cursor.x=Math.min(villageWidth-1,Math.max(0,cursor.x+dir[0]));cursor.y=Math.min(villageHeight-1,Math.max(0,cursor.y+dir[1]));paint();}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(cursor.x,cursor.y);}
});
document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>setMode(b.dataset.command));
get('guide').onclick=()=>get('brief').showModal();get('closeGuide').onclick=()=>get('brief').close();
get('endTurn').onclick=endTurn;get('restart').onclick=start;get('replay').onclick=start;
start();
