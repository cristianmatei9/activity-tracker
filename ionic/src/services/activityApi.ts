import { Activity } from '../models/Activity';
import { getToken } from './authApi';

const API_URL = 'http://localhost:3000';

export class HttpError extends Error {
    constructor(public status: number) {
        super(`HTTP ${status}`);
    }
}

function authHeaders(): HeadersInit {
    const token = getToken();

    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function photoAuthHeaders(): HeadersInit {
    const token = getToken();

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}

export async function getActivities(): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities`, {
        headers: authHeaders()
    });

    if(!response.ok) {
        throw new HttpError(response.status);
    }

    return response.json();
}

export async function getActivity(id: number): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities/${id}`, {
        headers: authHeaders()
    });

    if(!response.ok) {
        throw new HttpError(response.status);
    }

    return response.json();
}

export type ActivityInput = Omit<Activity, 'id'>;

export async function createActivity(
    data: ActivityInput
): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    return response.json();
}

export async function updateActivity(
    id: number,
    data: ActivityInput
): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    return response.json();
}

export interface ActivityPage {
    items: Activity[];
    total: number;
}


export async function getActivitiesPage(
    offset: number,
    limit: number = 10,
    search: string = '',
    completed?: boolean
): Promise<ActivityPage> {
    const params = new URLSearchParams({
        offset: String(offset),
        limit: String(limit)
    });

    if (search.trim()) {
        params.set('search', search.trim());
    }

    if (completed !== undefined) {
        params.set('completed', String(completed));
    }

    const response = await fetch(
        `${API_URL}/activities?${params.toString()}`,
        {
            headers: authHeaders()
        }
    );

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    return response.json();
}

export async function uploadActivityPhoto(
    activityId: number,
    photo: Blob,
    fileName: string
): Promise<Activity> {
    const formData = new FormData();

    formData.append('photo', photo, fileName);

    const response = await fetch(
        `${API_URL}/activities/${activityId}/photo`,
        {
            method: 'POST',
            headers: photoAuthHeaders(),
            body: formData
        }
    );

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    return response.json();
}

export async function getActivityPhoto(
    activityId: number
): Promise<Blob> {
    const response = await fetch(
        `${API_URL}/activities/${activityId}/photo`,
        {
            headers: photoAuthHeaders()
        }
    );

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    return response.blob();
}
