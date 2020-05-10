type Cell = 0 | 1 | 2;
type Grid_Data = Cell[][];
type Position = [number, number];

// each function will return an array with type: Position[]
// gridData is used to locate targets, but king and knight won't use it
type Output = (gridData: Grid_Data, playerPos: Position) => Position[];
type Backward_Pawn_Output = (gridData: Grid_Data, playerPos: Position, capture: boolean) => Position[];

// return false if the given position is out of the board
function checkOnGrid(pos: Position){
    if (Math.min(pos[0], pos[1]) < 0) return false; // check min limit
    if (Math.max(pos[0], pos[1]) >= 5) return false; // check max limit
    return true;
}


const king: Output = (gridData: Grid_Data, playerPos: Position) => {
    // king can move 1 step in each of the 8 directions
    // king's moves can't be blocked

    const allVelocities: [number, number][] = [
        [0, -1], // up
        [1, -1], // up right
        [1, 0], // right
        [1, 1], // down right
        [0, 1], // down
        [-1, 1], // down left
        [-1, 0], // left
        [-1, -1] // up left
    ];
    
    // map into Positions then filter out the off-grid ones
    const results: Position[] = allVelocities.map(
        (vel: [number, number]) => {
            const pos: Position = [playerPos[0] + vel[0], playerPos[1] + vel[1]];
            return pos;
        }
    ).filter((pos: Position) => checkOnGrid(pos));

    return results;
};

const knight: Output = (gridData: Grid_Data, playerPos: Position) => {
    // knight's moves can't be blocked

    return [[2,2]];
};

const queen: Output = (gridData: Grid_Data, playerPos: Position) => {
    return [[2,2]];
};

const bishop: Output = (gridData: Grid_Data, playerPos: Position) => {
    return [[2,2]];
};

const rook: Output = (gridData: Grid_Data, playerPos: Position) => {
    return [[2,2]];
};

// for gameplay
const pawnForward: Output = (gridData: Grid_Data, playerPos: Position) => {
    return [[2,2]];
};

// for puzzle generation
const pawnBackward: Backward_Pawn_Output = (gridData: Grid_Data, playerPos: Position, capture: boolean) => {
    return [[2,2]];
};



export default {king, knight, queen, bishop, rook, pawnForward, pawnBackward}