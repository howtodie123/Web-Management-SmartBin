// api 
// http://localhost:8090/
// http://35.213.129.74:30600/
url_real ="http://localhost:8090/"
document.getElementById('user-name').textContent = "Hi " + localStorage.getItem("username");
let markers = [];
const clearDataBtn = document.getElementById("clear-data-btn");
const tableBody = document.getElementById("table-body");
const token = localStorage.getItem('authToken');
let idbinReal = 1;
const currentTime = new Date();
async function fetchDataAndUpdateHTML(idbin) {
    try {
        const response = await fetch(`${url_real}api/databins/${idbin}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${token}`,
            }

        });
        const data = await response.json();

        if (response.ok) {
            // Cập nhật thông tin trong phần tử HTML
            document.querySelector('.tank-info h2').textContent = data.name;
            const statusElement = document.getElementById('connection-status');
            document.querySelector('.tank-info .offline').textContent = data.status === 'connect' ? 'Online' : 'Offline';

            inputTime = new Date(data.lastupdate * 1000);
            // formattedDate = new Date(data.lastupdate).toLocaleString('vi-VN');
            // alert(inputTime.toLocaleString())
            // alert(currentTime.toLocaleString())
            // Tính hiệu số thời gian (milliseconds)
            const diffMs = currentTime - inputTime;

            // Chuyển đổi thành giờ
            const diffHours = diffMs / (1000 * 60 * 60);
            // Gán trạng thái
            const status = diffHours > 1 ? "offline" : "online";

            if (status === 'online') {
                statusElement.classList.remove('offline');
                statusElement.classList.add('online');
                statusElement.textContent = "Online";
            } else {
                statusElement.classList.remove('online');
                statusElement.classList.add('offline');
                statusElement.textContent = "Offline";
            }


            document.querySelector('.tank-info p:nth-child(3)').innerHTML = `<strong>Storage 1: </strong>${data.storage1}%<br>`;
            document.querySelector('.tank-info p:nth-child(4)').innerHTML = `<strong>Storage 2: </strong>${data.storage2}%<br>`;
            document.querySelector('.tank-info p:nth-child(5)').innerHTML = `<strong>Storage 3: </strong>${data.storage3}%<br>`;
            document.querySelector('.tank-info p:nth-child(6)').innerHTML = `<strong>Storage 4: </strong>${data.storage4}%<br>`;
            document.querySelector('.tank-info p:nth-child(7)').innerHTML = `<strong>Ram: </strong>${data.ram}%<br>`;
            document.querySelector('.tank-info p:nth-child(8)').innerHTML = `<strong>Temperature: </strong>${data.temperature}°C<br>`;
            // document.querySelector('.tank-info p:last-child').textContent = `Last update: ${data.lastupdate}`;
            document.querySelector('.tank-info p:last-child').textContent = `Last update: ${inputTime.toLocaleString()}`;
            // storage
            updateWaterLevel('waterLevel1', 'percentage1', data.storage1);
            updateWaterLevel('waterLevel2', 'percentage2', data.storage2);
            updateWaterLevel('waterLevel3', 'percentage3', data.storage3);
            updateWaterLevel('waterLevel4', 'percentage4', data.storage4);

            // Cập nhật marker đầu tiên bằng dữ liệu API

            markers[0].name = data.name; // Cập nhật tên
            markers[0].status = data.status; // Cập nhật trạng thái

            // Cập nhật các giá trị của các marker khác nếu cần
            markers[0].storage1 = data.storage1;
            markers[0].storage2 = data.storage2;
            markers[0].storage3 = data.storage3;
            markers[0].storage4 = data.storage4;
            markers[0].ram = data.ram;
            markers[0].temperature = data.temperature;
            //markers[0].lastupdate = data.lastupdate;
            markers[0].lastupdate = inputTime.toLocaleString();

            // Cập nhật lại bản đồ với các thông tin mới
            map.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // Thêm lại các marker vào bản đồ
            markers.forEach(function(markerInfo) {
                addMarkerToMap(markerInfo);
            });
        } else {
            console.error('Failed to fetch data:', response.status, data);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Khởi tạo bản đồ
var map = L.map('map').setView([10.870121140644871, 106.80366338285954], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var customIcon = L.icon({
    iconUrl: 'img/Garbage.png',
    iconSize: [72, 84],
    iconAnchor: [26, 50],
    popupAnchor: [-3, -42]
});

var markerObjects = {};

function addMarkerToMap(markerInfo) {

    const popupContent = `
            <strong>Name: </strong>${markerInfo.name}<br>
            <strong>Status: </strong>${markerInfo.status}<br>
            <strong>Storage 1: </strong>${markerInfo.storage1}%<br>
            <strong>Storage 2: </strong>${markerInfo.storage2}%<br>
            <strong>Storage 3: </strong>${markerInfo.storage3}%<br>
            <strong>Storage 4: </strong>${markerInfo.storage4}%<br>
            <strong>Ram: </strong>${markerInfo.ram}%<br>
            <strong>Temperature: </strong>${markerInfo.temperature}°C<br>
            <strong>Last update:</strong> ${new Date(markerInfo.lastupdate * 1000).toLocaleString()}<br>
            <button onclick="goToDashboard('${markerInfo.idbin}')">Detail</button>`;

    const marker = L.marker(markerInfo.location, {icon: customIcon}).addTo(map)
        .bindPopup(popupContent);

    const listItem = document.createElement('li');
    listItem.textContent = markerInfo.name;
    listItem.addEventListener('click', function () {
        map.setView(markerInfo.location, 17);
        marker.openPopup();
    });

    // const removeButton = document.createElement('button');
    // removeButton.textContent = 'Remove';
    // removeButton.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     map.removeLayer(marker);
    //     document.getElementById('marker-list').removeChild(listItem);
    // });
    //
    // listItem.appendChild(removeButton);
    document.getElementById('marker-list').appendChild(listItem);

    markerObjects[markerInfo.name] = marker;
}

function fetchAndDisplayBins() {

    fetch(`${url_real}api/bins`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': '*/*'
        }
    })
        .then(res => res.json())
        .then(bins => {
            bins.forEach(bin => {
                const binId = bin.id;

                // Gọi API /api/databins/{id}
                fetch(`${url_real}api/databins/${binId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': '*/*'
                    }
                })
                    .then(res => {
                        if (!res.ok) throw new Error(`Can't find data for ${binId}`);
                        return res.json();
                    })
                    .then(data => {

                        inputTime = new Date(data.lastupdate * 1000);
                        const diffMs = currentTime - inputTime;
                        const diffHours = diffMs / (1000 * 60 * 60);
                        const status = diffHours > 1 ? "offline" : "online";


                        const markerInfo = {
                            idbin : data.idbin,
                            name: data.name,
                            location: [parseFloat(bin.locationX), parseFloat(bin.locationY)],
                            status: status,
                            storage1: data.storage1,
                            storage2: data.storage2,
                            storage3: data.storage3,
                            storage4: data.storage4,
                            ram: data.ram,
                            temperature: data.temperature,
                            lastupdate: data.lastupdate
                        };
                        addMarkerToMap(markerInfo);
                    })
                    .catch(err => console.error('Failed to fetch data: databins:', err));
            });
        })
        .catch(err => console.error('Failed to fetch data: bins:', err));
}

