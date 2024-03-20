let username;

const versionSelected = document.getElementById('versionSelected');
const setButton = document.getElementById('start')
const logoutBtn = document.getElementById('logout');
const versionSelectList = document.getElementById('versionSelectList');
const versionSelect = document.getElementById('versionSelect');
const mainSettingContainer = document.getElementById('mainSettingContainer');
const backMinecraftType = document.getElementById('backMinecraftType');
const nextMinecraftType = document.getElementById('nextMinecraftType');
const minecraftType = document.getElementById('minecraftType');

const minecraftTypeList = ['Vanilla', 'Fabric'];

let selectedVersion = null;

setButton.addEventListener('click', () => {
    //const progressBarParent = document.getElementById('progressBarParent');
    //progressBarParent.style.opacity = 1;
    window.electronAPI.launchMinecraft(selectedVersion, minecraftType.innerText);
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

versionSelected.addEventListener('click', () => {
    toggleElement(versionSelect);
    toggleElement(mainSettingContainer);
});

backMinecraftType.addEventListener('click', () => {
    let index = minecraftTypeList.indexOf(minecraftType.innerText);
    if (index <= 0) {
        index = minecraftTypeList.length - 1;
    } else {
        index--;
    }
    minecraftType.innerText = minecraftTypeList[index];
    refreshAvaibleVersions(minecraftTypeList[index]);
});

nextMinecraftType.addEventListener('click', () => {
    let index = minecraftTypeList.indexOf(minecraftType.innerText);
    if (index >= minecraftTypeList.length - 1) {
        index = 0;
    } else {
        index++;
    }
    minecraftType.innerText = minecraftTypeList[index];
    refreshAvaibleVersions(minecraftTypeList[index]);
});

async function load() {
    refreshAvaibleVersions();

    const usernameSlot = document.getElementById('usernameSlot');
    const headSlot = document.getElementById('headSlot');
    await window.electronAPI.getUsername().then((result) => {
        usernameSlot.innerText = result;
        username = result;
        headSlot.src = `https://mc-heads.net/head/${username}/45`;
        headSlot.alt = `${username}'s head`;
    });
}

async function refreshAvaibleVersions(minecraftType = 'Vanilla') {
    versionSelectList.innerHTML = '';
    let versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(res => res.json()).then(data => data.versions.filter(v => v.type === "release").map(v => v.id));

    versions.every(version => {
        console.log(version)
        if (minecraftType === 'Fabric' && version == '1.13.2') return false;
        const listItem = document.createElement('button');
        listItem.classList.add('outline');
        listItem.style.margin = "5px";
        listItem.innerText = version;
        versionSelectList.appendChild(listItem);
        listItem.addEventListener('click', () => {
            setButton.innerHTML = '<i class="bi bi-play-fill"></i> Launch ' + version;
            selectedVersion = version;
            toggleElement(versionSelect, false);
            toggleElement(mainSettingContainer, false);
        });
        return true;
    });
}

load();