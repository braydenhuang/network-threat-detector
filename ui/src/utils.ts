import { getFromAPI } from "./api";
import type { Health, Service } from "./types";

export async function getAPIHealth(): Promise<Health> {
    return getFromAPI<Health>("");
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