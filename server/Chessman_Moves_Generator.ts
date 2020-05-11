type Position = [number, number];

// each function will return an array with type: Position[] of movable positions
type Output = (targets: Position[], playerPos: Position) => Position[];
type Pawn_Output = (targets: Position[], playerPos: Position, capture: boolean) => Position[];

// return false if the given position is out of the board
function checkOnGrid(pos: Position): boolean{
    if (Math.min(pos[0], pos[1]) < 0) return false; // check min limit
    if (Math.max(pos[0], pos[1]) >= 5) return false; // check max limit
    return true;
}

// return true if the given position has target on it
function hasTarget(targets: Position[], pos: Position){
    return targets.some((targetPos: Position) => {
        return targetPos[0] === pos[0] && targetPos[1] === pos[1];
    });
}

// well actually all chessman at generation stage are blockable
function blockableMoves(
    targets: Position[], 
    playerPos: Position, 
    allVelocities: [number, number][]
): Position[] {
    const results: Position[] = [];
    allVelocities.forEach((vel: [number, number]) => {
        let nextPos: Position = [playerPos[0] + vel[0], playerPos[1] + vel[1]];
        
        // on grid and no target there?
        while (checkOnGrid(nextPos) && !hasTarget(targets, nextPos)){
            results.push([nextPos[0], nextPos[1]]); // add pos
            nextPos = [nextPos[0] + vel[0], nextPos[1] + vel[1]]; // set next one
        }
    });

    return results;
}

const king: Output = (targets: Position[], playerPos: Position) => {
    // king can move 1 step in each of the 8 directions | can't be blocked

    const allVelocities: [number, number][] = [
        [0, -1], // up
        [1, -1], // right up
        [1, 0], // right
        [1, 1], // right down
        [0, 1], // down
        [-1, 1], // left down
        [-1, 0], // left
        [-1, -1] // left up
    ];
    
    // map into Positions then filter out the off-grid and target ones
    const results: Position[] = allVelocities.map(
        (vel: [number, number]) => {
            const pos: Position = [playerPos[0] + vel[0], playerPos[1] + vel[1]];
            return pos;
        }
    ).filter((pos: Position) => (checkOnGrid(pos) && !hasTarget(targets, pos)));

    return results;
};

const knight: Output = (targets: Position[], playerPos: Position) => {
    // knight has 8 possible moves

    const allVelocities: [number, number][] = [
        [2, -1], // 30 (deg)
        [1, -2], // 60
        [-1, -2], // 120
        [-2, -1], // 150
        [-2, 1], // 210
        [-1, 2], // 240
        [1, 2], // 300
        [2, 1] // 330
    ];

    // map into Positions then filter out the off-grid and target ones
    const results: Position[] = allVelocities.map(
        (vel: [number, number]) => {
            const pos: Position = [playerPos[0] + vel[0], playerPos[1] + vel[1]];
            return pos;
        }
    ).filter((pos: Position) => (checkOnGrid(pos) && !hasTarget(targets, pos)));

    return results;
};

const bishop: Output = (targets: Position[], playerPos: Position) => {
    // bishop moves diagonally

    const allVelocities: [number, number][] = [
        [-1, -1], // left up
        [-1, 1], // left down
        [1, 1], // right down
        [1, -1] // right up
    ];

    return blockableMoves(targets, playerPos, allVelocities);
};

const rook: Output = (targets: Position[], playerPos: Position) => {
    // rook moves vertically and horizontall

    const allVelocities: [number, number][] = [
        [0, -1], // up
        [0, 1], // down
        [-1, 0], // left
        [1, 0] // right
    ];

    return blockableMoves(targets, playerPos, allVelocities);
};

const queen: Output = (targets: Position[], playerPos: Position) => {
    // queen has all moves bishop and rook have
    
    const allVelocities: [number, number][] = [
        [-1, -1], // left up
        [-1, 1], // left down
        [1, 1], // right down
        [1, -1], // right up
        [0, -1], // up
        [0, 1], // down
        [-1, 0], // left
        [1, 0] // right
    ];

    return blockableMoves(targets, playerPos, allVelocities);
};

const pawn: Pawn_Output = (targets: Position[], playerPos: Position, capture: boolean) => {
    // pawn can move BACKWARD 1 step if is not a capture move
    // can move DOWN-DIAGONALLY 1 step if is a capture (onto current pos) move

    const results: Position[] = [];
    let nextPos: Position;
    // backward
    nextPos = [playerPos[0], playerPos[1] + 1];
    if (checkOnGrid(nextPos) && !hasTarget(targets, nextPos) && !capture){
        results.push(nextPos);
    }
    // down left
    nextPos = [playerPos[0] - 1, playerPos[1] + 1];
    if (checkOnGrid(nextPos) && !hasTarget(targets, nextPos) && capture){
        results.push(nextPos);
    }
    // down right
    nextPos = [playerPos[0] + 1, playerPos[1] + 1];
    if (checkOnGrid(nextPos) && !hasTarget(targets, nextPos) && capture){
        results.push(nextPos);
    }

    return results;
};



export default {king, knight, bishop, rook, queen, pawn}