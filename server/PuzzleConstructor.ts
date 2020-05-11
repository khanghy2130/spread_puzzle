import LevelObject from "./Level_Object";

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
    let pickedRemoveAmount: number = removeAmounts[Math.floor(Math.random() * removeAmounts.length)];
    while (pickedRemoveAmount > 0){
        // pick a random capture point to remove, but not the first (0)
        const pickedCapturePointIndex = Math.floor(Math.random() * (moves - 1) + 1);
        // if not already removed -> remove and decrease amount
        if (capturePoints[pickedCapturePointIndex] === true){
            capturePoints[pickedCapturePointIndex] = false;
            pickedRemoveAmount--;
        }
        else continue; // continue to pick again
    }

    return capturePoints;
}

const PuzzleConstructor = function(this: LevelObject, moves: number, calculatedTime: number){

    // final data
    this.gridData = [
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 1, 0, 0],
        [0, 1, 0, 2, 0],
        [0, 0, 0, 0, 0]
    ];
    this.chessmanList = ["pawn", "bishop", "knight", "rook", "queen", "king"];
    this.timeLimit = calculatedTime;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

exports.PuzzleConstructor = PuzzleConstructor;

export {}