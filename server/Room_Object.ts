// Room Object for roomsList
// contains game related user-options to create LevelObject

interface PlayReport {
    nickname: string,
    time: number | null // null means not solved
}

interface User {
    id: string,
    nickname: string
}

// options that the host sets
interface Options {
    moves: number,
    time: number // in second
}

export default interface RoomObject {
    roomID: string, // 4 digits number / key
    users: User[], // ID as key, nickname as value. first user is host
    results: PlayReport[], // array of PlayReports
    timerID: any, // if not null then the game is in progress
    playingUsers: string[], // array of socket ids of players that started playing

    options: Options
}
