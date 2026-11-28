// The three relatives start between the gate detachment and the rear detachment.
const villageWidth = 16;
const villageHeight = 10;
const ranks = { Legend: 9, Epic: 7, Master: 5, Elite: 4 };
const commandInterval = 5;
const soldierLevel = 45;
const orderChance = .5;
const chopCriticalChance = .2;
const specialMove = { commander: 'Cross Slash', tint: 'Mighty Chop', pyae: 'Triple Thrust', guard: 'Double Thrust' };
function villageSkillName(unit, hand = unit.nextHook) {
  if (unit.id === 'general') return hand === 'right' ? 'Nyar Wike Let Thee' : 'Bal Wike Let Thee';
  return specialMove[unit.model];
}
function strikeCount(unit, skill) {
  if (!skill) return 1;
  if (unit.id === 'pyae') return 3;
  return unit.model === 'guard' || unit.model === 'commander' ? 2 : 1;
}
const directions = [[1, 0], [0, -1], [0, 1], [-1, 0]];
const squareKey = (x, y) => x + ',' + y;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const onBoard = (x, y) => x >= 0 && y >= 0 && x < villageWidth && y < villageHeight;
const isGate = (x, y) => x === villageWidth - 1 && y <= 2;
const standing = unit => unit.hp > 0 && !unit.escaped;

function villageUnit(id, name, model, level, rank, weapon, x, y, facing = 1) {
  const factor = level * ranks[rank];
  return { id, name, model, level, rank, weapon, x, y, facing,
    hp: 10 * factor, mp: 10 * factor,
    get maxHp() { return 10 * this.level * ranks[this.rank]; },
    get maxMp() { return 10 * this.level * ranks[this.rank]; },
    get str() { return Math.round(5 * this.level * ranks[this.rank] * (this.valor ? 1.1 : 1)); },
    get def() { return this.str; },
    enemy: model === 'guard' || model === 'commander',
    moved: false, acted: false, escaped: false, valor: false, dazed: false };
}
function damageAtPower(attacker, target, multiplier) {
  const strength = attacker.str;
  return Math.max(1, Math.floor(multiplier * strength * strength / (strength + target.def)));
}
function villageDamage(attacker, target, skill = false) {
  const power = skill && attacker.id === 'tint' ? 2 : skill && attacker.id === 'general' ? 1.5 : 1;
  return damageAtPower(attacker, target, power);
}
function inReach(unit, target, skill = false) {
  const d = distance(unit, target);
  if (skill && unit.model==='commander') return d>=1 && d<=2 && (unit.x===target.x || unit.y===target.y);
  return d === 1 || (unit.weapon === 'Spear' && d === 2 && (unit.x === target.x || unit.y === target.y));
}
const moveRange = unit => unit.enemy ? 2 : 3;
const skillCost = unit => Math.ceil(unit.maxMp * .15);

