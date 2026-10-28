
import React, { useEffect, useState } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonTitle,
    IonContent, IonItem, IonInput, IonTextarea,
    IonToggle, IonButton, IonButtons, IonBackButton
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    ActivityInput, createActivity, getActivity,
    updateActivity, HttpError
} from '../services/activityApi';
import { getCurrentUser } from '../services/authApi';
import {
    loadActivities, saveActivities
} from '../services/activityStorage';
import {
    addPendingOperation
} from '../services/activitySync';
import { Activity } from '../models/Activity';

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
        location: ''
    });

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isEditing) return;

        const user = getCurrentUser();
        if (!user) return;

        const activityId = Number(id);
        const local = loadActivities(user.id).find(
            a => a.id === activityId
        );

        if (local) {
            const { id: _, ...data } = local;
            setForm(data);
        }

        if (activityId < 0) {
            if (!local) setError('Activity not found');
            return;
        }

        getActivity(activityId)
            .then(activity => {
                const { id: _, ...data } = activity;
                setForm(data);
                setError('');
            })
            .catch(() => {
                if (!local) {
                    setError('Failed to load activity');
                }
            });
    }, [id, isEditing]);

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
                    if (isEditing) {
                        const updated = await updateActivity(
                            activityId,
                            form
                        );

                        const activities = loadActivities(userId);
                        saveActivities(
                            userId,
                            activities.map(a =>
                                a.id === activityId ? updated : a
                            )
                        );
                    } else {
                        const created = await createActivity(form);
                        const activities = loadActivities(userId);

                        saveActivities(userId, [
                            ...activities,
                            created
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

                {error && <p>{error}</p>}

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
            </IonContent>
        </IonPage>
    );
};

export default ActivityForm;
