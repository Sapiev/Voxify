let username;

const versionSelected = document.getElementById('versionSelected');
const setButton = document.getElementById('start')
const logoutBtn = document.getElementById('logout');
const versionSelectList = document.getElementById('versionSelectList');
const versionSelect = document.getElementById('versionSelect');
const mainSettingContainer = document.getElementById('mainSettingContainer');

setButton.addEventListener('click', () => {
    const progressBarParent = document.getElementById('progressBarParent');
    progressBarParent.style.opacity = 1;
    window.electronAPI.launchMinecraft(versionSelected.innerText, 'Notch')
})

logoutBtn.addEventListener('click', () => {
    window.electronAPI.logout();
});

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function toggleElement(element, forceShow = null) {
    console.log(element);
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

async function load() {
    let versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(res => res.json()).then(data => data.versions.filter(v => v.type === "release").map(v => v.id));

    const usernameSlot = document.getElementById('usernameSlot');
    const headSlot = document.getElementById('headSlot');
    await window.electronAPI.getUsername().then((result) => {
        usernameSlot.innerText = result;
        username = result;
        headSlot.src = `https://mc-heads.net/head/${username}/45`;
        headSlot.alt = `${username}'s head`;
    });

    versions.forEach(version => {
        const listItem = document.createElement('button');
        listItem.classList.add('outline');
        listItem.style.margin = "5px";
        listItem.innerText = version;
        versionSelectList.appendChild(listItem);
        listItem.addEventListener('click', () => {
            versionSelected.innerText = version;
            toggleElement(versionSelect, false);
            toggleElement(mainSettingContainer, false);
        });
    });
}

load();