function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function levelFromXP(xp, factor) {
  return Math.floor(Math.sqrt(xp / factor));
}

function xpForNextLevel(level, factor) {
  return (level + 1) * (level + 1) * factor;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

module.exports = {
  randInt,
  levelFromXP,
  xpForNextLevel,
  formatDuration,
};