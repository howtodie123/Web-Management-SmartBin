const token = localStorage.getItem('authToken');
const map = L.map('map').setView([10.762622, 106.660172], 13);
let markers = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

function updateWaterLevel(containerId, percentageId, value) {
    const level = document.getElementById(containerId);
    const percentage = document.getElementById(percentageId);
    level.style.height = `${value}%`;
    level.style.backgroundColor = value > 80 ? 'red' : value > 50 ? 'orange' : 'green';
    percentage.textContent = `${value}%`;
}

function updateBinDetails(bin) {
    const inputTime = new Date(bin.lastupdate);
    const currentTime = new Date();
    const diffHours = (currentTime - inputTime) / (1000 * 60 * 60);
    const status = diffHours > 1 ? "offline" : "online";

    document.getElementById('locationName').textContent = bin.name;
    document.getElementById('deviceId').textContent = bin.deviceid;
    document.getElementById('storage1').textContent = bin.storage1 + "%";
    document.getElementById('storage2').textContent = bin.storage2 + "%";
    document.getElementById('storage3').textContent = bin.storage3 + "%";
    document.getElementById('storage4').textContent = bin.storage4 + "%";
    document.getElementById('ram').textContent = bin.ram + "%";
    document.getElementById('temperature').textContent = bin.temperature + "°C";
    document.getElementById('status').textContent = status;

    updateWaterLevel('waterLevel1', 'percentage1', bin.storage1);
    updateWaterLevel('waterLevel2', 'percentage2', bin.storage2);
    updateWaterLevel('waterLevel3', 'percentage3', bin.storage3);
    updateWaterLevel('waterLevel4', 'percentage4', bin.storage4);
}

function loadDashboard(idbin) {
    goToDashboard();

    fetch(`http://localhost:8090/api/thresholds/${idbin}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById('threshold-info').textContent = JSON.stringify(data);
        });

    fetch(`http://localhost:8090/api/warnings/bin/${idbin}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById('warning-info').textContent = JSON.stringify(data);
        });
}

function addMarkerToMap(bin) {
    const marker = L.marker([bin.latitude, bin.longitude]).addTo(map);

    const popupContent = `
        <b>${bin.name}</b><br>
        Last Update: ${bin.lastupdate}<br>
        <button class="btn-detail" data-id="${bin.id}">Detail</button>
        <button class="btn-remove" data-id="${bin.id}">Remove</button>
    `;
    marker.bindPopup(popupContent);

    markers.push({ id: bin.id, marker });

    marker.on('popupopen', () => {
        const popupNode = marker.getPopup().getElement();
        const detailBtn = popupNode.querySelector('.btn-detail');
        const removeBtn = popupNode.querySelector('.btn-remove');

        if (detailBtn) {
            detailBtn.addEventListener('click', () => loadDashboard(bin.id));
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                map.removeLayer(marker);
                markers = markers.filter(m => m.id !== bin.id);
            });
        }
    });
}

function goToDashboard() {
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("map").style.display = "none";
}

function fetchAndDisplayBins() {
    fetch('http://localhost:8090/api/bins', {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(async bins => {
            for (const bin of bins) {
                const binDataRes = await fetch(`http://localhost:8090/api/databins/${bin.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const binData = await binDataRes.json();

                const fullBin = {
                    id: bin.id,
                    name: bin.name,
                    latitude: bin.latitude,
                    longitude: bin.longitude,
                    deviceid: bin.deviceid,
                    lastupdate: binData.lastupdate,
                    storage1: binData.storage1,
                    storage2: binData.storage2,
                    storage3: binData.storage3,
                    storage4: binData.storage4,
                    ram: binData.ram,
                    temperature: binData.temperature,
                };

                addMarkerToMap(fullBin);
            }
        });
}

// Menu navigation
document.getElementById("dashboard-link").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("map").style.display = "none";
    document.getElementById("dashboard-content").style.display = "block";
});

document.getElementById("home-link").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("map").style.display = "block";
    document.getElementById("dashboard-content").style.display = "none";
});


// Initial load
fetchAndDisplayBins();
