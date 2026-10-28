
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import {
    IonPage, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonLabel,
    IonBadge, IonButtons, IonButton,
    IonInput, IonSelect, IonSelectOption,
    IonInfiniteScroll, IonInfiniteScrollContent,
    useIonViewWillEnter
} from '@ionic/react';

import { useNavigate } from 'react-router-dom';
import { Activity } from '../models/Activity';
import {
    getActivitiesPage,
    getActivities
} from '../services/activityApi';
import {
    logout,
    getCurrentUser
} from '../services/authApi';
import {
    loadActivities
} from '../services/activityStorage';
import {
    getPendingOperations,
    mergeActivities,
    syncPendingOperations
} from '../services/activitySync';
import {
    connectActivityWebSocket
} from '../services/activityWebSocket';

import './Home.css';

const PAGE_SIZE = 10;

function getCompletedFilter(
    filter: string
): boolean | undefined {
    if (filter === 'completed') return true;
    if (filter === 'pending') return false;
    return undefined;
}


interface HomeProps {
    onLogout: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogout }) => {
    const navigate = useNavigate();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [online, setOnline] = useState(navigator.onLine);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [serverAvailable, setServerAvailable] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const loadingRef = useRef(false);
    const refreshVersion = useRef(0);

    const refresh = useCallback(async () => {
        const user = getCurrentUser();
        if (!user) return;

        const version = ++refreshVersion.current;
        const userId = user.id;

        setActivities(loadActivities(userId));
        setPendingCount(getPendingOperations(userId).length);

        if (loadingRef.current) return;
        loadingRef.current = true;

        try {
            await syncPendingOperations(userId);

            const page = await getActivitiesPage(
                0,
                PAGE_SIZE,
                search,
                getCompletedFilter(filter)
            );

            if (version !== refreshVersion.current) return;

            setActivities(page.items);
            setOffset(page.items.length);
            setTotal(page.total);
            setServerAvailable(true);
            setOnline(true);
            setVisibleCount(PAGE_SIZE);

            const pending = getPendingOperations(userId);
            setPendingCount(pending.length);
            setError(pending.length > 0
                ? 'Some activities are waiting for synchronization.'
                : '');

            // Keep the complete offline cache updated.
            const all = await getActivities();

            if (version === refreshVersion.current) {
                mergeActivities(userId, all);
            }
        } catch {
            if (version !== refreshVersion.current) return;

            const local = loadActivities(userId);
            setActivities(local);
            setOffset(0);
            setTotal(local.length);
            setServerAvailable(false);
            setOnline(navigator.onLine);
            setPendingCount(getPendingOperations(userId).length);
            setError('Server unavailable. Showing local activities.');
        } finally {
            loadingRef.current = false;
        }
    }, [search, filter]);

    const loadMore = async () => {
        if (loadingRef.current) return;

        if (!serverAvailable) {
            setVisibleCount(value => value + PAGE_SIZE);
            return;
        }

        if (offset >= total) return;

        loadingRef.current = true;

        try {
            const page = await getActivitiesPage(
                offset,
                PAGE_SIZE,
                search,
                getCompletedFilter(filter)
            );

            setActivities(previous => {
                const ids = new Set(previous.map(a => a.id));

                return [
                    ...previous,
                    ...page.items.filter(a => !ids.has(a.id))
                ];
            });

            setOffset(value => value + page.items.length);
            setTotal(page.total);
        } catch {
            setError('Failed to load the next page.');
        } finally {
            loadingRef.current = false;
        }
    };

    useIonViewWillEnter(() => {
        void refresh();
    });

    useEffect(() => {
        const handleOnline = () => {
            setOnline(true);
            void refresh();
        };

        const handleOffline = () => {
            setOnline(false);
            setServerAvailable(false);
            setActivities(
                loadActivities(getCurrentUser()?.id ?? 0)
            );
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = window.setInterval(() => {
            const user = getCurrentUser();

            if (
                user &&
                getPendingOperations(user.id).length > 0
            ) {
                void refresh();
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.clearInterval(interval);
        };
    }, [refresh]);

    useEffect(() => {
        if (!getCurrentUser()) return;

        const socket = connectActivityWebSocket(() => {
            void refresh();
        });

        return () => socket.close();
    }, [refresh]);


    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void refresh();
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, filter, refresh]);


    const filteredActivities = useMemo(() => {
        const query = search.toLowerCase();

        return activities.filter(activity => {
            const matchesSearch =
                activity.title.toLowerCase().includes(query) ||
                activity.description.toLowerCase().includes(query);

            const matchesFilter =
                filter === 'all' ||
                (filter === 'completed' && activity.completed) ||
                (filter === 'pending' && !activity.completed);

            return matchesSearch && matchesFilter;
        });
    }, [activities, search, filter]);

    const displayedActivities = serverAvailable
        ? activities
        : filteredActivities.slice(0, visibleCount);

    const hasMore = serverAvailable
        ? offset < total
        : visibleCount < filteredActivities.length;

    const handleLogout = () => {
        logout();
        onLogout();
        navigate('/login', { replace: true });
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Activity Tracker</IonTitle>

                    <IonButtons slot="end">
                        <IonButton
                            onClick={() => navigate('/activities/new')}
                        >
                            Add
                        </IonButton>

                        <IonButton onClick={() => void refresh()}>
                            Refresh
                        </IonButton>

                        <IonButton
                            color="danger"
                            onClick={handleLogout}
                        >
                            Logout
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <IonBadge color={online ? 'success' : 'danger'}>
                    {online ? 'Online' : 'Offline'}
                </IonBadge>

                {pendingCount > 0 && (
                    <p>
                        {pendingCount} operation(s) waiting for synchronization
                    </p>
                )}

                {error && <p>{error}</p>}

                <IonItem>
                    <IonInput
                        label="Search activities"
                        labelPlacement="stacked"
                        value={search}
                        onIonInput={event => {
                            setSearch(event.detail.value ?? '');
                            setVisibleCount(PAGE_SIZE);
                        }}
                    />
                </IonItem>

                <IonItem>
                    <IonSelect
                        label="Filter"
                        value={filter}
                        onIonChange={event => {
                            setFilter(event.detail.value);
                            setVisibleCount(PAGE_SIZE);
                        }}
                    >
                        <IonSelectOption value="all">All</IonSelectOption>
                        <IonSelectOption value="completed">
                            Completed
                        </IonSelectOption>
                        <IonSelectOption value="pending">
                            Pending
                        </IonSelectOption>
                    </IonSelect>
                </IonItem>

                <IonList>
                    {displayedActivities.map(activity => (
                        <IonItem
                            key={activity.id}
                            button
                            onClick={() =>
                                navigate(`/activities/${activity.id}`)
                            }
                        >
                            <IonLabel>
                                <h2>{activity.title}</h2>
                                <p>
                                    {activity.date} | {activity.duration} min
                                </p>
                                {activity.id < 0 && (
                                    <p>Not synchronized</p>
                                )}
                            </IonLabel>

                            <IonBadge
                                color={activity.completed
                                    ? 'success'
                                    : 'warning'}
                            >
                                {activity.completed
                                    ? 'Completed'
                                    : 'Pending'}
                            </IonBadge>
                        </IonItem>
                    ))}
                </IonList>

                <IonInfiniteScroll
                    disabled={!hasMore}
                    onIonInfinite={async event => {
                        await loadMore();
                        await event.target.complete();
                    }}
                >
                    <IonInfiniteScrollContent
                        loadingText="Loading more activities..."
                    />
                </IonInfiniteScroll>
            </IonContent>
        </IonPage>
    );
};

export default Home;
