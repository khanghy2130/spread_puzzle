interface PlayResult {
    nickname: string,
    time: number | null // null means not solved
}

interface RoomObject {
    users: string[], // list of user socket ID. first one is host
    option_moves: number,
    option_time: number, // number of seconds
    results: PlayResult[], // array of PlayResults
    timerID: number | null // if is a number then the game is in progress
}

// [key]roomID (4 digits) : RoomObjects
const roomsList: {[key: string]: RoomObject} = {}; 



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