import React, { useEffect } from 'react';

import LevelObject from '../../../server/Level_Object';

interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: () => void
};

const Play_Page = ({socket, levelObject, resetRoomPage} : propObject) => {
    
    useEffect(()=>{
        console.log("play_page useEffect running"); ///////
        if (typeof window !== 'undefined') {
            // adding listeners
            socket.on("end-game", (receivedLevelObject : LevelObject) => {

            });
        }

        return () => {
            // removing listeners
            socket.off("end-game");
        }
    // eslint-disable-next-line
    }, []);

    return (
        <div>
            play page
        </div>
    );
};

export default Play_Page;