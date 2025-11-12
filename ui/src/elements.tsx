import { createMemo, createResource, createSignal, For, Show, type JSX, type Resource } from 'solid-js'
import type { Health, Service, UploadResponse } from './types';
import { allGood, getAPIHealth } from './utils';
import { uploadFileToAPIWithProgress } from './api';

export function Upload(props: {
    class?: string | undefined
}): JSX.Element {
    type State = 'Waiting' | 'Uploading' | 'Done' | 'Error';
    const [state, setState] = createSignal<State>('Waiting');

    const [progress, setProgress] = createSignal(0);
    const [result, setResult] = createSignal<UploadResponse | null>(null);

    const uploadFile = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file)
            return;

        setState('Uploading');
        setProgress(0);
        setResult(null);

        try {
            for await (const update of uploadFileToAPIWithProgress<UploadResponse>("upload", file)) {
                if (typeof update === "number")
                    setProgress(update);
                else
                    setResult(update);
            }
        } catch (error: unknown) {
            setState('Error');
            return;
        }

        setState('Done');
    };

    return (
        <div class={`${props.class || ""} min-w-[360px] min-h-[60px]`}>
            <Show when={state() === 'Waiting'}>
                <div class="flex flex-col items-center justify-center p-8 gap-4">
                    <label class="cursor-pointer">
                        <input
                            type="file"
                            class="hidden"
                            accept=".pcap"
                            onChange={uploadFile}
                        />
                        <div class="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium shadow-lg shadow-sky-900/40 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] transition-all">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-7 h-7"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.8"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M3 15a4 4 0 004 4h10a4 4 0 004-4c0-1.846-1.28-3.405-3.002-3.84A6.002 6.002 0 006 9.5c0 .512.064 1.01.186 1.486A4.002 4.002 0 003 15zm9-9v9m0 0l-3-3m3 3l3-3"
                                />
                            </svg>
                            <span class="text-lg">Upload Traffic File</span>
                        </div>
                    </label>
                    <p class="text-xs text-neutral-300 ">Accepted: .pcap</p>
                </div>
            </Show>
            <Show when={state() === 'Uploading'}>
                <div class="flex flex-col items-center gap-3 p-4">
                    <div class="w-full bg-gray-200 rounded h-3">
                        <div
                            class="h-3 rounded transition-all duration-300 bg-gradient-to-r from-sky-600 to-indigo-600 font-medium shadow-lg shadow-sky-900/40 hover:from-sky-500 hover:to-indigo-500"
                            style={{ width: `${progress()}%` }}
                        />
                    </div>
                    <p class="text-sm text-neutral-300">Uploading... ({progress()}%)</p>
                </div>
            </Show>
            <Show when={state() === 'Done'}>
                <Show when={result() != null}>
                    <Show when={result()?.success == true}>
                        <div class="flex flex-col items-center justify-center p-8">
                            <p class="font-bold italic text-green-500">Successfully submitted {result()?.filename} for processing!</p>
                            <p class="font-semibold italic text-xs text-neutral-300 mb-2">{result()?.filesize} bytes total</p>
                            <button class="hover:cursor-pointer hover:font-semibold rounded-lg px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium shadow-lg shadow-sky-900/40 hover:from-sky-500 hover:to-indigo-500" onClick={() => setState("Waiting")}>See Progress</button>
                        </div>
                    </Show>
                    <Show when={result()?.success == false}>
                        <div class="flex flex-col items-center justify-center p-8">
                            <p class="font-bold italic text-red-400 mb-2">{result()?.message}</p>
                            <button class="hover:cursor-pointer hover:font-semibold rounded-lg px-4 py-2 bg-red-900" onClick={() => setState("Waiting")}>Try Again</button>
                        </div>
                    </Show>
                </Show>
            </Show>
            <Show when={state() === 'Error'}>
                <div class="flex flex-col items-center justify-center p-8">
                    <p class="font-bold italic text-red-400 mb-2">Upload failed! See console for error information.</p>
                    <button class="hover:cursor-pointer hover:font-semibold rounded-lg px-4 py-2 bg-green-900" onClick={() => setState("Waiting")}>Try Again</button>
                </div>
            </Show>
        </div>
    );
}

export function APIHealthIndicator(props: {
    class?: string | undefined,
    onClick: (health: Resource<Health> | undefined) => void
}): JSX.Element {
    const [health] = createResource(getAPIHealth);

    return (
        <a
            class={`${props.class || ""} hover:cursor-pointer hover:font-semibold border rounded-xl border-neutral-50 text-lg flex items-center px-2`}
            onClick={() => props.onClick(health)}
        >
            {allGood(health()) ? "All Services ✅" : "Issues Detected ❌"}
        </a>
    );
}

export function APIHealthPanel(props: {
    class?: string | undefined,
    health?: Resource<Health> | undefined
}): JSX.Element {
    interface ServiceWithName extends Service {
        name: string;
    }

    const services = createMemo<ServiceWithName[] | null>(() => {
        if (props.health == undefined || props.health.loading || props.health.error)
            return null;

        const health = props.health();

        let services: ServiceWithName[] = [];

        for (const serviceName in health) {
            if (Object.prototype.hasOwnProperty.call(health, serviceName)) {
                const service = health[serviceName as keyof Health] as Service;

                services.push(
                    {
                        name: serviceName,
                        working: service.working,
                        message: service.message
                    }
                );
            }
        }

        return services;
    });

    return (
        <div class={props.class || ""}>
            <Show when={!services()}>
                <p class="italic">Loading health information...</p>
            </Show>
            <Show when={services()}>
                <h2 class="font-bold italic text-center mb-2">API Status:</h2>
                <For each={services()}>
                    {(service) => (
                        <div class="flex flex-row min-w-[200px] justify-between mb-2">
                            <span>{service.name}</span>
                            <span>{service.working ? "✅ Working" : `❌ ${service.message ? `${service.message}` : ""}`}</span>
                        </div>
                    )}
                </For>
            </Show>
        </div>
    );
}