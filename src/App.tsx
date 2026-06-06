import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import Tournaments from './pages/Tournaments';
import ConnectChallonge from './pages/ConnectChallonge';
import TournamentDetail from './pages/TournamentDetail';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/login" component={Login} />
            <Route exact path="/tournaments" component={Tournaments} />
              <Route exact path="/connect-challonge" component={ConnectChallonge} />
            <Route exact path="/tournaments/:id" component={TournamentDetail} />
            <Route exact path="/">
              <Redirect to="/tournaments" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
