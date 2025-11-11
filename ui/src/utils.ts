import { getFromAPI } from "./api";
import type { Health } from "./types";

export async function getAPIHealth(): Promise<Health> {
    return getFromAPI<Health>('');
}