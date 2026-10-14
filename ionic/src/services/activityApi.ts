import { Activity } from '../models/Activity';

const API_URL = 'http://localhost:3000';

export async function getActivities(): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities`);

    if(!response.ok) {
        throw new Error('Failed to fetch activities');
    }
    return response.json();
}

export async function getActivity(id: Number): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities/${id}`);

    if(!response.ok) {
        throw new Error('Failed to fetch activity');
    }
    return response.json();
}

export type ActivityInput = Omit<Activity, 'id'>;

export async function createActivity(data: ActivityInput): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Failed to create activity');
    }

    return response.json();
}

export async function updateActivity(
    id: number,
    data: ActivityInput
): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Failed to update activity');
    }

    return response.json();
}