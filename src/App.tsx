import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";

import Login from "./pages/Login";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import ConnectChallonge from "./pages/ConnectChallonge";
import { AuthProvider } from "./context/AuthContext";
import CreateTournament from "./pages/CreateTournament";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route
              exact
              path="/create-tournament"
              component={CreateTournament}
            />
            <Route exact path="/login" component={Login} />
            <Route
              exact
              path="/connect-challonge"
              component={ConnectChallonge}
            />
            <Route exact path="/tournaments" component={Tournaments} />
            <Route exact path="/tournaments/:id" component={TournamentDetail} />
            <Route exact path="/">
              {localStorage.getItem("token") ? (
                <Redirect to="/tournaments" />
              ) : (
                <Redirect to="/login" />
              )}
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
