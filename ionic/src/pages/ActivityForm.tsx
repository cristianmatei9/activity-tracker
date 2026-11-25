
import React, { useEffect, useState } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonToggle,
    IonButton,
    IonButtons,
    IonBackButton
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    ActivityInput,
    createActivity,
    getActivity,
    getActivityPhoto,
    updateActivity,
    uploadActivityPhoto,
    HttpError
} from '../services/activityApi';
import { getCurrentUser } from '../services/authApi';
import {
    loadActivities,
    saveActivities
} from '../services/activityStorage';
import {
    addPendingOperation
} from '../services/activitySync';
import {
    takeActivityPhoto,
    loadActivityPhoto,
    readActivityPhoto,
    ActivityPhoto
} from '../services/photoService';
import { Activity } from '../models/Activity';
import ActivityMap, {
    MapLocation
} from '../components/ActivityMap';

const ActivityForm: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEditing = id !== undefined;

    const [form, setForm] = useState<ActivityInput>({
        title: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        duration: 30,
        completed: false,
        location: '',
        latitude: undefined,
        longitude: undefined
    });

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const [newPhoto, setNewPhoto] =
        useState<ActivityPhoto | null>(null);
    const [mapOpen, setMapOpen] = useState(false);

    useEffect(() => {
        let active = true;
        let objectUrl = '';

        const load = async () => {
            if (!isEditing) return;

            const user = getCurrentUser();
            if (!user) return;

            const activityId = Number(id);
            const local = loadActivities(user.id).find(
                a => a.id === activityId
            );

            const showActivity = async (activity: Activity) => {
                if (!active) return;

                const { id: _, ...data } = activity;
                setForm(data);

                if (!activity.photo) {
                    setPhotoUrl('');
                    return;
                }

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
                    if (active) setPhotoUrl('');
                }
            };

            if (local) {
                await showActivity(local);
            }

            if (activityId < 0) {
                if (!local && active) {
                    setError('Activity not found');
                }
                return;
            }

            try {
                const activity = await getActivity(activityId);

                if (active) {
                    await showActivity(activity);
                    setError('');
                }
            } catch {
                if (!local && active) {
                    setError('Failed to load activity');
                }
            }
        };

        load();

        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id, isEditing]);

    const takePhoto = async () => {
        try {
            setError('');

            const photo = await takeActivityPhoto();

            setNewPhoto(photo);
            setPhotoUrl(photo.webPath);

            setForm(previous => ({
                ...previous,
                photo: photo.fileName
            }));
        } catch {
            setError('Could not take photo');
        }
    };

    const selectLocation = (location: MapLocation) => {
        setForm(previous => ({
            ...previous,
            latitude: location.latitude,
            longitude: location.longitude
        }));
    };

    const save = async () => {
        setError('');
        setSaving(true);

        const user = getCurrentUser();

        if (!user) {
            setError('User not authenticated');
            setSaving(false);
            return;
        }

        const userId = user.id;
        const activityId = Number(id);

        const saveLocal = () => {
            const activities = loadActivities(userId);

            if (isEditing) {
                const updated = activities.map(activity =>
                    activity.id === activityId
                        ? { ...activity, ...form }
                        : activity
                );

                saveActivities(userId, updated);

                addPendingOperation(userId, {
                    type: 'UPDATE',
                    activityId,
                    data: form
                });
            } else {
                const localId = Math.min(
                    0,
                    ...activities.map(a => a.id)
                ) - 1;

                const newActivity: Activity = {
                    id: localId,
                    ...form
                };

                saveActivities(userId, [
                    ...activities,
                    newActivity
                ]);

                addPendingOperation(userId, {
                    type: 'CREATE',
                    localId,
                    data: form
                });
            }
        };

        try {
            if (isEditing && activityId < 0) {
                saveLocal();
            } else if (!navigator.onLine) {
                saveLocal();
            } else {
                try {
                    const activityData = {
                        ...form,
                        photo: undefined
                    };

                    let saved: Activity;

                    if (isEditing) {
                        saved = await updateActivity(
                            activityId,
                            activityData
                        );
                    } else {
                        saved = await createActivity(activityData);
                    }

                    if (newPhoto) {
                        try {
                            const blob = await readActivityPhoto(
                                newPhoto.fileName
                            );

                            saved = await uploadActivityPhoto(
                                saved.id,
                                blob,
                                newPhoto.fileName
                            );
                        } catch {
                            saved = {
                                ...saved,
                                photo: newPhoto.fileName
                            };

                            addPendingOperation(userId, {
                                type: 'UPDATE',
                                activityId: saved.id,
                                data: {
                                    ...form,
                                    photo: newPhoto.fileName
                                }
                            });
                        }
                    } else if (
                        form.photo?.startsWith('activity_')
                    ) {
                        saved = {
                            ...saved,
                            photo: form.photo
                        };
                    }

                    const activities = loadActivities(userId);

                    if (isEditing) {
                        saveActivities(
                            userId,
                            activities.map(a =>
                                a.id === activityId ? saved : a
                            )
                        );
                    } else {
                        saveActivities(userId, [
                            ...activities,
                            saved
                        ]);
                    }
                } catch (err) {
                    if (err instanceof HttpError) {
                        throw err;
                    }

                    saveLocal();
                }
            }

            navigate('/home', { replace: true });
        } catch {
            setError('Failed to save activity');
        } finally {
            setSaving(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>

                    <IonTitle>
                        {isEditing ? 'Edit Activity' : 'Add Activity'}
                    </IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <IonItem>
                    <IonInput
                        label="Title"
                        labelPlacement="stacked"
                        value={form.title}
                        onIonInput={e => setForm({
                            ...form,
                            title: e.detail.value ?? ''
                        })}
                    />
                </IonItem>

                <IonItem>
                    <IonTextarea
                        label="Description"
                        labelPlacement="stacked"
                        value={form.description}
                        onIonInput={e => setForm({
                            ...form,
                            description: e.detail.value ?? ''
                        })}
                    />
                </IonItem>

                <IonItem>
                    <IonInput
                        label="Date"
                        labelPlacement="stacked"
                        type="date"
                        value={form.date}
                        onIonInput={e => setForm({
                            ...form,
                            date: e.detail.value ?? ''
                        })}
                    />
                </IonItem>

                <IonItem>
                    <IonInput
                        label="Duration (minutes)"
                        labelPlacement="stacked"
                        type="number"
                        value={form.duration}
                        onIonInput={e => setForm({
                            ...form,
                            duration: Number(e.detail.value)
                        })}
                    />
                </IonItem>

                <IonItem>
                    <IonInput
                        label="Location"
                        labelPlacement="stacked"
                        value={form.location ?? ''}
                        onIonInput={e => setForm({
                            ...form,
                            location: e.detail.value ?? ''
                        })}
                    />
                </IonItem>

                <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => setMapOpen(true)}
                >
                    Select Location on Map
                </IonButton>

                {form.latitude != null &&
                    form.longitude != null && (
                        <p>
                            Selected coordinates:
                            {' '}
                            {form.latitude.toFixed(6)},
                            {' '}
                            {form.longitude.toFixed(6)}
                        </p>
                    )}

                <IonItem>
                    <IonToggle
                        checked={form.completed}
                        onIonChange={e => setForm({
                            ...form,
                            completed: e.detail.checked
                        })}
                    >
                        Completed
                    </IonToggle>
                </IonItem>

                <div className="ion-padding-vertical">
                    <IonButton
                        expand="block"
                        fill="outline"
                        onClick={takePhoto}
                    >
                        Take Photo
                    </IonButton>

                    {photoUrl && (
                        <img
                            src={photoUrl}
                            alt="Activity"
                            style={{
                                width: '100%',
                                maxHeight: '250px',
                                objectFit: 'cover',
                                borderRadius: '12px',
                                marginTop: '12px'
                            }}
                        />
                    )}
                </div>

                {error && (
                    <p style={{
                        color: 'var(--ion-color-danger)'
                    }}>
                        {error}
                    </p>
                )}

                <IonButton
                    expand="block"
                    onClick={save}
                    disabled={
                        saving ||
                        !form.title.trim() ||
                        !form.date ||
                        form.duration <= 0
                    }
                >
                    {saving ? 'Saving...' : 'Save Activity'}
                </IonButton>

                <ActivityMap
                    isOpen={mapOpen}
                    onClose={() => setMapOpen(false)}
                    onSelect={selectLocation}
                    latitude={form.latitude}
                    longitude={form.longitude}
                />
            </IonContent>
        </IonPage>
    );
};

export default ActivityForm;
