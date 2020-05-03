interface PlayResult {
    nickname: string,
    time: number | null // null means not solved
}

interface User {
    id: string,
    nickname: string
}

interface RoomObject {
    users: User[], // ID as key, nickname as value. first user is host
    option_moves: number,
    option_time: number, // number of seconds
    results: PlayResult[], // array of PlayResults
    timerID: number | null // if is a number then the game is in progress
}

// [key]roomID (4 digits) : RoomObjects
const roomsList: {[key: string]: RoomObject} = {}; 



exports.manager = function(socket: any) : void {

    // connected...
    console.log(socket.id.slice(-4), "connected!");
    
    socket.on("disconnect", () => {
        console.log(socket.id.slice(-4), "disconnected.");
    });


    /*                          >> = receive    << = send
            MAIN PAGE events
        >> enter-room: {nickname, roomID}  join or create a room (roomID = null)
        << join-success: {room_object}
        << join-fail

            ROOM PAGE events
        << update-room: {room_object}   when host updates options or someone leaves

            PLAY PAGE events

    */

    socket.on("enter-room", (nickname: string, roomID: string | null) => {
        

        // create room if needed
        if (roomID === null){
            function r(): number { return Math.floor(Math.random() * 10); }
            let newRoomID : string;
            do {
                newRoomID = "" + r() + r() + r() + r();
            } while(roomsList[newRoomID]); // reroll if has collided ID

            // setup default room object
            roomsList[newRoomID] = {
                users: [],
                option_moves: 3,
                option_time: 60,
                results: [],
                timerID: null
            };
            roomID = newRoomID;
        }
        
        // if room exists
        if (roomsList[roomID]){
            // leave current room if already in a room
            if (socket.currentRoom) {
                socket.leave(socket.currentRoom);
                socket.currentRoom = null;
            }
            // join and set up new room as current room
            socket.join(roomID);
            socket.currentRoom = roomID;

            // add this user
            roomsList[roomID].users.push({
                id: socket.id,
                nickname: nickname
            });

            socket.emit("join-success", roomsList[roomID]); // notify client
        }
        else {
            socket.emit("join-fail");
        }
    });
    

}

export {}