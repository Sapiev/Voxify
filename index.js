const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();
const { Client, Authenticator } = require('minecraft-launcher-core');
const { Auth } = require("msmc");
const launcher = new Client();
const xmcl = require("@xmcl/installer");
const xmclCore = require("@xmcl/core");
const fs = require('fs');

const { autoUpdater, AppUpdater } = require("electron-updater")

// Auto updater flags
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

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

async function launchMinecraft(event, profile) {
    const profilePath = `${await getAppDataPath()}/.minecraft/Voxify/profiles/${profile}`;
    if (!fs.existsSync(profilePath)) return console.error('Profile not found');

    const filePath = `${profilePath}/profile.json`;
    const data = fs.readFileSync(filePath);
    const { name, mcversion, mctype } = JSON.parse(data);

    let username = store.get('username');
    const versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(res => res.json()).then(data => data.versions.filter(v => v.type === "release").map(v => v.id))
    if (!versions.includes(mcversion)) {
        console.error(`Version ${mcversion} not found in the list of releases`)
        return
    }

    if (username.length < 3 || username.length > 16 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        console.error(`Nick ${username} doesn't meet the criteria`)
        return
    }
    var fabricVersion;
    if (mctype == "Fabric") {
        fabricVersion = await installFabricLoader(mcversion, `${await getAppDataPath()}/.minecraft`);
    }
    try {
        let opts;
        if (store.get('offline')) {
            opts = {
                authorization: Authenticator.getAuth(store.get('username')),
                root: `${profilePath}/.minecraft`,
                version: {
                    number: mcversion,
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
            opts = {
                authorization: await store.get('token'),
                root: `${profilePath}/.minecraft`,
                version: {
                    number: mcversion,
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
        console.log(`[VOXIFY] Launching Minecraft ${mcversion} as ${username}! Premium?: ${!store.get('offline')}`);
        launcher.launch(opts);
    } catch (e) { console.error(e) }
}

async function createProfileWindow(modify, name) {
    console.log(`Creating profile window, modify: ${modify}, name: ${name}`)
    const win = new BrowserWindow({
        width: 400,
        height: 270,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true
        },
        icon: 'img/logo-crop.png',
        frame: false,
        resizable: false
    })
    win.loadFile('create_profile.html');

    ipcMain.on('close', (event, windowLocation) => {
        if (windowLocation.includes('create_profile.html')) {
            win.destroy();
        }
    });
    ipcMain.on('createUpdateProfile', () => { win.destroy(); });

    if (modify) {
        const profilePath = `${await getAppDataPath()}/.minecraft/Voxify/profiles/${name}`;
        if (!fs.existsSync(profilePath)) return console.error('Profile not found');

        const filePath = `${profilePath}/profile.json`;
        const data = fs.readFileSync(filePath);
        const { mcversion, mctype } = JSON.parse(data);

        win.on('ready-to-show', () => {
            win.webContents.send('modyfyingProfile', name, mcversion, mctype);
        })
    }

    return win;
}

async function createUpdateProfile(name, mcversion, mctype, newname = name) {
    let profilePath = `${await getAppDataPath()}/.minecraft/Voxify/profiles/${name}`;
    if (!fs.existsSync(profilePath)) fs.mkdirSync(profilePath, { recursive: true });

    if (newname !== name) {
        fs.renameSync(`${await getAppDataPath()}/.minecraft/Voxify/profiles/${name}`, `${await getAppDataPath()}/.minecraft/Voxify/profiles/${newname}`);
        profilePath = `${await getAppDataPath()}/.minecraft/Voxify/profiles/${newname}`;
    }

    const filePath = `${profilePath}/profile.json`;
    const data = JSON.stringify({ name: newname, mcversion: mcversion, mctype: mctype });

    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error('Error creating file:', err);
        } else {
            console.log('File created successfully!');
        }
    });

}
ipcMain.on('openProfileWindow', (event, modify, name) => createProfileWindow(modify, name));
ipcMain.on('createUpdateProfile', (event, name, mcversion, mctype, newname) => createUpdateProfile(name, mcversion, mctype, newname));
ipcMain.on('deleteProfile', async (event, name) => { fs.rmSync(`${await getAppDataPath()}/.minecraft/Voxify/profiles/${name}`, { recursive: true }); });

async function getProfileList() {
    const profilePath = `${await getAppDataPath()}/.minecraft/Voxify/profiles`;
    if (!fs.existsSync(profilePath)) return console.error('Profile folder not found');

    const profiles = fs.readdirSync(profilePath);
    return profiles;
}

ipcMain.handle('getProfileList', async () => { return await getProfileList(); });

function createUpdater() {
    const win = new BrowserWindow({
        width: 220,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: true
        },
        resizable: true,
        icon: 'img/logo-crop.png',
        frame: false
    })

    win.loadFile('updater.html');

    return win;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            //devTools: false
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

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
    let updater = createUpdater();

    autoUpdater.on('update-available', () => {
        updater.webContents.send('updateProcess', 'Update available! Downloading...');
        autoUpdater.downloadUpdate();
    });
    autoUpdater.on('update-not-available', async () => {
        console.log('Update not avaible'); updater.webContents.send('updateProcess', 'No updates available.');
        await wait(2000);
        updater.close();
    });
    autoUpdater.on('download-progress', (progress) => {
        updater.webContents.send('updateProcess', `Downloading... ${progress.percent}%`)
    });
    autoUpdater.on('update-downloaded', async () => {
        updater.webContents.send('updateProcess', 'Update downloaded!');
        await wait(2000);
        updater.close();
    });
    autoUpdater.on('error', async (err) => {
        updater.webContents.send('updateProcess', 'Error updating');
        await wait(2000);
        updater.close();
    });
    try {
        let updater = await autoUpdater.checkForUpdates();
        if (!updater) {
            await wait(2000);
            updater.close();
        }
    } catch (e) {
        console.log('Error checking for updates');
        updater.webContents.send('updateProcess', 'Error checking for updates');
        await wait(2000);
        updater.close();
    }

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
    ipcMain.on('close', (event, windowLocation) => {
        if (windowLocation.includes('index.html') || windowLocation.includes('login.html')) {
            app.quit();
        }
    });
    ipcMain.on('createUpdateProfile', () => { win.webContents.send('updateProfileList'); });
    ipcMain.on('deleteProfile', () => { win.webContents.send('updateProfileList'); });

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
            let updater = createUpdater();
            autoUpdater.on('update-not-available', async () => {
                await wait(2000);
                updater.close();
                createWindow();
            });
            autoUpdater.on('update-downloaded', async () => {
                await wait(2000);
                updater.close();
                createWindow();
            });
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})