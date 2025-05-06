// Base API URL
const API_BASE_URL = 'http://localhost:8090/api';

// Get token from localStorage
const token = localStorage.getItem('authToken');
alert(token);
// Debug: Log token to ensure it exists
console.log('Token:', token);
if (!token) {
    alert('No authentication token found. Please log in.');
    window.location.href = 'login.html';
}

// Fetch latest databins and update HTML
async function fetchDataAndUpdateHTML() {
    try {
        const response = await fetch(`${API_BASE_URL}/databins/latest`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Update tank info
        document.querySelector('.tank-info h2').textContent = data.name;
        const statusElement = document.getElementById('connection-status');
        document.querySelector('.tank-info .offline').textContent = data.status === 'connect' ? 'Online' : 'Offline';
        if (data.status === 'connect') {
            statusElement.classList.remove('offline');
            statusElement.classList.add('online');
            statusElement.textContent = 'Online';
        } else {
            statusElement.classList.remove('online');
            statusElement.classList.add('offline');
            statusElement.textContent = 'Offline';
        }
        document.querySelector('.tank-info p:nth-child(3)').innerHTML = `<strong>Storage 1: </strong>${data.storage1}%<br>`;
        document.querySelector('.tank-info p:nth-child(4)').innerHTML = `<strong>Storage 2: </strong>${data.storage2}%<br>`;
        document.querySelector('.tank-info p:nth-child(5)').innerHTML = `<strong>Storage 3: </strong>${data.storage3}%<br>`;
        document.querySelector('.tank-info p:nth-child(6)').innerHTML = `<strong>Storage 4: </strong>${data.storage4}%<br>`;
        document.querySelector('.tank-info p:nth-child(7)').innerHTML = `<strong>CPU: </strong>${data.cpu}%<br>`;
        document.querySelector('.tank-info p:nth-child(8)').innerHTML = `<strong>Battery: </strong>${data.battery}%<br>`;
        document.querySelector('.tank-info p:last-child').textContent = `Last update: ${data.lastupdate}`;

        // Update water levels
        updateWaterLevel('waterLevel1', 'percentage1', data.storage1);
        updateWaterLevel('waterLevel2', 'percentage2', data.storage2);
        updateWaterLevel('waterLevel3', 'percentage3', data.storage3);
        updateWaterLevel('waterLevel4', 'percentage4', data.storage4);

        // Update marker data
        markers[0].name = data.name;
        markers[0].status = data.status;
        markers[0].storage1 = data.storage1;
        markers[0].storage2 = data.storage2;
        markers[0].storage3 = data.storage3;
        markers[0].storage4 = data.storage4;
        markers[0].cpu = data.cpu;
        markers[0].battery = data.battery;
        markers[0].lastupdate = data.lastupdate;

        // Refresh map markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        markers.forEach(addMarkerToMap);
    } catch (error) {
        console.error('Error fetching databins:', error);
        alert('Failed to load databins data. Please try again later.');
    }
}

// Initialize Leaflet map
const map = L.map('map').setView([10.870121140644871, 106.80366338285954], 50);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

const customIcon = L.icon({
    iconUrl: 'img/Garbage.png',
    iconSize: [60, 70],
    iconAnchor: [22, 42],
    popupAnchor: [-3, -42],
});

const markers = [
    {
        name: 'Tòa B, ĐH CNTT, DHQG_HCM',
        location: [10.870121140644871, 106.80366338285954],
        status: 'Offline',
        storage1: 0,
        storage2: 0,
        storage3: 0,
        storage4: 0,
        cpu: 0,
        battery: 0,
        lastupdate: '',
    },
];

const markerObjects = {};

function addMarkerToMap(markerInfo) {
    const popupContent = `
    <strong>Name: </strong>${markerInfo.name}<br>
    <strong>Status: </strong>${markerInfo.status}<br>
    <strong>Storage 1: </strong>${markerInfo.storage1}%<br>
    <strong>Storage 2: </strong>${markerInfo.storage2}%<br>
    <strong>Storage 3: </strong>${markerInfo.storage3}%<br>
    <strong>Storage 4: </strong>${markerInfo.storage4}%<br>
    <strong>CPU: </strong>${markerInfo.cpu}%<br>
    <strong>Battery: </strong>${markerInfo.battery}%<br>
    <strong>Last update:</strong> ${markerInfo.lastupdate}<br>
    <button onclick="goToDashboard('${markerInfo.name}')">Detail</button>`;
    const marker = L.marker(markerInfo.location, { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

    const listItem = document.createElement('li');
    listItem.textContent = markerInfo.name;
    listItem.addEventListener('click', () => {
        map.setView(markerInfo.location, 50);
        marker.openPopup();
    });

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', event => {
        event.stopPropagation();
        map.removeLayer(marker);
        document.getElementById('marker-list').removeChild(listItem);
    });

    listItem.appendChild(removeButton);
    document.getElementById('marker-list').appendChild(listItem);

    markerObjects[markerInfo.name] = marker;
}

function goToDashboard(locationName) {
    document.getElementById('dashboard-content').style.display = 'block';
    document.getElementById('map').style.display = 'none';
    document.querySelector('.right-bar-buttons').style.display = 'none';
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.style.display = 'none';
    });
}

