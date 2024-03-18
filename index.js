const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();
const { Client, Authenticator } = require('minecraft-launcher-core');
const { Auth } = require("msmc");
const launcher = new Client();

const authManager = new Auth("select_account");

async function getAppDataPath() {
    if (process.platform === 'win32') {
        return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
        return path.join(os.homedir());
    } else {
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
}

async function launchMinecraft(event, version, nick) {
    let versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(res => res.json()).then(data => data.versions.filter(v => v.type === "release").map(v => v.id))
    if (!versions.includes(version)) {
        console.error(`Version ${version} not found in the list of releases`)
        return
    }

    if (nick.length < 3 || nick.length > 16 || !/^[a-zA-Z0-9_]+$/.test(nick)) {
        console.error(`Nick ${nick} doesn't meet the criteria`)
        return
    }
    try {
        let opts;
        if (store.get('offline')) {
            opts = {
                authorization: Authenticator.getAuth(store.get('username')),
                root: `${await getAppDataPath()}/.minecraft`,
                version: {
                    number: version,
                    type: "release",
                },
                memory: {
                    max: "6G",
                    min: "4G",
                },
                overrides: {
                    detached: false
                },

                customArgs: ["-Dminecraft.api.auth.host=https://nope.invalid",
                    "-Dminecraft.api.account.host=https://nope.invalid",
                    "-Dminecraft.api.session.host=https://nope.invalid",
                    "-Dminecraft.api.services.host=https://nope.invalid"]
            }
        } else {
            opts = {
                authorization: await store.get('token'),
                root: `${await getAppDataPath()}/.minecraft`,
                version: {
                    number: version,
                    type: "release",
                },
                memory: {
                    max: "6G",
                    min: "4G",
                },
                overrides: {
                    detached: false
                }
            };
        }
        console.log(`[VOXIFY] Launching Minecraft ${version} as ${nick}! Premium?: ${!store.get('offline')}`);
        launcher.launch(opts);
    } catch (e) { console.error(e) }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        icon: 'img/logo-crop.png'
    })

    launcher.on('progress', (e) => {
        win.webContents.send('progress', e.task, e.total);
    });

    if (store.get('offline') === undefined || store.get('token') === undefined) {
        win.loadFile('login.html')
    } else {
        win.loadFile('index.html')
    }
    return win;
}

app.whenReady().then(async () => {
    const win = createWindow();
    ipcMain.on('launchMinecraft', launchMinecraft);
    ipcMain.on('offlineLogin', (event, username) => {
        store.set('username', username);
        store.set('offline', true);
    });
    ipcMain.on('tryPremiumLogin', async () => {
        authManager.launch("electron").then(async (xboxManager) => {
            //Generate the Minecraft login token
            const token = await xboxManager.getMinecraft();
            store.set('token', token.mclc());
            store.set('offline', false);
            let username = await (await xboxManager.getMinecraft()).profile.name;
            store.set('username', username);
            // Send the token to the main process
            win.webContents.send('premiumLoginSuccess');
        });
    });
    ipcMain.on('logout', () => {
        store.delete('token');
        store.delete('offline');
        store.delete('username');
        win.loadFile('login.html');
    });

    ipcMain.handle('getUsername', async () => { return store.get('username') });

    if (!store.get('offline')) {
        let newToken;
        try {
            newToken = await authManager.refresh(store.get('token'));
            store.set('token', newToken.mclc());
        } catch (e) { }
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})