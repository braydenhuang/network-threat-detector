import { createEffect, createMemo, createResource, createSignal, For, Show, type JSX, type Resource } from 'solid-js'
import type { Assignment, Health, JobResponse, Service, Stage, UploadResponse } from './types';
import { allGood, getAPIHealth, getJob, unixTimestampToDateString } from './utils';
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

    const redirectToAssignment = () => {
        const response = result();

        if (response == null || !response.success || response.assignment_id == null)
            return;

        window.open(`/${response.assignment_id}`, '_blank');
    }

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
                            <button class="hover:cursor-pointer hover:font-semibold rounded-lg px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium shadow-lg shadow-sky-900/40 hover:from-sky-500 hover:to-indigo-500" onClick={redirectToAssignment}>See Progress</button>
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

export function Feedback(props: {
    class?: string | undefined
    assignment_id: string
}): JSX.Element {
    const [submitted, setSubmitted] = createSignal(false);

    return (
        <div class={`${props.class || ""} rounded-3xl border border-slate-400 lg:w-2/4 w-3/4 p-6`}>
            <p class="text-center text-xl font-semibold">
                Did we get it right?
            </p>

            <Show when={!submitted()}>
                <div class="flex items-center justify-center gap-8 mt-6">
                    <button
                        class="w-24 h-24 rounded-full flex items-center justify-center bg-teal-600 text-white text-2xl shadow-md hover:bg-emerald-500 active:scale-[0.98] transition"
                        onClick={() => {
                            setSubmitted(true);
                            // TODO: send feedback
                        }}
                        aria-label="Yes"
                        title="Yes"
                    >
                        👍
                    </button>
                    <button
                        class="w-24 h-24 rounded-full flex items-center justify-center bg-orange-900 text-white text-2xl shadow-md hover:bg-red-500 active:scale-[0.98] transition"
                        onClick={() => {
                            setSubmitted(true);
                            // TODO: send feedback
                        }}
                        aria-label="No"
                        title="No"
                    >
                        👎
                    </button>
                </div>
            </Show>

            <Show when={submitted()}>
                <p class="mt-4 text-center italic font-semibold">
                    Thanks for your feedback!
                </p>
                <p class="text-center italic text-sm font-semibold">
                    Your response helps us improve our models.
                </p>
            </Show>
        </div>
    );
}

function StatusButton(props: {
    class?: string | undefined
    status: string
    onClick?: () => void
}): JSX.Element {
    interface Title {
        name: string;
        emoji: string;
    }

    const title = createMemo<Title>(() => {
        switch (props.status) {
            case "queued":
                return { name: "Queued", emoji: "⏳" };
            case "started":
                return { name: "In Progress", emoji: "🔄" }
            case "failed":
                return { name: "Failed", emoji: "❌" }
            case "finished":
                return { name: "Completed", emoji: "✅" }
            default:
                return { name: "Unknown", emoji: "❓" };
        }
    });

    return (
        <button
            class={`${props.class || ""} hover:cursor-default hover:font-semibold hover:bg-blue-800 rounded-xl px-2 py-1 bg-blue-900 text-lg text-white font-medium`}
            onClick={props.onClick}
        >
            {title().emoji} {title().name}
        </button>
    );
}

