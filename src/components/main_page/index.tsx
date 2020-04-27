import React, {useEffect} from 'react';
import io from 'socket.io-client';

import title_img from './title_img.png';
import "./style.scss";

const Main_Page = () => {

    useEffect(()=>{
        if (typeof window !== 'undefined') {
            
            const socket = io("/server"); // namespace
            console.log(socket);


        }
    });
    

    return (
        <main>
            <img src={title_img} alt="title" />
        </main>
    );
};

export default Main_Page;