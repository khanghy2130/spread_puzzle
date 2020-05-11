import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

import "./style.scss";
import LevelObject from '../../../server/Level_Object';
import RoomObject from '../../../server/Room_Object';
import cmMoves from '../Chessman_Moves';

import img_king from './chess_pieces/king.svg';
import img_queen from './chess_pieces/queen.svg';
import img_pawn from './chess_pieces/pawn.svg';
import img_bishop from './chess_pieces/bishop.svg';
import img_knight from './chess_pieces/knight.svg';
import img_rook from './chess_pieces/rook.svg';
import img_target from './chess_pieces/target.svg';
import img_unselected from './chess_pieces/unselected.svg';


interface propObject {
    socket: any,
    levelObject: LevelObject,
    resetRoomPage: (receivedLevelObject: RoomObject) => void,
    roomID: string,
    nickname: string
};

type Cell = 0 | 1 | 2; // 0: empty; 1: target; 2: player
type Chessman = "pawn" | "rook" | "bishop" | "knight" | "queen" | "king";

// [chessman type, availability]
type ChessmanPlay = [Chessman, boolean];
// [x, y]
type Position = [number, number];
// [previous position, used-chessman index, just captured a target?]
type MoveHistory = [Position, number, boolean]; 


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
    
    // dictionary for image sources
    const cmImg: {[key: string]: string} = {
        "king": img_king,
        "queen": img_queen,
        "pawn": img_pawn,
        "bishop": img_bishop,
        "knight": img_knight,
        "rook": img_rook,
        "target": img_target,
        "unselected": img_unselected
    };

    // -- Control States --
    // gridData: 2d array containing each Cell data
    const [gridData, setGridData] = useState<Cell[][]>([]);
    // playerPos: player's piece position
    const [playerPos, setPlayerPos] = useState<Position>([0, 0]); // dummy value
    // chessman List: list of chessman those which player will use
    const [cmList, setCmList] = useState<ChessmanPlay[]>([]);
    // moveHistories: record player moves to reverse
    const [moveHistories, setMoveHistories] = useState<MoveHistory[]>([]);
    // selected Chessman: index of the selected chessman in cmList, null means unselected
    const [selectedCm, setSelectedCm] = useState<number | null>(null);
    // movableTiles: array of cell positions that the selected chessman can move to
    const [movableTiles, setMovableTiles] = useState<Position[]>([]);

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
                        time_display.current.innerText = timeLeft.current.value;
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

    // called when play page starts
    function initialize(): void{
        // initiate begin-countdown
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

        // load game states (gridData, playerPos, cmList)
        // gridData
        const newGridData: Cell[][] = [];
        levelObject.gridData.forEach((row : Cell[]) => {
            const newRow: Cell[] = [];
            row.forEach((cellData : Cell) => newRow.push(cellData));
            newGridData.push(newRow);
        })
        setGridData(newGridData);

        // playerPos
        loopY:
        for (let y=0; y < levelObject.gridData.length; y++){
            loopX:
            for (let x=0; x < levelObject.gridData.length; x++){
                if (levelObject.gridData[y][x] === 2){
                    setPlayerPos([x, y]);
                    break loopY; // breaks out of loopY
                }
            }
        }

        // cmList
        setCmList(levelObject.chessmanList.map((cm: Chessman) => [cm, true]));
    }

    // update selectedCm and movableTiles
    function chessmanClicked(cmPlay: ChessmanPlay, index: number): void{
        // do nothing if this chessman is used, or is already selected
        if (!cmPlay[1] || selectedCm === index) return;

        setSelectedCm(index); // selected!

        // find and set movableTiles
        switch (cmPlay[0]){
            case "king":
                setMovableTiles(cmMoves.king(gridData, playerPos));
                break;
        }


    }

    function cellClicked(x: number, y: number){
        console.log(`x: ${x}  y: ${y}`);
    }

    ////////////// win by setProgress("complete")

    function renderCell(x: number, y: number){
        function isMovable(){
            for (let i=0; i < movableTiles.length; i++){
                const pos: Position = movableTiles[i];
                if (pos[0] === x && pos[1] === y) return true;
            }
            return false;
        }

        return (<div 
            onClick={() => cellClicked(x, y)}
            className={(isMovable())? "movable" : ""}>
            {
                // is a target cell? : not a target cell
                (gridData[y][x] === 1) ? (
                    <img src={cmImg["target"]} alt="target cell" />
                ) : (gridData[y][x] === 2) ? (
                    // key provided to replay css popup animation
                    <img alt="player cell"
                    className="player-cell" 
                    key={"player: " + selectedCm}
                    src={
                        // is unselected? : not selected
                        (selectedCm === null) ? cmImg["unselected"]
                        : cmImg[cmList[selectedCm][0]]
                    } />
                ) : null
            }
        </div>);
    }

    return (
        <main id="play-page-main">
            
            <div id="table-wrapper">
                <table><tbody>
                    {gridData.map((row: Cell[], y: number) => (
                        <tr key={"row:" + y}>{
                            row.map((cellData: Cell, x: number) => (
                                <td key={"cell: " + x}>
                                    {renderCell(x, y)}
                                </td>
                            ))
                        }</tr>
                    ))}
                </tbody></table>

                <h3>Time left: &nbsp;<span ref={time_display}>{timeLeft.current.value}</span> seconds</h3>
                <div id="buttons-div">
                    <button>Reset</button>
                    <button>Undo</button>
                </div>
            </div>

            <div id="chessman-container">
                {(cmList.map((cmPlay: ChessmanPlay, index: number) => <button 
                key={index} 
                disabled={!cmPlay[1]}
                onClick={() => chessmanClicked(cmPlay, index)}
                className={
                    // selected class
                    (selectedCm === index) ? "selected" :
                    // unselected state & unused
                    (selectedCm === null && cmPlay[1]) ? "blink" : ""
                }
                style={{animationDelay:`${index * 0.5}s`}}>
                    <img src={cmImg[cmPlay[0]]} alt="chessman" />
                </button>))}
            </div>

            {(progress === "playing") ? null : (
                <div id="play-page-modal">
                    {
                        (progress === "preparing") ? (<div>
                            <h3>Capture all <span className="red-color">targets</span>!</h3>
                            <h2>Starting in...</h2>
                            <h2 className="blue-color" ref={begin_countdown_display}>3</h2>
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