let MIN_RAM = 512;
let MAX_RAM = 1024;
let USER_RAM = 1024;

const infomin = document.querySelector('#min');
const infomax = document.querySelector('#max');

function controlFromSlider(fromSlider, toSlider) {
    const [from, to] = getParsed(fromSlider, toSlider);
    fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
    if (from > to) {
        fromSlider.value = to;
        MIN_RAM = to;
    } else {
        MIN_RAM = from;
    }

    infomin.innerText = `Min: ${MIN_RAM} MB`;
    infomax.innerText = `Max: ${MAX_RAM} MB`;
}

function controlToSlider(fromSlider, toSlider) {
    const [from, to] = getParsed(fromSlider, toSlider);
    fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
    setToggleAccessible(toSlider);
    if (from <= to) {
        toSlider.value = to;
        MAX_RAM = to;
    } else {
        MAX_RAM = from
        toSlider.value = from;
    }

    infomin.innerText = `Min: ${MIN_RAM} MB`;
    infomax.innerText = `Max: ${MAX_RAM} MB`;
}

function getParsed(currentFrom, currentTo) {
    const from = parseInt(currentFrom.value, 10);
    const to = parseInt(currentTo.value, 10);
    return [from, to];
}

function fillSlider(from, to, sliderColor, rangeColor, controlSlider) {
    const rangeDistance = to.max - to.min;
    const fromPosition = from.value - to.min;
    const toPosition = to.value - to.min;
    controlSlider.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0%,
      ${sliderColor} ${(fromPosition) / (rangeDistance) * 100}%,
      ${rangeColor} ${((fromPosition) / (rangeDistance)) * 100}%,
      ${rangeColor} ${(toPosition) / (rangeDistance) * 100}%, 
      ${sliderColor} ${(toPosition) / (rangeDistance) * 100}%, 
      ${sliderColor} 100%)`;
}

function setToggleAccessible(currentTarget) {
    const toSlider = document.querySelector('#toSlider');
    if (Number(currentTarget.value) <= 0) {
        toSlider.style.zIndex = 2;
    } else {
        toSlider.style.zIndex = 0;
    }
}

const fromSlider = document.querySelector('#fromSlider');
const toSlider = document.querySelector('#toSlider');
fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
setToggleAccessible(toSlider);

fromSlider.oninput = () => controlFromSlider(fromSlider, toSlider);
toSlider.oninput = () => controlToSlider(fromSlider, toSlider);

async function setup() {
    MIN_RAM = await window.electronAPI.getMinRam();
    MAX_RAM = await window.electronAPI.getMaxRam();
    USER_RAM = await window.electronAPI.getRam();

    fromSlider.max = USER_RAM / (1024 * 1024);
    toSlider.max = USER_RAM / (1024 * 1024);

    fromSlider.value = MIN_RAM;
    toSlider.value = MAX_RAM;

    infomin.innerText = `Min: ${MIN_RAM} MB`;
    infomax.innerText = `Max: ${MAX_RAM} MB`;

    fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
}

setup();

const saveSettings = document.querySelector('#save-settings');
saveSettings.addEventListener('click', () => {
    window.electronAPI.setRam(MIN_RAM, MAX_RAM);
});