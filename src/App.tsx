import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';

import '@ionic/react/css/core.css';
import './theme/variables.css'

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/tournaments">
            <Tournaments />
          </Route>

          <Route exact path="/tournament/:id">
            <TournamentDetail />
          </Route>

          <Route exact path="/">
            <Redirect to="/tournaments" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;