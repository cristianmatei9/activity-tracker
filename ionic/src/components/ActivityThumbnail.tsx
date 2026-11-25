import React, { useEffect, useState } from 'react';
import { Activity } from '../models/Activity';
import { getActivityPhoto } from '../services/activityApi';
import { loadActivityPhoto } from '../services/photoService';

interface ActivityThumbnailProps {
    activity: Activity;
}

const ActivityThumbnail: React.FC<ActivityThumbnailProps> = ({
                                                                 activity
                                                             }) => {
    const [photoUrl, setPhotoUrl] = useState('');

    useEffect(() => {
        let active = true;
        let objectUrl = '';

        const load = async () => {
            setPhotoUrl('');

            if (!activity.photo) return;

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

        void load();

        return () => {
            active = false;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [activity.id, activity.photo]);

    if (!photoUrl) return null;

    return (
        <img
            src={photoUrl}
            alt={activity.title}
            loading="lazy"
            className="activity-thumbnail"
        />
    );
};

export default ActivityThumbnail;