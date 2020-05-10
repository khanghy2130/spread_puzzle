import RoomObject from './Room_Object';
import LevelObject from './Level_Object';
const PuzzleConstructor = require('./PuzzleConstructor').PuzzleConstructor;


const TIME_FACTOR: number = 30; // 30

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
    // there are other user(s) and room is not in progress? => update room for others
    else if (roomsList[roomID].timerID === null){
        socket.to(roomID).emit('update-room', roomsList[roomID]);
    }
}

function startGame(namespace: any, roomObj: RoomObject){
    // GENERATE THE LEVEL
    const level_object : LevelObject = new PuzzleConstructor(
        roomObj.option_moves,
        roomObj.option_time * TIME_FACTOR
    );

    // SET UP LIST OF PLAYING USERS
    const playingUsers: string[] = [];
    roomObj.users.forEach((user: any) => {
        playingUsers.push(user.id);
    });
    roomObj.playingUsers = playingUsers;

    // CLEAR PREVIOUS RESULTS
    roomObj.results = [];

    // SEND THE LEVEL TO CLIENTS
    namespace.to(roomObj.roomID).emit("start-game", level_object);

    // SET UP TIMEOUT FOR SERVER
    // +10 extra seconds in case client responses are delayed or won't come
    roomObj.timerID = setTimeout(()=>{
        endGame(namespace, roomObj.roomID);
    }, (roomObj.option_time * TIME_FACTOR + 10) * 1000);
}

// called when a report is received
function checkoffReport(namespace: any, socket: any, roomID: string, finishedTime: number | null){
    if (!roomsList[roomID]) return;

    // if this room is in progress
    if (roomsList[roomID].timerID){
        // find and checkoff in playingUsers array
        const playingUsers = roomsList[roomID].playingUsers;
        let found: boolean = false; // if false then there is no need to get the report
        for (let i=0; i < playingUsers.length; i++){
            if (playingUsers[i] === socket.id){
                playingUsers.splice(i, 1);
                found = true;
                break;
            }
        }
        if (!found) return; // just a duplicated report, stop the function

        const results = roomsList[roomID].results;
        // no report yet? or finishedTime is null?
        if (results.length === 0 || finishedTime === null){
            results.push({nickname: socket.nickname, time: finishedTime});
        }
        // finishedTime is not null
        else {
            // insert in a sorted manner into results list
            for (let i=0; i <= results.length; i++){
                // if no more other time to compare with
                if (i === results.length){
                    results.push({nickname: socket.nickname, time: finishedTime});
                    break;
                }

                // insert if the comparing time is null or this time is smaller (faster)
                // @ts-ignore
                if (results[i].time === null || finishedTime < results[i].time){
                    results.splice(i, 0, {nickname: socket.nickname, time: finishedTime});
                    break;
                }
            }
        }

        

        // check if all reports received
        if (playingUsers.length === 0) endGame(namespace, roomID);
    }
}

function endGame(namespace: any, roomID: string){
    if (!roomsList[roomID]) return;

    clearTimeout(roomsList[roomID].timerID); // clear server timer
    roomsList[roomID].timerID = null; // reopen room
    
    setTimeout(()=>{
        // EMIT TO ALL PLAYING USERS
        namespace.to(roomID).emit("end-game", roomsList[roomID]);
    }, 2000);
}

exports.manager = function(socket: any, namespace: any) : void {

    ////////////////////////
    console.log(socket.id.slice(-4), "connected!");
    
    socket.on("disconnect", () => {
        console.log(socket.id.slice(-4), "disconnected.");

        // if currently in a room
        if (socket.currentRoomID) {
            // send report in case is in a game
            checkoffReport(namespace, socket, socket.currentRoomID, null);
            leaveRoom(socket, socket.currentRoomID); //leave room
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
                timerID: null,
                playingUsers: []
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
            socket.nickname = nickname; // also make a nickname prop

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
        startGame(namespace, roomsList[roomID]);        
    });

    socket.on("play-report", (roomID: string, finishedTime: number) => {
        if (!roomsList[roomID]) return;
        checkoffReport(namespace, socket, roomID, finishedTime);
    });
}

export {}