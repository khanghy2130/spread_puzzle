import React, { useRef, useState, useEffect } from 'react';

import "./style.scss";
import RoomObject from '../../../server/Room_Object';
import PLAY_PAGE from '../play_page/index'; 
import LevelObject from '../../../server/Level_Object';


interface propObject {
    socket: any,
    room: RoomObject,
    resetMainPage: () => void
};


const Room_Page = ({ socket, room, resetMainPage }: propObject) => {
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

    const [results, setResults] = useState<any>(room.results);
    const [showResults, setShowResults] = useState<boolean>(false);

    useEffect(()=>{
        console.log("room_page useEffect running"); ///////
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
        option_moves_display.current.className = "not-updated";
        setChanged(true);
    }
    function timeOnChange(){
        // check availablity
        if (!(option_time_display && option_time_display.current && option_time_input && option_time_input.current)) return;
        option_time_display.current.innerText = "" + Number(option_time_input.current.value) * 30;
        option_time_display.current.className = "not-updated";
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
            
            socket.emit(
                "save-options",
                room.roomID,
                    // @ts-ignore 
                option_moves_input.current.value,
                    // @ts-ignore 
                option_time_input.current.value
            );
        }
    }

    function onStart(){
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

    function resetRoomPage(){
        setShowRoom(true);
    }

    // joined room?
    if (!showRoom && levelObject !== null) {
        return <PLAY_PAGE socket={socket} levelObject={levelObject} resetRoomPage={resetRoomPage} />;
    }

    // for options, render the sliders and update button if isHost
    return (
        <main id="room-page-main">
            <div id="options-div">
                <h2>Room ID: {room.roomID}</h2>

                <label>
                    Difficulty:&nbsp;&nbsp;
                    <span className="updated" ref={option_moves_display}>{room.option_moves}</span>
                    &nbsp;moves
                </label>
                {(isHost) ? 
                    <input ref={option_moves_input} 
                    type="range" min={3} max={6} 
                    defaultValue={room.option_moves}
                    onChange={movesOnChange} /> 
                : null}

                <label>
                    Time:&nbsp;&nbsp;
                    <span className="updated" ref={option_time_display}>{room.option_time*30}</span>
                    &nbsp;seconds
                </label>
                {(isHost) ? 
                    <input ref={option_time_input} 
                    type="range" min={1} max={6} 
                    defaultValue={room.option_time}
                    onChange={timeOnChange} /> 
                : null}
                
                {
                    (isHost) ? 
                    <div id="host-buttons">
                        <button id="save-button" disabled={!changed} onClick={onSave}>
                            {(changed) ? "Save" : "Saved"}
                        </button>
                        <button id="start-button" onClick={onStart}>Start!</button>
                    </div>
                    :
                    <p id="not-host-message">Only the host can start the game.</p>
                }

                <button id="leave-button" ref={leave_button} onClick={onLeave}>
                    {(leaving) ? "CONFIRM LEAVING" : "Leave Room"}
                </button>
            </div>

            <div id="players-div">
                <h2>Players</h2>
                {room.users.map(
                    (user, index) => <h4 className={(user.id === socket.id) ? "you" : ""} key={index}>{user.nickname}</h4>
                )}
                {
                    (results.length === 0) ? null :
                    <button id="results-button" onClick={()=>{setShowResults(true)}}>
                        See Results
                    </button>
                }
            </div>
            
            {
                (!showResults) ? null :
                <div id="results-wrapper">
                    <button id="close-button" onClick={()=>{setShowResults(false)}}>
                        Close Results
                    </button>
                    <div id="results-div">
                        {results.map((result: any, index: number) => (
                            <h3 key={index}>
                                {index+1}:&nbsp;
                                {result.nickname} -&nbsp;
                                <span className={(result.time)? "":"dnf"}>
                                    {(result.time) ? result.time + " sec" : "DNF"}
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