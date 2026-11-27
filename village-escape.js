'use strict';
const get = id => document.getElementById(id);
const field = get('field'), ctx = field.getContext('2d');
const art = 'assets/game/village/';
const models = ['general','tint','pyae','guard','commander'];
const portraitPath = unit => unit.model === 'commander' ? 'assets/portraits/royal-commander.webp' : art+unit.model+'.webp';
const sprites = new Map();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let statusFrame = 0;
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
for(const key of ['commander-backhand','general-kneel','tint-kneel','pyae-kneel','guard-kneel','commander-kneel','general-valor','general-hook-left','general-hook-right','commander-warCry']){
  const img=new Image();
  img.onload=()=>{if(battle) paint();};
  img.src=art+key+'.webp';
  sprites.set(key,img);
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
let gateScene = '';
let advanceDialogue;
function actorPosition(u) {
  if (gateScene==='defeat') {
    const center=project(8,4);
    if (!u.enemy) return {x:center.x+(battle.family.indexOf(u)-1)*53,y:center.y};
    const angle=battle.guards.indexOf(u)*Math.PI/3;
    return {x:center.x+139*Math.cos(angle),y:center.y+68*Math.sin(angle)};
  }
  if (gateScene && u.enemy) {
    const index=battle.guards.indexOf(u);
    return project(7+(index%3)*1.55,3+Math.floor(index/3)*2);
  }
  if (gateScene && battle.family.includes(u)) {
    const i=battle.family.indexOf(u);
    const t=visual?.kind==='gateRun'?visual.t:0;
    const travel=Math.max(0,Math.min(1,(t-i*.07)/.86));
    const p=project(14.8+i*.22+5*travel, .15+i*.55);
    p.y-=Math.abs(Math.sin(travel*18))*5;
    return p;
  }
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
  let hit=false, rotation=0;
  if (visual?.kind === 'strike') {
    const {attacker,target,t,skill}=visual, a=project(attacker.x,attacker.y), b=project(target.x,target.y);
    const dx=b.x-a.x, dy=b.y-a.y;
    if (attacker===u && visual.hookHand) {
      const load = Math.sin(Math.PI*Math.min(1,t/.35));
      const swing = Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.25)/.64)));
      const side = visual.hookHand==='left' ? -1 : 1;
      p.x += dx*(.61*swing-.09*load);
      p.y += dy*(.61*swing-.09*load)+3*load+side*3*swing;
      rotation = -.08*load+.12*swing;
      hit = t>.32 && t<.82;
    } else if (attacker===u && skill && u.weapon==='Spear') {
      const beat=visual.hitIndex, master=u.id==='pyae';
      const reach=master?[.31,.42,.72][beat]:.29;
      const lift=master?[-6,4,-2][beat]:0;
      const angle=master?[-.16,.13,-.04][beat]:0;
      const extend=Math.sin(Math.PI*t);
      p.x+=dx*reach*extend;
      p.y+=(dy*reach+lift)*extend;
      rotation=angle*extend;
      hit=t>.18 && t<.82;
    } else if (attacker===u) {
      // Wind up, extend the weapon, then settle back onto the actor's tile.
      let thrust = Math.sin(Math.PI * Math.max(0,Math.min(1,(t-.14)/.68)));
      if (u.weapon==='Fists') thrust *= .82 + .18*Math.cos(4*Math.PI*t);
      if (skill && u.id==='tint') p.y -= 12*Math.sin(Math.PI*t);
      const advance = u.weapon==='Spear' ? .39 : .65;
      p.x+=dx*advance*thrust; p.y+=dy*advance*thrust-5*thrust;
      hit=t>.22 && t<.79;
    }
    if (target===u && t>.46) {
      const recoil=Math.sin(Math.PI*(t-.46)/.54);
      const finisher=skill && attacker.id==='pyae' && visual.hitIndex===2;
      p.x+=Math.sign(dx || 1)*(finisher?16:10)*recoil; p.y-=(finisher?7:4)*recoil;
    }
  }
  return {p,hit,rotation};
}
function drawUnit(u) {
  const {p,hit,rotation}=pose(u), active=selected===u && !u.enemy;
  const color=u===battle.commander?'#ffce69':u.enemy?'#ee7666':active?'#a5f4ff':'#8ed7ef';
  ring(p,19,6,color,'#22130f70',active?3:1.5);
  let img=sprites.get(u.model+(hit?'-hit':''));
  if(hit && u.model==='commander' && visual.skill && visual.hitIndex===1) img=sprites.get('commander-backhand');
  if (hit && visual.hookHand) {
    const hook = sprites.get('general-hook-'+visual.hookHand);
    if (hook.naturalWidth) img=hook;
  }
  const kneeling=gateScene==='defeat' ? !u.enemy : gateScene && u.enemy;
  if(kneeling) img=sprites.get(u.model+'-kneel');
  const commandPose=visual?.unit===u && (visual.kind==='valor' || visual.kind==='order');
  if(commandPose && visual.t>.12 && visual.t<.92){
    const alternate=sprites.get(visual.kind==='order'?'commander-warCry':u.model+'-'+visual.kind);
    if(alternate?.naturalWidth) img=alternate;
  }
  const h=(u.model === 'commander' ? 74 : u.model === 'general' ? 66 : 64) * (kneeling ? .75 : hit ? .91 : 1);
  if (img.complete && img.naturalWidth) {
    const w=h*img.naturalWidth/img.naturalHeight;
    ctx.save(); ctx.translate(p.x,p.y); ctx.scale(gateScene==='defeat' && u.enemy ? (p.x>project(8,4).x?-1:1) : kneeling?1:u.facing,1);
    if (rotation) ctx.rotate(rotation);
    if(commandPose){
      const t=visual.t, shout=Math.sin(Math.PI*t);
      if(visual.kind==='valor'){ctx.scale(1+.055*shout,1+.085*shout);}
      else {ctx.translate(3*shout,0);ctx.rotate(.045*shout);}
    }
    if(u.valor && !gateScene) {
      const phase=reduced.matches?0:performance.now()/520;
      const pulse=(1+Math.sin(phase))/2;
      ctx.save();
      ctx.translate(0,-h*.48);
      ctx.scale(Math.min(w*.6+8,46),h*.64);
      const halo=ctx.createRadialGradient(0,0,.12,0,0,1);
      halo.addColorStop(0,'rgba(255,240,170,.28)');
      halo.addColorStop(.65,'rgba(255,209,92,'+(.38+.2*pulse)+')');
      halo.addColorStop(1,'rgba(255,202,69,0)');
      ctx.fillStyle=halo;
      ctx.fillRect(-1,-1,2,2);
      ctx.restore();
      ctx.shadowColor='#ffe08c';
      ctx.shadowBlur=7+4*pulse;
    }
    ctx.drawImage(img,-w/2,-h+2,w,h); ctx.restore();
  } else { ctx.fillStyle=color; ctx.fillRect(p.x-6,p.y-25,12,23); }
  if(gateScene) return;
  drawStatus(u,p,h);
  const barWidth=30;
  let barHp=u.hp;
  if (visual?.kind==='strike' && visual.target===u) {
    barHp=Math.max(0,visual.hpBeforeHit-(visual.t>=.46?visual.damage:0));
  }
  ctx.fillStyle='#211812cf'; ctx.fillRect(p.x-barWidth/2-1,p.y+9,barWidth+2,4);
  ctx.fillStyle=u.enemy?'#f27864':'#79c6a0'; ctx.fillRect(p.x-barWidth/2,p.y+10,barWidth*barHp/u.maxHp,2);
  if (active && !busy) {
    ctx.beginPath(); ctx.moveTo(p.x-5,p.y-h-8); ctx.lineTo(p.x+5,p.y-h-8); ctx.lineTo(p.x,p.y-h-2);
    ctx.closePath(); ctx.fillStyle='#fff1ac'; ctx.fill();
  }
}
function impact() {
  if (visual?.kind!=='strike') return;
  const { t,attacker,target,damage,skill,critical,hitIndex }=visual;
  const p=project(target.x,target.y), sign=attacker.facing;
  const f=(t-.39)/.5;
  if (f<0 || f>1) return;
  ctx.save(); ctx.translate(p.x,p.y-38); ctx.scale(sign,1);
  ctx.globalAlpha=Math.sin(Math.PI*f);
  ctx.strokeStyle=skill?'#ffe5a1':'#fff5d0'; ctx.lineWidth=3.5; ctx.shadowColor='#fee3a0'; ctx.shadowBlur=7;
  if (skill && attacker.model==='commander') {
    ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle='#ffe596';
    const slash=(side,progress)=>{ctx.beginPath();ctx.moveTo(-25,-23*side);ctx.lineTo(-25+50*progress,(-23+46*progress)*side);ctx.stroke();};
    if(hitIndex===1) slash(1,1);
    slash(hitIndex===0?1:-1,Math.min(1,2*f));
  } else if (skill && attacker.id==='tint') {
    // A descending cleaver arc with a second bright edge on a critical hit.
    ctx.lineWidth=critical?9:6;ctx.strokeStyle=critical?'#fff5d1':'#ffbb55';
    ctx.beginPath();ctx.arc(-12,-38,42,-1.55,-1.55+2.95*f);ctx.stroke();
    if(critical){ctx.lineWidth=3;ctx.beginPath();ctx.arc(-12,-38,51,-1.55,-1.55+2.95*f);ctx.stroke();}
  } else if (skill && attacker.weapon==='Spear') {
    if (attacker.model==='guard') {
      ctx.strokeStyle='#ffc6a1';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(-32,-1);ctx.lineTo(7,-1);ctx.stroke();
    } else {
      const startY=[3,-5,0][hitIndex],endY=[-17,13,-2][hitIndex],finisher=hitIndex===2;
      const endX=finisher?24:12;
      ctx.strokeStyle=finisher?'#fff0aa':'#9cefff';ctx.lineWidth=finisher?6:4;
      ctx.beginPath();ctx.moveTo(finisher?-73:-43,startY);ctx.lineTo(endX,endY);ctx.stroke();
      if(finisher) {
        ctx.lineWidth=2;
        for(const offset of [-6,6]) {
          ctx.beginPath();ctx.moveTo(-55,offset);ctx.lineTo(8,endY+offset/2);ctx.stroke();
        }
        ring({x:endX,y:endY},4+f*20,4+f*11,'#fff1ac','#fff1ac22');
      }
    }
  } else if (visual.hookHand) {
    const side=visual.hookHand==='left'?-1:1;
    ctx.scale(1,side); ctx.lineCap='round'; ctx.lineWidth=4;
    ctx.strokeStyle='#ffda92';
    ctx.beginPath();ctx.ellipse(-13,-1,26,12,0,-2.65,-2.65+2.9*Math.min(1,f*2));ctx.stroke();
  } else if(attacker.weapon==='Sword') {
    ctx.beginPath();ctx.moveTo(-33,-31);ctx.quadraticCurveTo(18,-18,22,28);ctx.quadraticCurveTo(4,5,-33,-31);ctx.fillStyle='#fff0c8a0';ctx.fill();ctx.stroke();
  } else if(attacker.weapon==='Spear') {
    for(let i=0;i<3;i++) { ctx.beginPath();ctx.moveTo(-55,-3+i*4);ctx.lineTo(17-i*9,-9+i*3);ctx.stroke(); }
  } else {
    for(let i=0;i<2;i++) ring({x:i*13-8,y:4-i*10},4+f*12,4+f*10,'#fff4bb','#ffe2a033',2.5);
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha=Math.min(1,2*(1-f)); ctx.font='bold 24px Georgia';ctx.textAlign='center';ctx.lineWidth=4;
  ctx.strokeStyle='#45251b';ctx.fillStyle='#fff1bd';const label=(critical?'CRIT ':'')+'−'+fmt(damage);
  ctx.strokeText(label,p.x,p.y-67-f*24);ctx.fillText(label,p.x,p.y-67-f*24);ctx.restore();
}
function drawStatus(unit,p,height) {
  const time=reduced.matches ? 0 : performance.now()/450;
  ctx.save();
  if (unit.valor) {
    const pulse=(Math.sin(time)+1)/2;
    ring(p,22+pulse*2,7+pulse,'#ffe69b','#ffd25b38');
  }
  if (unit.model==='guard' && battle.ordersGiven) {
    ctx.strokeStyle='#ffb65a';ctx.lineWidth=2;
    for (let i=0;i<2;i++) {
      const y=p.y-height+12-i*5-2*Math.sin(time);
      ctx.beginPath();ctx.moveTo(p.x+12,y+3);ctx.lineTo(p.x+16,y);ctx.lineTo(p.x+20,y+3);ctx.stroke();
    }
  }
  if (unit.dazed) {
    ctx.fillStyle='#ffdf64';ctx.font='bold 14px Georgia';ctx.textAlign='center';
    for(let i=0;i<3;i++){
      const angle=time*1.8+i*Math.PI*2/3;
      ctx.fillText('✦',p.x+13*Math.cos(angle),p.y-height-4+4*Math.sin(angle));
    }
  }
  ctx.restore();
}
function scheduleStatusFrame() {
  if(statusFrame || reduced.matches || document.hidden || visual || battle.result) return;
  if(!battle.units.some(u=>standing(u) && (u.valor || u.dazed || (u.model==='guard' && battle.ordersGiven)))) return;
  statusFrame=requestAnimationFrame(()=>{statusFrame=0;paint();});
}
function supportAnimation() {
  if(!visual || !['order','valor','potion','herb','daze'].includes(visual.kind)) return;
  const {kind,unit,targets,t,amount}=visual;
  const origin=project(unit.x,unit.y);
  ctx.save();ctx.globalAlpha=Math.max(.1,Math.sin(Math.PI*t));
  if(kind==='order'){
    for(let i=0;i<3;i++){const f=(t+i/3)%1;ring(origin,20+f*110,8+f*43,'#ffc069','#e35a2420',3);}
  }
  for(const ally of targets){
    const p=project(ally.x,ally.y), y=p.y-28-t*19;
    if(kind==='valor'){
      ctx.strokeStyle='#8edfff';ctx.fillStyle='#3eaeee44';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(p.x-13,y-10);ctx.lineTo(p.x,y-15);ctx.lineTo(p.x+13,y-10);
      ctx.quadraticCurveTo(p.x+13,y+6,p.x,y+14);ctx.quadraticCurveTo(p.x-13,y+6,p.x-13,y-10);ctx.fill();ctx.stroke();
    } else if(kind==='order'){
      ctx.font='bold 15px Georgia';ctx.textAlign='center';ctx.fillStyle='#ffe3a0';ctx.fillText('Lv '+ally.level,p.x,y-12);
    } else if(kind==='daze'){
      ring({x:p.x,y:p.y-66},11+9*t,4+3*t,'#ffe077','#ffb70022',2);
    } else {
      ctx.textAlign='center';ctx.fillStyle=kind==='potion'?'#acffcf':'#cbef88';ctx.font='bold 18px Georgia';
      ctx.fillText('+'+amount,p.x,y-12);
      for(let i=0;i<3;i++){const x=p.x+(i-1)*14,dy=y+6+(i%2)*5;
        if(kind==='potion'){ctx.fillRect(x-4,dy-1,9,3);ctx.fillRect(x-1,dy-4,3,9);}
        else{ctx.beginPath();ctx.ellipse(x,dy,3,6,-.6,0,2*Math.PI);ctx.fill();}
      }
    }
  }
  ctx.restore();
}
document.addEventListener('visibilitychange',()=>{if(battle && !document.hidden) paint();});
reduced.addEventListener('change',()=>{if(battle) paint();});
// Put each technique over its caster. Impacts and status markers stay over the target.
function drawActionName() {
  if(!visual) return;
  const names={order:'Battle Frenzy',valor:'Valor',potion:'Potion',herb:'Herb',daze:'Dazed'};
  const strike=visual.kind==='strike';
  const name=visual.kind==='potion'?'Potion → '+visual.targets[0].name:visual.name || names[visual.kind];
  if(!name) return;
  const caster=strike ? visual.attacker : visual.unit;
  const p=pose(caster).p;
  const progress=visual.t;
  const tint=visual.critical?'#ffbe75':caster.enemy?'#ffdad0':'#fff0b8';
  ctx.save();
  ctx.font='bold 21px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
  const width=ctx.measureText(name).width+26;
  const x=Math.max(width/2+5,Math.min(field.width-width/2-5,p.x));
  const y=Math.max(18,p.y-(caster.model==='commander'?99:89));
  ctx.fillStyle='#201b22ed';ctx.strokeStyle=tint;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x-width/2,y);ctx.lineTo(x-width/2+7,y-13);
  ctx.lineTo(x+width/2-7,y-13);ctx.lineTo(x+width/2,y);ctx.lineTo(x+width/2-7,y+13);
  ctx.lineTo(x-width/2+7,y+13);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=tint;ctx.fillText(name,x,y+1);
  const shout=visual.kind==='valor'?'BATTLE!':visual.kind==='order'?'FIGHT!':'';
  if(shout && progress>.12){
    ctx.font='bold 23px Georgia';ctx.lineWidth=4;ctx.strokeStyle='#321b16';
    ctx.strokeText(shout,x,y-22);ctx.fillStyle='#fff1bb';ctx.fillText(shout,x,y-22);
  }
  ctx.restore();
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
  const visible=battle.units.filter(u=>gateScene ? u.enemy || gateScene==='family' || gateScene==='defeat' : standing(u) || (visual?.kind==='move' && visual.unit===u) || (visual?.kind==='strike' && visual.target===u));
  visible.sort((a,b)=>actorPosition(a).y-actorPosition(b).y).forEach(drawUnit);
  impact();
  supportAnimation();
  drawActionName();
  scheduleStatusFrame();
}
function showStatus(text) { get('message').textContent=text; }
function display() {
  const u=inspected;
  get('portrait').src=portraitPath(u); get('rank').textContent=u.rank+' · Lv. '+u.level;
  get('unitName').textContent=u.name;
  get('weapon').textContent=u.model==='guard' ? u.weapon+' · '+villageSkillName(u) : u.weapon;
  for(const [id,value,max] of [['hp',u.hp,u.maxHp],['mp',u.mp,u.maxMp]]) {
    get(id).max=max;get(id).value=value;get(id+'Value').textContent=fmt(value)+' / '+fmt(max);
  }
  get('strength').textContent=fmt(u.str);get('defense').textContent=fmt(u.def);
  const effects=[];
  if(u.valor) effects.push('Valor · +10% STR / DEF · '+(battle.valorReady-battle.turn)+' rounds left');
  if(u.dazed) effects.push('Dazed · skips next enemy phase');
  if(u.model==='guard' && battle.ordersGiven) effects.push('Battle Frenzy · +'+(u.level-soldierLevel)+' levels'+(u.level===battle.commander.level?' · capped':''));
  if(u===battle.commander) {
    const canBoost=battle.guards.some(ally=>ally.model==='guard' && standing(ally) && ally.level<u.level);
    effects.push('Potions ×'+battle.potions+' · Battle Frenzy '+(!canBoost?'no levels to grant':battle.turn>=battle.orderReady?'ready':'from turn '+battle.orderReady));
  }
  get('effects').textContent=effects.join(' · ');
  get('phase').textContent='Turn '+battle.turn+' · '+(battle.phase==='guards'?'Royal guards':'Family');
  get('progress').textContent=battle.family.filter(a=>a.escaped).length+'/3 escaped · '+battle.guards.filter(a=>a.hp<=0).length+'/6 enemies defeated';
  const locked=busy || !!battle.result || battle.phase!=='family' || !standing(selected);
  for(const button of document.querySelectorAll('[data-command]')) {
    const cmd=button.dataset.command;
    button.disabled=locked || (cmd==='move' ? selected.moved : (cmd==='wait' ? selected.acted && selected.moved : selected.acted)) ||
      (cmd==='herb' && (!battle.herbs || selected.hp===selected.maxHp)) || (cmd==='skill' && selected.mp<skillCost(selected));
    button.setAttribute('aria-pressed',String(mode===cmd));
    if(cmd==='herb') button.textContent='Herb ×'+battle.herbs;
    if(cmd==='skill') {
      button.textContent=villageSkillName(selected);
      const hook=selected.id==='general' ? (selected.nextHook==='left'?'Left hook':'Right hook')+' · ' : '';
      button.title=hook+villageSkillName(selected)+' · '+skillCost(selected)+' MP';
    }
    if(cmd==='valor') {
      button.hidden=selected.id!=='general';
      button.disabled=button.disabled || button.hidden || battle.turn<battle.valorReady;
      button.textContent=battle.turn<battle.valorReady?'Valor · T'+battle.valorReady:'Valor';
      button.title='Team STR and DEF +10% for five rounds. Uses one action.';
    }
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
  get('outcome').hidden=!result || busy;
  if(result) {
    get('resultTitle').textContent=result==='lost'?'GAME OVER!':'Mission complete';
    get('resultBody').textContent={escaped:'All three made it through the village entrance.','defeated-guards':'The commander and all five soldiers have been defeated. The road is open.',lost:'No family member remains on the field to complete the escape.'}[result];
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
async function setMode(cmd) {
  if(busy || battle.result || !standing(selected)) return;
  inspected=selected;
  if(cmd==='wait') {
    selected.moved=selected.acted=true;showStatus(selected.name+' waits. Choose another relative or end the turn.');
  } else if(cmd==='valor' || cmd==='herb') {
    const session=battle, unit=selected;
    const amount=cmd==='herb' ? battle.heal(unit) : 0;
    if(cmd==='valor' ? !battle.castValor(unit) : !amount) return;
    const targets=cmd==='valor' ? battle.family.filter(standing) : [unit];
    showStatus(cmd==='valor'?'“BATTLE!” Valor grants +10% STR and DEF through turn '+(battle.valorReady-1)+'.':unit.name+' recovered '+fmt(amount)+' HP.');
    busy=true;mode=unit.moved?'attack':'move';display();
    await tween({kind:cmd,unit,targets,amount},cmd==='valor'?1050:650,session);
    if(battle!==session) return;
    busy=false;
  } else {
    mode=cmd;
    const action=cmd==='skill'?villageSkillName(selected)+' · '+skillCost(selected)+' MP':cmd==='attack'?selected.weapon:'';
    showStatus(cmd==='move'?'Choose a blue tile. Gold tiles mark the village entrance.':action+' · '+(battle.targets(selected).length?'Choose a highlighted guard.':'Move closer to a guard.'));
  }
  display();
}
function tween(effect, duration, session) {
  if(reduced.matches) {
    if(effect.kind==='move' || (effect.kind==='strike' && !effect.skill && effect.attacker.model!=='commander')) return Promise.resolve();
    visual={...effect,t:.55};paint();
    return new Promise(resolve=>setTimeout(()=>{
      if(battle===session){visual=null;paint();}
      resolve();
    },400));
  }
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
  const name=skill?villageSkillName(u):u.weapon;
  if(skill) {
    showStatus(u.name+' · '+name);
    await tween({kind:'announce',unit:u,name},320,session);
    if(battle!==session) return;
  }
  let hpBeforeHit=target.hp;
  const result=battle.strike(u,target,skill);
  if(!result) return;
  let hitIndex=0;
  for(const damage of result.hits){
    let duration=u.enemy?470:650;
    if (skill && u.weapon==='Spear') duration=u.id==='pyae'?[265,300,465][hitIndex]:245;
    await tween({kind:'strike',attacker:u,target,damage,skill,name:skill?name:null,hitIndex,hpBeforeHit,hookHand:result.hookHand,critical:result.critical},duration,session);
    if(session!==battle) return;
    hpBeforeHit-=damage;
    hitIndex++;
  }
  showStatus(u.name+' · '+name+(result.critical?' · Critical!':'')+' · '+result.hits.map(fmt).join(' + ')+' damage to '+target.name+
    (!target.hp?' · defeated.':result.dazed?' · dazed for one turn.':' ('+fmt(target.hp)+' HP left).'));

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

    showStatus(selected.name+(selected.escaped?' reached the village entrance.':' moved. Choose an action or another relative.'));
    if(selected.escaped) selected=battle.family.find(standing) || selected;
    inspected=selected;mode=selected.moved?'attack':'move';
  } else {showStatus(mode==='move'?'Choose an unoccupied blue tile within three steps.':'Choose a guard highlighted in gold.');return;}
  if(session===battle && ['escaped','defeated-guards'].includes(battle.result)) await gateEnding(session);
  if(session===battle){busy=false;display();}
}
async function endTurn() {
  if(busy || !battle.startGuards()) return;
  const session=battle;busy=true;showStatus('The royal guards advance.');display();
  const notices=[];
  for(const guard of battle.guards.filter(standing)) {
    if(battle!==session || battle.result) break;
    if(guard.dazed){
      notices.push(guard.name+' missed its turn (dazed).');
      showStatus(notices.at(-1));
      await tween({kind:'daze',unit:guard,targets:[guard]},500,session);
      continue;
    }
    const dest=battle.guardDestination(guard);
    if(dest) await walk(guard,dest.x,dest.y,session);
    if(battle!==session) return;
    const support=guard===battle.commander ? battle.commanderAction() : null;
    if(support){
      notices.push(support.kind==='order'?'“FIGHT!” Battle Frenzy raised the soldiers to level '+support.targets[0].level+'.':'Commander used a potion on '+support.targets[0].name+' (+'+support.amount+' HP).');
      inspected=support.kind==='potion'?support.targets[0]:guard;
      showStatus(notices.at(-1));display();
      await tween({...support,unit:guard},support.kind==='order'?1050:700,session);
      continue;
    }
    const target=battle.targets(guard).sort((a,b)=>distance(guard,a)-distance(guard,b)||a.hp-b.hp)[0];
    if(target) {
      const doubleThrust = guard.model==='guard' && guard.mp>=skillCost(guard) && target.hp>villageDamage(guard,target);
      const crossSlash=guard===battle.commander && battle.crossSlashNext && guard.mp>=skillCost(guard);
      if(guard===battle.commander) battle.crossSlashNext=!crossSlash;
      await hit(guard,target,doubleThrust || crossSlash,session);
      if(battle===session && guard===battle.commander) notices.push(get('message').textContent);
    }
    if(battle!==session) return;
    display();
  }
  if(session!==battle) return;
  if (battle.result==='lost') {
    gateScene='defeat';
    paint();
    await gateDialogue(session.commander,'General…\nYou’re old now.\nSoldiers, let’s end it here.');
    if (battle!==session) return;
    get('gateTalk').hidden=true;
  }
  battle.nextRound();busy=false;
  selected=battle.family.find(standing)||selected;inspected=selected;mode='move';
  if(!battle.result) showStatus('Turn '+battle.turn+' · '+(notices.length?notices.join(' '):'Choose a relative, then move or attack.'));
  display();
}
async function gateDialogue(unit,line) {
  get('gateFace').src=portraitPath(unit);
  get('gateSpeaker').textContent=unit.name;
  const lines=line.split('\n');
  let shown=1;
  const bubble=get('gateLine');
  bubble.replaceChildren();
  function appendLine(text) {
    const row=document.createElement('span');
    row.textContent=text;
    bubble.append(row);
    bubble.scrollTo({top:bubble.scrollHeight,behavior:reduced.matches?'instant':'smooth'});
  }
  appendLine(lines[0]);
  get('gateTalk').hidden=false;
  get('gateNext').focus();
  await new Promise(resolve=>{
    const timer=setInterval(()=>{
      if (shown<lines.length) appendLine(lines[shown++]);
      if (shown===lines.length) clearInterval(timer);
    },850);
    advanceDialogue=(finish=false)=>{
      clearInterval(timer);
      if (!finish && shown<lines.length) {
        while(shown<lines.length) appendLine(lines[shown++]);
      } else {advanceDialogue=null;resolve();}
    };
  });
}
get('gateNext').onclick=()=>advanceDialogue?.();
async function gateEnding(session) {
  gateScene='family';
  session.family.forEach(u=>{u.facing=1;});
  paint();
  await new Promise(resolve=>setTimeout(resolve,600));
  if (battle!==session) return;
  await gateDialogue(session.family[0],"Let’s leave.\nWe’ll deal with them later.");
  if (battle!==session) return;
  get('gateTalk').hidden=true;
  if (!reduced.matches) await tween({kind:'gateRun'},1100,session);
  if (battle!==session) return;
  gateScene='pursuit';
  paint();
  const officer=session.commander;
  if (officer) await gateDialogue(officer,'....\nGeneral, you’re still very strong.\nMen!\nChase after them.');
  if (battle!==session) return;
  gateScene='';
  get('gateTalk').hidden=true;
}
function start() {
  advanceDialogue?.(true); advanceDialogue=null; gateScene='';
  get('gateTalk').hidden=true;
  battle=new VillageBattle();busy=false;visual=null;selected=battle.family[0];inspected=selected;
  cursor={x:selected.x,y:selected.y};mode='move';keyboard=false;
  const roster=get('roster');roster.replaceChildren();
  for(const unit of battle.units) {
    const b=document.createElement('button');b.type='button';b.dataset.unit=unit.id;b.setAttribute('aria-label',unit.name);
    if(unit.enemy) b.className='enemy';
    const img=document.createElement('img');img.src=portraitPath(unit);img.alt='';b.append(img);
    b.onclick=()=>activate(unit.x,unit.y,unit);roster.append(b);
  }
  showStatus('The level-60 commander holds the entrance. Escape with all three relatives or defeat all six enemies.');
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
  const count=strikeCount(selected,mode==='skill');
  field.title=u?u.name+' · Lv. '+u.level+(u.enemy && inReach(selected,u)?' · '+(count>1?count+' × ':'')+fmt(villageDamage(selected,u,mode==='skill'))+' forecast damage':''):'';
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
