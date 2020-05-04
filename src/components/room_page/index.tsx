import React, { useRef } from 'react';

import "./style.scss";
import RoomObject from '../../../server/Room_Object';
import PLAY_PAGE from '../play_page/index'; 


interface propObject {
    socket: any,
    room: RoomObject,
    resetMainPage: () => void
};


const Room_Page = ({ socket, room, resetMainPage }: propObject) => {
    const isHost: boolean = socket.id === room.users[0].id;

    const option_moves_input = useRef<HTMLInputElement>(null);
    const option_moves_display = useRef<HTMLInputElement>(null);
    const option_time_input = useRef<HTMLInputElement>(null);
    const option_time_display = useRef<HTMLInputElement>(null);

    function movesOnChange(){
        // check availablity
        if (!(option_moves_display && option_moves_display.current && option_moves_input && option_moves_input.current)) return;
        option_moves_display.current.innerText = option_moves_input.current.value;
        option_moves_display.current.className = "not-updated";
    }
    function timeOnChange(){
        // check availablity
        if (!(option_time_display && option_time_display.current && option_time_input && option_time_input.current)) return;
        option_time_display.current.innerText = "" + Number(option_time_input.current.value) * 30;
        option_time_display.current.className = "not-updated";
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
                        <button id="save-button" disabled>Saved</button>
                        <button id="start-button">Start!</button>
                    </div>
                    :
                    <p id="not-host-message">Only the host can start the game.</p>
                }

                <button id="leave-button">Leave Room</button>
            </div>

            <div id="players-div">
                <h2>Players</h2>
                <h4>BlueBerry30</h4>
                <h4 className="you">GreenMango24</h4>
                <h4>YellowApple53</h4>
            </div>
        </main>
    );
};

export default Room_Page;