fetchAndDisplayBins();

function goToDashboard(idbin) {
    // Hiển thị giao diện Dashboard và ẩn bản đồ
    idbinReal = idbin;
    fetchDataAndUpdateHTML(idbin);
    fetchDataAndUpdateHTML1(idbin);
    fetchAndDisplayData(idbin);
    document.getElementById('dashboard-content').style.display = 'block';
    document.getElementById('map').style.display = 'none';
    document.querySelector('.right-bar-buttons').style.display = 'none';
    document.querySelectorAll('.overlay').forEach(function(overlay) {
        overlay.style.display = 'none';
    });

    // Đặt nội dung của Dashboard
    //  document.getElementById('dashboard-content').innerHTML = `<h2>Dashboard</h2><p>Location: ${locationName}</p>`;
}
// Existing dashboard link click handler to also clear the map view
document.getElementById('dashboard-link').addEventListener('click', function (event) {
    event.preventDefault();
    goToDashboard(idbinReal);
});
markers.forEach(addMarkerToMap);

// // thêm thùng rác
// document.getElementById('add-marker').addEventListener('click', function () {
//     var name = document.getElementById('marker-name').value;
//     var lat = document.getElementById('marker-lat').value;
//     var lng = document.getElementById('marker-lng').value;
//
//     if (name && lat && lng && !isNaN(lat) && !isNaN(lng)) {
//         var markerInfo = { name: name, location: [parseFloat(lat), parseFloat(lng)] };
//         addMarkerToMap(markerInfo);
//     } else {
//         alert('Please provide valid marker name and coordinates.');
//     }
//
//     document.getElementById('marker-name').value = '';
//     document.getElementById('marker-lat').value = '';
//     document.getElementById('marker-lng').value = '';
// });

