// The three relatives start between the gate detachment and the rear detachment.
const villageWidth = 16;
const villageHeight = 10;
const ranks = { Legend: 9, Epic: 7, Master: 5, Elite: 4 };
const directions = [[1, 0], [0, -1], [0, 1], [-1, 0]];
const squareKey = (x, y) => x + ',' + y;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const onBoard = (x, y) => x >= 0 && y >= 0 && x < villageWidth && y < villageHeight;
const isGate = (x, y) => x === villageWidth - 1 && y <= 2;
const standing = unit => unit.hp > 0 && !unit.escaped;

function villageUnit(id, name, model, level, rank, weapon, x, y, facing = 1) {
  const factor = level * ranks[rank];
  const maxHp = 10 * factor, maxMp = 10 * factor;
  return { id, name, model, level, rank, weapon, x, y, facing, maxHp, maxMp,
    hp: maxHp, mp: maxMp, str: 5 * factor, def: 5 * factor, enemy: model === 'guard',
    moved: false, acted: false, escaped: false };
}
function villageDamage(attacker, target, skill = false) {
  const physical = attacker.str * attacker.str / (attacker.str + target.def);
  return Math.max(1, Math.floor(physical * (skill ? 1.5 : 1)));
}
function inReach(unit, target) {
  const d = distance(unit, target);
  return d === 1 || (unit.weapon === 'Spear' && d === 2 && (unit.x === target.x || unit.y === target.y));
}
const skillCost = unit => Math.ceil(unit.maxMp * .15);

class VillageBattle {
  constructor() {
    this.family = [
      villageUnit('general', 'General Min Sithu', 'general', 54, 'Legend', 'Fists', 7, 4),
      villageUnit('tint', 'Nga Tint', 'tint', 32, 'Epic', 'Sword', 8, 3),
      villageUnit('pyae', 'Nga Pyae Wa', 'pyae', 24, 'Master', 'Spear', 8, 6)
    ];
    this.guards = [[12,3],[14,1],[12,7],[2,3],[4,5],[2,7]].map(([x,y], index) =>
      villageUnit('guard-' + (index + 1), 'Royal Guard ' + (index + 1), 'guard', 20, 'Elite', 'Spear', x, y, index < 3 ? -1 : 1));
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
  canAct(unit) { return !this.result && standing(unit) && unit.enemy === (this.phase === 'guards'); }
  checkResult() {
    if (this.family.every(u => u.escaped)) this.result = 'escaped';
    else if (this.guards.every(u => u.hp <= 0)) this.result = 'defeated-guards';
    else if (!this.family.some(standing)) this.result = 'lost';
    return this.result;
  }
  move(unit, x, y) {
    if (!this.canAct(unit) || unit.moved) return null;
    const path = this.routes(unit, unit.enemy ? 2 : 3).get(squareKey(x, y));
    if (!path?.length) return null;
    const from = { x: unit.x, y: unit.y };
    unit.facing = x === unit.x ? unit.facing : Math.sign(x - unit.x);
    Object.assign(unit, { x, y, moved: true });
    if (!unit.enemy && isGate(x,y)) unit.escaped = true;
    this.checkResult();
    return { from, path };
  }
  strike(unit, target, skill = false) {
    if (!this.canAct(unit) || unit.acted || !standing(target) || unit.enemy === target.enemy || !inReach(unit, target)) return null;
    if (skill && unit.mp < skillCost(unit)) return null;
    if (skill) unit.mp -= skillCost(unit);
    unit.acted = true;
    unit.facing = target.x === unit.x ? (target.y > unit.y ? 1 : -1) : Math.sign(target.x - unit.x);
    const damage = villageDamage(unit, target, skill);
    target.hp = Math.max(0, target.hp - damage);
    this.checkResult();
    return damage;
  }
  heal(unit) {
    if (!this.canAct(unit) || unit.enemy || unit.acted || !this.herbs || unit.hp === unit.maxHp) return 0;
    const amount = Math.min(unit.maxHp - unit.hp, Math.ceil(unit.maxHp * .35));
    unit.hp += amount;
    unit.acted = true;
    this.herbs--;
    return amount;
  }
  targets(unit) {
    return (unit.enemy ? this.family : this.guards).filter(target => standing(target) && inReach(unit, target));
  }
  guardDestination(guard) {
    if (this.targets(guard).length) return null;
    // Search for a reachable square from which a guard can threaten a remaining relative.
    const gateDetachment = this.guards.indexOf(guard) < 3;
    const patrolArea = x => !gateDetachment || x >= 11;
    for (const path of this.routes(guard, villageWidth * villageHeight, patrolArea).values()) {
      if (!path.length) continue;
      const end = path[path.length - 1];
      const probe = { ...guard, ...end };
      if (this.family.some(target => standing(target) && inReach(probe, target))) return path[Math.min(path.length, 2) - 1];
    }
    return null;
  }
  startGuards() {
    if (this.result || this.phase !== 'family') return false;
    this.phase = 'guards';
    this.guards.forEach(u => { u.moved = false; u.acted = false; });
    return true;
  }
  nextRound() {
    if (this.result || this.phase !== 'guards') return;
    this.turn++;
    this.phase = 'family';
    this.family.forEach(u => { u.moved = false; u.acted = false; });
  }
}
