import React from 'react';
import io from 'socket.io-client';

import MAIN_PAGE from './components/main_page/index';

function App() {
  let socket: any;
  if (typeof window !== 'undefined' && !socket) { 
    // set up socket io connection
    socket = io("/server"); // namespace 'server'
  }

  return <MAIN_PAGE socket={socket}  />;
}



export default App;
