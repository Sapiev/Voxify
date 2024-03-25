const versionSelectList = document.getElementById('versionSelectList');
const createProfile = document.getElementById('createProfile');

let modifying = false;
let originalName = '';

async function refreshAvaibleVersions(minecraftType = 'Vanilla') {
    versionSelectList.innerHTML = '';
    let versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(res => res.json()).then(data => data.versions.filter(v => v.type === "release").map(v => v.id));

    versions.every(version => {
        if (minecraftType === 'Fabric' && version == '1.13.2') return false;
        if (version == '1.6.4') return false;
        const listItem = document.createElement('option');
        listItem.innerText = version;
        listItem.value = version;
        versionSelectList.appendChild(listItem);
        return true;
    });
}

refreshAvaibleVersions();

createProfile.addEventListener('click', () => {
    const version = versionSelectList.value;
    var getSelectedValue = document.querySelector(
        'input[name="mctype"]:checked');
    const type = getSelectedValue.value;
    console.log(type)
    const name = document.getElementById('profilename').value;

    if (!modifying) window.electronAPI.createUpdateProfile(name, version, type, name);
    else window.electronAPI.createUpdateProfile(originalName, version, type, name);
});

window.electronAPI.modyfyingProfile((name, mcversion, mctype) => {
    document.getElementById('title').innerText = 'Edit Profile';
    document.getElementById('profilename').value = name;
    document.getElementById('createProfile').innerText = 'Update Profile';
    versionSelectList.value = mcversion;
    document.querySelector(`input[value="${mctype}"]`).checked = true;
    modifying = true;
    originalName = name;
});
