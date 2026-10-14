import {Activity} from "../models/Activity";

export const mockActivities: Activity[] = [
    {
        id: 1,
        title: 'Gym Workout',
        description: 'Upper body training',
        date: '2026-10-15',
        duration: 60,
        completed: false,
        location: 'Cluj-Napoca'
    },
    {
        id: 2,
        title: 'Study Session',
        description: 'Study for university',
        date: '2026-10-16',
        duration: 120,
        completed: false
    },
    {
        id: 3,
        title: 'Grocery Shopping',
        description: 'Buy groceries for the week',
        date: '2026-10-13',
        duration: 45,
        completed: true
    }
]