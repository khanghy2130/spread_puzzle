import React from 'react';
import { 
  BrowserRouter as Router, 
  Route, 
  Switch,
  // eslint-disable-next-line
  Link
} from 'react-router-dom';
import io from 'socket.io-client';

import MAIN_PAGE from './components/main_page/index';
import ROOM_PAGE from './components/room_page/index';
import PLAY_PAGE from './components/play_page/index';

function App() {
  let socket: any;

  if (typeof window !== 'undefined') { 
    // set up socket io connection
    socket = io("/server"); // namespace 'server'
    console.log(socket);
    
  }

  return (
    <div className="App">
      <Router>
        <Switch>
          <Route
            exact path='/room'
            render={() => <ROOM_PAGE />}
          />
          <Route
            exact path='/play'
            render={() => <PLAY_PAGE />}
          />
          <Route
            render={() => <MAIN_PAGE socket={socket} />}
          />
        </Switch>  

        <ul>
    <li>
        <Link to="/">Main</Link>
    </li>
    <li>
        <Link to="/room">Room</Link>
    </li>
    <li>
        <Link to="/play">About</Link>
    </li>
</ul>
      </Router>
    </div>
  );
}



export default App;
