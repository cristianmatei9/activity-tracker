
import { Activity } from '../models/Activity';
import {
    ActivityInput,
    createActivity,
    updateActivity,
    uploadActivityPhoto
} from './activityApi';
import { loadActivities, saveActivities } from './activityStorage';
import { readActivityPhoto } from './photoService';

export type PendingOperation =
    | {
    type: 'CREATE';
    localId: number;
    data: ActivityInput;
    serverId?: number;
}
    | {
    type: 'UPDATE';
    activityId: number;
    data: ActivityInput;
};

const getKey = (userId: number) => `pending_operations_${userId}`;
const activeSyncs = new Set<number>();

export function getPendingOperations(userId: number): PendingOperation[] {
    try {
        const parsed: unknown = JSON.parse(
            localStorage.getItem(getKey(userId)) || '[]'
        );
        return Array.isArray(parsed) ? parsed as PendingOperation[] : [];
    } catch {
        return [];
    }
}

export function savePendingOperations(
    userId: number,
    operations: PendingOperation[]
): void {
    localStorage.setItem(getKey(userId), JSON.stringify(operations));
}

export function addPendingOperation(
    userId: number,
    operation: PendingOperation
): void {
    const operations = getPendingOperations(userId);

    if (operation.type === 'UPDATE') {
        const create = operations.find(
            op => op.type === 'CREATE' &&
                (op.localId === operation.activityId ||
                    op.serverId === operation.activityId)
        );

        if (create?.type === 'CREATE') {
            create.data = operation.data;
            savePendingOperations(userId, operations);
            return;
        }

        const index = operations.findIndex(
            op => op.type === 'UPDATE' &&
                op.activityId === operation.activityId
        );

        if (index !== -1) {
            operations[index] = operation;
            savePendingOperations(userId, operations);
            return;
        }
    }

    operations.push(operation);
    savePendingOperations(userId, operations);
}

function isLocalPhoto(photo?: string): boolean {
    return Boolean(photo?.startsWith('activity_'));
}

function replaceLocalActivity(
    userId: number,
    oldId: number,
    updated: Activity
): void {
    const local = loadActivities(userId);
    const index = local.findIndex(
        a => a.id === oldId || a.id === updated.id
    );

    if (index >= 0) {
        local[index] = updated;
    } else {
        local.push(updated);
    }

    saveActivities(
        userId,
        local.filter(
            (a, i) => local.findIndex(b => b.id === a.id) === i
        )
    );
}

async function uploadPhotoIfNeeded(
    activity: Activity,
    photo?: string
): Promise<Activity> {
    if (!isLocalPhoto(photo)) return activity;

    const fileName = photo as string;
    const blob = await readActivityPhoto(fileName);

    return uploadActivityPhoto(activity.id, blob, fileName);
}

export async function syncPendingOperations(
    userId: number
): Promise<boolean> {
    if (activeSyncs.has(userId)) return false;
    if (!navigator.onLine) return false;

    activeSyncs.add(userId);

    try {
        while (true) {
            const operations = getPendingOperations(userId);
            const operation = operations[0];

            if (!operation) return true;

            try {
                if (operation.type === 'CREATE') {
                    let serverId = operation.serverId;

                    if (serverId == null) {
                        const created = await createActivity({
                            ...operation.data,
                            photo: undefined
                        });

                        serverId = created.id;

                        savePendingOperations(userId, [
                            { ...operation, serverId },
                            ...operations.slice(1)
                        ]);

                        replaceLocalActivity(
                            userId,
                            operation.localId,
                            {
                                ...created,
                                photo: isLocalPhoto(operation.data.photo)
                                    ? operation.data.photo
                                    : created.photo
                            }
                        );
                    }

                    const data = operation.data;

                    const updated = await updateActivity(serverId, {
                        ...data,
                        photo: undefined
                    });

                    const result = await uploadPhotoIfNeeded(
                        updated,
                        data.photo
                    );

                    replaceLocalActivity(
                        userId,
                        operation.localId,
                        result
                    );

                    const latest = getPendingOperations(userId);

                    savePendingOperations(
                        userId,
                        latest.slice(1).map(op =>
                            op.type === 'UPDATE' &&
                            op.activityId === operation.localId
                                ? { ...op, activityId: serverId }
                                : op
                        )
                    );
                } else {
                    const updated = await updateActivity(
                        operation.activityId,
                        {
                            ...operation.data,
                            photo: undefined
                        }
                    );

                    const result = await uploadPhotoIfNeeded(
                        updated,
                        operation.data.photo
                    );

                    replaceLocalActivity(
                        userId,
                        operation.activityId,
                        result
                    );

                    savePendingOperations(
                        userId,
                        getPendingOperations(userId).slice(1)
                    );
                }
            } catch (error) {
                console.error('Synchronization failed:', error);
                return false;
            }
        }
    } finally {
        activeSyncs.delete(userId);
    }
}

export function mergeActivities(
    userId: number,
    serverActivities: Activity[]
): Activity[] {
    const local = loadActivities(userId);
    const pending = getPendingOperations(userId);
    const localById = new Map(local.map(a => [a.id, a]));
    const pendingIds = new Set<number>();

    for (const operation of pending) {
        if (operation.type === 'CREATE') {
            pendingIds.add(operation.serverId ?? operation.localId);
        } else {
            pendingIds.add(operation.activityId);
        }
    }

    const merged = serverActivities.map(activity =>
        pendingIds.has(activity.id)
            ? localById.get(activity.id) ?? activity
            : activity
    );

    const seen = new Set(merged.map(a => a.id));

    for (const activity of local) {
        if (pendingIds.has(activity.id) && !seen.has(activity.id)) {
            merged.push(activity);
            seen.add(activity.id);
        }
    }

    saveActivities(userId, merged);
    return merged;
}
