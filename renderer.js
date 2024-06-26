let username;

const versionSelected = document.getElementById('versionSelected');
const setButton = document.getElementById('start')
const logoutBtn = document.getElementById('logout');
const mainSettingContainer = document.getElementById('mainSettingContainer');
const chooseProfile = document.getElementById('chooseProfile');
const createProfile = document.getElementById('createProfile');
const settings = document.getElementById('settings');

settings.addEventListener('click', () => {
    window.electronAPI.openSettingsWindow();
});

const minecraftTypeList = ['Vanilla', 'Fabric'];

let selectedVersion = null;

setButton.addEventListener('click', () => {
    //const progressBarParent = document.getElementById('progressBarParent');
    //progressBarParent.style.opacity = 1;
    window.electronAPI.launchMinecraft(selectedVersion);
})

logoutBtn.addEventListener('click', () => {
    window.electronAPI.logout();
});

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function toggleElement(element, forceShow = null) {
    if (element.style.display === "none" || forceShow === true) {
        element.style.display = "block";
        await sleep(1);
        element.style.opacity = 1;
    } else if (element.style.display === "block" || forceShow === false) {
        element.style.opacity = 0;
        await sleep(300);
        element.style.display = "none";
    }
}

async function load() {
    refrehsProfileList()

    const usernameSlot = document.getElementById('usernameSlot');
    const headSlot = document.getElementById('headSlot');
    await window.electronAPI.getUsername().then((result) => {
        usernameSlot.innerText = result;
        username = result;
        headSlot.src = `https://mc-heads.net/head/${username}/45`;
        headSlot.alt = `${username}'s head`;
    });
}

let selectedProfile = null;

const rcmModify = document.getElementById('rcmModify');
const rcmDelete = document.getElementById('rcmDelete');

async function refrehsProfileList() {
    const rightClickMenu = document.getElementById('rightClickMenu');

    const profileListDiv = document.getElementById('profileListDiv');
    window.electronAPI.getProfileList().then((profiles) => {
        profileListDiv.innerHTML = '';
        profiles.forEach(profile => {
            const listItem = document.createElement('button');
            listItem.classList.add('profile');
            listItem.innerText = profile;
            listItem.addEventListener('click', () => {
                selectedVersion = profile;
                setButton.innerHTML = '<i class="bi bi-play-fill"></i> ' + profile;
            });
            listItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                rightClickMenu.style.top = e.y + 'px';
                rightClickMenu.style.left = e.x + 'px';
                rightClickMenu.classList.add('active');
                selectedProfile = profile;
            });
            profileListDiv.appendChild(listItem);
        });
    });
    window.addEventListener('click', (e) => {
        e.preventDefault();
        rightClickMenu.classList.remove('active');
    });
}

rcmDelete.addEventListener('click', () => {
    window.electronAPI.deleteProfile(selectedProfile);
    refrehsProfileList();
});

rcmModify.addEventListener('click', () => {
    window.electronAPI.openProfileWindow(true, selectedProfile);
});

createProfile.addEventListener('click', () => {
    window.electronAPI.openProfileWindow(false, '');
});

window.electronAPI.updateProfileList(() => refrehsProfileList());

load();