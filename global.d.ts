// global.d.ts
interface ElectronAPI {
  send: (channel: string, data?: any) => void;
  invoke: (channel: string, data?: any) => Promise<any>;
  on: (channel: string, func: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

interface Window {
  electron: ElectronAPI;
}
