import React from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonBadge, IonButtons, IonButton, useIonViewWillEnter
} from '@ionic/react';

import { useEffect, useState } from 'react';
import { getActivities } from '../services/activityApi';
import { Activity } from '../models/Activity';
import { connectActivityWebSocket } from '../services/activityWebSocket';

import { useNavigate } from "react-router-dom";

import ExploreContainer from '../components/ExploreContainer';
import './Home.css';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const socket = connectActivityWebSocket(() => {
            getActivities()
                .then(data => setActivities(data))
                .catch(error => console.error(error));
        });

        return () => {
            socket.close();
        };
    }, []);

    useIonViewWillEnter(() => {
        setLoading(true);

        getActivities()
            .then(data => {
                setActivities(data);
                setError('');
            })
            .catch(() => setError('Failed to load activities'))
            .finally(() => setLoading(false));
    });

    return (

    <IonPage>
      <IonHeader>
        <IonToolbar>
            <IonTitle>Activity Tracker</IonTitle>
            <IonButtons slot="end">
                <IonButton onClick={() => navigate('/activities/new')}>
                    Add
                </IonButton>
            </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
          {loading && <p>Loading activities...</p>}
          {error && <p>{error}</p>}
          <IonList>
              {activities.map(activity => (
                    <IonItem key={activity.id}
                             button
                             onClick={() => navigate(`/activities/${activity.id}`)}
                    >
                        <IonLabel>
                            <h2>{activity.title}</h2>
                            <p>
                                {activity.date} | {activity.duration} min
                            </p>
                        </IonLabel>

                        <IonBadge
                            color={activity.completed ? 'success' : 'warning'}
                        >
                            {activity.completed ? 'Completed' : 'Pending'}
                        </IonBadge>
                    </IonItem>
              ))}
          </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Home;
