export interface Activity {
    id: number;
    title: string;
    description: string;
    date: string;
    duration: number;
    completed: boolean;
    location?: string;
    photo?: string;
}