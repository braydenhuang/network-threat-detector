import { getFromAPI } from "./api";
import type { Assignment, Health, JobResponse, JobResult, MLJobResult, Service } from "./types";

export async function getAPIHealth(): Promise<Health> {
    return getFromAPI<Health>("");
}

export async function getAssignment(assignment_id: string): Promise<Assignment> {
    return getFromAPI<Assignment>(`assignment/${assignment_id}`);
}

export async function getJob(job_id: string): Promise<JobResponse> {
    return getFromAPI<JobResponse>(`job/${job_id}`);
}

export function allGood(health: Health | undefined): boolean {
    if (health == undefined)
        return false;

    for (const serviceName in health) {
        if (Object.prototype.hasOwnProperty.call(health, serviceName)) {
            const service = health[serviceName as keyof Health] as Service;

            if (!service.working)
                return false;
        }
    }

    return true;
}

export function unixTimestampToDateString(milliseconds: number): string {
    const date = new Date(milliseconds);
    return date.toLocaleString(); // Format the date to a readable string
}

export function validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function compare(a: JobResult | MLJobResult, b: JobResult | MLJobResult): boolean {
    return a.success === b.success &&
           a.message === b.message &&
           a.next_job_id === b.next_job_id;
}

export class Rotate extends Array<string> {
    constructor(items: Iterable<string>) {
        super();
        
        for (const item of items)
            this.push(item);
    }

    get(index: number) {
        return this[index % this.length];
    }

    set(_index: number, _value: string) {
        // Don't let people edit the array
        throw new Error("This object is immutable!");
    }
}