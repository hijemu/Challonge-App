import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const history = useHistory();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setError('');
      if (mode === 'register') {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      history.replace('/tournaments');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{mode === 'login' ? 'Login' : 'Create Account'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {mode === 'register' && (
          <IonItem>
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput value={name} onIonInput={(e) => setName(e.detail.value || '')} />
          </IonItem>
        )}

        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput type="email" value={email} onIonInput={(e) => setEmail(e.detail.value || '')} />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput type="password" value={password} onIonInput={(e) => setPassword(e.detail.value || '')} />
        </IonItem>

        {error && <IonText color="danger"><p>{error}</p></IonText>}

        <IonButton expand="block" onClick={submit}>
          {mode === 'login' ? 'Login' : 'Register'}
        </IonButton>

        <IonButton fill="clear" expand="block" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Create new account' : 'Already have an account? Login'}
        </IonButton>

        <IonText color="medium">
          <p>First registered account becomes Super Admin. After that, new accounts are view-only until assigned staff permissions.</p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Login;
