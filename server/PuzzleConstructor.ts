/*
        >>> PuzzleConstructor(options) returns LevelObject
GENERATION STEPS:
- STEP 1: Make base 
    1. set up list of positions with origin (triangle origin is always upward)
    2. expand until the list has as many tiles as option.figure_size
    3. while expanding, update borders

- STEP 2: Make factors for rendering
    1. find tileFactor
    2. find offsetFactors (from origin tile to canvas center)
- STEP 3: Make pieces
    1. spawn all root pieces, high chance of rerolling if spawned next to each other
    2. 
*/

import LevelObject from "./Level_Object";
import RoomObject from "./Room_Object";


type Pos = [number, number];
type DirectionDegree = 0 | 30 | 90 | 150 | 180 | 210 | 270 | 330;

// types for generator
interface Borders {
    left: number,
    right: number,
    top: number,
    bottom: number,
}


interface MappingTile {
    pos: Pos,
    children: ({
        dir: DirectionDegree,
        child: MappingTile
    })[]
}
interface PieceGroup {
    rootMappingTile: MappingTile,
    posData: Pos[] // positions of tiles relative to base
}

// types for final output to client
interface BaseOutput {
    tileType: RoomObject["options"]["type"],
    tileFactor: number,
    offsetFactors: [number, number],
    posData: Pos[]
}
interface PieceGroupOutput {
    rootPosOnBase: Pos[], // solution position
    posDataArray: Pos[][], // all rotations posData
    color: string,
    rootIsUpward?: boolean // triangle only
}
interface MatchLineOutput  {
    pos: Pos, // tile position
    lines: DirectionDegree[] // directions for lines on that tile
}


// global
let globalOptions: RoomObject["options"];


// stringifying and parsing for Pos
function stringifyPos(pos: Pos): string {
    return `${pos[0]}_${pos[1]}`;
}
function parsePos(stringifiedPos: string): Pos{
    const l: string[] = stringifiedPos.split("_");
    return [Number(l[0]), Number(l[1])];
}

function arrayHasTile(arr: Pos[], tilePos: Pos): boolean{
    return arr.some(pos => pos[0] === tilePos[0] && pos[1] === tilePos[1]);
}

function getNeighborPos(
    tilePos: Pos,
    dir: DirectionDegree
): Pos{
    const x: number = tilePos[0];
    const y: number = tilePos[1];
    switch (globalOptions.type){
        case "square":
            switch (dir){
                case 0: // "right"
                    return [x + 1, y];
                case 90: // "up"
                    return [x, y - 1];
                case 180: // "left"
                    return [x - 1, y];
                case 270: // "down"
                    return [x, y + 1];
            }
        case "hexagon":
            switch (dir){
                case 30: // "up right"
                    return [x + 1, y];
                case 90: // "up"
                    return [x + 1, y - 1];
                case 150: // "up left"
                    return [x, y - 1];
                case 210: // "down left"
                    return [x - 1, y];
                case 270: // "down"
                    return [x - 1, y + 1];
                case 330: // "down right"
                    return [x, y + 1];
            }
        case "triangle":
            switch (dir){
                case 30: // "right"
                    return [x + 1, y];
                case 90: // "up"
                    return [x, y - 1];
                case 150: // "left"
                    return [x - 1, y];
                case 210: // "left"
                    return [x - 1, y];
                case 270: // "down"
                    return [x, y + 1];
                case 330: // "right"
                    return [x + 1, y];
            }
    }
    throw "something went wrong in getNeighborPos()";
}

// returns all neighbor tile positions of the given tile (and type)
function getNeighbors(
    tilePos: Pos
): Pos[]{
    const isUpward: boolean = (tilePos[0] + tilePos[1]) % 2 === 0;
    let neighborDirs: DirectionDegree[];

    switch(globalOptions.type){
        case "square":
            neighborDirs = [0, 90, 180, 270];
            break;
        case "hexagon":
            neighborDirs = [30, 90, 150, 210, 270, 330];
            break;
        case "triangle":
            if (isUpward) neighborDirs = [30, 150, 270];
            else neighborDirs = [90, 210, 330];
    }

    let neighborPosList: Pos[] = [];
    neighborDirs.forEach((dir) => {
        neighborPosList.push(getNeighborPos(tilePos, dir));
    });
    return neighborPosList;
}

