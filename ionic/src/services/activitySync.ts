
import { Activity } from '../models/Activity';
import {
    ActivityInput,
    createActivity,
    updateActivity
} from './activityApi';
import {
    loadActivities,
    saveActivities
} from './activityStorage';

export type PendingOperation =
    | {
    type: 'CREATE';
    localId: number;
    data: ActivityInput;
}
    | {
    type: 'UPDATE';
    activityId: number;
    data: ActivityInput;
};

const getKey = (userId: number) =>
    `pending_operations_${userId}`;

export function getPendingOperations(
    userId: number
): PendingOperation[] {
    try {
        const data = JSON.parse(
            localStorage.getItem(getKey(userId)) || '[]'
        );
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export function savePendingOperations(
    userId: number,
    operations: PendingOperation[]
): void {
    localStorage.setItem(
        getKey(userId),
        JSON.stringify(operations)
    );
}

export function addPendingOperation(
    userId: number,
    operation: PendingOperation
): void {
    const operations = getPendingOperations(userId);

    if (operation.type === 'UPDATE') {
        const create = operations.find(
            op => op.type === 'CREATE' &&
                op.localId === operation.activityId
        );

        if (create && create.type === 'CREATE') {
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

const activeSyncs = new Set<number>();

export async function syncPendingOperations(
    userId: number
): Promise<boolean> {
    if (activeSyncs.has(userId)) return false;

    activeSyncs.add(userId);

    try {
        while (true) {
            const operations = getPendingOperations(userId);
            const operation = operations[0];

            if (!operation) return true;

            try {
                if (operation.type === 'CREATE') {
                    const created = await createActivity(
                        operation.data
                    );

                    const activities = loadActivities(userId);

                    saveActivities(
                        userId,
                        activities.map(activity =>
                            activity.id === operation.localId
                                ? created
                                : activity
                        )
                    );
                } else {
                    const updated = await updateActivity(
                        operation.activityId,
                        operation.data
                    );

                    const activities = loadActivities(userId);

                    saveActivities(
                        userId,
                        activities.map(activity =>
                            activity.id === operation.activityId
                                ? updated
                                : activity
                        )
                    );
                }

                savePendingOperations(
                    userId,
                    getPendingOperations(userId).slice(1)
                );
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

    const createIds = new Set(
        pending
            .filter(op => op.type === 'CREATE')
            .map(op => op.localId)
    );

    const updateIds = new Set(
        pending
            .filter(op => op.type === 'UPDATE')
            .map(op => op.activityId)
    );

    const merged = serverActivities.map(activity => {
        if (updateIds.has(activity.id)) {
            return local.find(a => a.id === activity.id)
                || activity;
        }
        return activity;
    });

    for (const activity of local) {
        if (createIds.has(activity.id)) {
            merged.push(activity);
        }
    }

    saveActivities(userId, merged);
    return merged;
}
