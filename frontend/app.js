let map;
let hospitals = [];
let distanceMatrix;
let durationMatrix;
let originalDistanceMatrix;
let originalDurationMatrix;
let floydWarshallResult = null;
let allLocations = [];
let polylineLayer = null;
let hospitalMarkers = [];

const hospitalIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMwIDQwIj48cGF0aCBmaWxsPSIjMjE5NmYzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE1IDAgQyA4IDAgMyA1IDMgMTIgQyAzIDE4IDguNSAyNSAxNSA0MCBDIDIxLjUgMjUgMjcgMTggMjcgMTIgQyAyNyA1IDIyIDAgMTUgMCBaIE0gMTUgMTcgQyAxMiAxNyAxMCAxNSAxMCAxMiBDIDEwIDkgMTIgNyAxNSA3IEMgMTggNyAyMCA5IDIwIDEyIEMgMjAgMTUgMTggMTcgMTUgMTcgWiIvPjwvc3ZnPg==',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
});

// Icon colors based on road class
function getHospitalIcon(roadClass) {
    const colors = {
        'arteri_primer': '#e74c3c',      // Red
        'arteri_sekunder': '#f39c12',    // Orange  
        'jalan_lokal': '#3498db'         // Blue
    };
    const color = colors[roadClass] || '#2196f3';
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path fill="${color}" stroke="#fff" stroke-width="2" d="M15 0 C 8 0 3 5 3 12 C 3 18 8.5 25 15 40 C 21.5 25 27 18 27 12 C 27 5 22 0 15 0 Z M 15 17 C 12 17 10 15 10 12 C 10 9 12 7 15 7 C 18 7 20 9 20 12 C 20 15 18 17 15 17 Z"/></svg>`;
    
    return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40]
    });
}

function showLoading(show = true) {
    const loadingEl = document.getElementById("loading");
    if (show) {
        loadingEl.classList.remove("hidden");
    } else {
        loadingEl.classList.add("hidden");
    }
}

function showNotification(message, type = "info") {
    const notifEl = document.getElementById("notification");
    notifEl.textContent = message;
    notifEl.className = `notification ${type}`;
    notifEl.classList.remove("hidden");

    setTimeout(() => {
        notifEl.classList.add("hidden");
    }, 4000);
}

function initMap() {
    map = L.map("map").setView([-10.16, 123.61], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(map);
}

async function loadDataset() {
    try {
        showLoading(true);
        const res = await fetch("/api/dataset");

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.hospitals || !data.matrices) {
            throw new Error("Data tidak lengkap");
        }

        hospitals = Object.values(data.hospitals);
        distanceMatrix = data.matrices.distances_m;
        durationMatrix = data.matrices.durations_s;

        // Save original matrices
        originalDistanceMatrix = distanceMatrix.map(row => [...row]);
        originalDurationMatrix = durationMatrix.map(row => [...row]);

        // Build all locations array (semua RS)
        allLocations = hospitals;

        // Populate FROM dropdown
        let fromSelect = document.getElementById("fromLocation");
        fromSelect.innerHTML = '';
        allLocations.forEach(loc => {
            let opt = document.createElement("option");
            opt.value = loc.id;
            opt.textContent = `${loc.name} (${loc.type})`;
            fromSelect.appendChild(opt);
        });
        fromSelect.value = "0"; // Default: RS pertama

        // Populate TO dropdown
        let select = document.getElementById("targetRS");
        select.innerHTML = '<option value="">-- Pilih RS Tujuan --</option>';

        allLocations.forEach(loc => {
            let opt = document.createElement("option");
            opt.value = loc.id;
            opt.textContent = `${loc.name} (${loc.type})`;
            select.appendChild(opt);
        });

        hospitals.forEach(h => {
            const marker = L.marker([h.lat, h.lng], {
                icon: getHospitalIcon(h.road_class),
                title: h.name
            })
                .addTo(map)
                .bindPopup(`<b>${h.name}</b><br><i>${h.type}</i><br>Jalan: ${h.road_class.replace(/_/g, ' ')}`);
            hospitalMarkers.push(marker);
        });

        showLoading(false);
        showNotification("Data berhasil dimuat!", "success");
        console.log("Dataset loaded:", data);

    } catch (error) {
        showLoading(false);
        showNotification(`Error: ${error.message}`, "error");
        console.error("Error loading dataset:", error);
    }
}

function hitungRuteTercepat() {
    try {
        const fromSelect = document.getElementById("fromLocation");
        const targetSelect = document.getElementById("targetRS");

        const from = parseInt(fromSelect.value);
        const target = parseInt(targetSelect.value);

        if (isNaN(from) || !target || isNaN(target)) {
            showNotification("Silakan pilih lokasi awal dan tujuan!", "error");
            return;
        }

        if (from === target) {
            showNotification("Lokasi awal dan tujuan tidak boleh sama!", "error");
            return;
        }

        showLoading(true);

        const n = distanceMatrix.length;

        const distCopy = distanceMatrix.map(row =>
            row.map(val => val === 0 ? 0 : (val > 0 ? val : Infinity))
        );

        const durCopy = durationMatrix.map(row =>
            row.map(val => val === 0 ? 0 : (val > 0 ? val : Infinity))
        );

        const distResult = floydWarshall(distCopy);
        const durResult = floydWarshall(durCopy);

        // Save results for matrix visualization
        floydWarshallResult = {
            distance: distResult,
            duration: durResult
        };

        let path = reconstructPath(distResult.next, from, target);

        if (path.length < 2) {
            showLoading(false);
            showNotification("Tidak ada rute ditemukan!", "error");
            return;
        }

        fetchRealRoute(path, distResult.dist, durResult.dist);

    } catch (error) {
        showLoading(false);
        showNotification(`Error: ${error.message}`, "error");
        console.error("Error calculating route:", error);
    }
}

async function fetchRealRoute(path, distMatrix, durMatrix) {
    try {
        const coordinates = path.map(idx => {
            let h = hospitals.find(x => x.id === idx);
            return [h.lng, h.lat];
        });

        const response = await fetch("/api/route", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ coordinates })
        });

        if (!response.ok) {
            throw new Error("Gagal mendapatkan rute dari server");
        }

        const data = await response.json();

        if (data.type === "success" && data.geometry) {
            const coords = data.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            if (polylineLayer) polylineLayer.remove();

            polylineLayer = L.polyline(coords, {
                color: "#f44336",
                weight: 5,
                opacity: 0.7
            }).addTo(map);

            map.fitBounds(polylineLayer.getBounds());

            displayRouteInfo(path, distMatrix, durMatrix);
            
            // Highlight path in graph visualization
            if (window.graphVisualizer) {
                highlightPathInGraph(path);
            }

            showLoading(false);
            showNotification("Rute tercepat berhasil dihitung!", "success");
        } else {
            throw new Error("Format rute tidak valid");
        }

    } catch (error) {
        showLoading(false);
        showNotification(`Error: ${error.message}`, "error");
        console.error("Error fetching real route:", error);
    }
}

function displayRouteInfo(path, distMatrix, durMatrix) {
    const routeInfoEl = document.getElementById("routeInfo");
    const routeDetailsEl = document.getElementById("routeDetails");

    let html = "";
    let totalDist = 0;
    let totalDur = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const fromIdx = path[i];
        const toIdx = path[i + 1];

        const segmentDist = distMatrix[fromIdx][toIdx];
        const segmentDur = durMatrix[fromIdx][toIdx];

        totalDist += segmentDist;
        totalDur += segmentDur;

        const fromLoc = allLocations.find(loc => loc.id === fromIdx);
        const toLoc = allLocations.find(loc => loc.id === toIdx);

        html += `
            <div class="route-step">
                <strong>Langkah ${i + 1}</strong><br>
                Dari: <b>${fromLoc.name}</b><br>
                Ke: <b>${toLoc.name}</b><br>
                Jarak: ${(segmentDist / 1000).toFixed(2)} km<br>
                Waktu: ${Math.round(segmentDur / 60)} menit
            </div>
        `;
    }

    html += `
        <div class="route-total">
            <div>📍 Total Jarak: <span style="color: #1976d2">${(totalDist / 1000).toFixed(2)} km</span></div>
            <div>⏱️ Estimasi Waktu: <span style="color: #1976d2">${Math.round(totalDur / 60)} menit</span></div>
            <div>🏥 Jumlah Perhentian: <span style="color: #1976d2">${path.length - 2}</span></div>
        </div>
    `;

    routeDetailsEl.innerHTML = html;
    routeInfoEl.classList.remove("hidden");
}

function resetRoute() {
    if (polylineLayer) {
        polylineLayer.remove();
        polylineLayer = null;
    }

    document.getElementById("routeInfo").classList.add("hidden");
    document.getElementById("fromLocation").value = "0";
    document.getElementById("targetRS").value = "";
    
    // Clear graph highlight
    if (window.graphVisualizer) {
        window.graphVisualizer.clearHighlight();
    }

    if (hospitalMarkers.length > 0) {
        const group = L.featureGroup(hospitalMarkers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    showNotification("Rute telah direset", "info");
}

function getLocationName(id) {
    const loc = allLocations.find(l => l.id === id);
    return loc ? loc.name : `Lokasi ${id}`;
}

function showMatrixModal() {
    if (!floydWarshallResult) {
        showNotification("Hitung rute terlebih dahulu untuk melihat matriks!", "error");
        return;
    }

    const modal = document.getElementById("matrixModal");
    modal.classList.remove("hidden");

    // Default: show distance matrix
    renderMatrix("distance");
}

function showAllPairsModal() {
    if (!floydWarshallResult) {
        showNotification("Hitung rute terlebih dahulu untuk melihat semua jalur!", "error");
        return;
    }

    const modal = document.getElementById("allPairsModal");
    modal.classList.remove("hidden");

    // Default: show distance table
    renderAllPairsTable("distance");
}

function renderMatrix(type) {
    const container = document.getElementById("matrixContainer");
    const result = floydWarshallResult[type];
    const originalMatrix = type === "distance" ? originalDistanceMatrix : originalDurationMatrix;
    const unit = type === "distance" ? "km" : "min";
    const divisor = type === "distance" ? 1000 : 60;

    let html = '<div class="matrix-wrapper"><h4>Matriks Hasil Floyd-Warshall</h4>';
    html += '<table class="matrix-table"><thead><tr><th>Dari \\ Ke</th>';

    // Header columns
    allLocations.forEach(loc => {
        html += `<th title="${loc.name}">${loc.id}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Rows
    allLocations.forEach((fromLoc, i) => {
        html += `<tr><th title="${fromLoc.name}">${fromLoc.id}</th>`;
        allLocations.forEach((toLoc, j) => {
            const value = result.dist[i][j];
            const originalValue = originalMatrix[i][j];
            const isChanged = result.changes[i][j];
            const displayValue = value === Infinity ? '∞' : (value / divisor).toFixed(2);

            let cellClass = '';
            if (i === j) {
                cellClass = 'diagonal';
            } else if (isChanged) {
                cellClass = 'indirect';
            } else if (value < Infinity) {
                cellClass = 'direct';
            }

            let title = `${fromLoc.name} → ${toLoc.name}: ${displayValue} ${unit}`;
            if (isChanged) {
                const origDisplay = (originalValue / divisor).toFixed(2);
                title += `\nAsli: ${origDisplay} ${unit}\nDioptimalkan via jalur tidak langsung`;
            }

            html += `<td class="${cellClass}" title="${title}">${displayValue}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Location legend
    html += '<div class="location-legend"><h4>Keterangan Lokasi:</h4>';
    allLocations.forEach(loc => {
        html += `<div><strong>${loc.id}:</strong> ${loc.name}</div>`;
    });
    html += '</div>';

    container.innerHTML = html;
}

function renderAllPairsTable(type) {
    const container = document.getElementById("allPairsContainer");
    const result = floydWarshallResult[type];
    const unit = type === "distance" ? "km" : "menit";
    const divisor = type === "distance" ? 1000 : 60;

    let html = '<table class="all-pairs-table">';
    html += '<thead><tr>';
    html += '<th>Dari</th><th>Ke</th><th>Jarak/Waktu</th><th>Jalur</th><th>Tipe</th>';
    html += '</tr></thead><tbody>';

    // Generate all pairs
    allLocations.forEach((fromLoc, i) => {
        allLocations.forEach((toLoc, j) => {
            if (i !== j) {
                const value = result.dist[i][j];
                if (value < Infinity) {
                    const displayValue = (value / divisor).toFixed(2);
                    const path = reconstructPath(result.next, i, j);
                    const pathNames = path.map(id => {
                        const loc = allLocations.find(l => l.id === id);
                        return `${loc.name} (${id})`;
                    }).join(' → ');

                    const isChanged = result.changes[i][j];
                    const routeType = isChanged ?
                        '<span class="badge indirect-badge">Tidak Langsung</span>' :
                        '<span class="badge direct-badge">Langsung</span>';

                    html += `<tr>`;
                    html += `<td>${fromLoc.name}</td>`;
                    html += `<td>${toLoc.name}</td>`;
                    html += `<td><strong>${displayValue}</strong> ${unit}</td>`;
                    html += `<td class="path-cell">${pathNames}</td>`;
                    html += `<td>${routeType}</td>`;
                    html += `</tr>`;
                }
            }
        });
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function closeMatrixModal() {
    document.getElementById("matrixModal").classList.add("hidden");
}

function closeAllPairsModal() {
    document.getElementById("allPairsModal").classList.add("hidden");
}

function showGraphModal() {
    if (!floydWarshallResult) {
        showNotification("Hitung rute terlebih dahulu untuk melihat graf!", "error");
        return;
    }
    
    showGraphVisualization(hospitals, floydWarshallResult.distance.dist, 'weighted');
}

document.addEventListener("DOMContentLoaded", async () => {
    initMap();
    await loadDataset();

    document.getElementById("btnHitung").onclick = hitungRuteTercepat;
    document.getElementById("btnReset").onclick = resetRoute;
    document.getElementById("btnShowMatrix").onclick = showMatrixModal;
    document.getElementById("btnShowAllPairs").onclick = showAllPairsModal;
    document.getElementById("btnShowGraph").onclick = showGraphModal;
    document.getElementById("closeMatrix").onclick = closeMatrixModal;
    document.getElementById("closeAllPairs").onclick = closeAllPairsModal;
    document.getElementById("closeGraph").onclick = closeGraphModal;

    // Tab switching for matrix modal
    document.querySelectorAll("#matrixModal .tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll("#matrixModal .tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            renderMatrix(e.target.dataset.tab);
        });
    });

    // Tab switching for all-pairs modal
    document.querySelectorAll("#allPairsModal .tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll("#allPairsModal .tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            renderAllPairsTable(e.target.dataset.tab);
        });
    });

    // Close modal when clicking outside
    window.onclick = function (event) {
        const matrixModal = document.getElementById("matrixModal");
        const allPairsModal = document.getElementById("allPairsModal");
        if (event.target === matrixModal) {
            closeMatrixModal();
        }
        if (event.target === allPairsModal) {
            closeAllPairsModal();
        }
    };
});
