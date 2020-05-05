interface PlayResult {
    nickname: string,
    time: number | null // null means not solved
}

interface User {
    id: string,
    nickname: string
}

export default interface RoomObject {
    roomID: string, // 4 digits number / key
    users: User[], // ID as key, nickname as value. first user is host
    option_moves: number,
    option_time: number, // 1 unit equals 30 seconds (ex: 3 = 90 sec)
    results: PlayResult[], // array of PlayResults
    timerID: number | null // if is a number then the game is in progress
}