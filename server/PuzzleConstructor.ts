/*
        >>> PuzzleConstructor(options) returns LevelObject
GENERATION STEPS:
- STEP 1: Make base 
    1. set up list of positions with origin (triangle origin is always upward)
    2. expand until the list has as many tiles as option.figure_size
    3. while expanding, update borders

- STEP 2: 
    1. find tileFactor
    2. find offsetFactors (from origin tile to canvas center)
-  
*/

import LevelObject from "./Level_Object";
import RoomObject from "./Room_Object";


type Pos = [number, number];
type DirectionDegree = 0 | 30 | 90 | 150 | 180 | 210 | 270 | 330;
interface Borders {
    left: number,
    right: number,
    top: number,
    bottom: number,
}

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
    tileType: RoomObject["options"]["type"], 
    dir: DirectionDegree
): Pos{
    const x: number = tilePos[0];
    const y: number = tilePos[1];
    switch (tileType){
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
    tilePos: Pos, 
    tileType: RoomObject["options"]["type"]
): Pos[]{
    const isUpward: boolean = (tilePos[0] + tilePos[1]) % 2 === 0;
    switch(tileType){
        case "square":
            return [
                getNeighborPos(tilePos, tileType, 0),
                getNeighborPos(tilePos, tileType, 90),
                getNeighborPos(tilePos, tileType, 180),
                getNeighborPos(tilePos, tileType, 270)
            ];
        case "hexagon":
            return [
                getNeighborPos(tilePos, tileType, 30),
                getNeighborPos(tilePos, tileType, 90),
                getNeighborPos(tilePos, tileType, 150),
                getNeighborPos(tilePos, tileType, 210),
                getNeighborPos(tilePos, tileType, 270),
                getNeighborPos(tilePos, tileType, 330)
            ];
        case "triangle":
            if (isUpward) return [
                getNeighborPos(tilePos, tileType, 30),
                getNeighborPos(tilePos, tileType, 150),
                getNeighborPos(tilePos, tileType, 270)
            ];
            else return [
                getNeighborPos(tilePos, tileType, 90),
                getNeighborPos(tilePos, tileType, 210),
                getNeighborPos(tilePos, tileType, 330)
            ];
    }
}

// NOTE: tileScale is just 1
function updateBorders(
    borders: Borders, 
    tilePos: Pos, 
    tileType: RoomObject["options"]["type"]
) : void{
    const b: Borders = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };
    let x: number, y: number;
    const HALF_SQRT_3 = Math.sqrt(3) / 2;

    switch(tileType){
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
    updateBorders(borders, ORIGIN_TILE, options.type);

    // keep expanding until reach <options.figure_size> amount of tiles
    while (baseTiles.length < options.figure_size){
        // pick a random tile from activeBaseTiles
        const pickedTileIndex: number = randomInt(0, activeBaseTiles.length);
        const pickedTile: Pos = activeBaseTiles[pickedTileIndex];

        // fetch the neighbor tiles of this tile
        // optionally passing isUpward (only takes effect if type is triangle)
        let neighborsList: Pos[] = getNeighbors(
            pickedTile, 
            options.type
        );

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
                updateBorders(borders, pickedNeighbor, options.type);
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

    console.log(
        `let setType = "${options.type}",` +
        `tileScale = CANVAS_SIZE * ${tileFactor},` +
        `offset = [${offsetFactors[0]} * CANVAS_SIZE, ${offsetFactors[1]} * CANVAS_SIZE],` +
        `baseTiles = ${JSON.stringify(baseTiles)}`
    )

    // set to 'this' (returning LevelObject)
    this.timeLimit = options.time;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

// return a random integer, including start but not end
function randomInt(start: number, end: number): number{
    return Math.floor(Math.random() * (end - start)) + start;
}

exports.PuzzleConstructor = PuzzleConstructor;
export {}


// BACKUP
/* 
function setup() {
  createCanvas(500, 500);
  rectMode(CENTER);
  background(100, 50, 0);
  //noStroke();
  
  // make borders ............

  baseTiles.forEach((pos) => {
    renderTile(pos, setType, (pos[0]+pos[1]) % 2 === 0)
  })
}

// constants
const SQRT_3 = Math.sqrt(3);
const HALF_SQRT_3 = SQRT_3 / 2;


// for base. Accessible globally
const CANVAS_SIZE = 500;
// setType, tileScale, offset, baseTiles
// let setType = "square"
// let tileScale = CANVAS_SIZE * 0.1
// let offset = [ 0, 0 ]
// let baseTiles = []

let setType = "triangle",tileScale = CANVAS_SIZE * 0.15384615384615385,offset = [0.46153846153846156 * CANVAS_SIZE, 0.6110288979210818 * CANVAS_SIZE],baseTiles = [[0,0],[-1,0],[-1,-1],[1,0],[-2,-1],[1,-1],[2,0],[-2,-2],[0,-1],[0,1],[-2,0],[1,1],[-3,0],[-3,-1],[2,1],[3,0],[-4,0],[-5,0],[-4,1],[0,-2],[-2,1],[-3,1],[4,0],[3,-1],[-1,1],[2,-1],[-4,-1],[1,2],[-5,1],[-3,2],[-3,-2],[5,0],[1,-2],[-1,2],[6,0],[1,-3],[-5,-1],[2,-3],[3,1],[0,2],[3,-3],[4,-1],[0,-3],[-5,2],[4,-2],[2,-2],[5,-1],[2,-4],[4,1],[-4,-2]]



// offset is where the origin tile should be
function renderTile(pos, type, isUpward) {
  if (type === "square") {
    rect(
      offset[0] + pos[0] * tileScale,
      offset[1] + pos[1] * tileScale,
      tileScale,
      tileScale
    );
  } else if (type === "hexagon") {
    const HALF_SCALE = tileScale / 2;
    const SCALED_SQRT = HALF_SQRT_3 * tileScale;
    const x = offset[0] + pos[0] * tileScale * 3 / 2;
    const y = offset[1] + (pos[1] * 2 + pos[0]) * SCALED_SQRT;
    beginShape();
    vertex(x + tileScale, y);
    vertex(x + HALF_SCALE, y + SCALED_SQRT);
    vertex(x - HALF_SCALE, y + SCALED_SQRT);
    vertex(x - tileScale, y);
    vertex(x - HALF_SCALE, y - SCALED_SQRT);
    vertex(x + HALF_SCALE, y - SCALED_SQRT);
    endShape(CLOSE);
  } else if (type === "triangle") {
    const HALF_SCALE = tileScale / 2;
    const SCALED_SQRT = HALF_SQRT_3 * tileScale;
    const CENTER_Y = tileScale / (SQRT_3 * 2);
    const yOffset = isUpward ? SCALED_SQRT - (CENTER_Y * 2) : 0;
    const x = offset[0] + pos[0] * HALF_SCALE;
    const y = offset[1] + pos[1] * SCALED_SQRT + yOffset;
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


*/