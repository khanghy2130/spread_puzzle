import RoomObject from './Room_Object';
import LevelObject from './Level_Object';

// [key]roomID : RoomObjects
const roomsList: {[key: string]:  RoomObject} = {}; 


function leaveRoom(socket: any, roomID: string){
    if (!roomsList[roomID]) return;

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

// called when all reports received or server timer is up
function reopenRoom(socket: any, roomID: string){
    // set timerID to null
}

exports.manager = function(socket: any, namespace: any) : void {

    ////////////////////////
    console.log(socket.id.slice(-4), "connected!");
    
    socket.on("disconnect", () => {
        console.log(socket.id.slice(-4), "disconnected.");

        // if currently in a room
        if (socket.currentRoomID) {
            leaveRoom(socket, socket.currentRoomID);
        }
    });


    /*                         ->> = receive    <<- = send
            MAIN PAGE events
        ->> enter-room:   {nickname, roomID}     @join or create a room (roomID = null)
        <<- join-success: {room_object}
        <<- join-fail:    {message}              @when room doesn't exist or is in progress
        <<- update-room:  {room_object}          @when host saves options or someone leaves/joins

            ROOM PAGE events
        ->> leave-room
        ->> save-options: {option_moves, option_time}   @host clicks save
        ->> start-game                          @host clicks start
        <<- start-game:   {play_object}

            PLAY PAGE events
        ->> play-report:  {nickname, time}
        <<- end-game:     {results}             @when server timer fires or all play-reports received

    */

    socket.on("enter-room", (nickname: string, roomID: string | null) => {
        // creating a new room?
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
            // stop the joining if room is in progress
            if (roomsList[roomID].timerID !== null) {
                socket.emit("join-fail", `Room ${roomID} has started the game.`);
                return;
            }

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
            socket.emit("join-fail", `Room ${roomID} doesn't exist.`);
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

        // GENERATE THE LEVEL
        const level_object: LevelObject = {
            gridData : [],
            chessmanList : [],
            timeLimit : roomsList[roomID].option_time * 2 //////////////// 30
        }

        // SEND THE LEVEL TO CLIENTS
        namespace.to(roomID).emit("start-game", level_object);

        // SET UP TIMEOUT FOR SERVER, in case clients won't respond
        roomsList[roomID].timerID = setTimeout(()=>{
            console.log("timeout works");

            //////////////////// 
            // reopenRoom
        }, 2000);
    });

    socket.on("play-report", (roomID: string, nickname: string, finishedTime: number) => {
        if (!roomsList[roomID]) return;

        const results = roomsList[roomID].results;

        // no report yet? or time is null?
        if (results.length === 0 || finishedTime === null){
            results.push({nickname: nickname, time: finishedTime});
        }
        else {
            // insert in a sorted manner into results list
            for (let i=results.length-1; i >= 0; i--){
                // if this report has slower or equal time then insert it here
                // @ts-ignore
                if (finishedTime <= results[i].time){
                    results.splice(i + 1, 0, {nickname: nickname, time: finishedTime});
                    break;
                }
            }
        }

        // check if all reports are collected
        // reopenRoom
    });
}

export {}