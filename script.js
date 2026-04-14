const TILE_COLORS = {
  2:    { bg:'#eee4da', fg:'#776e65' },
  4:    { bg:'#ede0c8', fg:'#776e65' },
  8:    { bg:'#f2b179', fg:'#fff' },
  16:   { bg:'#f59563', fg:'#fff' },
  32:   { bg:'#f67c5f', fg:'#fff' },
  64:   { bg:'#f65e3b', fg:'#fff' },
  128:  { bg:'#edcf72', fg:'#fff' },
  256:  { bg:'#edcc61', fg:'#fff' },
  512:  { bg:'#edc850', fg:'#fff' },
  1024: { bg:'#edc53f', fg:'#fff' },
  2048: { bg:'#edc22e', fg:'#fff' },
};

let grid, score, best = 0, prevGrid, prevScore, won, over, continueAfterWin;

function initGrid() {
  grid = Array.from({length:4}, () => Array(4).fill(0));
  score = 0; won = false; over = false; continueAfterWin = false;
  prevGrid = null; prevScore = 0;
  addRandom(); addRandom();
  render();
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('overlayContinue').style.display = 'none';
}

function addRandom() {
  let empty = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return;
  let [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function saveState() {
  prevGrid = grid.map(r => [...r]);
  prevScore = score;
}

function slide(row) {
  let arr = row.filter(v => v), gained = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      gained += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < 4) arr.push(0);
  return [arr, gained];
}

function move(dir) {
  if (over) return;
  if (won && !continueAfterWin) return;

  saveState();
  let newGrid = grid.map(r => [...r]);
  let totalGained = 0;

  if (dir === 'left' || dir === 'right') {
    for (let r = 0; r < 4; r++) {
      let row = dir === 'right' ? [...newGrid[r]].reverse() : [...newGrid[r]];
      let [slid, pts] = slide(row);
      if (dir === 'right') slid = slid.reverse();
      newGrid[r] = slid;
      totalGained += pts;
    }
  } else {
    for (let c = 0; c < 4; c++) {
      let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
      if (dir === 'down') col = col.reverse();
      let [slid, pts] = slide(col);
      if (dir === 'down') slid = slid.reverse();
      [0, 1, 2, 3].forEach(i => newGrid[i][c] = slid[i]);
      totalGained += pts;
    }
  }

  const changed = JSON.stringify(newGrid) !== JSON.stringify(grid);
  if (!changed) return;

  grid = newGrid;
  score += totalGained;
  if (score > best) best = score;
  addRandom();
  render();
  checkState();
}

function checkState() {
  let flat = grid.flat();
  if (flat.includes(2048) && !won && !continueAfterWin) {
    won = true;
    showOverlay('You Win!', true, 'Reach 2048!', true);
    return;
  }
  if (flat.includes(0)) return;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return;
    }
  }
  over = true;
  showOverlay('Game Over', false, 'Score: ' + score, false);
}

function showOverlay(msg, win = false, sub = '', showContinue = false) {
  let o = document.getElementById('overlay');
  let t = document.getElementById('overlayTitle');
  let s = document.getElementById('overlaySub');
  let cont = document.getElementById('overlayContinue');
  t.textContent = msg;
  t.className = 'overlay-title' + (win ? ' win' : '');
  s.textContent = sub;
  cont.style.display = showContinue ? 'block' : 'none';
  o.classList.add('show');
}

function render() {
  document.getElementById('score').textContent = score;
  document.getElementById('best').textContent = best;
  let slots = document.querySelectorAll('.tile-slot');
  slots.forEach((slot, i) => {
    let r = Math.floor(i / 4), c = i % 4, v = grid[r][c];
    slot.innerHTML = '';
    if (v) {
      let t = document.createElement('div');
      t.className = 'tile';
      t.textContent = v;
      let colors = TILE_COLORS[v] || { bg: '#3c3a32', fg: '#fff' };
      t.style.background = colors.bg;
      t.style.color = colors.fg;
      if (v >= 1024) t.style.fontSize = 'clamp(0.75rem, 2.8vw, 1.2rem)';
      slot.appendChild(t);
    }
  });
}

document.getElementById('btnNew').onclick = initGrid;

document.getElementById('btnUndo').onclick = () => {
  if (!prevGrid) return;
  grid = prevGrid.map(r => [...r]);
  score = prevScore;
  won = false; over = false;
  prevGrid = null;
  document.getElementById('overlay').classList.remove('show');
  render();
};

document.getElementById('overlayBtn').onclick = initGrid;

document.getElementById('overlayContinue').onclick = () => {
  continueAfterWin = true;
  won = false;
  document.getElementById('overlay').classList.remove('show');
};

const DIRS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down'
};
document.addEventListener('keydown', e => {
  if (DIRS[e.code]) { e.preventDefault(); move(DIRS[e.code]); }
});

let tx = 0, ty = 0;
document.getElementById('board').addEventListener('touchstart', e => {
  tx = e.touches[0].clientX; ty = e.touches[0].clientY;
}, { passive: true });
document.getElementById('board').addEventListener('touchend', e => {
  let dx = e.changedTouches[0].clientX - tx;
  let dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
});

initGrid();