function toggleOverlay(id) {
    var overlay = document.getElementById(id);
    var isVisible = overlay.style.display === 'block';

    document.querySelectorAll('.overlay').forEach(function(overlay) {
        overlay.style.display = 'none';
    });

    if (!isVisible) {
        overlay.style.display = 'block';
    }
}

document.getElementById('map-container').addEventListener('click', function(event) {
    if (!event.target.closest('.overlay') && !event.target.closest('.right-bar-buttons')) {
        document.querySelectorAll('.overlay').forEach(function(overlay) {
            overlay.style.display = 'none';
        });
    }
});



// Home functionality
document.getElementById('home-link').addEventListener('click', function (event) {
    event.preventDefault();  // Prevent default link behavior
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    document.querySelector('.right-bar-buttons').style.display = 'flex';
});

// Default behavior: show the Home page
document.getElementById('home-link').click();

// Logout functionality
document.getElementById('logout').addEventListener('click', function() {
    // Clear user session or token if necessary
    alert('You have logged out.');
    // Redirect to login page
    window.location.href = 'index.html'; // Change this to your actual login page URL
});

// Dashboard Page
function updateWaterLevel(tankId, percentageId, level) {
    const waterLevel = document.getElementById(tankId);
    const percentageText = document.getElementById(percentageId);

    // Clamp the level to be between 0 and 100
    let clampedLevel = Math.min(100, Math.max(0, level));

    // Update the water level and percentage display
    waterLevel.style.height = clampedLevel + '%';
    percentageText.textContent = clampedLevel + '%';

    // Change color based on water level
    if (clampedLevel <= 50) {
        waterLevel.style.backgroundColor = 'green';
    } else if (clampedLevel <= 80) {
        waterLevel.style.backgroundColor = 'yellow';
    } else {
        waterLevel.style.backgroundColor = 'red';
    }
}


let originalData = {};
let isEditing = false;

