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
    3. make output base object

- STEP 3: Make pieces
    1. spawn all root pieces, high chance of rerolling if spawned next to each other
    2. pick a random active tile to spread, remove tile from list if no longer active

- STEP 4: Make piece data for all rotations
    1. iterate through all possible rotations to make posData from original mapping
*/

import LevelObject from "./Level_Object";
import RoomObject from "./Room_Object";


type Pos = [number, number];
type DirectionDegree = 0 | 30 | 90 | 150 | 180 | 210 | 270 | 330;

const SQUARE_DIRS: DirectionDegree[] = [0, 90, 180, 270];
const HEXAGON_DIRS: DirectionDegree[] = [30, 90, 150, 210, 270, 330];
const UPWARD_TRIANGLE_DIRS: DirectionDegree[] = [30, 150, 270];
const DOWNWARD_TRIANLGE_DIRS: DirectionDegree[] = [90, 210, 330];
const PIECE_SIZE_LIMIT_FACTOR: number = 0.7;
const PIECE_COLORS: string[] = ["crimson", "lime", "blue", "yellow", "violet", "aqua"];

// types for generator
interface Borders {
    left: number,
    right: number,
    top: number,
    bottom: number,
}

interface MappingTile {
    pieceIndex: number,
    pos: Pos, // for pieces generation only
    children: ({
        dir: DirectionDegree,
        mappedTile: MappingTile
    })[]
}


// global
let globalOptions: RoomObject["options"];

function arrayHasTile(arr: Pos[], tilePos: Pos): boolean{
    return arr.some(pos => pos[0] === tilePos[0] && pos[1] === tilePos[1]);
}

