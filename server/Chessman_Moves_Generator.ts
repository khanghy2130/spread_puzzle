type _Position = [number, number];

// each function will return an array with type: _Position[] of movable positions
type Output = (targets: _Position[], playerPos: _Position) => _Position[];
type Pawn_Output = (targets: _Position[], playerPos: _Position, capture: boolean) => _Position[];

const BOARD_SIZE: number = 6;

// return false if the given position is out of the board
function checkOnGrid(pos: _Position): boolean{
    if (Math.min(pos[0], pos[1]) < 0) return false; // check min limit
    if (Math.max(pos[0], pos[1]) >= BOARD_SIZE) return false; // check max limit
    return true;
}

// return true if the given position has target on it
function hasTarget(targets: _Position[], pos: _Position){
    return targets.some((targetPos: _Position) => {
        return targetPos[0] === pos[0] && targetPos[1] === pos[1];
    });
}

// well actually all chessman at generation stage are blockable
function blockableMoves(
    targets: _Position[], 
    playerPos: _Position, 
    allVelocities: [number, number][]
): _Position[] {
    const results: _Position[] = [];
    allVelocities.forEach((vel: [number, number]) => {
        let nextPos: _Position = [playerPos[0] + vel[0], playerPos[1] + vel[1]];
        
        // on grid and no target there?
        while (checkOnGrid(nextPos) && !hasTarget(targets, nextPos)){
            results.push([nextPos[0], nextPos[1]]); // add pos
            nextPos = [nextPos[0] + vel[0], nextPos[1] + vel[1]]; // set next one
        }
    });

    return results;
}

const king: Output = (targets: _Position[], playerPos: _Position) => {
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
    const results: _Position[] = allVelocities.map(
        (vel: [number, number]) => {
            const pos: _Position = [playerPos[0] + vel[0], playerPos[1] + vel[1]];
            return pos;
        }
    ).filter((pos: _Position) => (checkOnGrid(pos) && !hasTarget(targets, pos)));

    return results;
};

const knight: Output = (targets: _Position[], playerPos: _Position) => {
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
    const results: _Position[] = allVelocities.map(
        (vel: [number, number]) => {
            const pos: _Position = [playerPos[0] + vel[0], playerPos[1] + vel[1]];
            return pos;
        }
    ).filter((pos: _Position) => (checkOnGrid(pos) && !hasTarget(targets, pos)));

    return results;
};

const bishop: Output = (targets: _Position[], playerPos: _Position) => {
    // bishop moves diagonally

    const allVelocities: [number, number][] = [
        [-1, -1], // left up
        [-1, 1], // left down
        [1, 1], // right down
        [1, -1] // right up
    ];

    return blockableMoves(targets, playerPos, allVelocities);
};

const rook: Output = (targets: _Position[], playerPos: _Position) => {
    // rook moves vertically and horizontall

    const allVelocities: [number, number][] = [
        [0, -1], // up
        [0, 1], // down
        [-1, 0], // left
        [1, 0] // right
    ];

    return blockableMoves(targets, playerPos, allVelocities);
};

const queen: Output = (targets: _Position[], playerPos: _Position) => {
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

const pawn: Pawn_Output = (targets: _Position[], playerPos: _Position, capture: boolean) => {
    // pawn can move BACKWARD 1 step if is not a capture move
    // can move DOWN-DIAGONALLY 1 step if is a capture (onto current pos) move

    const results: _Position[] = [];
    let nextPos: _Position;
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



exports.cmMoves = {king, knight, bishop, rook, queen, pawn}

export {}