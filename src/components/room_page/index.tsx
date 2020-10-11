import React, { useRef, useState, useEffect } from 'react';

import "./style.scss";
import RoomObject from '../../../server/Room_Object';
import PLAY_PAGE from '../play_page/index'; 
import LevelObject from '../../../server/Level_Object';


interface propObject {
    socket: any,
    room: RoomObject,
    resetMainPage: () => void,
    nickname: string,
    setRoom: (receivedRoomObject: RoomObject) => void
};


const Room_Page = ({ socket, room, resetMainPage, nickname, setRoom }: propObject) => {
    const TIME_FACTOR: number = 10; // must match with the one in PuzzleConstructor

    // render room page (true) or play page (false)
    const [showRoom, setShowRoom] = useState<boolean>(true);
    const [levelObject, setLevelObject] = useState<LevelObject | null>(null);

    const isHost: boolean = socket.id === room.users[0].id;

    const option_moves_input = useRef<HTMLInputElement>(null);
    const option_moves_display = useRef<HTMLInputElement>(null);
    const option_time_input = useRef<HTMLInputElement>(null);
    const option_time_display = useRef<HTMLInputElement>(null);
    // if changed then user can click save button
    const [changed, setChanged] = useState<boolean>(false);
    // if started then disable start button
    const [started, setStarted] = useState<boolean>(false);

    const [showResults, setShowResults] = useState<boolean>(false);

    useEffect(()=>{
        if (typeof window !== 'undefined') {
            // adding listeners
            socket.on("start-game", (receivedLevelObject : LevelObject) => {
                setLevelObject(receivedLevelObject);
                setShowRoom(false);
            });
        }

        return () => {
            // removing listeners
            socket.off("start-game");
        }
    // eslint-disable-next-line
    }, []);

    function movesOnChange(){
        // check availablity
        if (!(option_moves_display && option_moves_display.current && option_moves_input && option_moves_input.current)) return;
        option_moves_display.current.innerText = option_moves_input.current.value;
        setChanged(true);
    }
    function timeOnChange(){
        // check availablity
        if (!(option_time_display && option_time_display.current && option_time_input && option_time_input.current)) return;
        option_time_display.current.innerText = "" + Number(option_time_input.current.value) * TIME_FACTOR;
        setChanged(true);
    }

    // confirm leaving state
    const [leaving, setLeaving] = useState<boolean>(false);
    const [leavingTimerID, setLeavingTimerID] = useState<any>(null);
    const leave_button = useRef<HTMLButtonElement>(null);

    function onSave(){
        if (changed){
            // local update for self
            setChanged(false);
                // @ts-ignore 
            option_moves_display.current.className = "updated";
                // @ts-ignore 
            option_time_display.current.className = "updated";
            
            const newOptions: RoomObject["options"] = {
                // @ts-ignore 
                moves: Number(option_moves_input.current.value),
                // @ts-ignore 
                time: Number(option_time_input.current.value)
            };
            socket.emit("save-options", room.roomID, newOptions);
        }
    }

    function onStart(){
        setStarted(true);
        socket.emit("start-game", room.roomID);
    }

    function onLeave(){
        // 1st click
        if (!leaving) {
            setLeaving(true);
            setLeavingTimerID(setTimeout(()=>{
                setLeaving(false);
            }, 3000));
        }
        // 2nd click
        else {
            clearTimeout(leavingTimerID); // stop timer
            socket.emit("leave-room", room.roomID);
            resetMainPage();
        }
    }

    // going back to room page from play page
    function resetRoomPage(receivedRoomObject: RoomObject){
        setRoom(receivedRoomObject);
        setShowRoom(true);
        setShowResults(true);
        setChanged(false);
        setStarted(false);
    }

    // play page?
    if (!showRoom && levelObject !== null) {
        return (<PLAY_PAGE 
            socket={socket} 
            levelObject={levelObject} 
            resetRoomPage={resetRoomPage} 
            roomID={room.roomID}
            nickname={nickname} 
        />);
    }

    // for options, render the sliders and update button if isHost
    return (
        <main id="room-page-main">
            <div id="options-div">
                <h2>Room ID: {room.roomID}</h2>

                <label>
                    Difficulty:&nbsp;&nbsp;
                    <span ref={option_moves_display}>{room.options.moves}</span>
                    &nbsp;moves
                </label>
                {(isHost) ? 
                    <input ref={option_moves_input} 
                    type="range" min={3} max={7} 
                    defaultValue={room.options.moves}
                    onChange={movesOnChange} /> 
                : null}

                <label>
                    Time:&nbsp;&nbsp;
                    <span ref={option_time_display}>{room.options.time*TIME_FACTOR}</span>
                    &nbsp;seconds
                </label>
                {(isHost) ? 
                    <input ref={option_time_input} 
                    type="range" min={1} max={10} 
                    defaultValue={room.options.time}
                    onChange={timeOnChange} /> 
                : null}
                
                <p id="save-reminder">{(isHost && changed) ? "Remember to press Save!" : ""}</p>

                {/* Save and Start buttons */}
                {
                    (isHost) ? 
                    <div id="host-buttons">
                        <button id="save-button" disabled={!changed} onClick={onSave}>
                            Save
                        </button>
                        <button id="start-button" disabled={started} onClick={onStart}>
                            {started ? "Starting..." : "Start"}
                        </button>
                    </div>
                    :
                    <p id="not-host-message">Only the host can start the game.</p>
                }

                <button id="leave-button" ref={leave_button} onClick={onLeave}>
                    {(leaving) ? "CONFIRM LEAVING" : "Leave Room"}
                </button>
            </div>

            {/* Players list */}
            <div id="players-div">
                <h2>Players</h2>
                {room.users.map(
                    (user, index) => <h4 className={(user.id === socket.id) ? "you" : ""} key={user.id}>{user.nickname}</h4>
                )}
                {
                    (room.results.length === 0) ? null :
                    <button id="results-button" onClick={()=>{setShowResults(true)}}>
                        See Results
                    </button>
                }
            </div>
            
            {/* Results */}
            {
                (!showResults) ? null :
                <div id="results-wrapper">
                    <button id="close-button" onClick={()=>{setShowResults(false)}}>
                        Close Results
                    </button>
                    <div id="results-div">
                        {room.results.map((result: any, index: number) => (
                            <h3 key={index}>
                                {index+1}) &nbsp;
                                {result.nickname}:&nbsp;
                                <span className={(result.time !== null)? "":"dnf"}>
                                    {(result.time !== null) ? result.time + " sec" : "DNF"}
                                </span>
                            </h3>
                        ))}
                    </div>
                </div>
            }       
        </main>
    );
};

export default Room_Page;