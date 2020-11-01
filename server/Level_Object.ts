// Level Object to send to clients when puzzle is created
import RoomObject from "./Room_Object";

type Pos = [number, number];

// types for final output to client
interface BaseOutput {
    tileType: RoomObject["options"]["type"],
    tileFactor: number,
    offsetFactors: [number, number],
    posData: Pos[]
}
interface PieceGroupOutput {
    rootPosOnBase: Pos, // solution position
    posDataArray: Pos[][], // all rotations posData
    color: string,
    rootIsUpward?: boolean // triangle only
}

export default interface LevelObject{
    timeLimit: number,
    base: BaseOutput,
    pieces: PieceGroupOutput[]
}