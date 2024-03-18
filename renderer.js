let username;

const setButton = document.getElementById('start')
setButton.addEventListener('click', () => {
    const progressBarParent = document.getElementById('progressBarParent');
    progressBarParent.style.opacity = 1;
    window.electronAPI.launchMinecraft('1.16.5', 'Notch')
})

const logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', () => {
    window.electronAPI.logout();
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

    const versionSelect = document.getElementById('versionSelect');
    versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version;
        option.innerText = version;
        versionSelect.appendChild(option);
    });
}

load();