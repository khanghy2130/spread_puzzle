import React, { useEffect, useState} from 'react';
import { 
  BrowserRouter as Router, 
  Route, 
  Switch,
  Link
} from 'react-router-dom';
import io from 'socket.io-client';

import MAIN_PAGE from './components/main_page/index';
import ROOM_PAGE from './components/room_page/index';
import PLAY_PAGE from './components/play_page/index';

function App() {
  const [socket, setSocket] = useState<any>(null);

  useEffect(()=>{
    if (typeof window !== 'undefined') { 
      // set up socket io connection
      setSocket(io("/server")); // namespace 'server'

      if (socket){
        socket.emit("update-user");
      }
      
    }
  // eslint-disable-next-line
  }, []);

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
