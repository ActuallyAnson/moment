// The Vega Virtual Device reaches the host Mac at 10.0.2.2 (QEMU user-mode networking).
export const API_BASE = 'http://10.0.2.2:8787';
// The backend gives up after ~7.3 s (two attempts); leave margin so the app shows the server's message.
export const REQUEST_TIMEOUT_MS = 9000;
