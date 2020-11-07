import React, { useEffect, useState, useRef } from 'react';

import "./style.scss";
import LevelObject from '../../../server/Level_Object';
import RoomObject from '../../../server/Room_Object';
import CanvasVars from './CanvasVars';

import P5_Canvas from './CanvasComponent';
import downPNG from './images/down.png';
import leftPNG from './images/left.png';
import rightPNG from './images/right.png';

// timeout or give up: setProgress("incomplete");   win: setProgress("complete");

interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: (receivedLevelObject: RoomObject) => void,
    roomID: string,
    convertToTime: (seconds: number) => string,
    getText: (tree: string[]) => string
};


const Play_Page = ({socket, levelObject, resetRoomPage, roomID, convertToTime, getText} : propObject) => {
    const time_display = useRef<HTMLHeadingElement>(null);
    // store timeLeft as ref
    const timeLeft = useRef<any>({ value: levelObject.timeLimit });
    const [timeLimitIntervalID, setTimeLimitIntervalID] = useState<any>(null); // ID of the time limit countdown interval

    // begin countdown 
    const begin_countdown_display = useRef<HTMLHeadingElement>(null);
    let beginCountdownIntervalID: any; // ID of the begin countdown interval

    // confirm giving up
    let givingUp: boolean = false;
    let givingUpTimerID : NodeJS.Timeout;
    const give_up_button = useRef<HTMLButtonElement>(null);

    function onGiveUp(){
        if (!give_up_button || !give_up_button.current) return;

        // 1st click
        if (!givingUp) {
            give_up_button.current.innerText = "CONFIRM GIVING UP";
            givingUp = true;
            givingUpTimerID = setTimeout(()=>{
                if (typeof givingUp !== "undefined" && give_up_button && give_up_button.current) {
                    give_up_button.current.innerText = "Give up";
                    givingUp = false;
                }
            }, 3000);
        }
        // 2nd click
        else {
            give_up_button.current.hidden = true;
            clearTimeout(givingUpTimerID); // stop timer
            setProgress("incomplete");
        }
    }

    // main game state status
    type progressType = "preparing"|"playing"|"incomplete"|"complete";
    const [progress, setProgress] = useState<progressType>("preparing");

    // setting up CV default
    const [cv, setCv] = useState<CanvasVars>({
        imagesContainer: {
            baseImg: null,
            pieceImages: []
        },
    
        placedPieces: [],

        selectedPiece: {
            index: 0,
            isPlacing: false,
            nextRotate: null
        }
    });

    // socket io events
    useEffect(()=>{
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0); // scroll to top when page loaded
            // set time left text
            if (time_display && time_display.current){
                time_display.current.innerText = convertToTime(timeLeft.current.value);
            }

            socket.on("end-game", (receivedRoomObject : RoomObject) => {
                resetRoomPage(receivedRoomObject);
            });
        }

        return () => {
            socket.off("end-game");
        }
    // eslint-disable-next-line
    }, []);

    

    useEffect(()=>{
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
        }
        else if (progress === "playing"){
            // start the time limit countdown
            setTimeLimitIntervalID(setInterval(()=>{
                if (timeLeft.current.value > 0){
                    timeLeft.current.value--;
                    // set time left text
                    if (time_display && time_display.current){
                        time_display.current.innerText = convertToTime(timeLeft.current.value);
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
                            <h3 className="green-color">{convertToTime(levelObject.timeLimit - timeLeft.current.value)}</h3>
                        </div>) :
                        (progress === "incomplete") ? (<div>
                            <h2 className="red-color">Game over!</h2>
                        </div>) : null
                    }
                </div>
            )}

            <section id="canvas-section">
                {/* Timer text */}
                <h3 id="time-left-text">Time left:  <span ref={time_display}></span></h3>

                {/* Canvas */}
                <div id="canvas-parent">
                    {P5_Canvas(levelObject, cv, setCv, progress, setProgress)}
                </div>
            </section>
            
            <section id="control-section">
                
                <div id="control-buttons">
                    <div id="pieces-panel"></div>
                    <div id="selected-piece-controls">
                        <button onClick={() => {
                            cv.selectedPiece.isPlacing = true;
                            setCv(cv);
                        }}>
                            <img src={downPNG} alt="place button"/>
                        </button>
                        <button onClick={() => {
                            cv.selectedPiece.nextRotate = "left";
                            setCv(cv);
                        }}>
                            <img src={leftPNG} alt="rotate left button"/>
                        </button>
                        <button onClick={() => {
                            cv.selectedPiece.nextRotate = "right";
                            setCv(cv);
                        }}>
                            <img src={rightPNG} alt="rotate right button"/>
                        </button>
                    </div>
                </div>

                <div id="extra-buttons">
                    <div>
                        <button id="help-button">Help</button>
                        <button id="chat-button">Chat</button>
                    </div>
                    <button id="give-up-button" onClick={onGiveUp} ref={give_up_button}>
                        Give up
                    </button>
                </div>

            </section>

        </main>
    );
};

export default Play_Page;