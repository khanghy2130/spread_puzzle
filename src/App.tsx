import React from 'react';
import { 
  BrowserRouter as Router, 
  Route, 
  Switch
} from 'react-router-dom';

import Main_Page from './components/main_page/index';
import Room_Page from './components/room_page/index';
import Play_Page from './components/play_page/index';

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/room" component={Room_Page} />
          <Route exact path="/play" component={Play_Page} />
          <Route component={Main_Page} />
        </Switch>  
      </Router>
    </div>
  );
}

export default App;
