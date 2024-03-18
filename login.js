const loginBtn = document.getElementById('login');
const username = document.getElementById('username');

loginBtn.addEventListener('click', () => {
    window.electronAPI.offlineLogin(username.value)
    window.location.href = 'index.html';
});

const premiumLoginBtn = document.getElementById('premium');
premiumLoginBtn.addEventListener('click', () => {
    window.electronAPI.tryPremiumLogin();
});