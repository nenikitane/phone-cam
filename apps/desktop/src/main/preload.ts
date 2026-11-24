import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  webrtc: {
    start: (config: { roomId: string; signalingHost?: string }) => 
      ipcRenderer.invoke('webrtc:start', config),
    stop: () => ipcRenderer.invoke('webrtc:stop'),
    getState: () => ipcRenderer.invoke('webrtc:get-state'),
    onStateChange: (callback: (state: string) => void) => {
      ipcRenderer.on('webrtc:state-change', (_event, state) => callback(state));
      return () => ipcRenderer.off('webrtc:state-change', callback);
    },
    onStream: (callback: (streamId: string) => void) => {
      ipcRenderer.on('webrtc:stream', (_event, streamId) => callback(streamId));
      return () => ipcRenderer.off('webrtc:stream', callback);
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('webrtc:error', (_event, error) => callback(error));
      return () => ipcRenderer.off('webrtc:error', callback);
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
  },
  dialog: {
    showError: (title: string, message: string) => 
      ipcRenderer.invoke('dialog:show-error', title, message),
  },
});

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}