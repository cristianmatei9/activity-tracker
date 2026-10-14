import React from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge, IonButton
} from '@ionic/react';
import {useNavigate, useParams} from 'react-router-dom';

import { useEffect, useState } from 'react';
import { Activity } from '../models/Activity';
import { getActivity } from '../services/activityApi';

const ActivityDetail: React.FC = () => {
    const { id } = useParams<{id: string}>();

    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getActivity(Number(id))
            .then(data => setActivity(data))
            .catch(() => setError('Failed to load activity'))
            .finally(() => setLoading(false));
    }, [id]);

    const navigate = useNavigate();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>Activity Details</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => navigate(`/activities/${id}/edit`)}>
                            Edit
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                {loading ? (
                    <IonItem>
                        <IonLabel>Loading activity...</IonLabel>
                    </IonItem>
                ) : error ? (
                    <IonItem>
                        <IonLabel>{error}</IonLabel>
                    </IonItem>
                ) : activity ? (
                    <IonList>
                        <IonItem>
                            <IonLabel>
                                <h2>{activity.title}</h2>
                                <p>{activity.description}</p>
                            </IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonLabel>
                                Date: {activity.date}
                            </IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonLabel>
                                Duration: {activity.duration}
                            </IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonLabel>Status</IonLabel>
                            <IonBadge color={activity.completed ? 'success' : 'warning'}>
                                {activity.completed ? 'Completed' : 'Pending'}
                            </IonBadge>
                        </IonItem>

                        {activity.location && (
                            <IonItem>
                                <IonLabel>
                                    Location: {activity.location}
                                </IonLabel>
                            </IonItem>
                        )}
                    </IonList>
                ) : (
                    <IonItem>
                        <IonLabel>Activity not found</IonLabel>
                    </IonItem>
                )}
            </IonContent>

        </IonPage>
    );
}

export default ActivityDetail;