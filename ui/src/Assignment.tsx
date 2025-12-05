// 

import { useParams } from '@solidjs/router';
import { createMemo, createResource, createSignal, onCleanup, onMount, Show, type Accessor, type JSX, type ResourceActions } from 'solid-js'
import { compare, getAssignment, validateUUID } from './utils';
import { Feedback, ProgressTracker } from './elements';
import type { JobResult, MLJobResult } from './types';

export default function Assignment(): JSX.Element {
    const [finalResult, setFinalResult] = createSignal<JobResult | undefined>(undefined);
    const finished = createMemo(() => finalResult() != undefined);

    let results: (JobResult | MLJobResult)[] = [];
    const countFinished = (result: JobResult | MLJobResult | undefined) => {
        if (result == undefined || results.find(existing => compare(existing, result)) != undefined)
            return;

        results.push(result);

        if (results.length >= 2)
            setFinalResult(results[results.length - 1]);
    };

    // ===========================

    const params = useParams();

    const assignment_id = params.assignment_id;

    const valid = validateUUID(assignment_id);

    const [assignment, options] = createResource(() => {
        if (valid)
            return getAssignment(assignment_id)

        // Invalid UUID, don't need to fetch anything
        return undefined as any;
    });

    // If we have a valid assignment ID, set up the refresh countdown
    const refreshCountdown = valid ? refresh(onMount, onCleanup, options, finished) : undefined;

    return (
        // Main container
        <>
            { /* Header with dark blue color */}
            <div class="flex flex-row flex-wrap bg-sky-950 text-neutral-50 w-full pt-4 min-h-[60px] max-h-[100px]">
                <h1 class="flex-none mx-4 p-4 text-3xl font-semibold">Network Threat Detector</h1>
                <Show when={valid}>
                    <button class="hover:cursor-pointer hover:font-semibold rounded-4xl mx-4 ml-auto px-4 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-lg text-white font-medium shadow-lg shadow-sky-900/40 hover:from-sky-500 hover:to-indigo-500" onClick={() => window.location.href = "/"}>Back to Home</button>
                </Show>
            </div>
            { /* Content with blue color */}
            <div class="flex bg-sky-950 text-neutral-50 w-full h-screen">
                { /* Center box */}
                <div class="flex flex-col m-auto">

                    <Show when={!valid || assignment.error}>
                        <div class="border rounded-2xl mx-auto border-neutral-50 border-opacity-50">
                            <div class="flex flex-col items-center justify-center p-8">
                                <h1 class="text-center text-2xl font-semibold mb-2">Oops! That page doesn't exist.</h1>
                                <button class="hover:cursor-pointer hover:font-semibold rounded-lg mx-auto px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium shadow-lg shadow-sky-900/40 hover:from-sky-500 hover:to-indigo-500" onClick={() => window.location.href = "/"}>Back to Home</button>
                            </div>
                        </div>
                    </Show>
                    <Show when={valid && !assignment.error}>
                        <>
                            <ProgressTracker
                                assignment={assignment}
                                onFinish={countFinished}
                            />

                            <Show when={!finished()}>
                                <p class="ml-4 text-sm italic font-semibold">
                                    Checking again in {refreshCountdown!()} seconds...
                                    <a class="hover:font-bold hover:underline" onClick={options.refetch}>(Check now)</a>
                                </p>
                            </Show>

                            <Show when={finished()}>
                                <div class={`mx-auto my-8 sm:w-128 w-4/5 rounded-2xl border border-emerald-900 ${finalResult()?.success ? "bg-teal-800" : "bg-red-800"}`}>
                                    <p class="mt-4 text-center sm:text-xl text-base font-semibold">
                                        We've finished processing your file!
                                    </p>

                                    <div class="text-slate-100">
                                        <p class="text-center">{finalResult()?.success ? "Job Successful" : "Task Failed"}</p>
                                        <p class="mb-4 text-center text-xs text-slate-300">{finalResult()?.message || ""}</p>
                                    </div>
                                </div>

                                <Feedback
                                    class="mx-auto sm:w-128 w-4/5"
                                    assignment_id={assignment().id}
                                />
                            </Show>
                        </>
                    </Show>
                </div>
            </div>
        </>
    );
}


function refresh(
    onMount: (fn: () => void) => void,
    onCleanup: (fn: () => void) => void,
    options: ResourceActions<any, unknown>,
    finished: Accessor<boolean>
): Accessor<number> {
    let refetchCount = 3; // Start with 2^3 = 8 seconds
    const [refreshCountdown, setRefreshCountdown] = createSignal(Math.pow(2, refetchCount)); // In seconds
    const raiseCountdown = (current: number) => setRefreshCountdown(current >= 2048 ? 2048 : current * Math.pow(2, ++refetchCount));
    let refetchTask: number | undefined;
    onMount(async () => {
        setInterval(() => {
            const count = refreshCountdown();
            if (count <= 1 && !finished()) {
                options.refetch();
                raiseCountdown(count);
            } else
                setRefreshCountdown(count - 1);
        }, 1000);
    });

    onCleanup(() => {
        if (refetchTask != undefined)
            clearInterval(refetchTask);
    });

    return refreshCountdown;
}