import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

import "./style.scss";
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
    // store timeLeft as ref
    const timeLeft = useRef<any>({ value: levelObject.timeLimit });
    //const [timeLeft, setTimeLeft] = useState<number>(levelObject.timeLimit);
    const [timeLimitIntervalID, setTimeLimitIntervalID] = useState<any>(null); // ID of the time limit countdown interval

    // begin countdown 
    const begin_countdown_display = useRef<HTMLHeadingElement>(null);
    let beginCountdownIntervalID: any; // ID of the begin countdown interval

    const [progress, setProgress] = useState<"preparing"|"playing"|"incomplete"|"complete">("preparing");

    useEffect(()=>{
        console.log("play_page useEffect running"); ///////
        if (typeof window !== 'undefined') {
            initializeGame();

            socket.on("end-game", (receivedRoomObject : RoomObject) => {
                resetRoomPage(receivedRoomObject);
            });
        }

        return () => {
            socket.off("end-game");
            window.clearInterval(beginCountdownIntervalID); // stop countdown
            window.clearInterval(timeLimitIntervalID); // stop countdown
        }
    // eslint-disable-next-line
    }, []);

    useLayoutEffect(()=>{
        console.log("Just changed: " , progress);
        // after begin countdown is done
        if (progress === "playing"){
            setTimeLimitIntervalID(setInterval(()=>{
                if (timeLeft.current.value > 0){
                    timeLeft.current.value--;
                    if (time_display && time_display.current){
                        time_display.current.innerText = `Time Remaining: ${timeLeft.current.value} sec`;
                    }
                } else {
                    setProgress("incomplete");
                }
            }, 1000));
        }
        // after puzzle is solved
        else if (progress === "complete"){
            window.clearInterval(timeLimitIntervalID); // stop countdown interval
            socket.emit("play-report", roomID, levelObject.timeLimit - timeLeft.current.value);
        }
        // after time limit countdown is done
        else if (progress === "incomplete"){
            window.clearInterval(timeLimitIntervalID); // stop countdown interval
            socket.emit("play-report", roomID, null);
        }

    // eslint-disable-next-line
    }, [progress]);

    // called when page loads
    // load level data. initiate begin countdown
    function initializeGame(){
        let beginCountdownLeft = 4;
        beginCountdownIntervalID = setInterval(()=>{
            if (beginCountdownLeft > 0){
                beginCountdownLeft--; // decrease the timeLimit
                if (begin_countdown_display && begin_countdown_display.current){
                    begin_countdown_display.current.innerText = `Starting in ${beginCountdownLeft}`;
                }
            } else {
                window.clearInterval(beginCountdownIntervalID); // stop begin countdown
                setProgress("playing");
            }
        }, 1000);

    }



    return (
        <main id="play-page-main">
            <h1 ref={begin_countdown_display}>begin</h1>
            <h3 ref={time_display}>Time Remaining: {timeLeft.current.value} sec</h3>
            <h3>Status: {progress}</h3>
            {
                (progress !== "playing") ? null:
                <button onClick={() => {setProgress("complete");}}>Click Me To Win</button>
            }
        </main>
    );
};

export default Play_Page;