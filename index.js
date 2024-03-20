const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();
const { Client, Authenticator } = require('minecraft-launcher-core');
const { Auth } = require("msmc");
const launcher = new Client();
const xmcl = require("@xmcl/installer");
const xmclCore = require("@xmcl/core");

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

async function installFabricLoader(version, path) {
    const fabricVersionList = await xmcl.getFabricLoaderArtifact(version, '0.15.7');
    const fabricVersion = await xmcl.installFabric(fabricVersionList, path);
    return fabricVersion;
}

async function launchMinecraft(event, version, mctype) {
    let username = store.get('username');
    const versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(res => res.json()).then(data => data.versions.filter(v => v.type === "release").map(v => v.id))
    if (!versions.includes(version)) {
        console.error(`Version ${version} not found in the list of releases`)
        return
    }

    if (username.length < 3 || username.length > 16 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        console.error(`Nick ${username} doesn't meet the criteria`)
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
                    custom: (mctype == "Fabric") ? fabricVersion : null,
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
            let fabricVersion = await installFabricLoader(version, `${await getAppDataPath()}/.minecraft`);

            opts = {
                authorization: await store.get('token'),
                root: `${await getAppDataPath()}/.minecraft`,
                version: {
                    number: version,
                    type: "release",
                    custom: (mctype == "Fabric") ? fabricVersion : null,
                },
                memory: {
                    max: "8G",
                    min: "4G",
                },
                overrides: {
                    detached: false
                }
            };
        }
        console.log(`[VOXIFY] Launching Minecraft ${version} as ${username}! Premium?: ${!store.get('offline')}`);
        launcher.launch(opts);
    } catch (e) { console.error(e) }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: false
        },
        icon: 'img/logo-crop.png',
        frame: false
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
        authManager.launch("electron", {
            icon: 'img/logo-crop.png'
        }).then(async (xboxManager) => {
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

    ipcMain.on('minimize', () => win.minimize());
    ipcMain.on('maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
    ipcMain.on('close', () => win.close());

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