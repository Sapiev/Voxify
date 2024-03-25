const APP_VERSION = "Beta 0.1.2";

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    launchMinecraft: (profile) => ipcRenderer.send('launchMinecraft', profile),
    offlineLogin: (username) => ipcRenderer.send('offlineLogin', username),
    tryPremiumLogin: () => ipcRenderer.send('tryPremiumLogin'),
    logout: () => ipcRenderer.send('logout'),
    getUsername: async () => await ipcRenderer.invoke('getUsername'),
    updateProcess: (callback) => ipcRenderer.on('updateProcess', (_event, info) => callback(info)),
    updateProfileList: (callback) => ipcRenderer.on('updateProfileList', (_event) => callback()),
    modyfyingProfile: (callback) => ipcRenderer.on('modyfyingProfile', (_event, name, mcversion, mctype) => callback(name, mcversion, mctype)),
    openProfileWindow: (modify, name) => ipcRenderer.send('openProfileWindow', modify, name),
    createUpdateProfile: (name, mcversion, mctype, newname) => ipcRenderer.send('createUpdateProfile', name, mcversion, mctype, newname),
    deleteProfile: (name) => ipcRenderer.send('deleteProfile', name),
    getProfileList: async () => await ipcRenderer.invoke('getProfileList')
})

window.addEventListener('DOMContentLoaded', () => {
    try {
        const productVersion = document.getElementById('productVersion');
        productVersion.innerText = APP_VERSION;

        const minimize = document.getElementById('minimize');
        const maximize = document.getElementById('maximize');
        const close = document.getElementById('close');

        minimize.addEventListener('click', () => ipcRenderer.send('minimize'));
        maximize.addEventListener('click', () => ipcRenderer.send('maximize'));
        close.addEventListener('click', () => ipcRenderer.send('close', window.location.href));

    } catch (e) {
        console.log('Navbar not detected')
    }

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