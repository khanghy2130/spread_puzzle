/*
        >>> PuzzleConstructor(options) returns LevelObject
GENERATION STEPS:
- 1. 
- 2. 
- 3. 
*/

import LevelObject from "./Level_Object";
import RoomObject from "./Room_Object";

// return a random integer, including start but not end
function randomInt(start: number, end: number): number{
    return Math.floor(Math.random() * (end - start)) + start;
}

const PuzzleConstructor = function(this: LevelObject, options: RoomObject["options"]){
    // do generation

    // set to 'this' (returning LevelObject)
    this.timeLimit = options.time;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

exports.PuzzleConstructor = PuzzleConstructor;

export {}