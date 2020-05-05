import React, {useState, useEffect, useRef} from 'react';

import title_img from './title_img.png';
import "./style.scss";
import ROOM_PAGE from '../room_page/index';

import RoomObject from '../../../server/Room_Object';

interface propObject {
    socket: any
};

const Main_Page = ({ socket }: propObject) => {
    // render main page (true) or room page (false)
    const [showMain, setShowMain] = useState<boolean>(true);
    const [room, setRoom] = useState<RoomObject | null>(null);

    const colors: string[] = ["Black","Blue","Brown","Green","Orange","Pink","Purple","Red","White","Yellow"];
    const fruits: string[] = ["Apple","Berry","Banana","Cherry","Coconut","Grape","Lemon","Mango","Peach","Pear"];
    
    const [nickname, setNickname] = useState<string>(rollNewName());
    const no_room_alert_text = useRef<HTMLParagraphElement>(null);
    const roomID_input = useRef<HTMLInputElement>(null);
    // joining => true when clicked create or join
    const [joining, setJoining] = useState<boolean>(false);

    useEffect(()=>{
        console.log("main_page useEffect running"); ///////
        if (typeof window !== 'undefined') {
            // adding listeners
            socket.on("join-success", (receivedRoom: RoomObject) => {
                setRoom(receivedRoom);
                setShowMain(false);
            });

            socket.on("join-fail", (message: string) => {
                setAlertText(false, message); // show alert
                setJoining(false); // clear joining status
            });

            socket.on("update-room", (receivedRoom: RoomObject) => {
                setRoom(receivedRoom);
            });
        }

        return () => {
            // removing listeners
            socket.off("join-success");
            socket.off("join-fail");
            socket.off("update-room");
        }
    // eslint-disable-next-line
    }, []);
    

    function createRoom(){
        if (joining) return; // early exit
        setJoining(true);
        socket.emit("enter-room", nickname, null); // null => create
    }
    function joinRoom(){
        if (joining) return; //early exit
        if (roomID_input && roomID_input.current){
            if (roomID_input.current.checkValidity()){
                setAlertText(true); // hide alert
                setJoining(true);
                socket.emit("enter-room", nickname, roomID_input.current.value);
            }
            else {
                roomID_input.current.reportValidity(); // invaild room ID
            }
        }
    }
    function setAlertText(status: boolean, message?: string){
        if (no_room_alert_text && no_room_alert_text.current){
            no_room_alert_text.current.hidden = status; 
            if (message) no_room_alert_text.current.innerText = message; 
        }
    }

    // returns a random integer from 0 to (limit - 1)
    function ranNum(limit: number): number {
        return Math.floor(Math.random() * limit);
    }
    function rollNewName(): string{
        const colors_index: number = ranNum(colors.length);
        const fruits_index: number = ranNum(fruits.length);
        
        return colors[colors_index] + fruits[fruits_index] + ranNum(10) + ranNum(10);
    }

    // called when user leaves room
    function resetMainPage(){
        setJoining(false);
        setShowMain(true);
        setRoom(null);
    }

    // joined room?
    if (!showMain && room !== null) {
        return <ROOM_PAGE socket={socket} room={room} resetMainPage={resetMainPage} />;
    }
    
    return (
        <main id="main-page-main">
            <div id="title-img-div">
                <img src={title_img} alt="title" />
            </div>

            <div id="contents-wrapper">
                <div id="nickname-div">
                    <h2 className="main-page-header">Nickname</h2>
                    <h3 id="nickname-display">{nickname}</h3>
                    <button onClick={()=>setNickname(rollNewName())}>New name</button>
                </div>
                <div id="create-room-div">
                    <h2 className="main-page-header">Create new room</h2>
                    <button onClick={createRoom}>Create room</button>
                </div>
                <div id="join-room-div">
                    <h2 className="main-page-header">Join room</h2>
                    <p ref={no_room_alert_text} id="no-room-alert" hidden></p>
                    <input 
                        ref={roomID_input} 
                        type="text" 
                        pattern="[0-9]{4}" 
                        placeholder="Room ID" 
                        title="Room ID is a 4-digits number"
                        required
                        onKeyUp={(e) => {
                            if (e.keyCode === 13) joinRoom();
                        }}     
                    />
                    <br/><button onClick={joinRoom}>Join room</button>
                </div>
            </div>

            <div id="info-wrapper">
                <div id="tutorial-div">
                    <h2 className="main-page-header">What is Chess Puzzle?</h2>
                    <ul>
                        <li>Chess Puzzle is a multiplayer game.</li>
                        <li>To begin, create a new room or join an existing room.</li>
                        <li>The room host can change the options and start the game.</li>
                        <li>Turn your piece into any given chessman to make the move.</li>
                        <li>Race with other players to capture all targets. Have fun!</li>
                    </ul>
                </div>

                <div id="credits-div">
                    <h2 className="main-page-header">Credits</h2>
                    <ul>
                        <li>Chess Puzzle is made by&nbsp;
                            <a target="_blank" 
                            rel="noopener noreferrer" 
                            href="https://www.hynguyen.info">
                                Hy Nguyen
                            </a>
                        </li>
                        <li>The game is inspired by&nbsp;
                            <a target="_blank" 
                            rel="noopener noreferrer" 
                            href="https://play.google.com/store/apps/details?id=com.mythicowl.chessace&hl=en_US">
                                Chess Ace
                            </a>
                        </li>
                        <li>Chessman images by&nbsp;
                            <a target="_blank" 
                            rel="noopener noreferrer" 
                            href="https://en.wikipedia.org/wiki/User:Cburnett">
                                Colin Burnett
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
};

export default Main_Page;