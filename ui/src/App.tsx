// Homepage component for the U.I

import { createSignal, type JSX } from 'solid-js'
import solidLogo from './assets/solid.svg'
import viteLogo from '/vite.svg'

export default function App(): JSX.Element {
  //const [count, setCount] = createSignal(0)

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
            <div class="flex flex-col items-center justify-center p-8 gap-4 min-w-[320px]">
              <label class="cursor-pointer">
                <input
                  type="file"
                  class="hidden"
                  accept=".pcap,.pcapng,.csv"
                  onChange={e => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) console.log('Selected file:', file.name) // TODO: Handle file upload
                  }}
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
          </div>
        </div>
      </div>
    </>
  )
}
