import React from 'react';

import "./style.scss";
import RoomObject from '../../../server/Room_Object';
import PLAY_PAGE from '../play_page/index'; 


interface propObject {
    socket: any,
    room: RoomObject | null
};

const Room_Page = ({ socket, room }: propObject) => {

    console.log(room);
    // ignore because 'room' wouldn't be null
    // @ts-ignore
    console.log("is host:", socket.id === room.users[0].id);

    return (
        <div>
            This page is underconstruction :] - Azure
        </div>
    );
};

export default Room_Page;