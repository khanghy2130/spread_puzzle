import LevelObject from "./Level_Object";

const PuzzleConstructor = function(this: LevelObject, moves: number, calculatedTime: number){
    this.gridData = [
        [0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 2, 0],
        [0, 1, 0, 0, 0]
    ];
    this.chessmanList = ["pawn", "bishop", "knight", "rook", "queen", "king"];
    this.timeLimit = calculatedTime;
} as any as { new (moves: number, calculatedTime: number): LevelObject; };

exports.PuzzleConstructor = PuzzleConstructor;

export {}