// NOTE: tileScale is just 1
function updateBorders(
    borders: Borders, 
    tilePos: Pos
) : void{
    const b: Borders = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };
    let x: number, y: number;
    const HALF_SQRT_3 = Math.sqrt(3) / 2;

    switch(globalOptions.type){
        case "square":
            x = tilePos[0];
            y = tilePos[1];

            b.left = x - 0.5;
            b.right = x + 0.5;
            b.top = y - 0.5;
            b.bottom = y + 0.5;
            break;

        case "hexagon":
            x = tilePos[0] * 3 / 2;
            y = (tilePos[1] * 2 + tilePos[0]) * HALF_SQRT_3;

            b.left = x - 1;
            b.right = x + 1;
            b.top = y - HALF_SQRT_3;
            b.bottom = y + HALF_SQRT_3;
            break;

        case "triangle":
            const CENTER_Y = 1 / (Math.sqrt(3) * 2);
            x = tilePos[0] * 0.5;
            y = tilePos[1] * HALF_SQRT_3;

            b.left = x - 0.5;
            b.right = x + 0.5;
            b.top = y - CENTER_Y;
            b.bottom = y + (HALF_SQRT_3 - CENTER_Y);
            break;
    }
    // compare to update if out of current borders
    borders.left = Math.min(borders.left, b.left);
    borders.right = Math.max(borders.right, b.right);
    borders.top = Math.min(borders.top, b.top);
    borders.bottom = Math.max(borders.bottom, b.bottom);
}

