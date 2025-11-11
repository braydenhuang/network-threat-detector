// Homepage component for the U.I

import { type JSX } from 'solid-js'
import { Upload } from './elements'

export default function App(): JSX.Element {
  return (
    // Main container - <> ... </> is a JSX.Element in SolidJS, and everything must be wrapped in one, or something like a <div>
    <>
      { /* Header with dark blue color */ }
      <div class="bg-sky-950 text-neutral-50 flex w-full min-h-[60px] max-h-[100px]">
        <h1 class="ml-4 text-3xl font-semibold p-4">Network Threat Detector</h1>
      </div>
      { /* Content with blue color */ }
      <div class="bg-sky-950 text-neutral-50 flex w-full h-screen">
        { /* Center box */}
        <div class="flex flex-col m-auto">
          <div class="border-2 rounded-2xl mx-auto border-dashed border-neutral-50">
            <Upload />
          </div>
        </div>
      </div>
    </>
  )
}
