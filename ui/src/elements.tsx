import { type JSX } from 'solid-js'

export function Upload(props: { 
    class?: string | undefined,
    onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event> | undefined
}): JSX.Element {
    return (
        <div class={`${props.class || ""} flex flex-col items-center justify-center p-8 gap-4 min-w-[320px]`}>
            <label class="cursor-pointer">
                <input
                    type="file"
                    class="hidden"
                    accept=".pcap,.pcapng,.csv"
                    onChange={props.onChange}
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
            <p class="text-xs text-neutral-300">Accepted: .pcap, .pcapng, .csv</p>
        </div>
    );
}