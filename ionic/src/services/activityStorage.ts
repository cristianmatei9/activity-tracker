
import { Activity } from '../models/Activity';

const STORAGE_PREFIX = 'activities_';

function getStorageKey(userId: number): string {
    return `${STORAGE_PREFIX}${userId}`;
}

export function saveActivities(
    userId: number,
    activities: Activity[]
): void {
    const key = getStorageKey(userId);

    localStorage.setItem(key, JSON.stringify(activities));
}

export function loadActivities(userId: number): Activity[] {
    const key = getStorageKey(userId);
    const storedData = localStorage.getItem(key);

    if (!storedData) {
        return [];
    }

    try {
        return JSON.parse(storedData) as Activity[];
    } catch {
        return [];
    }
}

export function clearActivities(userId: number): void {
    const key = getStorageKey(userId);

    localStorage.removeItem(key);
}