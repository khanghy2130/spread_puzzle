import React, {useState, useEffect, useRef, Fragment} from 'react';

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
    // order of this credits must match order of languages
    const creditsData: [string, string | null][] = [
        ["Logix Indie", "https://www.youtube.com/channel/UCs9Pt9s8V0SDfhrfFFCNV7Q"],
        ["Google Translate", null],
        ["Google Translate", null],
        ["Google Translate", null]
    ];
    
    const [nickname, setNickname] = useState<string>(rollNewName());
    const nickname_input = useRef<HTMLInputElement>(null);
    const no_room_alert_text = useRef<HTMLParagraphElement>(null);
    const roomID_input = useRef<HTMLInputElement>(null);
    // joining => true when clicked create or join
    const [joining, setJoining] = useState<boolean>(false);

    const [lang, setLang] = useState<any>(null); // json object
    const langSelectorInput = useRef<HTMLSelectElement>(null);
    const [selectedLang, setSelectedLang] = useState<string>("en");
    function _setSelectedLang (){
        if (langSelectorInput && langSelectorInput.current) {
            setSelectedLang(langSelectorInput.current.value);
        }
    }
    // get text in selected language with given tree of keys
    function getText(tree: string[]): string {
        if (!lang) return "";
        let result: any = lang;
        tree.forEach((key: string) => {
            result = result[key]
        });
        // @ts-ignore
        return (result[selectedLang] || result["en"]);
    }

    useEffect(()=>{
        if (typeof window !== 'undefined') {
            // load languages.json
            fetch("/languages.json")
                .then(res => res.json())
                .then(languagesJSON => {
                    setLang(languagesJSON);
                });

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
    

    function noNickname():  boolean {
        if (nickname.length === 0){
            alert("Your nickname cannot be empty.");
            return true;
        }
        return false;
    }
    function createRoom(){
        if (joining) return; // already joining
        if (noNickname()) return;

        setJoining(true);
        socket.emit("enter-room", nickname, null); // null => create
    }
    function joinRoom(){
        if (joining) return; // already joining
        if (noNickname()) return;

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
        
        return colors[colors_index] +"_"+ fruits[fruits_index];
    }
    function onNameChange(): void{
        if (nickname_input && nickname_input.current) {
            setNickname(nickname_input.current.value);
        }
    }
    function newNameClicked(): void{
        const newName: string = rollNewName();
        setNickname(newName);
        if (nickname_input && nickname_input.current) {
            nickname_input.current.value = newName;
        }
    }

    // called when user leaves room
    function resetMainPage(){
        setJoining(false);
        setShowMain(true);
        setRoom(null);
    }

    function footerComponent(){
        return (
        <footer>
            <div>
                <label>{getText(["main_page", "nickname"])}:  <span>{nickname}</span></label>
            </div>
            <div>
                <label>{getText(["language"])}:</label>
                <select ref={langSelectorInput} onChange={_setSelectedLang}>
                    {
                        !lang ? null : (
                            lang.langs_list.map((item: [string, string], i: number) => (
                                <option key={i} value={item[1]}>{item[0]}</option>
                            ))
                        )
                    }
                </select>
            </div>
        </footer>)
    }

    // joined room?
    if (!showMain && room !== null) {
        return (
        <Fragment>
            <ROOM_PAGE 
                socket={socket} 
                room={room} 
                resetMainPage={resetMainPage} 
                nickname={nickname}
                setRoom={setRoom}
                getText={getText}
            />
            {footerComponent()}
        </Fragment>
        );
    }
    
    return (
        <Fragment>
            <main id="main-page-main">
                <div id="title-img-div">
                    <img src={title_img} alt="title" />
                </div>

                <div id="contents-wrapper">
                    <div id="nickname-div">
                        <h2 className="main-page-header">{getText(["main_page", "nickname"])}</h2>
                        <input ref={nickname_input} 
                        onChange={onNameChange}
                        type="text" 
                        defaultValue={nickname} 
                        maxLength={15} /><br/>
                        <button onClick={newNameClicked}>{getText(["main_page", "randomize"])}</button>
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
                        <h2 className="main-page-header">Welcome!</h2>
                        <ul>
                            <li>Sample text</li>
                            <li>Sample text</li>
                            <li>Sample text</li>
                        </ul>
                    </div>

                    <div id="credits-div">
                        <h2 className="main-page-header">Credits</h2>
                        <ul>
                            <li>Spread Puzzle™ is developed by&nbsp;
                                <a target="_blank" 
                                rel="noopener noreferrer" 
                                href="https://www.hynguyen.info">
                                    Hy Nguyen
                                </a>
                            </li>
                            <li>
                                Translations by:
                                <ul>
                                    {creditsData.map((cdItem, index) => {
                                        return (<li key={index}>
                                            { // there is a link?
                                                cdItem[1] !== null ? (
                                                    <a target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    href={cdItem[1]}>
                                                        {cdItem[0]}
                                                    </a>
                                                ) : (cdItem[0])
                                            }
                                            &nbsp;{!lang ? null : (
                                                `(${lang.langs_list[index + 1][0]})`
                                            )}
                                        </li>);
                                    })}
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
            {footerComponent()}
        </Fragment>
    );
};

export default Main_Page;