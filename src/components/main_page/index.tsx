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
            <div id="title-img-div">
                <img src={title_img} alt="title" />
            </div>

            <div id="contents-wrapper">
                <div id="nickname-div">
                    <h2 className="main-page-header">Nickname</h2>
                    <h3 id="nickname-display">Unknown</h3>
                    <button>New name</button>
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
        </main>
    );
};

export default Main_Page;