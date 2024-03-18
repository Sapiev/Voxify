const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    launchMinecraft: (version, nick) => ipcRenderer.send('launchMinecraft', version, nick),
    offlineLogin: (username) => ipcRenderer.send('offlineLogin', username),
    tryPremiumLogin: () => ipcRenderer.send('tryPremiumLogin'),
    logout: () => ipcRenderer.send('logout'),
    getUsername: async () => await ipcRenderer.invoke('getUsername')
})

window.addEventListener('DOMContentLoaded', () => {
    if (window.location.href.includes('index.html')) {
        let progressBar = document.getElementById('progressBar');
        ipcRenderer.on('progress', (_event, task, total) => {
            let percentage = Math.round((task / total) * 100);
            progressBar.style.width = `${percentage}%`;
            const progressBarParent = document.getElementById('progressBarParent');
            if (percentage === 100) progressBarParent.style.opacity = 0;
        })
    } else {
        ipcRenderer.on('premiumLoginSuccess', () => window.location.href = 'index.html');
    }
})