function Status(props: {
    class?: string | undefined
    stage: Stage
    onFinish: (response: JobResponse) => void
}): JSX.Element {
    type View = 'Closed' | 'Status' | 'Results';

    const [view, setView] = createSignal<View>('Closed');

    const [job] = createResource(() => props.stage.id != null ? getJob(props.stage.id) : undefined);

    createEffect(() => {
        if (job() != undefined && job()?.status === 'finished')
            props.onFinish?.(job()!);
    });

    return (
        <div class={props.class || ""}>
            <Show when={view() === 'Closed'}>
                <StatusButton status={job()?.status || ""} onClick={() => setView('Status')} />

                <Show when={job()?.status === 'finished'}>
                    <br />
                    <a class="hover:cursor-default hover:font-bold underline italic" onClick={() => setView('Results')}>View Results</a>
                </Show>
            </Show>
            <Show when={view() === 'Status'}>
                <div class="rounded-2xl border border-slate-900 bg-blue-900 p-2">
                    <button
                        class="mb-4 hover:cursor-default hover:font-semibold hover:bg-blue-900 rounded-xl px-2 py-1 bg-blue-950 text-lg text-white font-medium"
                        onClick={() => setView('Closed')}
                    >
                        Close
                    </button>

                    <Show when={job() == undefined}>
                        <p>Loading job information...</p>
                    </Show>
                    <Show when={job() != undefined}>
                        <div class="text-slate-100">
                            <div class="mb-1 flex flex-row">
                                <span class="flex-grow">Status:</span>
                                <span class="">{job()?.status}</span>
                            </div>
                            <div class="mb-1 flex flex-row">
                                <span class="flex-grow">Queue:</span>
                                <span class="">{job()?.queue}</span>
                            </div>
                            <div class="mb-1 flex flex-row">
                                <span class="flex-grow">Enqueued at:</span>
                                <span class="">{job()?.enqeued_at != null ? unixTimestampToDateString(parseInt(job()?.enqeued_at as string)) : "(pending)"}</span>
                            </div>
                            <div class="flex flex-row">
                                <span class="flex-grow">Ended at:</span>
                                <span class="">{job()?.ended_at != null ? unixTimestampToDateString(parseInt(job()?.ended_at as string)) : "(pending)"}</span>
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
            <Show when={view() === 'Results'}>
                <div class={`rounded-2xl border border-emerald-900 ${job()?.result?.success ? "bg-teal-800" : "bg-red-800"} p-2`}>
                    <button
                        class="mb-4 hover:cursor-default hover:font-semibold hover:bg-blue-900 rounded-xl px-2 py-1 bg-blue-950 text-lg text-white font-medium"
                        onClick={() => setView('Closed')}
                    >
                        Close
                    </button>

                    <Show when={job() == undefined}>
                        <p>Loading job information...</p>
                    </Show>
                    <Show when={job() != undefined}>
                        <div class="text-slate-100">
                            <p class="text-center">{job()?.result?.success ? "Job Successful" : "Task Failed"}</p>
                            <p class="mb-4 text-center text-xs text-slate-300">{job()?.result?.message || ""}</p>

                            <div class="flex flex-row text-xs">
                                <span class="flex-grow">Ended at:</span>
                                <span class="">{job()?.ended_at != null ? unixTimestampToDateString(parseInt(job()?.ended_at as string)) : "(pending)"}</span>
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
        </div>
    );
}

export function ProgressTracker(props: {
    class?: string | undefined,
    assignment: Resource<Assignment>,
    onFinish: (response: JobResponse) => void
}): JSX.Element {
    class Colors extends Array<string> {
        constructor() {
            super();
            this.push("violet-500/80");
            this.push("blue-500/70");
        }

        get(index: number) {
            return this[index % this.length];
        }

        set(_index: number, _value: string) {
            // Do nothing
        }
    }

    const COLORS = new Colors();

    const stages = createMemo(() => props.assignment()?.stages);

    return (
        <div class={props.class || ""}>
            <div class="flex items-center justify-center">
                <div class="flex flex-wrap w-full max-w-5xl px-4 text-white text-sm font-medium">

                    <div class="relative flex-1 z-30">
                        <div
                            class="flex flex-col items-start justify-center min-w-64 h-full min-h-64 px-10 bg-emerald-500/95 ring-1 ring-neutral-50/70 shadow-lg [clip-path:polygon(0%_0%,90%_0%,100%_50%,90%_100%,0%_100%,10%_50%)]">
                            <div class="ml-5">
                                <p class="text-lg mb-1">Received file for analysis</p>
                                <p class="text-sm text-slate-100 opacity-95">We are preparing your file for analysis using machine learning technologies.</p>
                            </div>
                        </div>
                    </div>

                    <For each={stages()}>
                        {(stage, index) => (
                            <div class="relative flex-1 -ml-8 z-20">
                                <div
                                    class={`flex items-center justify-center min-w-64 h-full px-10 py-8 bg-${COLORS[index()]} ring-1 ring-neutral-50/60 shadow-lg [clip-path:polygon(0%_0%,90%_0%,100%_50%,90%_100%,0%_100%,10%_50%)]`}>
                                    <div class="ml-5">
                                        <p class="text-lg mb-1">{stage.name}</p>
                                        <p class="text-sm text-slate-100 opacity-95 mb-3">{stage.description}</p>

                                        <Status
                                            stage={stage}
                                            onFinish={props.onFinish}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </For>

                </div>
            </div>
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