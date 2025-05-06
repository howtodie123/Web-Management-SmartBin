// js/auth.js

// Lấy token
function getToken() {
    return localStorage.getItem('authToken');
}

// Lấy loại token: "Bearer"
function getTokenType() {
    return localStorage.getItem('tokenType') || 'Bearer';
}

// Tạo header Authorization
function getAuthHeader() {
    const token = getToken();
    const type = getTokenType();
    return token ? `${type} ${token}` : null;
}

// Kiểm tra đã đăng nhập chưa
function isLoggedIn() {
    return !!getToken();
}

// Lấy thông tin user
function getUsername() {
    return localStorage.getItem('username');
}

function getUserEmail() {
    return localStorage.getItem('userEmail');
}

function getUserRoles() {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
}

// Đăng xuất
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
