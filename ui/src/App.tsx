// Homepage component for the U.I

import { type JSX } from 'solid-js'
import { APIHealthIndicator, APIHealthPanel, Upload } from './elements'
import { usePopup } from './popup';

export default function App(): JSX.Element {
    const { setContent, PopupContainer } = usePopup();

    return (
        // Main container - <> ... </> is a JSX.Element in SolidJS, and everything must be wrapped in one, or something like a <div>
        <>
            { /* Header with dark blue color */}
            <div class="flex flex-row flex-wrap bg-sky-950 text-neutral-50 w-full pt-4 min-h-[60px] max-h-[100px]">
                <h1 class="flex-none mx-4 p-4 text-3xl font-semibold">Network Threat Detector</h1>
                <APIHealthIndicator class="mx-4 ml-auto" onClick=
                    {
                        (health) => setContent((<APIHealthPanel health={health} />))
                    } />
            </div>
            { /* Content with blue color */}
            <div class="flex bg-sky-950 text-neutral-50 w-full h-screen">
                { /* Center box */}
                <div class="flex flex-col m-auto">
                    <div class="border-2 rounded-2xl mx-auto border-dashed border-neutral-50">
                        <Upload />
                    </div>
                </div>
            </div>

            <PopupContainer />
        </>
    )
}
