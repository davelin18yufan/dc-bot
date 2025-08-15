// import { User } from "discord.js";

interface ClockedInData {
    tasks: string;
    time: Date;
}

export class AttendanceService {
    private static instance: AttendanceService;
    private clockedInUsers: Map<string, ClockedInData> = new Map();

    public static getInstance(): AttendanceService {
        if (!AttendanceService.instance) {
            AttendanceService.instance = new AttendanceService();
        }
        return AttendanceService.instance;
    }

    public clockIn(userId: string, tasks: string): { success: boolean; message: string } {
        if (this.clockedInUsers.has(userId)) {
            return { success: false, message: "alreadyClockedIn" };
        }
        this.clockedInUsers.set(userId, { tasks, time: new Date() });
        return { success: true, message: "clockInSuccess" };
    }

    public clockOut(userId: string): { success: boolean; message: string } {
        if (!this.clockedInUsers.has(userId)) {
            return { success: false, message: "notClockedIn" };
        }
        this.clockedInUsers.delete(userId);
        return { success: true, message: "clockOutSuccess" };
    }

    public getNotClockedInUsers(developerIds: string[]): string[] {
        return developerIds.filter(id => !this.clockedInUsers.has(id));
    }

    public getClockedInUsers(): string[] {
        return Array.from(this.clockedInUsers.keys());
    }

    public clear(): void {
        this.clockedInUsers.clear();
    }
}
