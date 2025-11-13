export async function getFromAPI<V>(endpoint: string): Promise<V> {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok)
        throw new Error(`API GET request failed: ${response.status} ${response.statusText}`);

    return response.json() as Promise<V>;
}

export async function postToAPI<T, V>(endpoint: string, data: T): Promise<V> {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok)
        throw new Error(`API POST request failed: ${response.status} ${response.statusText}`);

    return response.json() as Promise<V>;
}

export async function uploadFileToAPI<V>(endpoint: string, file: File): Promise<V> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok)
        throw new Error(`API file upload failed: ${response.status} ${response.statusText}`);
    
    return response.json() as Promise<V>;
}

export async function* uploadFileToAPIWithProgress<V>(
  endpoint: string,
  file: File
): AsyncGenerator<number | V, void, unknown> {
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();

  // Tiny async queue the generator will drain.
  const queue: Array<number | V> = [];
  let notify: (() => void) | null = null;
  let done = false;
  let error: Error | null = null;

  const push = (val: number | V) => {
    queue.push(val);
    if (notify) {
      const n = notify;
      notify = null;
      n();
    }
  };

  const wake = () => {
    if (notify) {
      const n = notify;
      notify = null;
      n();
    }
  };

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      push(percent); // this will be yielded out
    }
  };

  xhr.onload = () => {
    try {
      const result = JSON.parse(xhr.responseText) as V;
      // ensure final 100 then the parsed result
      push(100);
      push(result);
    } catch {
      error = new Error("Invalid JSON response");
    }
    done = true;
    wake();
  };

  xhr.onerror = () => {
    error = new Error("Network error during upload");
    done = true;
    wake();
  };

  xhr.open("POST", `/api/${endpoint}`);
  // If your API returns JSON, this is optional but fine:
  // xhr.responseType = "json";
  xhr.send(formData);

  // Drain the queue as items arrive; finish when done & queue empty.
  while (true) {
    // Yield anything already in the queue.
    while (queue.length) {
      yield queue.shift()!;
    }
    if (done) break; // nothing left and upload finished
    // Wait for more items or completion.
    await new Promise<void>((res) => (notify = res));
    if (error) break; // wake due to error
  }

  if (error) throw error;
}
