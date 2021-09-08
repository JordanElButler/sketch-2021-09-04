const EMPTYTILE = 0;
const WALLTILE = 1;
const SPIKETILE = 2;
let player = {
  px: 0,
  py: 0,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  jumpv: -5,
  horiv: 1,
  maxvx: 5,
  maxvy: 6,
  grounddamp: 0.85,
  airdamp: 0.9,
  canjump: false,
};

function setTileColor(tileType) {
  if (tileType === EMPTYTILE) {
    stroke(200, 255, 255);
    fill(255, 100, 100);
  } else if (tileType === WALLTILE) {
    stroke(200, 255, 255);
    fill(255, 100, 255);
  } else if (tileType === SPIKETILE) {
    stroke(200, 255, 255);
    fill(255, 0, 0);
  } else {
    console.log("Unknown tileType");
  }
}

// remap t from interval (x11, x12) to (x21 x22)
function remap(x11, x12, x21, x22, t) {
  let d1 = x12 - x11;
  let d = t - x11;
  
  let d2 = x22 - x21;
  
  return d2 * d / d1 + x21;
}

function setup() {
  tileSpan = 20;
  tileCountHori = 50;
  tileCountVert = 30;
  PLAYERFILL = color(255, 255, 0);
  PLAYERSTROKE = color(255, 255, 200);
  
  createCanvas(tileSpan*tileCountHori, tileSpan*tileCountVert);

  
  staticTiles = [];
  for (let i = 0; i < tileCountVert; i++) {
    let tmp = [];
    for (let j = 0; j < tileCountHori; j++) {
      let x = remap(0, tileCountHori, 0, 6*PI, j + 0.5);
      let y = remap(0, tileCountVert, 4, -2, i + 0.5);
      
      if (sin(x) > y) {
        tmp.push(WALLTILE);
      } else if (i === 0 || j === 0 || i === tileCountVert - 1 || j === tileCountHori - 1) {
        tmp.push(WALLTILE);
      } else if (sin(x) < -0.5 && y > 0 && y < 1) {
        tmp.push(WALLTILE);
      }  else {
        tmp.push(EMPTYTILE);
      }
    }
    staticTiles.push(tmp);
  }
  placePlayerAtTile(10, 3);
}

function draw() {
  background(220);
  
  for (let i = 0; i < tileCountVert; i++) {
    for (let j = 0; j < tileCountHori; j++) {
      
      let x = j * tileSpan;
      let y = i * tileSpan;
      setTileColor(staticTiles[i][j]);
      rect(x, y, tileSpan, tileSpan);
    }
  }
  
  stroke(PLAYERSTROKE);
  fill(PLAYERFILL);
  rect(player.x, player.y, tileSpan, tileSpan);
  
  playerUpdate();
}

function playerUpdate() {
  if (keyIsDown(65)) {
    player.vx -= player.horiv;
  }
  if (keyIsDown(68)) {
    player.vx += player.horiv;
  }
  if (keyIsDown(87)) {
    tryJump();
  }
  const g = 0.18;
  player.vy += g;
  
  // clamp velocities
  player.vx = clamp(-player.maxvx, player.maxvx, player.vx);
  player.vy = clamp(-player.maxvy, player.maxvy, player.vy);
  
  // set to zero if too small
  player.vx = abs(player.vx) < 0.01 ? 0 : player.vx;
  player.vy = abs(player.vy) < 0.01 ? 0 : player.vy;

  // save previous player position, we know px and py are valid
  player.px = player.x;
  player.py = player.y;
  
  player.x += player.vx;
  player.y += player.vy;
  
  player.x = round(player.x);
  player.y = round(player.y);
  
  if (player.canjump) {
    player.vx *= player.grounddamp;
  } else {
    player.vx *= player.airdamp;
  }
  
  player.canjump = staticCollisions(false);
  if (player.canjump) console.log("canjump")
}

