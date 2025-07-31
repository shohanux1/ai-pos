declare global {
  interface Window {
    __TAURI__?: {
      invoke: <T>(cmd: string, args?: any) => Promise<T>
    }
  }
}

export {}