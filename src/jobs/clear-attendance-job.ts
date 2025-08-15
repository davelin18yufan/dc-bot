import { Job } from "@/jobs/index.js";
import { AttendanceService, Logger } from "@/services/index.js";
import Config from "~/config/config.json";
import Logs from "~/lang/logs.json";

export class ClearAttendanceJob extends Job {
    public name = "Clear Attendance";
    public schedule: string = Config.jobs.clearAttendance.schedule;
    public log: boolean = Config.jobs.clearAttendance.log;
    public runOnce: boolean = Config.jobs.clearAttendance.runOnce;
    public initialDelaySecs: number = Config.jobs.clearAttendance.initialDelaySecs;

    public async run(): Promise<void> {
        const attendanceService = AttendanceService.getInstance();
        attendanceService.clear();
        Logger.info(Logs.info.clearedAttendance);
    }
}
