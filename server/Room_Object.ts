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


type TileType = "hexagon" | "triangle" | "square";
// options that the host sets
interface Options {
    time: number, // in second
    type: TileType,
    figure_size: number,
    pieces_amount: number,
    lines_amount: number
}

export default interface RoomObject {
    roomID: string, // 4 digits number / key
    users: User[], // ID as key, nickname as value. first user is host
    results: PlayReport[], // array of PlayReports
    timerID: any, // if not null then the game is in progress
    playingUsers: string[], // array of socket ids of players that started playing

    options: Options
}
