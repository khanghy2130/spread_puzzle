// Level Object to send to clients


type Cell = 0 | 1 | 2; // 0: empty; 1: target; 2: blocker
type Chessman = "pawn" | "rook" | "bishop" | "knight" | "queen" | "king";

export default interface LevelObject{
    playerPos: [number, number],
    gridData: Cell[][],
    chessmanList: Chessman[],
    timeLimit: number // number of exact seconds
}