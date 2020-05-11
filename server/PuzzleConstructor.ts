/*
- 1.Generation process is backward, meaning it's the reverse of the solution.
- 2.Starting with FINAL playerPos. Moving according to capture points.
- 3.Each capture point: Pick a random chessman to make a move. Do this until no more point.
- 4.If picked chessman has no valid move, check it off and reroll new chessman.
- 5.If all chessman have no valid move and there are still capture points, reroll at number 2.
*/

import LevelObject from "./Level_Object";

type Cell = 0 | 1; // 0: empty; 1: target
type Position = [number, number];
type Chessman = "pawn" | "rook" | "bishop" | "knight" | "queen" | "king";

interface Generated_Puzzle {
    success: boolean,
    gridData: Cell[][],
    playerPos: Position,
    chessmanList: Chessman[]
}

// first capture point is always true
function generateCapturePoints(moves: number): boolean[] {
    const capturePoints: boolean[] = [];
    for (let i=0; i < moves; i++) capturePoints.push(true);

    let removeAmounts: number[] = [];
    switch(moves){
        case 3:
            removeAmounts = [0, 1];
            break;
        case 4:
            removeAmounts = [0, 1];
            break;
        case 5:
            removeAmounts = [0, 1, 2];
            break;
        case 6:
            removeAmounts = [1, 2, 3];
            break;
    } 
    let pickedRemoveAmount: number = removeAmounts[randomInt(0, removeAmounts.length)];
    while (pickedRemoveAmount > 0){
        // pick a random capture point to remove, but not the first (index 0)
        const pickedCapturePointIndex = randomInt(1, moves); // moves = capturePoints.length
        // if not already removed -> remove and decrease amount
        if (capturePoints[pickedCapturePointIndex] === true){
            capturePoints[pickedCapturePointIndex] = false;
            pickedRemoveAmount--;
        }
        else continue; // continue to pick again
    }

    return capturePoints;
}

// return [gridData, playPos, chessmanList]
// if process fails, return .success as false
function createPuzzle(capturePoints: boolean[]): Generated_Puzzle{
    // generate playerPos (would be the last position in the solution)
    let playerPos: Position = [randomInt(0, 5), randomInt(0, 5)];

    ////// do to

    // fail output
    return {
        success: !false,
        gridData: [],
        playerPos: [0,0],
        chessmanList: []
    }
}

// return a random number, including start but not end
function randomInt(start: number, end: number): number{
    return Math.floor(Math.random() * (end - start)) + start;
}

const PuzzleConstructor = function(this: LevelObject, moves: number, calculatedTime: number){
    // generate capture points
    const capturePoints: boolean[] = generateCapturePoints(moves);

    let newLevelData: Generated_Puzzle;
    do newLevelData = createPuzzle(capturePoints)
    while(!newLevelData.success); // not successfully created the puzzle?


    // final data
    this.gridData = [
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 1, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ];
    this.playerPos = [1, 0];
    this.chessmanList = ["pawn", "bishop", "knight", "rook", "queen", "king"];
    this.timeLimit = calculatedTime;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

exports.PuzzleConstructor = PuzzleConstructor;

export {}