document.getElementById('dashboard-link').addEventListener('click', event => {
    event.preventDefault();
    goToDashboard('Dashboard');
});

document.getElementById('add-marker').addEventListener('click', () => {
    const name = document.getElementById('marker-name').value;
    const lat = document.getElementById('marker-lat').value;
    const lng = document.getElementById('marker-lng').value;

    if (name && lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const markerInfo = { name, location: [parseFloat(lat), parseFloat(lng)] };
        addMarkerToMap(markerInfo);
        markers.push(markerInfo);
    } else {
        alert('Please provide valid marker name and coordinates.');
    }

    document.getElementById('marker-name').value = '';
    document.getElementById('marker-lat').value = '';
    document.getElementById('marker-lng').value = '';
});

function toggleOverlay(id) {
    const overlay = document.getElementById(id);
    const isVisible = overlay.style.display === 'block';

    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.style.display = 'none';
    });

    if (!isVisible) {
        overlay.style.display = 'block';
    }
}

document.getElementById('map-container').addEventListener('click', event => {
    if (!event.target.closest('.overlay') && !event.target.closest('.right-bar-buttons')) {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.style.display = 'none';
        });
    }
});

document.getElementById('home-link').addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    document.querySelector('.right-bar-buttons').style.display = 'flex';
});

document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    alert('You have logged out.');
    window.location.href = 'login.html';
});

function updateWaterLevel(tankId, percentageId, level) {
    const waterLevel = document.getElementById(tankId);
    const percentageText = document.getElementById(percentageId);
    const clampedLevel = Math.min(100, Math.max(0, level));

    waterLevel.style.height = clampedLevel + '%';
    percentageText.textContent = clampedLevel + '%';

    waterLevel.style.backgroundColor =
        clampedLevel <= 50 ? 'green' : clampedLevel <= 80 ? 'yellow' : 'red';
}

// Fetch thresholds and update HTML
let originalData = {};
let isEditing = false;

