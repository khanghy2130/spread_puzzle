interface UserObject {
    nickname: string,
    roomID: string | null
}

interface PlayResult {
    nickname: string,
    time: number | null // null means not solved
}

interface RoomObject {
    roomID: string,
    hostID: string, // user socket id
    option_moves: number,
    option_time: number, // number of seconds
    results: PlayResult[] // array of PlayResults 
}

const usersList: {[key: string]: UserObject} = {}; // [key]socketID : UserObjects
const roomsList: {[key: string]: RoomObject} = {}; // contains RoomObjects



exports.manager = function(socket: any) : void {

    console.log(socket.id.slice(-4), "connected!");
    socket.on("disconnect", () => {
        console.log(socket.id.slice(-4), "disconnected.");
    });

        ///////////////////////////// dummy event
    socket.on("justtalk", (msg: string) => {
        console.log(msg, "talked...")
    });

    /* 
            MAIN PAGE events
        update-user: {nickname, roomID}  << join or create a room

            ROOM PAGE events

            PLAY PAGE events

    */


    

}

export {}