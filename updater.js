const statusText = document.getElementById('status');

window.electronAPI.updateProcess((info) => {
    statusText.innerText = info;
})