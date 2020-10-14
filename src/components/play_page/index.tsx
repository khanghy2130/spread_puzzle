import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

import "./style.scss";
import LevelObject from '../../../server/Level_Object';
import RoomObject from '../../../server/Room_Object';


// timeout or give up: setProgress("incomplete");   win: setProgress("complete");

interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: (receivedLevelObject: RoomObject) => void,
    roomID: string,
    nickname: string,
    
    getText: (tree: string[]) => string
};

const Play_Page = ({socket, levelObject, resetRoomPage, roomID, nickname} : propObject) => {
    const time_display = useRef<HTMLHeadingElement>(null);
    // store timeLeft as ref
    const timeLeft = useRef<any>({ value: levelObject.timeLimit });
    const [timeLimitIntervalID, setTimeLimitIntervalID] = useState<any>(null); // ID of the time limit countdown interval

    // begin countdown 
    const begin_countdown_display = useRef<HTMLHeadingElement>(null);
    let beginCountdownIntervalID: any; // ID of the begin countdown interval

    // main game state status
    const [progress, setProgress] = useState<"preparing"|"playing"|"incomplete"|"complete">("preparing");
    
    // -- Control States --
    ////// const [name, setName] = useState<type>(initialValue);

    // socket io events
    useEffect(()=>{
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0); // scroll to top when play page loaded

            socket.on("end-game", (receivedRoomObject : RoomObject) => {
                resetRoomPage(receivedRoomObject);
            });
        }

        return () => {
            socket.off("end-game");
        }
    // eslint-disable-next-line
    }, []);

    // progress status handler (when progress just changed)
    useLayoutEffect(()=>{
        console.log("Just changed: " , progress);
        // after begin countdown is done
        if (progress === "preparing"){
            // initiate begin-countdown
            let beginCountdownLeft = 3;
            // eslint-disable-next-line
            beginCountdownIntervalID = setInterval(()=>{
                if (beginCountdownLeft > 0){
                    beginCountdownLeft--; // decrease the timeLimit
                    if (begin_countdown_display && begin_countdown_display.current){
                        begin_countdown_display.current.innerText = "" + beginCountdownLeft;
                    }
                } else {
                    window.clearInterval(beginCountdownIntervalID); // stop begin countdown
                    setProgress("playing");
                }
            }, 800);

            loadLevel();
        }
        else if (progress === "playing"){
            // start the time limit countdown
            setTimeLimitIntervalID(setInterval(()=>{
                if (timeLeft.current.value > 0){
                    timeLeft.current.value--;
                    if (time_display && time_display.current){
                        time_display.current.innerText = timeLeft.current.value;
                    }
                } else {
                    setProgress("incomplete");
                    window.clearInterval(timeLimitIntervalID); // stop countdown interval
                }
            }, 1000));
        }
        // after puzzle is solved
        else if (progress === "complete"){
            socket.emit("play-report", roomID, levelObject.timeLimit - timeLeft.current.value);
        }
        // after time limit countdown is done
        else if (progress === "incomplete"){
            socket.emit("play-report", roomID, null);
        }

        return () => {
            window.clearInterval(beginCountdownIntervalID); // stop countdown
            window.clearInterval(timeLimitIntervalID); // stop countdown
        }
    // eslint-disable-next-line
    }, [progress]);

    /*
    // check win whenever gridData changes
    useEffect(() => {
        if (!gridData.flat(1).includes(1)){
            setProgress("complete");
        }
    }, [gridData]);
    */

    // called when play page starts
    function loadLevel(): void{
        // load game states
        ///////////
    }


    return (
        <main id="play-page-main">

            {/* horizonal modal */}
            {(progress === "playing") ? null : (
                <div id="play-page-modal">
                    {
                        (progress === "preparing") ? (<div>
                            <h3>Fit all pieces together!</h3>
                            <h2>Starting in...</h2>
                            <h2 className="blue-color" ref={begin_countdown_display}>3</h2>
                        </div>) :
                        (progress === "complete") ? (<div>
                            <h2 className="blue-color">Puzzle solved!</h2>
                            <h3>Your time:</h3>
                            <h3 className="green-color">{levelObject.timeLimit - timeLeft.current.value} seconds</h3>
                        </div>) :
                        (progress === "incomplete") ? (<div>
                            <h2 className="red-color">Game over!</h2>
                        </div>) : null
                    }
                </div>
            )}

            {/* Timer text */}
            <h3 id="time-left-text">Time left: &nbsp;<span ref={time_display}>{timeLeft.current.value}</span> seconds</h3>

            <button onClick={() => {setProgress("complete")}}>Win</button>
            <button onClick={() => {setProgress("incomplete")}}>Lose</button>

        </main>
    );
};

export default Play_Page;