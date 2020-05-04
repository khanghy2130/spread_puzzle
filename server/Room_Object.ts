interface PlayResult {
    nickname: string,
    time: number | null // null means not solved
}

interface User {
    id: string,
    nickname: string
}

export default interface RoomObject {
    users: User[], // ID as key, nickname as value. first user is host
    option_moves: number,
    option_time: number, // number of seconds
    results: PlayResult[], // array of PlayResults
    timerID: number | null // if is a number then the game is in progress
}
