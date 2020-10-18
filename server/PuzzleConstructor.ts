/*
        >>> PuzzleConstructor(options) returns LevelObject
GENERATION STEPS:
- STEP 1: Make base 
    1. set up list of positions with origin (triangle origin is always upward)
    2. expand until the list has as many tiles as option.figure_size
    3. while expanding, update borders

- STEP 2: Make mappings of pieces
    1. make a parsed version of baseTileKeys

-  
*/

import LevelObject from "./Level_Object";
import RoomObject from "./Room_Object";


type Pos = [number, number];
type DirectionDegree = 0 | 30 | 90 | 150 | 180 | 210 | 270 | 330;


// stringifying and parsing for Pos
function stringifyPos(pos: Pos): string {
    return `${pos[0]}_${pos[1]}`;
}
function parsePos(stringifiedPos: string): Pos{
    const l: string[] = stringifiedPos.split("_");
    return [Number(l[0]), Number(l[1])];
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
    tileType: RoomObject["options"]["type"], 
    isUpward?: boolean
): Pos[]{
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


const PuzzleConstructor = function(this: LevelObject, options: RoomObject["options"]){
    // _________ STEP 1
    // borders of the base
    const borders = {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0
    };
    // a tile key is the tile position stringified in format of x_y (ex: 10_2 or 2_3)
    const baseTileKeys : string[] = ["0_0"]
    // activeBaseTiles is for randomly expansion of base, if a tile becomes unactive, remove it from this list
    const activeBaseTiles : Pos[] = [[0, 0]];

    // keep expanding until reach <options.figure_size> amount of tiles
    while (activeBaseTiles.length < options.figure_size){
        // pick a random tile from activeBaseTiles
        const pickedTileIndex: number = randomInt(0, activeBaseTiles.length);
        const pickedTile: Pos = activeBaseTiles[pickedTileIndex];

        // fetch the neighbor tiles of this tile
        // optionally passing isUpward (only takes effect if type is triangle)
        let neighborsList: Pos[] = getNeighbors(
            pickedTile, 
            options.type, 
            (pickedTile[0] + pickedTile[1]) % 2 === 0
        );

        // (repeatable) pick a random neighbor and check if it's available
        // if no neighbor is available then remove the picked tile from activeBaseTiles
        while (neighborsList.length > 0){
            const pickedNeighborIndex: number = randomInt(0, neighborsList.length);
            const pickedNeighbor: Pos = neighborsList[pickedNeighborIndex];
            // this neighbor IS taken?
            if (baseTileKeys.includes(stringifyPos(pickedNeighbor))){
                neighborsList.splice(pickedNeighborIndex, 1); // remove this neighbor from list
            }
            // AVAILABLE! Add new tile
            else {
                activeBaseTiles.push(pickedNeighbor);
                baseTileKeys.push(stringifyPos(pickedNeighbor));
                break;
            }
        }
        
        // all neighbors of this tile are taken? => unactive tile
        if (neighborsList.length === 0) activeBaseTiles.splice(pickedTileIndex, 1);
    }

    // _________ STEP 2
    let parsedBaseList: Pos[] = baseTileKeys.map(key => parsePos(key));
    // console.log(baseTileKeys);
    // console.log(parsedBaseList);


    // set to 'this' (returning LevelObject)
    this.timeLimit = options.time;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

// return a random integer, including start but not end
function randomInt(start: number, end: number): number{
    return Math.floor(Math.random() * (end - start)) + start;
}

exports.PuzzleConstructor = PuzzleConstructor;
export {}