async function fetchDataAndUpdateHTML1() {
    try {
        const response = await fetch(`${API_BASE_URL}/thresholds/1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        document.getElementById('bin-name').textContent = `Threshold for ${data.name}`;
        document.getElementById('storage1-value').textContent = `${data.storage1}%`;
        document.getElementById('storage2-value').textContent = `${data.storage2}%`;
        document.getElementById('storage3-value').textContent = `${data.storage3}%`;
        document.getElementById('storage4-value').textContent = `${data.storage4}%`;
        document.getElementById('battery-value').textContent = `${data.battery}%`;

        originalData = { ...data };
    } catch (error) {
        console.error('Error fetching thresholds:', error);
        alert('Failed to load thresholds data. Please try again later.');
    }
}

function toggleEdit() {
    isEditing = !isEditing;

    if (isEditing) {
        document.getElementById('storage1-value').innerHTML = `<input type="number" id="storage1" value="${originalData.storage1}">`;
        document.getElementById('storage2-value').innerHTML = `<input type="number" id="storage2" value="${originalData.storage2}">`;
        document.getElementById('storage3-value').innerHTML = `<input type="number" id="storage3" value="${originalData.storage3}">`;
        document.getElementById('storage4-value').innerHTML = `<input type="number" id="storage4" value="${originalData.storage4}">`;
        document.getElementById('battery-value').innerHTML = `<input type="number" id="battery" value="${originalData.battery}">`;

        document.getElementById('edit-button').style.display = 'none';
        document.getElementById('save-button').style.display = 'inline-block';
        document.getElementById('cancel-button').style.display = 'inline-block';
    } else {
        document.getElementById('storage1-value').textContent = `${document.getElementById('storage1').value}%`;
        document.getElementById('storage2-value').textContent = `${document.getElementById('storage2').value}%`;
        document.getElementById('storage3-value').textContent = `${document.getElementById('storage3').value}%`;
        document.getElementById('storage4-value').textContent = `${document.getElementById('storage4').value}%`;
        document.getElementById('battery-value').textContent = `${document.getElementById('battery').value}%`;

        document.getElementById('edit-button').style.display = 'inline-block';
        document.getElementById('save-button').style.display = 'none';
        document.getElementById('cancel-button').style.display = 'none';
    }
}

function cancelEdit() {
    document.getElementById('storage1-value').textContent = `${originalData.storage1}%`;
    document.getElementById('storage2-value').textContent = `${originalData.storage2}%`;
    document.getElementById('storage3-value').textContent = `${originalData.storage3}%`;
    document.getElementById('storage4-value').textContent = `${originalData.storage4}%`;
    document.getElementById('battery-value').textContent = `${originalData.battery}%`;

    isEditing = false;
    document.getElementById('edit-button').style.display = 'inline-block';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('cancel-button').style.display = 'none';
}

async function saveData() {
    const dataToUpdate = {
        storage1: parseInt(document.getElementById('storage1').value),
        storage2: parseInt(document.getElementById('storage2').value),
        storage3: parseInt(document.getElementById('storage3').value),
        storage4: parseInt(document.getElementById('storage4').value),
        battery: parseInt(document.getElementById('battery').value),
    };

    try {
        const response = await fetch(`${API_BASE_URL}/thresholds/1`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(dataToUpdate),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        alert('Data saved successfully!');
        await fetchDataAndUpdateHTML1();
        toggleEdit();
    } catch (error) {
        console.error('Error saving thresholds:', error);
        alert('Failed to save thresholds data. Please try again later.');
    }
}

// Fetch warnings and display in table
const tableBody = document.getElementById('table-body');
const clearDataBtn = document.getElementById('clear-data-btn');

async function fetchAndDisplayData() {
    try {
        const response = await fetch(`${API_BASE_URL}/warnings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const apiData = await response.json();
        tableBody.innerHTML = '';

        apiData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${data.id}</td>
        <td>${data.idbin}</td>
        <td class="message-cell">${data.message}</td>
        <td>${data.namebin}</td>
        <td>${data.time}</td>
      `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching warnings:', error);
        alert('Failed to load warnings data. Please try again later.');
    }
}

async function clearTableData() {
    try {
        const response = await fetch(`${API_BASE_URL}/warnings`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        tableBody.innerHTML = '';
        alert('All warnings deleted successfully.');
    } catch (error) {
        console.error('Error deleting warnings:', error);
        alert('Failed to delete warnings. Please try again later.');
    }
}

// Initialize
function init() {
    // Add initial markers
    markers.forEach(addMarkerToMap);

    // Fetch initial data
    fetchDataAndUpdateHTML();
    fetchDataAndUpdateHTML1();
    fetchAndDisplayData();

    // Set up periodic fetching
    setInterval(fetchDataAndUpdateHTML, 60000);
    setInterval(fetchDataAndUpdateHTML1, 60000);
    setInterval(fetchAndDisplayData, 60000);
}

// Run initialization
window.addEventListener('load', init);

// Event listeners for buttons
document.getElementById('edit-button')?.addEventListener('click', toggleEdit);
document.getElementById('save-button')?.addEventListener('click', saveData);
document.getElementById('cancel-button')?.addEventListener('click', cancelEdit);
clearDataBtn?.addEventListener('click', clearTableData);