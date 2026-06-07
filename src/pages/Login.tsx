import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
} from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const history = useHistory();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    console.log("API URL =", "https://api-test-cmxie.duckdns.org");
    console.log("MODE =", mode);
    console.log("EMAIL =", email);
    try {
      setError("");
      if (mode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      history.replace("/tournaments");
    } catch (err: any) {
      console.log("FULL ERROR", err);
      console.log("ERROR RESPONSE", err?.response);
      console.log("ERROR DATA", err?.response?.data);
      console.log("ERROR MESSAGE", err?.message);
    
      setError(
        JSON.stringify(err?.response?.data) ||
        err?.message ||
        "Login failed"
      );
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div
          className="app-page"
          style={{ minHeight: "100vh", display: "grid", alignItems: "center" }}
        >
          <IonCard className="hero-card">
            <IonCardContent>
              <span className="hero-kicker">Mga Nigga</span>
              <h1 className="hero-title">Central Manila x Ilocos Elites</h1>
              <p className="hero-subtitle">
                Connect your own Challonge account, manage tournaments, and
                report Beyblade X scores from mobile.
              </p>
            </IonCardContent>
          </IonCard>

          <IonCard className="soft-card">
            <IonCardContent>
              <h2 style={{ marginBottom: 6 }}>
                {mode === "login" ? "Welcome back" : "Create staff account"}
              </h2>
              <p>
                {mode === "login"
                  ? "Login to continue managing brackets."
                  : "First account becomes Super Admin."}
              </p>

              {mode === "register" && (
                <IonItem>
                  <IonLabel position="stacked">Name</IonLabel>
                  <IonInput
                    value={name}
                    onIonInput={(e) => setName(e.detail.value || "")}
                  />
                </IonItem>
              )}

              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value || "")}
                  type="email"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Password</IonLabel>
                <IonInput
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value || "")}
                  type="password"
                />
              </IonItem>

              {error && (
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              )}

              <IonButton expand="block" onClick={submit}>
                {mode === "login" ? "Login" : "Create account"}
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login"
                  ? "Create new account"
                  : "Already have an account? Login"}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