// Lấy dữ liệu và cập nhật giao diện
async function fetchDataAndUpdateHTML1(idbin) {
    try {
        const response = await fetch(`${url_real}api/thresholds/${idbin}`, {
            headers: { 'Authorization': `Bearer ${token}`,'Accept': '*/*' }
        });
        const data = await response.json();

        if (response.ok) {
            // Cập nhật tên bin
            document.getElementById('bin-name').textContent = "Threshold for " + data.name;

            // Cập nhật thông tin
            document.getElementById('storage1-value').textContent = `${data.storage1}%`;
            document.getElementById('storage2-value').textContent = `${data.storage2}%`;
            document.getElementById('storage3-value').textContent = `${data.storage3}%`;
            document.getElementById('storage4-value').textContent = `${data.storage4}%`;
            document.getElementById('temperature-value').textContent = `${data.temperature}°C`;

            // // Lưu lại dữ liệu gốc
            originalData = { ...data };
        } else {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
    } catch (error) {
        alert("Error loading data: " + error.message);
    }
}

// Toggle chế độ chỉnh sửa và hiển thị nút Edit/Save
function toggleEdit() {
    isEditing = !isEditing;

    if (isEditing) {
        // Chuyển sang chế độ chỉnh sửa
        document.getElementById('storage1-value').innerHTML = `<input type="number" id="storage1" value="${originalData.storage1}">`;
        document.getElementById('storage2-value').innerHTML = `<input type="number" id="storage2" value="${originalData.storage2}">`;
        document.getElementById('storage3-value').innerHTML = `<input type="number" id="storage3" value="${originalData.storage3}">`;
        document.getElementById('storage4-value').innerHTML = `<input type="number" id="storage4" value="${originalData.storage4}">`;
        document.getElementById('temperature-value').innerHTML = `<input type="number" id="temperature" value="${originalData.temperature}">`;

        // Hiển thị nút Save và Cancel, ẩn nút Edit
        document.getElementById('edit-button').style.display = 'none';
        document.getElementById('save-button').style.display = 'inline-block';
        document.getElementById('cancel-button').style.display = 'inline-block';
    } else {
        // Kết thúc chế độ chỉnh sửa
        document.getElementById('storage1-value').textContent = `${document.getElementById('storage1').value}%`;
        document.getElementById('storage2-value').textContent = `${document.getElementById('storage2').value}%`;
        document.getElementById('storage3-value').textContent = `${document.getElementById('storage3').value}%`;
        document.getElementById('storage4-value').textContent = `${document.getElementById('storage4').value}%`;
        document.getElementById('temperature-value').textContent = `${document.getElementById('temperature').value}°C`;

        // Hiển thị lại nút Edit, ẩn Save và Cancel
        document.getElementById('edit-button').style.display = 'inline-block';
        document.getElementById('save-button').style.display = 'none';
        document.getElementById('cancel-button').style.display = 'none';
    }
}

// Thêm hàm hủy chỉnh sửa
function cancelEdit() {
    // Phục hồi giá trị gốc
    document.getElementById('storage1-value').textContent = `${originalData.storage1}%`;
    document.getElementById('storage2-value').textContent = `${originalData.storage2}%`;
    document.getElementById('storage3-value').textContent = `${originalData.storage3}%`;
    document.getElementById('storage4-value').textContent = `${originalData.storage4}%`;
    document.getElementById('temperature-value').textContent = `${originalData.temperature}°C`;

    // Đặt lại trạng thái chỉnh sửa
    isEditing = false;

    // Hiển thị lại nút Edit, ẩn Save và Cancel
    document.getElementById('edit-button').style.display = 'inline-block';
    document.getElementById('save-button').style.display = 'none';
    document.getElementById('cancel-button').style.display = 'none';
}


// Hàm save, gửi yêu cầu PUT khi người dùng nhấn nút Save
async function saveData() {
    const dataToUpdate = {
        storage1: document.getElementById('storage1').value,
        storage2: document.getElementById('storage2').value,
        storage3: document.getElementById('storage3').value,
        storage4: document.getElementById('storage4').value,
        temperature: document.getElementById('temperature').value
    };

    try {
        const response = await fetch(`${url_real}api/thresholds/${idbinReal}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToUpdate)
        });

        if (response.ok) {
            alert("Data saved successfully!");
            // Gọi lại API GET để lấy lại dữ liệu mới và cập nhật lại giao diện
            fetchDataAndUpdateHTML1(idbinReal);
            toggleEdit();  // Chuyển về chế độ xem
        } else {
            throw new Error(`Failed to save data: ${response.status}`);
        }
    } catch (error) {
        alert("Error saving data: " + error.message);
    }
}

// Gọi hàm fetch dữ liệu khi tải trang

const deleteUrl = `${url_real}api/warnings`; // URL DELETE API
//const tableBody = document.getElementById("table-body");
//const clearDataBtn = document.getElementById("clear-data-btn");

// Hàm gọi API và hiển thị dữ liệu
async function fetchAndDisplayData(idbin) {
    try {
        tableBody.innerHTML = "";

        const response = await fetch(`http://35.213.129.74:30600/api/warnings/bin/${idbin}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const apiData = await response.json();

        apiData.forEach(data1 => {
            const row = document.createElement("tr");

            //inputTime1 = new Date(data1.time * 1000);
            //<td>${inputTime1.toLocaleString()}</td>
            row.innerHTML = `
                <td>${data1.id}</td>
                <td>${data1.idbin}</td>
                <td class="message-cell">${data1.message}</td>
                <td>${data1.namebin}</td>
                <td>${data1.time}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}


// Hàm xóa dữ liệu bảng và gọi API DELETE
async function clearTableData() {
    tableBody.innerHTML = "";

    try {

        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        console.log("All warnings deleted successfully");
    } catch (error) {
        console.error("Error deleting data:", error);
    }
}

// Gắn sự kiện cho nút Clear Table
clearDataBtn.addEventListener("click", clearTableData);

setInterval(fetchAndDisplayData(idbinReal), 60000);
setInterval(fetchDataAndUpdateHTML1(idbinReal), 60000);
setInterval(fetchDataAndUpdateHTML(idbinReal), 60000);