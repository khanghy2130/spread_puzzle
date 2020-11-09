import React, { useRef, useState, useEffect, Fragment } from 'react';

import "./style.scss";
import RoomObject from '../../../server/Room_Object';
import PLAY_PAGE from '../play_page/index'; 
import LevelObject from '../../../server/Level_Object';


interface propObject {
    socket: any,
    room: RoomObject,
    resetMainPage: () => void,
    nickname: string,
    setRoom: (receivedRoomObject: RoomObject) => void,
    getText: (tree: string[]) => string
};

interface optionElements {
    time: React.RefObject<HTMLInputElement>,
    type: React.RefObject<HTMLSelectElement>,
    figure_size: React.RefObject<HTMLInputElement>,
    pieces_amount: React.RefObject<HTMLInputElement>
}

interface ChatDataObject {
    sender: string,
    type: "chat" | "solve" | "giveup" | "join" | "leave",
    message?: string
}

const Room_Page = ({ socket, room, resetMainPage, nickname, setRoom, getText }: propObject) => {
    // render room page (true) or play page (false)
    const [showRoom, setShowRoom] = useState<boolean>(true);
    const [levelObject, setLevelObject] = useState<LevelObject | null>(null);

    const isHost: boolean = socket.id === room.users[0].id;

    // option elements
    const optionsContainer : optionElements = {
        time: useRef<HTMLInputElement>(null),
        type: useRef<HTMLSelectElement>(null),
        figure_size: useRef<HTMLInputElement>(null),
        pieces_amount: useRef<HTMLInputElement>(null)
    }

    const [options, setOptions] = useState<RoomObject["options"]>(room.options);
    // update options when room.options changes
    useEffect(()=>{
        if (typeof window !== 'undefined') {
            setOptions(room.options);
        }
    }, [room.options])

    // if started then disable start button
    const [started, setStarted] = useState<boolean>(false);
    const [showResults, setShowResults] = useState<boolean>(false);

    useEffect(()=>{
        if (typeof window !== 'undefined') {
            // adding listeners
            socket.on("start-game", (receivedLevelObject : LevelObject) => {
                setLevelObject(receivedLevelObject);
                setShowRoom(false);
                setChatModalHidden(true); // hide chat
            });
            socket.on("chat-from-server", (chatData : ChatDataObject) => {
                updateChat(chatData);
            });
        }

        return () => {
            // removing listeners
            socket.off("start-game");
            socket.off("chat-from-server");
        }
    // eslint-disable-next-line
    }, []);


    // confirm leaving state
    const [leaving, setLeaving] = useState<boolean>(false);
    const [leavingTimerID, setLeavingTimerID] = useState<any>(null);

    function onAnyInputChange(){
        // if not already started
        if (!started){
            // @ts-ignore
            const newOptions : RoomObject["options"] = {
                // @ts-ignore
                time: Number(optionsContainer.time.current.value),
                // @ts-ignore
                type: optionsContainer.type.current.value,
                // @ts-ignore
                figure_size: Number(optionsContainer.figure_size.current.value),
                // @ts-ignore
                pieces_amount: Number(optionsContainer.pieces_amount.current.value)
            };

            setOptions(newOptions);
            socket.emit("save-options", room.roomID, newOptions);
        }
    }

    function onStart(){
        setStarted(true);
        socket.emit("start-game", room.roomID, options);
    }

    function onHelp(){
        console.log("Help clicked");
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
        setStarted(false);
        setChatModalHidden(true); // hide chat
    }

    // convert seconds to time format mm:ss
    function convertToTime(seconds: number): string {
        let text_minutes: string = "" + Math.floor(seconds / 60);
        let text_seconds: string = "" + seconds % 60;
        if (text_seconds.length < 2) text_seconds = "0" + text_seconds;
        return `${text_minutes}:${text_seconds}`;
    }

    // chat modal
    const openChatButton = useRef<HTMLButtonElement>(null);
    const chatModalRef = useRef<HTMLDivElement>(null);
    const chatMessagesContainer = useRef<HTMLDivElement>(null);
    const chatInput = useRef<HTMLInputElement>(null);
    function chatModalRender(){
        return <div id="chat-modal" ref={chatModalRef}>
            <button id="close-chat-button" onClick={()=>{setChatModalHidden(true)}}>
                Close
            </button>
            <div id="chat-modal-content">
                <div id="chat-messages-container" ref={chatMessagesContainer}>
                    {/* h3 of span and text */}
                </div>
                <div id="chat-input-div">
                    <input onKeyPress={(event) => {
                        if (event.key === "Enter") sendChat();
                    }} ref={chatInput}
                    type="text" maxLength={100}
                    placeholder="Chat"></input>
                    <button onClick={sendChat}>Send</button>
                </div>
            </div>
        </div>;
    }
    
    function setChatModalHidden(toBeHidden: boolean): void {
        if (!chatModalRef || !chatModalRef.current) return; // null? quit
        chatModalRef.current.style.display = toBeHidden ? "none" : "flex";
        openChatButton.current?.classList.remove("new-message"); // clear notification
    }
    function sendChat(): void{
        if (!chatInput || !chatInput.current) return; // null? quit
        // not empty chat box?
        if (chatInput.current.value.length > 0){
            const chatData: ChatDataObject = {
                sender: nickname, type: "chat", message: chatInput.current.value
            };
            socket.emit("chat-from-client", room.roomID, chatData);
            chatInput.current.value = ""; // clear chat
        }
    }
    // receive chat data from server => add to chat container
    function updateChat(chatData: ChatDataObject): void {
        if (!chatMessagesContainer || !chatMessagesContainer.current) return; // null? quit

        const msgContainer: HTMLDivElement = chatMessagesContainer.current;
        const h3Ele: HTMLHeadElement = document.createElement("h3");
        if (chatData.type === "chat"){
            h3Ele.innerHTML = `${getNameSpan()} ${chatData.message}`;
            if (chatModalRef.current?.style.display !== "flex"){
                openChatButton.current?.classList.add("new-message"); // show notification
            }    
        } else if (chatData.type === "solve"){
            h3Ele.innerHTML = `>> ${getNameSpan()} has solved the puzzle.`; 
        } else if (chatData.type === "giveup"){
            h3Ele.innerHTML = `>> ${getNameSpan()} has given up.`; 
        } else if (chatData.type === "join"){
            h3Ele.innerHTML = `>> ${getNameSpan()} has joined the room.`; 
        } else if (chatData.type === "leave"){
            h3Ele.innerHTML = `>> ${getNameSpan()} has left the room.`; 
        }
        function getNameSpan(): string {
            const youClass: string = chatData.sender === nickname ? `class="you"` : "";
            const colon: string = chatData.type === "chat" ? ":" : "";
            return `<span ${youClass}>${chatData.sender}${colon}</span>`;
        }
        msgContainer.appendChild(h3Ele);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    // play page?
    if (!showRoom && levelObject !== null) {
        return (<Fragment>
            <PLAY_PAGE 
                socket={socket} 
                levelObject={levelObject} 
                resetRoomPage={resetRoomPage} 
                roomID={room.roomID}
                nickname={nickname}
                convertToTime={convertToTime}
                setChatModalHidden={setChatModalHidden}
                getText={getText}
            />
            {chatModalRender()}
        </Fragment>);
    }

    // for options, render the sliders and update button if isHost
    return (<Fragment>
        <main id="room-page-main">
            <div id="options-div">
                <h2>Room ID: {room.roomID}</h2>

                <label>
                    Tile type:&nbsp;&nbsp;
                    <select ref={optionsContainer.type} 
                        defaultValue={options.type}
                        onChange={onAnyInputChange}
                        disabled={started}
                        className={!isHost ? "hidden-input" : ""} >
                        <option value="square">square</option>
                        <option value="triangle">triangle</option>
                        <option value="hexagon">hexagon</option>
                    </select>
                    {isHost? null : <span>{options.type}</span>}
                </label>

                <label>
                    Figure size: <span>{options.figure_size}</span>
                </label>
                <input ref={optionsContainer.figure_size} 
                    type="range" min={30} max={50} step={5}
                    defaultValue={options.figure_size}
                    onChange={onAnyInputChange}
                    disabled={started}
                    className={!isHost ? "hidden-input" : ""} />

                <label>
                    Number of pieces: <span>{options.pieces_amount}</span>
                </label>
                <input ref={optionsContainer.pieces_amount} 
                    type="range" min={4} max={7} 
                    defaultValue={options.pieces_amount}
                    onChange={onAnyInputChange}
                    disabled={started}
                    className={!isHost ? "hidden-input" : ""} />
                
                <label>
                    Time limit: <span>{convertToTime(options.time)}</span>
                </label>
                <input ref={optionsContainer.time} 
                    type="range" min={30} max={600} step={30}
                    defaultValue={options.time}
                    onChange={onAnyInputChange}
                    disabled={started}
                    className={!isHost ? "hidden-input" : ""} />
                
                {/* Save and Start buttons */}
                {
                    (isHost) ? 
                    <div id="host-buttons">
                        <button id="help-button" onClick={onHelp}>
                            Help
                        </button>
                        <button id="start-button" disabled={started} onClick={onStart}>
                            {started ? "Starting..." : "Start"}
                        </button>
                    </div>
                    :
                    <p id="not-host-message">Only the host can start the game.</p>
                }

                <button id="leave-button" onClick={onLeave}>
                    {(leaving) ? "CONFIRM LEAVING" : "Leave Room"}
                </button>
            </div>

            {/* Players list */}
            <div id="left-div">
                <h2>{getText(["room_page", "players"])}</h2>
                <div id="players-div">
                    {room.users.map(
                        (user) => <h4 className={(user.id === socket.id) ? "you" : ""} key={user.id}>{user.nickname}</h4>
                    )}
                </div>
                
                <button id="chat-button" ref={openChatButton}
                onClick={()=>{setChatModalHidden(false)}}>
                    Chat
                </button>
                {
                    (room.results.length === 0) ? null :
                    <button onClick={()=>{setShowResults(true)}}>
                        See Results
                    </button>
                }
            </div>
            
            {/* Results */}
            {
                (!showResults) ? null :
                <div id="results-wrapper">
                    <button id="close-button" onClick={()=>{setShowResults(false)}}>
                        Close
                    </button>
                    <div id="results-div">
                        {room.results.map((result: any, index: number) => (
                            <h3 key={index}>
                                {index+1}) &nbsp;
                                {result.nickname} -&nbsp;
                                <span className={(result.time !== null)? "":"dnf"}>
                                    {(result.time !== null) ? convertToTime(result.time) : "DNF"}
                                </span>
                            </h3>
                        ))}
                    </div>
                </div>
            }       
        </main>
        {chatModalRender()}
    </Fragment>);
};

export default Room_Page;