// Level Object to send to clients


type Cell = 0 | 1; // 0: empty; 1: target
type Chessman = "pawn" | "rook" | "bishop" | "knight" | "queen" | "king";

export default interface LevelObject{
    playerPos: [number, number],
    gridData: Cell[][],
    chessmanList: Chessman[],
    timeLimit: number // number of exact seconds
}