/*
- 1.Generation process is backward, meaning it's the reverse of the solution.
- 2.Starting with FINAL playerPos. Moving according to capture points.
- 3.Each capture point: Pick a random chessman to make a move. Do this until no more point.
- 4.If picked chessman has no valid move, check it off and reroll new chessman.
- 5.If all chessman have no valid move and there are still capture points, reroll at number 2.
- 6.Randomize chessmanList order
*/

import LevelObject from "./Level_Object";
const cmMoves =  require("./Chessman_Moves_Generator").cmMoves;

type Cell = 0 | 1; // 0: empty; 1: target
type Position = [number, number];
type Chessman = "pawn" | "rook" | "bishop" | "knight" | "queen" | "king";

interface Generated_Puzzle {
    success: boolean,
    gridData: Cell[][],
    playerPos: Position,
    chessmanList: Chessman[]
}

const BOARD_SIZE: number = 6;

// first capture point is always true
function generateCapturePoints(moves: number): boolean[] {
    const capturePoints: boolean[] = [];
    for (let i=0; i < moves; i++) capturePoints.push(true);

    let removeAmounts: number[] = [];
    if (moves === 3) removeAmounts = [0, 1];
    else if (moves === 4) removeAmounts = [0, 1];
    else if (moves === 5) removeAmounts = [0, 1];
    else if (moves === 6) removeAmounts = [0, 1, 2];
    else if (moves === 7) removeAmounts = [0, 1, 2];

    let pickedRemoveAmount: number = removeAmounts[randomInt(0, removeAmounts.length)];

    while (pickedRemoveAmount > 0){
        // pick a random capture point to remove, but not the first (index 0)
        const pickedCpIndex = randomInt(1, moves); // moves = capturePoints.length
        // if not already removed -> remove and decrease amount
        if (capturePoints[pickedCpIndex] === true){
            capturePoints[pickedCpIndex] = false;
            pickedRemoveAmount--;
        }
    }
    
    return capturePoints;
}

// return [gridData, playPos, chessmanList]
// if process fails, return .success as false
function createPuzzle(capturePoints: boolean[]): Generated_Puzzle{
    // outputs
    let gridData: Cell[][] = [],
        chessmanList: Chessman[] = [],
        playerPos: Position = [randomInt(0, BOARD_SIZE), randomInt(0, BOARD_SIZE)];
    
    for (let y=0; y < BOARD_SIZE; y++) {
        const newRow: Cell[] = [];
        for (let x=0; x < BOARD_SIZE; x++) newRow.push(0);
        gridData.push(newRow);
    }

    const targets: Position[] = [];

    for (let cpIndex: number = 0; cpIndex < capturePoints.length; cpIndex++){
        const capture: boolean = capturePoints[cpIndex];
        const chessmanPool: Chessman[] = ["king", "knight", "bishop", "rook", "queen", "pawn"];
        let pickedCmIndex: number;

        // while no move is made yet
        while (chessmanList.length <= cpIndex) {
            pickedCmIndex = randomInt(0, chessmanPool.length);
            const pickedChessman: Chessman = chessmanPool[pickedCmIndex];

            // Designing check: if is not knight or pawn then have a chance to reroll
            if (pickedChessman !== "pawn" && pickedChessman !== "knight"){
                if (randomInt(0, 10) < 5.5) continue;
            }

            const movableTiles: Position[] = cmMoves[pickedChessman](targets, playerPos, capture);
            // has valid move(s)
            if (movableTiles.length > 0){
                chessmanList.push(pickedChessman); // add picked chessman

                // current playerPos: place target if capture
                if (capture) {
                    gridData[playerPos[1]][playerPos[0]] = 1; // place a target
                    targets.push([playerPos[0], playerPos[1]]);
                }

                // pick a random move for the next playerPos
                const pickedMove = movableTiles[randomInt(0, movableTiles.length - 1)];
                playerPos = pickedMove;
            }
            // has no valid moves
            else {
                chessmanPool.splice(pickedCmIndex, 1); // remove chessman from pool

                // check to return fail
                if (chessmanPool.length === 0) return {
                    success: false,
                    gridData: [],
                    playerPos: [0,0],
                    chessmanList: []
                }
            }
        }
    }

    return {
        success: true, 
        gridData,
        playerPos,
        chessmanList
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

    // randomize chessmanList
    const randomizedCmList: Chessman[] = [];
    while (newLevelData.chessmanList.length > 0){
        const pickedCmIndex: number = randomInt(0, newLevelData.chessmanList.length);
        randomizedCmList.push(newLevelData.chessmanList[pickedCmIndex]);
        newLevelData.chessmanList.splice(pickedCmIndex, 1);
    }

    this.gridData = newLevelData.gridData;
    this.playerPos = newLevelData.playerPos;
    this.chessmanList = randomizedCmList;
    this.timeLimit = calculatedTime;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

exports.PuzzleConstructor = PuzzleConstructor;

export {}