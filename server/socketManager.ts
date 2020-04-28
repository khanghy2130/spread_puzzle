const usersList = {}; // { nickname, roomID }
const roomsList = {}; // { roomID, hostID, {moves, timelimit} }

exports.manager = function(socket: any) : void {

    console.log('a user connected');
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });

        ///////////////////////////// dummy event
    socket.on("justtalk", (msg: string, num: number) => {
        console.log(msg, num)
    });

    /* 
            MAIN PAGE events
        update-user: {nickname, roomID}  << join or create a room

            ROOM PAGE events

            PLAY PAGE events

    */
    

}

export {}