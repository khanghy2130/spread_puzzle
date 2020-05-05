import RoomObject from './Room_Object';

// [key]roomID : RoomObjects
const roomsList: {[key: string]:  RoomObject} = {}; 


function leaveRoom(socket: any, roomID: string){
    const usersList = roomsList[roomID].users;
    // find and remove this user from the users list
    for (let i=0; i < usersList.length; i++){
        if (usersList[i].id === socket.id){
            usersList.splice(i, 1); // remove user
            break;
        }
    }
    
    socket.leave(roomID); // leave the room
    
    // no more users? => remove room object
    if (usersList.length === 0){
        delete roomsList[roomID];
    }
    // there are other user(s)? => update room for others
    else {
        socket.to(roomID).emit('update-room', roomsList[roomID]);
    }
}

exports.manager = function(socket: any, namespace: any) : void {

    ////////////////////////
    console.log(socket.id.slice(-4), "connected!");
    
    socket.on("disconnect", () => {
        console.log(socket.id.slice(-4), "disconnected.");

        // call leaveRoom() if in a room
        if (socket.currentRoomID) leaveRoom(socket, socket.currentRoomID);

        // send report of 'unsolved' if the game is in progress
        
    });


    /*                         ->> = receive    <<- = send
            MAIN PAGE events
        ->> enter-room: {nickname, roomID}  @join or create a room (roomID = null)
        <<- join-success: {room_object}
        <<- join-fail
        <<- update-room: {room_object}   @when host saves options or someone leaves/joins

            ROOM PAGE events
        ->> leave-room
        ->> save-options  option_moves, option_time   @host clicks save
        ->> start-game     @host clicks start
        <<- start-game {play_object}

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
                roomID: newRoomID,
                users: [],
                option_moves: 3,
                option_time: 2,
                results: [],
                timerID: null
            };
            roomID = newRoomID;
        }
        
        // if room exists
        if (roomsList[roomID]){
            // leave current room if already in a room
            if (socket.currentRoomID) {
                socket.leave(socket.currentRoomID);
                socket.currentRoomID = null;
            }
            // join and set up new room as current room
            socket.join(roomID);
            socket.currentRoomID = roomID;

            // add this user
            roomsList[roomID].users.push({
                id: socket.id,
                nickname: nickname
            });

            socket.emit("join-success", roomsList[roomID]); // notify client
            socket.to(roomID).emit('update-room', roomsList[roomID]); //  update room for others
        }
        else {
            socket.emit("join-fail");
        }
    });
    
    socket.on("leave-room", (roomID: string) => {
        if (!roomsList[roomID]) return;

        leaveRoom(socket, roomID);
    });

    socket.on("save-options", (roomID: string, moves: number, time: number) => {
        if (!roomsList[roomID]) return;

        roomsList[roomID].option_moves = moves;
        roomsList[roomID].option_time = time;

        // update room for others
        socket.to(roomID).emit("update-room", roomsList[roomID]);
    });

    socket.on("start-game", (roomID: string) => {
        if (!roomsList[roomID]) return;

        namespace.to(roomID).emit("start-game");
    });
}

export {}