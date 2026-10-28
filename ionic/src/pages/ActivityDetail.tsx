
import React, { useEffect, useState } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonTitle,
    IonContent, IonItem, IonLabel, IonList,
    IonBadge, IonButton, IonButtons, IonBackButton
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';

import { Activity } from '../models/Activity';
import { getActivity } from '../services/activityApi';
import { getCurrentUser } from '../services/authApi';
import { loadActivities } from '../services/activityStorage';

const ActivityDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = getCurrentUser();

        if (!user) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        const activityId = Number(id);

        const local = loadActivities(user.id).find(
            a => a.id === activityId
        );

        setActivity(local ?? null);
        setError('');
        setLoading(false);

        if (activityId < 0) {
            if (!local) setError('Activity not found');
            return;
        }

        getActivity(activityId)
            .then(data => {
                setActivity(data);
                setError('');
            })
            .catch(() => {
                if (!local) {
                    setError('Failed to load activity');
                }
            });
    }, [id]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>

                    <IonTitle>Activity Details</IonTitle>

                    <IonButtons slot="end">
                        <IonButton
                            onClick={() =>
                                navigate(`/activities/${id}/edit`)
                            }
                        >
                            Edit
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                {loading && <p>Loading activity...</p>}
                {error && <p>{error}</p>}

                {activity && (
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
                                Duration: {activity.duration} min
                            </IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonLabel>Status</IonLabel>
                            <IonBadge
                                color={activity.completed
                                    ? 'success'
                                    : 'warning'}
                            >
                                {activity.completed
                                    ? 'Completed'
                                    : 'Pending'}
                            </IonBadge>
                        </IonItem>

                        {activity.location && (
                            <IonItem>
                                <IonLabel>
                                    Location: {activity.location}
                                </IonLabel>
                            </IonItem>
                        )}

                        {activity.id < 0 && (
                            <IonItem>
                                <IonLabel color="warning">
                                    Waiting for synchronization
                                </IonLabel>
                            </IonItem>
                        )}
                    </IonList>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ActivityDetail;