function getNeighborPos(tilePos: Pos, dir: DirectionDegree): Pos{
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

// returns all possible directions to neighbors of the given tilePos
// triangle type: by default root is upward
function getNeighborDirs(tilePos: Pos): DirectionDegree[] {
    switch(globalOptions.type){
        case "square":
            return SQUARE_DIRS;
        case "hexagon":
            return HEXAGON_DIRS;
        case "triangle":
            const isUpward: boolean = (tilePos[0] + tilePos[1]) % 2 === 0;
            if (isUpward) return UPWARD_TRIANGLE_DIRS;
            else return DOWNWARD_TRIANLGE_DIRS;
    }
}

// returns all neighbor tile positions of the given tile (and type)
function getNeighbors(tilePos: Pos): Pos[]{
    let neighborDirs: DirectionDegree[] = getNeighborDirs(tilePos);

    let neighborPosList: Pos[] = [];
    neighborDirs.forEach((dir) => {
        neighborPosList.push(getNeighborPos(tilePos, dir));
    });
    return neighborPosList;
}

// NOTE: tileScale is just 1
function updateBorders(borders: Borders, tilePos: Pos) : void{
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


// recursive function that starts with the root tile of a piece group
// add position to posData, then invoke for each child (with their calculated pos)
function traverseMappedTile(
    mappedTile: MappingTile, 
    pos: Pos, 
    posData: Pos[], 
    degs: DirectionDegree[],
    rotateAmount: number
): void {
    posData.push(pos); // add current tile position

    // for each child
    mappedTile.children.forEach((child) => {
        // calculate new dir
        let currentDirIndex: number = degs.indexOf(child.dir), newDir: DirectionDegree;
        if (currentDirIndex + rotateAmount < degs.length) {
            newDir = degs[currentDirIndex + rotateAmount];
        } else newDir = degs[rotateAmount - (degs.length - currentDirIndex)];

        // calculate child pos and recursively invoke this function
        traverseMappedTile(
            child.mappedTile, 
            getNeighborPos(pos, newDir), 
            posData, 
            degs,
            rotateAmount
        );
    });
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
    
    // offsetFactors (canvas size * offsetFactor[y] = offset for y dimension)
    const yOffset: number = (LONGEST_DIMENSION - BASE_HEIGHT) / 2;
    const xOffset: number = (LONGEST_DIMENSION - BASE_WIDTH) / 2;
    function getOffsetFactor(units: number): number{
        return units / LONGEST_DIMENSION;
    }

    // output base object
    const outputBase: LevelObject["base"] = {
        tileType: options.type,
        tileFactor: getOffsetFactor(1), // tileFactor (canvas size * tileFactor = tileScale)
        offsetFactors: [
            getOffsetFactor(borders.left * -1 + xOffset),
            getOffsetFactor(borders.top * -1 + yOffset),
        ],
        posData: baseTiles
    };
    

    // _________ STEP 3
    let resultRootTiles: MappingTile[]; // contains only the mapped root tiles
    // wrapped in a while loop to check if any piece is too big then regenerate
    let regenerateCount: number = 0;
    while (true){

        // spawn root tiles
        const mappedRootTiles: MappingTile[] = [];
        let rootTilesCounter: number = 0;
        makeRootTiles:
        while (rootTilesCounter < options.pieces_amount){
            let pickedPos: Pos = baseTiles[randomInt(0, baseTiles.length)];
            // deny if this position already has another root tile
            for (let j=0; j < mappedRootTiles.length; j++){
                if (pickedPos === mappedRootTiles[j].pos){
                    continue makeRootTiles;
                }
            }
            // check if pickedPos is a neighbor of any other root tile
            for (let j=0; j < mappedRootTiles.length; j++){
                const neighbors: Pos[] = getNeighbors(mappedRootTiles[j].pos);
                for (let n=0; n < neighbors.length; n++){
                    const neighborPos: Pos = neighbors[n];
                    if (pickedPos[0] === neighborPos[0] && pickedPos[1] === neighborPos[1]){
                        // high chance to deny
                        if (Math.random() < 0.95) continue makeRootTiles;
                    }
                }
            }
            // accepted position, add to list
            mappedRootTiles.push({
                pieceIndex: rootTilesCounter,
                pos: pickedPos,
                children: []
            });
            rootTilesCounter++;
        }
    
        // transfer root tiles to this 2 lists
        const allPieceTiles: MappingTile[] = [];
        const activePieceTiles: MappingTile[] = [];
        mappedRootTiles.forEach((mappedRootTile) => {
            allPieceTiles.push(mappedRootTile);
            activePieceTiles.push(mappedRootTile);
        });
        
        let spawningCount: number = options.pieces_amount; // to check if it's all done
        // pick a random active tile to spread
        while (spawningCount < options.figure_size){
            // pat = picked active tile
            let patIndex: number = randomInt(0, activePieceTiles.length);
            let pat: MappingTile = activePieceTiles[patIndex];
    
            const neighbors: Pos[] = getNeighbors(pat.pos);
            const correspondingDirs: DirectionDegree[] = getNeighborDirs(pat.pos);
    
            interface ConnectedNeighbor {nPos: Pos, dir: DirectionDegree} 
            let connectedNeighbors: ConnectedNeighbor[] = neighbors.map(
                (nPos, i) => ({nPos: nPos, dir: correspondingDirs[i]})
            );

            // only keep neighbors that are in baseTiles and not already in allPieceTiles
            connectedNeighbors = connectedNeighbors.filter((connectedNeighbor) => {
                const nPos: Pos = connectedNeighbor.nPos;
                // not in baseTiles? remove neighbor
                if (!arrayHasTile(baseTiles, nPos)) return false;
                // is already in allPieceTiles? remove neighbor
                for (let i=0; i < allPieceTiles.length; i++){
                    const addedPos: Pos = allPieceTiles[i].pos;
                    if (addedPos[0] === nPos[0] && addedPos[1] === nPos[1]) return false;
                }
                return true; // passed both checks
            });
    
            // deactivate tile if no more available neighbors
            if (connectedNeighbors.length === 0){
                activePieceTiles.splice(patIndex, 1);
                continue;
            }
    
            // create a mapping tile with random available neighbor
            const pickedSpreadIndex: number = randomInt(0, connectedNeighbors.length);
            const newMappedTile: MappingTile = {
                pieceIndex: pat.pieceIndex,
                pos: connectedNeighbors[pickedSpreadIndex].nPos,
                children: []
            };
            
            // finally: add to the parent tile and the other 2 lists
            pat.children.push({
                dir: connectedNeighbors[pickedSpreadIndex].dir,
                mappedTile: newMappedTile
            });
            allPieceTiles.push(newMappedTile);
            activePieceTiles.push(newMappedTile);
            spawningCount++;
        }

        // check if any piece is too big or just one tile
        let gerationRejected: boolean = false;
        const tilesCountLimit: number = allPieceTiles.length / (mappedRootTiles.length * PIECE_SIZE_LIMIT_FACTOR);
        for (let i=0; i < mappedRootTiles.length; i++){
            const tilesCount: number = allPieceTiles.filter(mappedTile => mappedTile.pieceIndex === i).length;
            if (tilesCount > tilesCountLimit || tilesCount === 1) {
                gerationRejected = true;
                break;
            }
        }

        // accepted or already 1000+ regenerations? exists loop
        if (!gerationRejected || regenerateCount > 1000){
            resultRootTiles = mappedRootTiles;
            break;
        } else regenerateCount++;
    }

    // _________ STEP 4
    let degs: DirectionDegree[];
    if (globalOptions.type === "square") degs = SQUARE_DIRS;
    else degs = HEXAGON_DIRS; // for both hexagon and triangle

    let availablePieceColors: string[] = PIECE_COLORS.slice(); // shallow copy

    const outputPieces: LevelObject["pieces"] = [];
    // for each piece
    resultRootTiles.forEach((mappedRootTile) => {
        const pickedColorIndex: number = randomInt(0, availablePieceColors.length);
        const pickedColor: string = availablePieceColors[pickedColorIndex];
        availablePieceColors.splice(pickedColorIndex, 1); // remove picked color
        
        // default piece group
        const newPieceGroup: LevelObject["pieces"][0] = {
            rootPosOnBase: mappedRootTile.pos,
            posDataArray: [],
            color: pickedColor,
            rootIsUpward: (mappedRootTile.pos[0] + mappedRootTile.pos[1]) % 2 === 0
        };
        outputPieces.push(newPieceGroup); // add to output array
        
        // for each rotation => create posData's for posDataArray
        for (let rotateAmount = 0; rotateAmount < degs.length; rotateAmount++){
            const newPosData: Pos[] = [];
            newPieceGroup.posDataArray.push(newPosData);
            
            traverseMappedTile(
                mappedRootTile,
                [0, 0],
                newPosData,
                degs,
                rotateAmount
            );
        }
    });

    console.log("regenerate count:", regenerateCount);
    console.log("let output=" + JSON.stringify({
        base: outputBase, pieces: outputPieces
    }));

    // set to 'this' (returning LevelObject)
    this.timeLimit = options.time;
    this.base = outputBase;
    this.pieces = outputPieces;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

// return a random integer, including start but not end
function randomInt(start: number, end: number): number{
    return Math.floor(Math.random() * (end - start)) + start;
}


exports.PuzzleConstructor = PuzzleConstructor;
export {}


// BACKUP
/* 
let output={"base":{"tileType":"triangle","tileFactor":0.18504816320180312,"offsetFactors":[0.36121387759864765,0.39316239316239315],"posData":[[0,0],[0,1],[1,0],[1,1],[-1,0],[1,-1],[2,-1],[1,2],[2,-2],[2,1],[3,-1],[2,2],[0,2],[3,2],[-1,1],[-1,2],[-2,2],[2,0],[-2,1],[3,0],[4,2],[5,2],[2,3],[3,-2],[0,3]]},"pieces":[{"rootPosOnBase":[-2,1],"posDataArray":[[[0,0],[1,0],[2,0],[2,-1],[1,-1],[1,1],[0,1]],[[0,0],[1,0],[1,-1],[0,-1],[-1,-1],[2,0],[2,1]],[[0,0],[0,-1],[-1,-1],[-2,-1],[-2,0],[1,-1],[2,-1]],[[0,0],[-1,0],[-2,0],[-2,1],[-1,1],[-1,-1],[0,-1]],[[0,0],[-1,0],[-1,1],[0,1],[1,1],[-2,0],[-2,-1]],[[0,0],[0,1],[1,1],[2,1],[2,0],[-1,1],[-2,1]]],"color":"blue","rootIsUpward":false},{"rootPosOnBase":[2,-2],"posDataArray":[[[0,0],[0,1],[-1,1],[-1,2],[1,1],[1,2],[1,0]],[[0,0],[1,0],[1,1],[2,1],[2,0],[3,0],[0,-1]],[[0,0],[1,0],[2,0],[3,0],[1,-1],[2,-1],[-1,0]],[[0,0],[0,-1],[1,-1],[1,-2],[-1,-1],[-1,-2],[-1,0]],[[0,0],[-1,0],[-1,-1],[-2,-1],[-2,0],[-3,0],[0,1]],[[0,0],[-1,0],[-2,0],[-3,0],[-1,1],[-2,1],[1,0]]],"color":"crimson","rootIsUpward":true},{"rootPosOnBase":[2,1],"posDataArray":[[[0,0],[-1,0],[0,-1]],[[0,0],[0,1],[-1,0]],[[0,0],[1,0],[-1,0]],[[0,0],[1,0],[0,1]],[[0,0],[0,-1],[1,0]],[[0,0],[-1,0],[1,0]]],"color":"yellow","rootIsUpward":false},{"rootPosOnBase":[5,2],"posDataArray":[[[0,0],[-1,0],[-2,0],[-3,0],[-3,1],[-4,0],[-5,0],[-5,1]],[[0,0],[0,1],[-1,1],[-1,2],[0,2],[-2,2],[-2,3],[-1,3]],[[0,0],[1,0],[1,1],[2,1],[3,1],[2,2],[3,2],[4,2]],[[0,0],[1,0],[2,0],[3,0],[3,-1],[4,0],[5,0],[5,-1]],[[0,0],[0,-1],[1,-1],[1,-2],[0,-2],[2,-2],[2,-3],[1,-3]],[[0,0],[-1,0],[-1,-1],[-2,-1],[-3,-1],[-2,-2],[-3,-2],[-4,-2]]],"color":"violet","rootIsUpward":false}]}



function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  angleMode(DEGREES);
  imageMode(CENTER);
  rectMode(CENTER);
  strokeCap(SQUARE);
  frameRate(30);
  
  loadData();
}

// constants
const CANVAS_SIZE = 500;
const STROKE_COLOR = 20;
const BG_COLOR = 28;
const SQRT_3 = Math.sqrt(3);
const HALF_SQRT_3 = SQRT_3 / 2;


let tileType = output.base.tileType,
    tileScale = output.base.tileFactor * CANVAS_SIZE,
    offset = output.base.offsetFactors.map(f => f * CANVAS_SIZE),
    baseTiles = output.base.posData
const HALF_SCALE = tileScale / 2;
const SCALED_SQRT = HALF_SQRT_3 * tileScale;


function renderTile(pos, isUpward) {
  const renderPos = calculateRenderPos(pos, isUpward);
  const x = renderPos[0];
  const y = renderPos[1];
  
  if (tileType === "square") {
    rect(x, y, tileScale, tileScale);
  } 
  else if (tileType === "hexagon") {
    beginShape();
    vertex(x + tileScale, y);
    vertex(x + HALF_SCALE, y + SCALED_SQRT);
    vertex(x - HALF_SCALE, y + SCALED_SQRT);
    vertex(x - tileScale, y);
    vertex(x - HALF_SCALE, y - SCALED_SQRT);
    vertex(x + HALF_SCALE, y - SCALED_SQRT);
    endShape(CLOSE);
  } 
  else if (tileType === "triangle") {
    const CENTER_Y = tileScale / (SQRT_3 * 2);
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
  
  if (tileType === "square"){
    result = [
      r((mouseX - offset[0])/tileScale),
      r((mouseY - offset[1])/tileScale),
    ];
  } 
  else if (tileType === "hexagon"){    
    const xPos = (mouseX - offset[0])/tileScale/3*2;
    const yPos = ((mouseY - offset[1])/SCALED_SQRT - xPos) / 2;
    result = [r(xPos), r(yPos)];
  } 
  else if (tileType === "triangle"){
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




let baseImage, baseSize, pieceImages, dataLoaded = false;
function loadData(){
  const CS = width;
  background(BG_COLOR);
  
  // BASE
  let baseColor = 60;
  fill(baseColor);
  stroke(70);
  strokeWeight(tileScale * 0.05);
  baseTiles.forEach((pos) => {
    renderTile(pos, getTDir(pos, true))
  });
  baseImage = get(0, 0, CS, CS);
  baseSize = CS * 2;
  
  // PIECES
  pieceImages = [];
  output.pieces.forEach((pieceGroup, pieceIndex) => {
    fill(pieceGroup.color);
    stroke(STROKE_COLOR);
    strokeWeight(tileScale * getStrokeWeight());
    
    clear();
    // render tiles (original rotation) in this piece group
    pieceGroup.posDataArray[0].forEach((pos) => {
      const originalPos = [
        pos[0] + pieceGroup.rootPosOnBase[0],
        pos[1] + pieceGroup.rootPosOnBase[1]
      ];
      
      renderTile(
        originalPos,
        getTDir(originalPos, true)
      );
    })
    
    // save image
    const renderPos = calculateRenderPos(
      pieceGroup.rootPosOnBase,
      getTDir(pieceGroup.rootPosOnBase, true)
    );
    pieceImages.push(get(
      renderPos[0] - CS,
      renderPos[1] - CS,
      CS * 2,
      CS * 2
    ));
  });

  dataLoaded = true;
  background(BG_COLOR);
}

  
function draw() {
  background(BG_COLOR);
  

  image(
    baseImage, 
    width/2, width/2,
    baseSize/2,
    baseSize/2
  );
  
  pieceImages.forEach((pieceImage, i) => {
    push();
    const rootPos = output.pieces[i].rootPosOnBase;
    const renderPos = calculateRenderPos(
      rootPos,
      getTDir(rootPos, true)
    );
    translate(renderPos[0], renderPos[1]);
    //rotate(frameCount * 1.2);
    image(
      pieceImage,
      0, 0,
      baseSize, 
      baseSize
    );
    pop();
  });
  
  
  // TEST ODD ROTATED TRIANGLE POS DATA...
//   const rotateIndex = 0;
//   const showPieceIndex = 0;
//   const showPiece = output.pieces[showPieceIndex];
//   fill(showPiece.color);
//   stroke(STROKE_COLOR);
//   strokeWeight(tileScale * getStrokeWeight());
//   showPiece.posDataArray[rotateIndex].forEach(pos => {
//     renderTile(
//       pos,
//       getTDir(pos, showPiece.rootIsUpward === (rotateIndex % 2 === 0))
//     );
//   });
 
  
  // HOVERED
  let hoverPos = getHoveredTile();
  if (hoverPos){
    let hoverColor = color("white");
    fill(hoverColor);
    noStroke();
    renderTile(hoverPos, getTDir(hoverPos, true));
  }
  //console.log(frameRate());
}
 


// helper functions
function arrayHasTile(arr, tilePos){
    return arr.some(pos => pos[0] === tilePos[0] && pos[1] === tilePos[1]);
}
// return true if this triangle tile is upward
function getTDir(pos, rootIsUpward){
  if (rootIsUpward) return (pos[0] + pos[1]) % 2 === 0;
  return Math.abs((pos[0] + pos[1]) % 2) === 1;
}
function getStrokeWeight(){
  switch(tileType){
    case "square":
      return 0.08;
    case "hexagon":
      return 0.11;
    case "triangle":
      return 0.05;
  }
}
// takes in grid pos and returns render pos
function calculateRenderPos(pos, isUpward){
  let x, y;
  if (tileType === "square") {
    x = offset[0] + pos[0] * tileScale;
    y = offset[1] + pos[1] * tileScale;
  }
  else if (tileType === "hexagon") {
    x = offset[0] + pos[0] * tileScale * 3 / 2;
    y = offset[1] + (pos[1] * 2 + pos[0]) * SCALED_SQRT;
  }
  else if (tileType === "triangle") {
    const CENTER_Y = tileScale / (SQRT_3 * 2);
    const yOffset = isUpward ? SCALED_SQRT - (CENTER_Y * 2) : 0;
    x = offset[0] + pos[0] * HALF_SCALE;
    y = offset[1] + pos[1] * SCALED_SQRT + yOffset;
  }
  return [x, y];
}
*/