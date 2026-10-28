
import React, { useState } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonText
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authApi';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            onLogin();
            navigate('/home', { replace: true });
        } catch {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Login</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <IonItem>
                    <IonInput
                        label="Username"
                        labelPlacement="stacked"
                        value={username}
                        onIonInput={e =>
                            setUsername(e.detail.value ?? '')
                        }
                    />
                </IonItem>

                <IonItem>
                    <IonInput
                        label="Password"
                        labelPlacement="stacked"
                        type="password"
                        value={password}
                        onIonInput={e =>
                            setPassword(e.detail.value ?? '')
                        }
                    />
                </IonItem>

                {error && (
                    <IonText color="danger">
                        <p>{error}</p>
                    </IonText>
                )}

                <IonButton
                    expand="block"
                    onClick={handleLogin}
                    disabled={
                        loading ||
                        !username.trim() ||
                        !password
                    }
                >
                    {loading ? 'Logging in...' : 'Login'}
                </IonButton>
            </IonContent>
        </IonPage>
    );
};

export default Login;
