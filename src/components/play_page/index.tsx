import React, { useEffect, useState } from 'react';

import LevelObject from '../../../server/Level_Object';

interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: () => void,
    roomID: string,
    nickname: string
};

const Play_Page = ({socket, levelObject, resetRoomPage, roomID, nickname} : propObject) => {
    let timeLeft: number = levelObject.timeLimit; // in second
    let intervalID: any; // ID of the countdown interval

    const [progress, setProgress] = useState<"playing"|"incomplete"|"complete">("playing");

    useEffect(()=>{
        console.log("play_page useEffect running"); ///////
        if (typeof window !== 'undefined') {
            initializeGame();

            // adding listeners
            socket.on("end-game", (receivedLevelObject : LevelObject) => {
                console.log("game ended!");
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
                console.log(timeLeft); ////////////////////
            } else {
                puzzleIncomplete();
            }
        }, 1000);

    }

    // called when time's up
    function puzzleIncomplete(){
        console.log("Time's up!"); /////////////

        window.clearInterval(intervalID); // stop countdown
        setProgress("incomplete");
        socket.emit("play-report", roomID, nickname, null);

    }

    // called when the puzzle is solved
    function puzzleComplete(){
        console.log("Completed in", levelObject.timeLimit - timeLeft); ////////////////

        window.clearInterval(intervalID); // stop countdown
        setProgress("complete");
        socket.emit("play-report", roomID, nickname, levelObject.timeLimit - timeLeft);
    }

    return (
        <div>
            <button onClick={puzzleComplete}>Win</button>
            <h3>{progress}</h3>
        </div>
    );
};

export default Play_Page;