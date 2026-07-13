/// <reference types="vite/client" />

interface Window {
  blackMambaDesktop?: {
    platform: string;
    onTransport: (callback: (action: 'toggle' | 'previous' | 'next' | 'stop') => void) => () => void;
    onUpdateStatus: (callback: (status: { status: string; detail: string | number | null }) => void) => () => void;
  };
}
