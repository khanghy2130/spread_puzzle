// Level Object to send to clients


type Cell = null | "target" | "player"; // null means empty cell
type Chessman = "pawn" | "rook" | "bishop" | "knight" | "queen" | "king";

export default interface LevelObject{
    gridData: Cell[][],
    chessmanList: Chessman[],
    timeLimit: number // number of exact seconds
}