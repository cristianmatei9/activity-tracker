
import React, { useEffect, useState } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonBadge,
    IonButton,
    IonButtons,
    IonBackButton,
    useIonViewWillEnter
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';

import { Activity } from '../models/Activity';
import {
    getActivity,
    getActivityPhoto
} from '../services/activityApi';
import { getCurrentUser } from '../services/authApi';
import { loadActivities } from '../services/activityStorage';
import { loadActivityPhoto } from '../services/photoService';
import ActivityMap from '../components/ActivityMap';

const ActivityDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activity, setActivity] =
        useState<Activity | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [mapOpen, setMapOpen] = useState(false);

    useIonViewWillEnter(() => {
        let active = true;

        const load = async () => {
            const user = getCurrentUser();

            setLoading(true);
            setError('');

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

            if (activityId < 0) {
                if (!local) {
                    setError('Activity not found');
                }

                setLoading(false);
                return;
            }

            try {
                const data = await getActivity(activityId);

                if (active) {
                    setActivity(data);
                    setError('');
                }
            } catch {
                if (!local && active) {
                    setError('Failed to load activity');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        let active = true;
        let objectUrl = '';

        const loadPhoto = async () => {
            setPhotoUrl('');

            if (!activity?.photo) return;

            try {
                let url: string;

                if (activity.photo.startsWith('activity_')) {
                    url = await loadActivityPhoto(activity.photo);
                } else if (activity.id > 0) {
                    const blob = await getActivityPhoto(activity.id);
                    url = URL.createObjectURL(blob);
                    objectUrl = url;
                } else {
                    return;
                }

                if (active) {
                    setPhotoUrl(url);
                } else if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            } catch {
                if (active) {
                    setPhotoUrl('');
                }
            }
        };

        loadPhoto();

        return () => {
            active = false;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [activity?.id, activity?.photo]);

    const hasCoordinates =
        activity?.latitude != null &&
        activity?.longitude != null;

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
                {loading && <p className="ion-padding">Loading activity...</p>}
                {error && <p className="ion-padding">{error}</p>}

                {activity && (
                    <>
                        {photoUrl && (
                            <div className="ion-padding">
                                <img
                                    src={photoUrl}
                                    alt={activity.title}
                                    style={{
                                        width: '100%',
                                        maxHeight: '300px',
                                        objectFit: 'cover',
                                        borderRadius: '12px'
                                    }}
                                />
                            </div>
                        )}

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
                                    color={
                                        activity.completed
                                            ? 'success'
                                            : 'warning'
                                    }
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

                            {hasCoordinates && (
                                <div className="ion-padding">
                                    <IonButton
                                        expand="block"
                                        fill="outline"
                                        onClick={() => setMapOpen(true)}
                                    >
                                        View Location on Map
                                    </IonButton>
                                </div>
                            )}

                            {activity.id < 0 && (
                                <IonItem>
                                    <IonLabel color="warning">
                                        Waiting for synchronization
                                    </IonLabel>
                                </IonItem>
                            )}
                        </IonList>

                        <ActivityMap
                            isOpen={mapOpen}
                            onClose={() => setMapOpen(false)}
                            latitude={activity.latitude}
                            longitude={activity.longitude}
                            readonly
                        />
                    </>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ActivityDetail;
