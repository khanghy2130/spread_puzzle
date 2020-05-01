import React, {useState} from 'react';

import title_img from './title_img.png';
import "./style.scss";

interface propObject {
    socket: any
};

const Main_Page = ({ socket }: propObject) => {
    const colors: string[] = ["Black","Blue","Brown","Green","Orange","Pink","Purple","Red","White","Yellow"];
    const fruits: string[] = ["Apple","Berry","Banana","Cherry","Coconut","Grape","Lemon","Mango","Peach","Pear"];
    
    const [nickname, setNickname] = useState<string>(rollNewName());

    // if (socket){
    //     console.log(nickname);
    // }
    
    /*
    function talk(){
        socket.emit("justtalk", socket.id.slice(-4));
    }
    */
    

    // returns a random integer from 0 to (limit - 1)
    function ranNum(limit: number): number {
        return Math.floor(Math.random() * limit);
    }

    function rollNewName(): string{
        const colors_index: number = ranNum(colors.length);
        const fruits_index: number = ranNum(fruits.length);
        
        return colors[colors_index] + fruits[fruits_index] + ranNum(10) + ranNum(10);
    }
    
    return (
        <main>
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
                    <button>Create room</button>
                </div>
                <div id="join-room-div">
                    <h2 className="main-page-header">Join room</h2>
                    <input id="room-id-input" type="number" placeholder="Room ID" />
                    <br/><button>Join room</button>
                </div>
            </div>

            <div id="info-wrapper">
                <div id="tutorial-div">
                    <h2 className="main-page-header">What is Chess Puzzle?</h2>
                    <ul>
                        <li>Chess Puzzle is a multiplayer game.</li>
                        <li>Create a new room or join an existing room.</li>
                        <li>The room host can change the options and start the game.</li>
                        <li>Race with other players to collect all gems. Have fun!</li>
                    </ul>
                </div>

                <div id="credits-div">
                    <h2 className="main-page-header">Credits</h2>
                    <ul>
                        <li>Chess Puzzle is made by <a target="_blank" href="https://www.hynguyen.info">Hy Nguyen</a></li>
                        <li>The game is inspired by <a target="_blank" href="https://play.google.com/store/apps/details?id=com.mythicowl.chessace&hl=en_US">Chess Ace</a></li>
                        <li>Chessman images by <a target="_blank" href="https://en.wikipedia.org/wiki/User:Cburnett">Colin Burnett</a></li>
                    </ul>
                </div>
            </div>
        </main>
    );
};

export default Main_Page;