import React from 'react';

import title_img from './title_img.png';
import "./style.scss";

interface propObject {
    socket: any
};

const Main_Page = ({ socket }: propObject) => {

    if (socket){
        //console.log(socket);
    }
    
    function talk(){
        ///////////////////////////// dummy event
        socket.emit("justtalk", socket.id.slice(-4));
    }
    
    return (
        <main>
            <img src={title_img} alt="title" />
            
            <div id="contents-wrapper">
                <div id="nickname-div">
                    <h2 className="main-page-header">Nickname</h2>
                    <h3 id="nickname-display"></h3>
                    <button>New Name</button>
                </div>
                <div id="create-room-div">
                    <h2 className="main-page-header">Create new room</h2>
                    <button>Create</button>
                </div>
                <div id="join-room-div">
                    <h2 className="main-page-header">Join room</h2>
                    <input type="text" placeholder="Room ID" />
                    <button>Join</button>
                </div>
            </div>
        </main>
    );
};

export default Main_Page;