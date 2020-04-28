import React from 'react';

import title_img from './title_img.png';
import "./style.scss";

interface propObject {
    socket: any
};

const Main_Page = ({ socket }: propObject) => {

    if (socket){
        console.log(socket);
    }
    
    function talk(){
        ///////////////////////////// dummy event
        socket.emit("justtalk", "oh yeah", 50);
    }
    
    return (
        <main>
            <img src={title_img} alt="title" />
            <button onClick={talk}>Talk</button>
        </main>
    );
};

export default Main_Page;