const PuzzleConstructor = function(this: LevelObject, options: RoomObject["options"]){
    globalOptions = options;

    // _________ STEP 1
    // borders of the base
    const borders : Borders = {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0
    };
    const ORIGIN_TILE: Pos = [0, 0];
    const baseTiles : Pos[] = [ORIGIN_TILE];
    // activeBaseTiles is for randomly expansion of base, if a tile becomes unactive, remove it from this list
    const activeBaseTiles : Pos[] = [ORIGIN_TILE];

    // update borders for origin tile
    updateBorders(borders, ORIGIN_TILE);

    // keep expanding until reach <options.figure_size> amount of tiles
    while (baseTiles.length < options.figure_size){
        // pick a random tile from activeBaseTiles
        const pickedTileIndex: number = randomInt(0, activeBaseTiles.length);
        const pickedTile: Pos = activeBaseTiles[pickedTileIndex];

        // fetch the neighbor tiles of this tile
        // optionally passing isUpward (only takes effect if type is triangle)
        let neighborsList: Pos[] = getNeighbors(pickedTile);

        // (repeatable) pick a random neighbor and check if it's available
        // if no neighbor is available then remove the picked tile from activeBaseTiles
        while (neighborsList.length > 0){
            const pickedNeighborIndex: number = randomInt(0, neighborsList.length);
            const pickedNeighbor: Pos = neighborsList[pickedNeighborIndex];
            // this neighbor IS taken?
            if (arrayHasTile(baseTiles, pickedNeighbor)){
                neighborsList.splice(pickedNeighborIndex, 1); // remove this neighbor from list
            }
            // AVAILABLE! Add new tile and update border
            else {
                activeBaseTiles.push(pickedNeighbor);
                baseTiles.push(pickedNeighbor);
                updateBorders(borders, pickedNeighbor);
                break;
            }
        }
        
        // all neighbors of this tile are taken? => unactive tile
        if (neighborsList.length === 0) activeBaseTiles.splice(pickedTileIndex, 1);
    }

    // _________ STEP 2
    // find longest dimension (width or height) from borders
    // it will be scaled up in order to create padding
    const BASE_WIDTH: number = borders.right - borders.left;
    const BASE_HEIGHT: number = borders.bottom - borders.top;
    const LONGEST_DIMENSION: number = Math.max(BASE_HEIGHT, BASE_WIDTH) * 1.04;
    
    // tileFactor (canvas size * tileFactor = tileScale)
    const tileFactor: number = 1 / LONGEST_DIMENSION;
    
    // offsetFactors (canvas size * offsetFactor[y] = offset for y dimension)
    const yOffset: number = (LONGEST_DIMENSION - BASE_HEIGHT) / 2;
    const xOffset: number = (LONGEST_DIMENSION - BASE_WIDTH) / 2;
    let offsetFactors: [number, number] = [
        getOffsetFactor(borders.left * -1 + xOffset),
        getOffsetFactor(borders.top * -1 + yOffset),
    ];

    function getOffsetFactor(units: number): number{
        return units / LONGEST_DIMENSION;
    }

    // _________ STEP 3
    // spawn root tiles
    const rootTiles: Pos[] = [];
    makeRootTiles:
    while (rootTiles.length < options.pieces_amount){
        let pickedPos: Pos = randomPos(baseTiles);
        // deny if this position already has another root tile
        for (let j=0; j < rootTiles.length; j++){
            if (pickedPos === rootTiles[j]){
                continue makeRootTiles;
            }
        }
        // check if pickedPos is a neighbor of any other root tile
        for (let j=0; j < rootTiles.length; j++){
            const neighbors: Pos[] = getNeighbors(rootTiles[j]);
            for (let n=0; n < neighbors.length; n++){
                const neighborPos: Pos = neighbors[n];
                if (pickedPos[0] === neighborPos[0] && pickedPos[1] === neighborPos[1]){
                    // high chance to deny
                    if (Math.random() < 0.95) continue makeRootTiles;
                }
            }
        }
        rootTiles.push(pickedPos);
    }

    // set up piece groups
    const pieceGroupsList: PieceGroup[] = [];
    for (let i=0; i < rootTiles.length; i++) {
        pieceGroupsList.push({
            rootMappingTile: {
                pos: rootTiles[i],
                children: []
            },
            posData: []
        });
    }
    
    // spread



    console.log(
        `let setType="${options.type}",` +
        `tileScale=CANVAS_SIZE*${tileFactor},` +
        `offset=[${offsetFactors[0]}*CANVAS_SIZE, ${offsetFactors[1]}*CANVAS_SIZE],` +
        `baseTiles=${JSON.stringify(baseTiles)},` + 
        `rootTiles=${JSON.stringify(rootTiles)}`
    )


    // set to 'this' (returning LevelObject)
    this.timeLimit = options.time;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

// return a random integer, including start but not end
function randomInt(start: number, end: number): number{
    return Math.floor(Math.random() * (end - start)) + start;
}
// returns a random position from given posData
function randomPos(posData: Pos[]): Pos{
    return posData[randomInt(0, posData.length)];
}

exports.PuzzleConstructor = PuzzleConstructor;
export {}


// BACKUP
/* 
function setup() {
  createCanvas(500, 500);
  rectMode(CENTER);
  frameRate(30);
}

// constants
const SQRT_3 = Math.sqrt(3);
const HALF_SQRT_3 = SQRT_3 / 2;



// for base. Accessible globally
const CANVAS_SIZE = 500;
const STROKE_COLOR = 0;
// setType, tileScale, offset, baseTiles

let setType = "hexagon",tileScale = CANVAS_SIZE * 0.08,offset = [0.43 * CANVAS_SIZE, 0.76 * CANVAS_SIZE],baseTiles = [[0,0],[0,-1],[0,-2],[-1,-1],[0,-3],[1,-4],[1,-2],[1,-1],[-1,0],[2,-5],[2,-1],[-1,-2],[0,1],[-2,0],[1,-3],[-2,-1],[-2,1],[-1,1],[2,-2],[3,-2],[3,-6],[3,-5],[-1,-3],[0,-4],[1,0]]


// RECALCULATE in a customSetup function that runs in setup() and resize()
let HALF_SCALE = tileScale / 2;
let SCALED_SQRT = HALF_SQRT_3 * tileScale;


// offset is where the origin tile should be
function renderTile(pos, fromArray, isUpward) {
  let x, y;
  if (setType === "square") {
    x = offset[0] + pos[0] * tileScale;
    y = offset[1] + pos[1] * tileScale;
    rect(
      x,
      y,
      tileScale,
      tileScale
    );
  } 
  else if (setType === "hexagon") {
    x = offset[0] + pos[0] * tileScale * 3 / 2;
    y = offset[1] + (pos[1] * 2 + pos[0]) * SCALED_SQRT;
    beginShape();
    vertex(x + tileScale, y);
    vertex(x + HALF_SCALE, y + SCALED_SQRT);
    vertex(x - HALF_SCALE, y + SCALED_SQRT);
    vertex(x - tileScale, y);
    vertex(x - HALF_SCALE, y - SCALED_SQRT);
    vertex(x + HALF_SCALE, y - SCALED_SQRT);
    endShape(CLOSE);
  } 
  else if (setType === "triangle") {
    const CENTER_Y = tileScale / (SQRT_3 * 2);
    const yOffset = isUpward ? SCALED_SQRT - (CENTER_Y * 2) : 0;
    x = offset[0] + pos[0] * HALF_SCALE;
    y = offset[1] + pos[1] * SCALED_SQRT + yOffset;
    if (isUpward) {
      triangle(
        x,
        y - (SCALED_SQRT - CENTER_Y),
        x - HALF_SCALE,
        y + CENTER_Y,
        x + HALF_SCALE,
        y + CENTER_Y
      );
    } else {
      triangle(
        x,
        y + (SCALED_SQRT - CENTER_Y),
        x - HALF_SCALE,
        y - CENTER_Y,
        x + HALF_SCALE,
        y - CENTER_Y
      );
    }
  }
}

// returns null if not a vaild tile
function getHoveredTile(){
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return null;
  let r = Math.round;
  let result;
  
  if (setType === "square"){
    result = [
      r((mouseX - offset[0])/tileScale),
      r((mouseY - offset[1])/tileScale),
    ];
  } 
  else if (setType === "hexagon"){    
    const xPos = (mouseX - offset[0])/tileScale/3*2;
    const yPos = ((mouseY - offset[1])/SCALED_SQRT - xPos) / 2;
    result = [r(xPos), r(yPos)];
  } 
  else if (setType === "triangle"){
    // which triangle direction is vaild
    let lookingForUpward = !!true;
    const CENTER_Y = tileScale / (SQRT_3 * 2);
    const yOffset = lookingForUpward ? SCALED_SQRT - (CENTER_Y * 2) : 0;
    const xPos = (mouseX - offset[0]) / HALF_SCALE;
    const yPos = (mouseY - offset[1] - yOffset) / SCALED_SQRT;
    
    // if is the other direction
    if (getTDir([r(xPos), r(yPos)], true) !== lookingForUpward){
      // more to the right?
      if (Math.ceil(xPos) - r(xPos) > 0.5){
        result = [r(xPos + 1), r(yPos)];
      }
      else result = [r(xPos - 1), r(yPos)];
    }
    else result = [r(xPos), r(yPos)];
  }
  
  // return null if not a tile in baseTiles
  if (arrayHasTile(baseTiles, result)) return result;
  return null;
}

// return true if this triangle tile is upward
function getTDir(pos, rootTileIsUpward){
  if (rootTileIsUpward) return (pos[0] + pos[1]) % 2 === 0;
  return (pos[0] + pos[1]) % 2 === 1;
}


  
function draw() {
  background(30);
  
  // outline
  noFill();
  stroke(STROKE_COLOR);
  // special: hexagons are bigger in scale
  strokeWeight(tileScale * (setType === "hexagon" ? 0.1 : 0.07));
  baseTiles.forEach((pos) => {
    renderTile(pos, baseTiles, getTDir(pos, true))
  })
  
  // inner colors
  let tileColor = 60;
  fill(tileColor);
  stroke(tileColor);
  strokeWeight(tileScale * 0.03);
  baseTiles.forEach((pos) => {
    renderTile(pos, baseTiles, getTDir(pos, true))
  })
  
  
  let hoverPos = getHoveredTile();
  if (hoverPos){
    let hoverColor = color("yellow");
    fill(hoverColor);
    stroke(hoverColor);
    strokeWeight(tileScale * 0.03);
    renderTile(hoverPos, baseTiles, getTDir(hoverPos, true));
  }
  //console.log(frameRate());
}
 

//////// FROM PUZZLEGENERATOR

function arrayHasTile(arr, tilePos){
    return arr.some(pos => pos[0] === tilePos[0] && pos[1] === tilePos[1]);
}
*/