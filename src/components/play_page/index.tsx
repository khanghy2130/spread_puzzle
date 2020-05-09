import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

import "./style.scss";
import LevelObject from '../../../server/Level_Object';
import RoomObject from '../../../server/Room_Object';

import img_king from './chess_pieces/king.svg';
import img_queen from './chess_pieces/queen.svg';
import img_pawn from './chess_pieces/pawn.svg';
import img_bishop from './chess_pieces/bishop.svg';
import img_knight from './chess_pieces/knight.svg';
import img_rook from './chess_pieces/rook.svg';
import img_target from './chess_pieces/target.svg';

interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: (receivedLevelObject: RoomObject) => void,
    roomID: string,
    nickname: string
};

type Cell = 0 | 1 | 2; // 0: empty; 1: target; 2: player

const Play_Page = ({socket, levelObject, resetRoomPage, roomID, nickname} : propObject) => {
    const time_display = useRef<HTMLHeadingElement>(null);
    // store timeLeft as ref
    const timeLeft = useRef<any>({ value: levelObject.timeLimit });
    const [timeLimitIntervalID, setTimeLimitIntervalID] = useState<any>(null); // ID of the time limit countdown interval

    // begin countdown 
    const begin_countdown_display = useRef<HTMLHeadingElement>(null);
    let beginCountdownIntervalID: any; // ID of the begin countdown interval

    const [progress, setProgress] = useState<"preparing"|"playing"|"incomplete"|"complete">("preparing");

    const [gridData, setGridData] = useState<Cell[][]>(levelObject.gridData);

    // socket io events
    useEffect(()=>{
        console.log("play_page useEffect running"); ///////
        if (typeof window !== 'undefined') {
            socket.on("end-game", (receivedRoomObject : RoomObject) => {
                resetRoomPage(receivedRoomObject);
            });
        }

        return () => {
            socket.off("end-game");
        }
    // eslint-disable-next-line
    }, []);

    // progress status handler
    useLayoutEffect(()=>{
        console.log("Just changed: " , progress);
        // after begin countdown is done
        if (progress === "preparing"){
            initialize();
        }
        else if (progress === "playing"){
            // start the time limit countdown
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

        return () => {
            window.clearInterval(beginCountdownIntervalID); // stop countdown
            window.clearInterval(timeLimitIntervalID); // stop countdown
        }
    // eslint-disable-next-line
    }, [progress]);

    // load level data. initiate begin countdown
    function initialize(){
        let beginCountdownLeft = 3;
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

    function cellClicked(x: number, y: number){
        console.log(`x: ${x}  y: ${y}`);
    }

    return (
        <main id="play-page-main">
            {/* <h3 ref={time_display}>Time Remaining: {timeLeft.current.value} sec</h3> */}
            
            <div>
                <table>
                    {gridData.map((row: Cell[], y: number) => (
                        <tr key={"row:" + y}>{
                            row.map((cellData: Cell, x: number) => (
                                <td key={"cell: " + x}>
                                    <div className="highlighter" 
                                    onClick={() => cellClicked(x, y)}>
                                        {/* image if */}
                                        <img src={img_bishop} alt="" />
                                    </div>
                                </td>
                            ))
                        }</tr>
                    ))}
                </table>

            </div>


            {
                (progress !== "playing" || true) ? null:
                <button onClick={() => {setProgress("complete");}}>Click Me To Win</button>
            }

            {(progress === "playing") ? null : (
                <div id="play-page-modal">
                    {
                        (progress === "preparing") ? (<div>
                            <h3 className="blue-color">Capture all targets!</h3>
                            <h2>Starting in...</h2>
                            <h2 ref={begin_countdown_display}>3</h2>
                        </div>) :
                        (progress === "complete") ? (<div>
                            <h2 className="blue-color">Puzzle solved!</h2>
                            <h3>Your time:</h3>
                            <h3 className="green-color">{levelObject.timeLimit - timeLeft.current.value} seconds</h3>
                        </div>) :
                        (progress === "incomplete") ? (<div>
                            <h2 className="red-color">Time's up!</h2>
                        </div>) : null
                    }
                </div>
            )}
            
        </main>
    );
};

export default Play_Page;