function tryJump() {
  if (player.canjump) {
    player.vy = player.jumpv;
    player.canjump = false;
  }
}


function staticCollisions(groundResolve) {
// very bad
  {
    let {i, j} = getTileContainingPoint(player.x, player.y);
    if (i >= 0 && i < tileCountVert && j >= 0 && j < tileCountHori) {
      if (staticTiles[i][j] === WALLTILE) {
        fill(0, 0, 0);
        rect(j * tileSpan, i * tileSpan, tileSpan, tileSpan);

        let pt = player.py;
        let pl = player.px;
        let tb = (i+1) * tileSpan;
        let tr = (j+1) * tileSpan;
        if (pl >= tr) {
          player.x = tr;
          player.vx = 0;
          return staticCollisions(groundResolve);
        } else if (pt >= tb) {
          player.y = tb;
          player.vy = -player.vy * 0.5;
          return staticCollisions(groundResolve);
        } 
      }
    } 
  }
  {
    let {i, j} = getTileContainingPoint(player.x + tileSpan - 1, player.y);
    if (i >= 0 && i < tileCountVert && j >= 0 && j < tileCountHori) {
      if (staticTiles[i][j] === WALLTILE) {
        fill(0, 0, 0);
        rect(j * tileSpan, i * tileSpan, tileSpan, tileSpan);

        let pt = player.py;
        let pr = player.px + tileSpan - 1;
        let tb = (i+1) * tileSpan;
        let tl = (j) * tileSpan;
        if (pr < tl) {
          player.x = tl - tileSpan;
          player.vx = 0;
          return staticCollisions(groundResolve);
        } if (pt >= tb) {
          player.y = tb;
          player.vy = -player.vy * 0.5;
          return staticCollisions(groundResolve);
        }
      }
    } 
  }
    {
    let {i, j} = getTileContainingPoint(player.x, player.y + tileSpan - 1);
    if (i >= 0 && i < tileCountVert && j >= 0 && j < tileCountHori) {
      if (staticTiles[i][j] === WALLTILE) {
        fill(0, 0, 0);
        rect(j * tileSpan, i * tileSpan, tileSpan, tileSpan);
        let pb = player.py + tileSpan - 1;
        let pl = player.px;
        let tt = (i) * tileSpan;
        let tr = (j+1) * tileSpan;
        if (pb < tt) {
          player.y = tt - tileSpan;
          player.vy = 0;
          return staticCollisions(true);
        } else if (pl >= tr) {
          player.x = tr
          player.vx = 0;
          return staticCollisions(groundResolve);
        }
      }
    } 
  }
    {
    let {i, j} = getTileContainingPoint(player.x + tileSpan - 1, player.y + tileSpan - 1);
    if (i >= 0 && i < tileCountVert && j >= 0 && j < tileCountHori) {
      if (staticTiles[i][j] === WALLTILE) {
        fill(0, 0, 0);
        rect(j * tileSpan, i * tileSpan, tileSpan, tileSpan);
        let pb = player.py + tileSpan - 1;
        let pr = player.px + tileSpan - 1;
        let tt = (i) * tileSpan;
        let tl = (j) * tileSpan;
        if (pb < tt) {
          player.y = tt - tileSpan;
          player.vy = 0;
          return staticCollisions(true);
        } else if (pr < tl) {
          player.x = tl - tileSpan;
          player.vx = 0;
          return staticCollisions(groundResolve);
        }
      }
    } 
  }
  return groundResolve;
}



function getTileContainingPoint(x, y) {
  let j = (x - (x % tileSpan)) / tileSpan;
  let i = (y - (y % tileSpan)) / tileSpan;
  
  return {i, j};
}

function placePlayerAtTile(j, i) {
  player.x = tileSpan * j;
  player.y = tileSpan * i;
  player.px = player.x;
  player.py = player.y;
}

function clamp(a, b, n) {
  if (n < a) return a;
  if (n > b) return b;
  return n;
}