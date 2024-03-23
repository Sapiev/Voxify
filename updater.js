const statusText = document.getElementById('status');

window.electronAPI.updateProcess((info) => {
    console.log(">>>>>> " + info);
    statusText.innerText = info;
})