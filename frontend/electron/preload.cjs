const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Add any IPC bridges here if needed
});