class VillageBattle {
  constructor(random = Math.random) {
    this.random = random;
    this.family = [
      villageUnit('general', 'General Min Sithu', 'general', 54, 'Legend', 'Fists', 7, 4),
      villageUnit('tint', 'Nga Tint', 'tint', 32, 'Epic', 'Sword', 8, 3),
      villageUnit('pyae', 'Nga Pyae Wa', 'pyae', 24, 'Master', 'Spear', 8, 6)
    ];
    this.family[0].nextHook = 'left';
    this.commander = villageUnit('commander', 'Royal Commander', 'commander', 60, 'Legend', 'Sword', 14, 1, -1);
    const soldiers = [[12,3],[12,7],[2,3],[4,5],[2,7]].map(([x,y], i) =>
      villageUnit('guard-' + (i + 1), 'Royal Guard ' + (i + 1), 'guard', soldierLevel, 'Elite', 'Spear', x, y, i < 2 ? -1 : 1));
    this.guards = [this.commander, ...soldiers];
    this.orderReady = 1;
    this.crossSlashNext = true;
    this.ordersGiven = 0;
    this.orderDelays = 0;
    this.potions = 3;
    this.valorReady = 1;
    this.units = [...this.family, ...this.guards];
    this.turn = 1;
    this.phase = 'family';
    this.result = '';
    this.herbs = 2;
  }
  at(x, y) { return this.units.find(u => standing(u) && u.x === x && u.y === y); }
  routes(unit, limit = 3, canEnter = () => true) {
    const start = squareKey(unit.x, unit.y);
    const paths = new Map([[start, []]]);
    const queue = [[unit.x, unit.y]];
    for (const [x, y] of queue) {
      const steps = paths.get(squareKey(x, y));
      if (steps.length === limit) continue;
      for (const [dx, dy] of directions) {
        const nx = x + dx, ny = y + dy, key = squareKey(nx, ny);
        if (!onBoard(nx, ny) || !canEnter(nx, ny) || paths.has(key) || this.at(nx, ny)) continue;
        paths.set(key, [...steps, { x: nx, y: ny }]);
        queue.push([nx, ny]);
      }
    }
    return paths;
  }
  canAct(unit) { return !this.result && standing(unit) && !unit.dazed && unit.enemy === (this.phase === 'guards'); }
  checkResult() {
    if (this.family.every(u => u.escaped)) this.result = 'escaped';
    else if (this.guards.every(u => u.hp <= 0)) this.result = 'defeated-guards';
    else if (!this.family.some(standing)) this.result = 'lost';
    return this.result;
  }
  move(unit, x, y) {
    if (!this.canAct(unit) || unit.moved) return null;
    const path = this.routes(unit, moveRange(unit)).get(squareKey(x, y));
    if (!path?.length) return null;
    const from = { x: unit.x, y: unit.y };
    unit.facing = x === unit.x ? unit.facing : Math.sign(x - unit.x);
    Object.assign(unit, { x, y, moved: true });
    if (!unit.enemy && isGate(x,y)) unit.escaped = true;
    this.checkResult();
    return { from, path };
  }
  strike(unit, target, skill = false) {
    if (!this.canAct(unit) || unit.acted || !standing(target) || unit.enemy === target.enemy || !inReach(unit, target, skill)) return null;
    if (skill && unit.mp < skillCost(unit)) return null;
    if (skill) unit.mp -= skillCost(unit);
    unit.acted = true;
    unit.facing = target.x === unit.x ? (target.y > unit.y ? 1 : -1) : Math.sign(target.x - unit.x);
    const critical = skill && unit.id === 'tint' && this.random() < chopCriticalChance;
    const damage = critical ? damageAtPower(unit, target, 5) : villageDamage(unit, target, skill);
    const hookHand = skill && unit.id === 'general' ? unit.nextHook : null;
    if (hookHand) unit.nextHook = hookHand === 'left' ? 'right' : 'left';
    const count = strikeCount(unit, skill);
    const hits = [];
    for (let i = 0; i < count && target.hp > 0; i++) {
      hits.push(damage);
      target.hp = Math.max(0, target.hp - damage);
    }
    const dazed = skill && unit.weapon === 'Spear' && standing(target) &&
      this.random() < (unit.enemy ? 0.25 : 0.50);
    if (dazed) target.dazed = true;
    this.checkResult();
    return { hits, critical, dazed, hookHand };
  }
  castValor(unit) {
    if (unit.id !== 'general' || !this.canAct(unit) || unit.acted || this.turn < this.valorReady) return false;
    unit.acted = true;
    this.valorReady = this.turn + commandInterval;
    this.family.filter(standing).forEach(ally => { ally.valor = true; });
    return true;
  }
  commanderAction() {
    const unit = this.commander;
    if (!this.canAct(unit) || unit.acted) return null;
    const soldiers = this.guards.filter(ally => ally !== unit && standing(ally) && ally.level < unit.level);
    if (soldiers.length && this.turn >= this.orderReady && ((!this.ordersGiven && this.turn >= 3) || this.orderDelays >= 2 || this.random() < orderChance)) {
      unit.acted = true;
      this.orderReady = this.turn + commandInterval;
      this.ordersGiven++;
      this.orderDelays = 0;
      soldiers.forEach(ally => {
        const hpFraction = ally.hp / ally.maxHp, mpFraction = ally.mp / ally.maxMp;
        ally.level = Math.min(ally.level + 10, unit.level);
        ally.hp = Math.max(1, Math.round(ally.maxHp * hpFraction));
        ally.mp = Math.round(ally.maxMp * mpFraction);
      });
      return { kind: 'order', targets: soldiers };
    }
    if (soldiers.length && this.turn >= this.orderReady) this.orderDelays++;
    if (this.targets(unit).length || !this.potions) return null;
    const injured = this.guards.filter(ally => standing(ally) && ally.hp < ally.maxHp);
    injured.sort((a,b) => a.hp / a.maxHp - b.hp / b.maxHp);
    const target = injured[0];
    if (!target) return null;
    const amount = Math.min(100, target.maxHp - target.hp);
    target.hp += amount;
    unit.acted = true;
    this.potions--;
    return { kind: 'potion', targets: [target], amount };
  }
  heal(unit) {
    if (!this.canAct(unit) || unit.enemy || unit.acted || !this.herbs || unit.hp === unit.maxHp) return 0;
    const amount = Math.min(unit.maxHp - unit.hp, Math.ceil(unit.maxHp * .35));
    unit.hp += amount;
    unit.acted = true;
    this.herbs--;
    return amount;
  }
  crossSlashReady(unit) {
    return unit===this.commander && this.crossSlashNext && unit.mp>=skillCost(unit);
  }
  targets(unit) {
    return (unit.enemy ? this.family : this.guards).filter(target => standing(target) && inReach(unit, target, this.crossSlashReady(unit)));
  }
  guardDestination(guard) {
    if (this.targets(guard).length) return null;
    // Search for a reachable square from which a guard can threaten a remaining relative.
    const gateDetachment = guard !== this.commander && this.guards.indexOf(guard) < 3;
    const patrolArea = x => !gateDetachment || x >= 11;
    for (const path of this.routes(guard, villageWidth * villageHeight, patrolArea).values()) {
      if (!path.length) continue;
      const end = path[path.length - 1];
      const probe = { ...guard, ...end };
      if (this.family.some(target => standing(target) && inReach(probe, target, this.crossSlashReady(guard)))) return path[Math.min(path.length, moveRange(guard)) - 1];
    }
    return null;
  }
  startGuards() {
    if (this.result || this.phase !== 'family') return false;
    this.family.forEach(hero=>{hero.dazed=false;});
    this.phase = 'guards';
    this.guards.forEach(u => { u.moved = false; u.acted = false; });
    return true;
  }
  nextRound() {
    if (this.result || this.phase !== 'guards') return;
    this.turn++;
    this.guards.forEach(guard => { guard.dazed = false; });
    if (this.turn >= this.valorReady) this.family.forEach(ally => { ally.valor = false; });
    this.phase = 'family';
    this.family.forEach(u => { u.moved = false; u.acted = false; });
  }
}
