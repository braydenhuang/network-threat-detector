import { createMemo, createSignal, type JSX, onCleanup, Show } from 'solid-js'
import { Portal } from 'solid-js/web';

function Popup(props: { 
    children: JSX.Element,
    onClose?: () => void
}): JSX.Element {
    // Logic to handle close on ESC
    const handleKey = (e: { key: string; }) => e.key === "Escape" && props.onClose?.();
    document.addEventListener("keydown", handleKey);
    onCleanup(() => document.removeEventListener("keydown", handleKey));

    return (
        <Portal>
            <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    {props.children}
                    <button
                        class="mt-4 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                        onClick={props.onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </Portal>
    );
}

/**
 * Custom hook to open a popup with dynamic content.
 * 
 * **Example usage:**
 * ```js
 * const { setContent, PopupContainer } = usePopup();
 * 
 * // To open the popup with some content
 * setContent(<div>Your content here</div>);
 * 
 * // In your JSX, include the PopupContainer
 * <PopupContainer />
 * 
 * // To close the popup, call
 * setContent(null);
 * ```
 */
export function usePopup() {
    const [content, setContent] = createSignal<JSX.Element | null>(null);

    const show = createMemo(() => content() !== null);

    const PopupContainer = (): JSX.Element => (
        <Show when={show()}>
            <Popup onClose={() => setContent(null)}>{content()}</Popup>
        </Show>
    );

    return { 
        content, 
        setContent, 
        PopupContainer 
    };
}
