import React, { useEffect, useState, useRef } from 'react';

import LevelObject from '../../../server/Level_Object';
import RoomObject from '../../../server/Room_Object';

interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: (receivedLevelObject: RoomObject) => void,
    roomID: string,
    nickname: string
};

const Play_Page = ({socket, levelObject, resetRoomPage, roomID, nickname} : propObject) => {
    const time_display = useRef<HTMLHeadingElement>(null);
    let timeLeft: number = levelObject.timeLimit; // in second
    let intervalID: any; // ID of the countdown interval

    const [progress, setProgress] = useState<"playing"|"incomplete"|"complete">("playing");

    useEffect(()=>{
        console.log("play_page useEffect running"); ///////
        if (typeof window !== 'undefined') {
            initializeGame();

            // adding listeners
            socket.on("end-game", (receivedRoomObject : RoomObject) => {
                resetRoomPage(receivedRoomObject);
            });
        }

        return () => {
            // removing listeners
            socket.off("end-game");
        }
    // eslint-disable-next-line
    }, []);

    function initializeGame(){
        intervalID = setInterval(()=>{
            if (timeLeft > 0){
                timeLeft--; // decrease the timeLimit
                if (time_display && time_display.current){
                    time_display.current.innerText = `Time Remaining: ${timeLeft} sec`;
                }
            } else {
                puzzleIncomplete();
            }
        }, 1000);

    }

    // called when time's up
    function puzzleIncomplete(){
        window.clearInterval(intervalID); // stop countdown
        setProgress("incomplete");
        socket.emit("play-report", roomID, null);
    }

    // called when the puzzle is solved
    function puzzleComplete(){
        window.clearInterval(intervalID); // stop countdown
        setProgress("complete");
        socket.emit("play-report", roomID, levelObject.timeLimit - timeLeft);
    }

    return (
        <div>
            <button onClick={puzzleComplete}>Click Me To Win</button>
            <h3>Status: {progress}</h3>
            <h3 ref={time_display}>Time Remaining: {timeLeft} sec</h3>
        </div>
    );
};

export default Play_Page;