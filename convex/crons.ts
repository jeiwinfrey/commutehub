import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("move vehicles", { seconds: 10 }, internal.vehicles.tick);
crons.interval("expire reports", { minutes: 1 }, internal.reports.purge);
export default crons;
