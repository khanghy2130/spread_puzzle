import React, { useEffect, useState, useRef } from 'react';

import "./style.scss";
import LevelObject from '../../../server/Level_Object';
import RoomObject from '../../../server/Room_Object';
import CanvasVars from './CanvasVars';

import P5_Canvas from './CanvasComponent';
import downPNG from './images/down.png';
import leftPNG from './images/left.png';
import rightPNG from './images/right.png';


interface ChatDataObject {
    sender: string,
    type: "chat" | "solve" | "giveup" | "join" | "leave",
    message?: string
}

interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: (receivedLevelObject: RoomObject) => void,
    roomID: string,
    nickname: string,
    convertToTime: (seconds: number) => string,
    setChatModalHidden: (toBeHidden: boolean) => void,
    setHelpModalHidden: (toBeHidden: boolean) => void,
    getText: (tree: string[]) => string
};

const Play_Page = ({
    socket, levelObject, resetRoomPage, 
    roomID, nickname, 
    convertToTime, 
    setChatModalHidden, setHelpModalHidden,
    getText
} : propObject) => {
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
            give_up_button.current.innerText = getText(["play_page", "confirm_giving_up"]);
            givingUp = true;
            givingUpTimerID = setTimeout(()=>{
                if (typeof givingUp !== "undefined" && give_up_button && give_up_button.current) {
                    give_up_button.current.innerText = getText(["play_page", "give_up"]);
                    givingUp = false;
                }
            }, 3000);
        }
        // 2nd click
        else {
            give_up_button.current.hidden = true;
            clearTimeout(givingUpTimerID); // stop timer
            setProgress("incomplete");
            const chatData: ChatDataObject = {
                sender: nickname, type: "giveup"
            };
            socket.emit("chat-from-client", roomID, chatData);
        }
    }

    // safariMode ("on" or "off") in local storage
    const safari_mode_toggler = useRef<HTMLButtonElement>(null);
    const [safariMode, setSafariMode] = useState<boolean>(
        window?.localStorage?.getItem("safariMode") === "on" || false
    );
    function toggleSafariMode(): void {
        const newModeStatus: boolean = !safariMode;
        setSafariMode(newModeStatus); // switch
        // save
        window.localStorage.setItem("safariMode", newModeStatus ? "on" : "off");
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
            nextRotate: null,
            nextPiece: null
        }
    });

    // piece button refs
    const pieceButtonRefs = useRef(Array.from(
        {length: levelObject.pieces.length}, 
        a => React.createRef<HTMLButtonElement>()
    ));


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
            const chatData: ChatDataObject = {
                sender: nickname, type: "solve"
            };
            socket.emit("chat-from-client", roomID, chatData);
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


    function Pieces_Panel(){
        return <div id="pieces-panel">
            {levelObject.pieces.map((pieceGroup, index) => (
                <button
                    ref={pieceButtonRefs.current[index]}
                    className={0 === index? "selected" : "" /* set up value only */}
                    style={{backgroundColor: pieceGroup.color}}
                    key={index} 
                    onClick={() => {
                        cv.selectedPiece.nextPiece = index;
                        setCv(cv);
                    }}
                    disabled={progress !== "playing"}
                ></button>
            ))}
        </div>
    }
    // functions about setting piece buttons class names for canvas component
    function setPlacedClass(targetPieceIndex: number, adding: boolean): void {
        const btnClassList: any = pieceButtonRefs.current[targetPieceIndex].current?.classList;
        if (!btnClassList) return; // quit
        if (adding) btnClassList.add("placed");
        else btnClassList.remove("placed");
    }
    function setSelectedClass(selectedPieceIndex: number): void{
        pieceButtonRefs.current.forEach((btnRef, btnIndex) => {
            // is clicked btn
            if (btnIndex === selectedPieceIndex){
                btnRef.current?.classList.add("selected");
                setPlacedClass(btnIndex, false);
            }
            else btnRef.current?.classList.remove("selected");
        });
    }

    return (
        <main id="play-page-main">

            {/* horizonal modal */}
            {(progress === "playing") ? null : (
                <div id="play-page-modal">
                    {
                        (progress === "preparing") ? (<div>
                            <h3>{getText(["play_page", "fit_all_pieces_together"])}</h3>
                            <h2>{getText(["play_page", "starting_in"])}</h2>
                            <h2 className="blue-color" ref={begin_countdown_display}>3</h2>
                        </div>) :
                        (progress === "complete") ? (<div>
                            <h2 className="blue-color">{getText(["play_page", "puzzle_solved"])}</h2>
                            <h3>{getText(["play_page", "your_time"])}</h3>
                            <h3 className="green-color">{convertToTime(levelObject.timeLimit - timeLeft.current.value)}</h3>
                            <button onClick={()=>{setChatModalHidden(false)}}>
                                {getText(["room_page", "chat"])}
                            </button>
                        </div>) :
                        (progress === "incomplete") ? (<div>
                            <h2 className="red-color">{getText(["play_page", "did_not_finish"])}</h2>
                            <button onClick={()=>{setChatModalHidden(false)}}>
                                {getText(["room_page", "chat"])}
                            </button>
                        </div>) : null
                    }
                </div>
            )}

            <section id="canvas-section">
                {/* Timer text */}
                <h3 id="time-left-text">{getText(["play_page", "time_left"])}:  <span ref={time_display}></span></h3>

                {/* Canvas */}
                <div id="canvas-parent">
                    {P5_Canvas(
                        levelObject, 
                        cv, setCv, 
                        progress, setProgress, 
                        setPlacedClass, 
                        setSelectedClass,
                        safariMode
                    )}
                </div>
            </section>
            
            <section id="control-section">
                
                <div id="control-buttons">
                    {Pieces_Panel()}

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
                        <button id="help-button" onClick={()=>{setHelpModalHidden(false)}}>
                            {getText(["room_page", "help"])}
                        </button>
                        <button id="chat-button" onClick={()=>{setChatModalHidden(false)}}>
                            {getText(["room_page", "chat"])}
                        </button>
                    </div>

                    <button id="give-up-button" onClick={onGiveUp} ref={give_up_button}>
                        {getText(["play_page", "give_up"])}
                    </button>

                    <div id="safari-mode-div">
                        <p id="safari-mode-note">{getText(["play_page", "safari_mode_note"])}</p>
                        <button onClick={toggleSafariMode} ref={safari_mode_toggler}>
                            {getText(["play_page", "safari_mode"])}: {safariMode ? getText(["play_page", "on"]) : getText(["play_page", "off"])}
                        </button>
                    </div>
                </div>

            </section>

        </main>
    );
};


export default Play_Page;