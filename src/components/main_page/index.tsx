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
        ["Jafet Uribe", "https://www.instagram.com/jafet_uribe_16"],
        ["Vitor Lima", null],
        ["DarkFluo", null],
        ["Google Translate", null],
        ["Google Translate", null],
        ["Google Translate", null]
    ];
    const langs_list: [string, string][] = [
        ["English", "en"],
        ["Tiếng Việt", "vi"],
        ["Español", "es"],
        ["Português", "pt"],
        ["Français", "fr"],
        ["Deutsch", "de"],
        ["Italiano", "it"],
        ["Suomi", "fi"]
    ];
    

    // nickname: get from local storage | rollNewName
    const [nickname, setNickname] = useState<string>(
        window.localStorage.getItem("nickname") || rollNewName()
    );
    const nickname_input = useRef<HTMLInputElement>(null);
    const no_room_alert_text = useRef<HTMLParagraphElement>(null);
    const roomID_input = useRef<HTMLInputElement>(null);
    // joining => true when clicked create or join
    const [joining, setJoining] = useState<boolean>(false);

    const [lang, setLang] = useState<any>(null); // json object of texts of a language
    const [selectedLang, setSelectedLang] = useState<string>("en");
    const langSelectorInput = useRef<HTMLSelectElement>(null);

    function fetchAndSetLanguage(newLang: string): void {
        // set value for select element
        if (langSelectorInput && langSelectorInput.current) {
            langSelectorInput.current.value = newLang;
        }

        // load target json file and set state to langObject
        fetch(`/languages/${newLang}.json`)
            .then(res => res.json())
            .then(languagesJSON => {
                setLang(languagesJSON);
                setSelectedLang(newLang);
                window.localStorage.setItem("selectedLang", newLang); // save
            });
    }

    // get text in selected language with given tree of keys
    function getText(tree: string[]): string {
        if (!lang) return "";
        let result: any = lang;
        tree.forEach((key: string) => {
            result = result[key]
        });
        // @ts-ignore
        return (result);
    }

    useEffect(()=>{
        if (typeof window !== 'undefined') {
            // selectedLang: get from local storage | browser language | en
            let initSelectedLang: string | null = window.localStorage.getItem("selectedLang");
            if (initSelectedLang === null) {
                const browserLang: string = navigator.language.slice(0,2);
                // browserLang is in list?
                if (langs_list.some(item => item[1] === browserLang)) initSelectedLang = browserLang;
                else initSelectedLang = "en";
            }
            fetchAndSetLanguage(initSelectedLang);

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
                <label>{getText(["main_page", "language"])}:</label>
                <select ref={langSelectorInput} onChange={() => {
                    fetchAndSetLanguage(langSelectorInput.current?.value || "en");
                }}>
                    {
                        langs_list.map((item: [string, string], i: number) => (
                            <option key={i} value={item[1]}>{item[0]}</option>
                        ))
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
                selectedLang={selectedLang}
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
                        <h2 className="main-page-header">{getText(["main_page", "create_room"])}</h2>
                        <button onClick={createRoom}>{getText(["main_page", "create_room"])}</button>
                    </div>
                    <div id="join-room-div">
                        <h2 className="main-page-header">{getText(["main_page", "join_room"])}</h2>
                        <p ref={no_room_alert_text} id="no-room-alert" hidden></p>
                        <input 
                            ref={roomID_input} 
                            type="text" 
                            pattern="[0-9]{4}" 
                            placeholder={getText(["main_page", "room_number"])}
                            title="Room number is a 4-digits number"
                            required
                            onKeyUp={(e) => {
                                if (e.keyCode === 13) joinRoom();
                            }}     
                        />
                        <br/><button onClick={joinRoom}>{getText(["main_page", "join_room"])}</button>
                    </div>
                </div>

                <div id="info-wrapper">
                    <div id="tutorial-div">
                        <h2 className="main-page-header">{getText(["main_page", "welcome"])}</h2>
                        <ul>
                            <li>{getText(["main_page", "welcome_list", "li0"])}</li>
                            <li>{getText(["main_page", "welcome_list", "li1"])}</li>
                            <li>{getText(["main_page", "welcome_list", "li2"])}</li>
                            <li>{getText(["main_page", "welcome_list", "li3"])}</li>
                        </ul>
                    </div>

                    <div id="credits-div">
                        <ul>
                            <li>{getText(["main_page", "developed_by"])}&nbsp;
                                <a target="_blank" 
                                rel="noopener noreferrer" 
                                href="https://www.hynguyen.info">
                                    Hy Nguyen
                                </a>
                            </li>
                            <li>
                                {getText(["main_page", "translations_by"])}
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
                                            &nbsp;({langs_list[index + 1][0]})
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