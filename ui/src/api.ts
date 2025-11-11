export async function getFromAPI<T>(endpoint: string): Promise<T> {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok)
        throw new Error(`API GET request failed: ${response.status} ${response.statusText}`);

    return response.json() as Promise<T>;
}