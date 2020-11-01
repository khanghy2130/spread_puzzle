import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import Sketch from "react-p5";
import p5Types from "p5"; 

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
    convertToTime: (seconds: number) => string,
    getText: (tree: string[]) => string
};


interface CanvasVarsType {
    x : number
}
function P5_Canvas(cv: CanvasVarsType, setCv: React.Dispatch<React.SetStateAction<CanvasVarsType>>) {
    if (!cv) return null;

    let alreadyPressing = false; // prevent multiple clicks in draw()
 
    const windowResized = (p: p5Types) => {
        const SMALLEST_SIZE = p.min(document.documentElement.clientWidth, document.documentElement.clientHeight);
        const CANVAS_SIZE = p.min(SMALLEST_SIZE, 500);
        p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
    }
    const setup = (p: p5Types, canvasParentRef: Element) => {
        p.createCanvas(500, 500).parent(canvasParentRef);
        p.frameRate(30);
        console.log("created canvas");
    };
 
    const draw = (p: p5Types) => {
        p.background(0);
        p.ellipse(cv.x, 20, 20, 20);
        cv.x += 1;

        // click by mouse, not touch
        if (p.mouseIsPressed && !alreadyPressing && p.touches.length === 0){
            alreadyPressing = true;
            /////
        }
        else if (!p.mouseIsPressed && alreadyPressing){
            alreadyPressing = false;
        }

        setCv(cv); // update cv
    };
    
 
    return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
};


const Play_Page = ({socket, levelObject, resetRoomPage, roomID, nickname, convertToTime, getText} : propObject) => {
    const time_display = useRef<HTMLHeadingElement>(null);
    // store timeLeft as ref
    const timeLeft = useRef<any>({ value: levelObject.timeLimit });
    const [timeLimitIntervalID, setTimeLimitIntervalID] = useState<any>(null); // ID of the time limit countdown interval

    // begin countdown 
    const begin_countdown_display = useRef<HTMLHeadingElement>(null);
    let beginCountdownIntervalID: any; // ID of the begin countdown interval

    // main game state status
    type progressType = "preparing"|"playing"|"incomplete"|"complete";
    const [progress, setProgress] = useState<progressType>("preparing");

    // setting up CV default
    const [cv, setCv] = useState<CanvasVarsType>({
        x: 50
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
            console.log(levelObject);
        }

        return () => {
            socket.off("end-game");
        }
    // eslint-disable-next-line
    }, []);

    

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

            {/* Timer text */}
            <h3 id="time-left-text">Time left:  <span ref={time_display}></span></h3>

            <button onClick={() => {setProgress("complete")}}>Win</button>
            <button onClick={() => {setProgress("incomplete")}}>Lose</button>
            <button onClick={() => {setCv({x: 0})}}>XXX</button>

            {/* Canvas */}
            <div id="canvas-parent">
                {P5_Canvas(cv, setCv)}
            </div>

        </main>
    );
};

export default Play_Page;