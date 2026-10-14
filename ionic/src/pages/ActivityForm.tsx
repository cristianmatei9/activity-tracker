
import React, { useEffect, useState } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonTextarea, IonToggle, IonButton,
    IonButtons, IonBackButton
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ActivityInput, createActivity, getActivity, updateActivity
} from '../services/activityApi';

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

        getActivity(Number(id))
            .then(activity => {
                const { id: _, ...data } = activity;
                setForm(data);
            })
            .catch(() => setError('Failed to load activity'));
    }, [id, isEditing]);

    const save = async () => {
        setError('');
        setSaving(true);

        try {
            if (isEditing) {
                await updateActivity(Number(id), form);
            } else {
                await createActivity(form);
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
                    <IonTitle>{isEditing ? 'Edit Activity' : 'Add Activity'}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <IonItem>
                    <IonInput label="Title" labelPlacement="stacked"
                              value={form.title}
                              onIonInput={e => setForm({
                                  ...form, title: e.detail.value ?? ''
                              })} />
                </IonItem>

                <IonItem>
                    <IonTextarea label="Description" labelPlacement="stacked"
                                 value={form.description}
                                 onIonInput={e => setForm({
                                     ...form, description: e.detail.value ?? ''
                                 })} />
                </IonItem>

                <IonItem>
                    <IonInput label="Date" labelPlacement="stacked"
                              type="date" value={form.date}
                              onIonInput={e => setForm({
                                  ...form, date: e.detail.value ?? ''
                              })} />
                </IonItem>

                <IonItem>
                    <IonInput label="Duration (minutes)" labelPlacement="stacked"
                              type="number" value={form.duration}
                              onIonInput={e => setForm({
                                  ...form, duration: Number(e.detail.value)
                              })} />
                </IonItem>

                <IonItem>
                    <IonInput label="Location" labelPlacement="stacked"
                              value={form.location ?? ''}
                              onIonInput={e => setForm({
                                  ...form, location: e.detail.value ?? ''
                              })} />
                </IonItem>

                <IonItem>
                    <IonToggle checked={form.completed}
                               onIonChange={e => setForm({
                                   ...form, completed: e.detail.checked
                               })}>
                        Completed
                    </IonToggle>
                </IonItem>

                {error && <p>{error}</p>}

                <IonButton expand="block" onClick={save}
                           disabled={saving || !form.title.trim() ||
                               !form.date || form.duration <= 0}>
                    {saving ? 'Saving...' : 'Save Activity'}
                </IonButton>
            </IonContent>
        </IonPage>
    );
};

export default ActivityForm;
