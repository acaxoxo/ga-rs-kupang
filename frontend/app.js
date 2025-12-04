let map;
let hospitals = [];
let distanceMatrix;
let durationMatrix;
let polylineLayer = null;
let hospitalMarkers = [];
let tspVisualizer = null;
let convergenceChart = null;
let comparisonResults = {};

// Seeded RNG support for reproducibility
let __originalRandom = null;
function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashSeedToInt(seedStr) {
    let h = 2166136261 >>> 0; // FNV-1a basis
    const s = String(seedStr);
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function applySeed(seedStr) {
    if (seedStr === undefined || seedStr === null || seedStr === '') return null;
    const seedInt = typeof seedStr === 'number' ? (seedStr >>> 0) : hashSeedToInt(seedStr);
    if (!__originalRandom) __originalRandom = Math.random;
    Math.random = mulberry32(seedInt);
    return seedInt;
}

function restoreRandom() {
    if (__originalRandom) {
        Math.random = __originalRandom;
        __originalRandom = null;
    }
}

// Hospital icon with colors based on road class
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
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
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

        // Populate start hospital dropdown
        const startHospitalSelect = document.getElementById("startHospital");
        startHospitalSelect.innerHTML = '';
        hospitals.forEach(h => {
            const opt = document.createElement("option");
            opt.value = h.id;
            opt.textContent = `${h.name}`;
            startHospitalSelect.appendChild(opt);
        });

        // Add hospital markers to map
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
        showNotification("Data berhasil dimuat! Silakan pilih algoritma dan jalankan optimasi.", "success");
        console.log("Dataset loaded:", data);

    } catch (error) {
        showLoading(false);
        showNotification(`Error: ${error.message}`, "error");
        console.error("Error loading dataset:", error);
    }
}

function drawTourOnMap(tour) {
    // Remove existing polyline
    if (polylineLayer) {
        polylineLayer.remove();
    }
    
    // Create tour coordinates
    const coords = tour.map(idx => {
        const h = hospitals.find(x => x.id === idx);
        return [h.lat, h.lng];
    });
    
    // Close the tour
    coords.push(coords[0]);
    
    // Draw on map
    polylineLayer = L.polyline(coords, {
        color: "#27ae60",
        weight: 4,
        opacity: 0.8
    }).addTo(map);
    
    // Fit bounds
    map.fitBounds(polylineLayer.getBounds(), { padding: [50, 50] });
}

function adjustTourStart(tour, startHospitalId) {
    const startIndex = tour.indexOf(startHospitalId);
    if (startIndex === 0) return tour;
    
    return [...tour.slice(startIndex), ...tour.slice(0, startIndex)];
}

async function runGeneticAlgorithm(startHospitalId, callback) {
    const ga = new GeneticAlgorithm(distanceMatrix, hospitals);
    
    ga.setParameters({
        populationSize: parseInt(document.getElementById("gaPopulation").value),
        generations: parseInt(document.getElementById("gaGenerations").value),
        mutationRate: parseFloat(document.getElementById("gaMutationRate").value),
        crossoverRate: parseFloat(document.getElementById("gaCrossoverRate").value),
        elitismCount: parseInt(document.getElementById("gaElitismCount").value),
        adaptiveMutation: document.getElementById("gaAdaptiveMutation").checked,
        localSearchProb: parseFloat(document.getElementById("gaLocalSearchProb").value),
        diversityThreshold: parseFloat(document.getElementById("gaDiversityThreshold").value),
        stagnationLimit: parseInt(document.getElementById("gaStagnationLimit").value),
        selectionMethod: document.getElementById("gaSelectionMethod").value,
        crossoverMethod: document.getElementById("gaCrossoverMethod").value,
        mutationMethod: document.getElementById("gaMutationMethod").value
    });
    
    const result = await ga.run(callback);
    
    // Adjust tour to start from selected hospital
    result.bestTour = adjustTourStart(result.bestTour, startHospitalId);
    
    return result;
}

async function runSimulatedAnnealing(startHospitalId, callback) {
    const sa = new SimulatedAnnealing(distanceMatrix, hospitals);
    
    sa.setParameters({
        initialTemperature: parseFloat(document.getElementById("saInitialTemp").value),
        finalTemperature: parseFloat(document.getElementById("saFinalTemp").value),
        coolingRate: parseFloat(document.getElementById("saCoolingRate").value),
        iterationsPerTemp: parseInt(document.getElementById("saIterationsPerTemp").value),
        coolingSchedule: document.getElementById("saCoolingSchedule").value,
        reheating: document.getElementById("saReheating").checked,
        reheatThreshold: parseInt(document.getElementById("saReheatThreshold").value),
        earlyStopEnabled: document.getElementById("saEarlyStop").checked
    });
    
    const result = await sa.run(callback);
    
    // Adjust tour to start from selected hospital
    result.bestTour = adjustTourStart(result.bestTour, startHospitalId);
    
    // Convert cost history to match GA format
    result.fitnessHistory = result.costHistory;
    result.avgFitnessHistory = [];
    
    return result;
}

async function runDifferentialEvolution(startHospitalId, callback) {
    const de = new DifferentialEvolution(distanceMatrix, hospitals);
    
    de.setParameters({
        populationSize: parseInt(document.getElementById("dePopulation").value),
        generations: parseInt(document.getElementById("deGenerations").value),
        F: parseFloat(document.getElementById("deMutationFactor").value),
        CR: parseFloat(document.getElementById("deCrossoverProb").value),
        strategy: document.getElementById("deStrategy").value,
        crossoverType: document.getElementById("deCrossoverType").value,
        selfAdaptive: document.getElementById("deSelfAdaptive").checked
    });
    
    const result = await de.run(callback);
    
    // Adjust tour to start from selected hospital
    result.bestTour = adjustTourStart(result.bestTour, startHospitalId);
    
    return result;
}

async function runTSPOptimization() {
    const algorithm = document.getElementById("algorithmSelect").value;
    const startHospitalId = parseInt(document.getElementById("startHospital").value);
    const useSeed = document.getElementById("useSeed").checked;
    const seedValue = document.getElementById("globalSeed").value;
    
    // Show loading
    showLoading(true);
    
    // Initialize visualizers if not yet created
    if (!tspVisualizer) {
        tspVisualizer = new TSPVisualizer("tspTourCanvas", hospitals, distanceMatrix);
    }
    if (!convergenceChart) {
        convergenceChart = new ConvergenceChart("tspConvergenceCanvas");
    }
    
    let seeded = false;
    let usedSeed = null;
    try {
        let result;
        const startTime = performance.now();
        if (useSeed) {
            usedSeed = applySeed(seedValue || 'default');
            seeded = true;
        }
        
        // Progress callback
        const progressCallback = async (progress) => {
            if (progress.generation && progress.generation % 50 === 0) {
                console.log(`Generation ${progress.generation}: Best = ${(progress.bestFitness / 1000).toFixed(2)} km, Diversity = ${progress.diversity?.toFixed(4) || 'N/A'}`);
            }
        };
        
        if (algorithm === "ga") {
            result = await runGeneticAlgorithm(startHospitalId, progressCallback);
        } else if (algorithm === "sa") {
            result = await runSimulatedAnnealing(startHospitalId, progressCallback);
        } else if (algorithm === "de") {
            result = await runDifferentialEvolution(startHospitalId, progressCallback);
        }
        if (seeded) {
            result.seed = usedSeed;
            restoreRandom();
            seeded = false;
        }
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        showLoading(false);
        displayTSPResults(result, algorithm, executionTime);
        
    } catch (error) {
        if (seeded) {
            restoreRandom();
            seeded = false;
        }
        showLoading(false);
        showNotification("Error: " + error.message, "error");
        console.error("Error running TSP:", error);
    }
}

function displayTSPResults(result, algorithm, executionTime) {
    const resultsModal = document.getElementById("resultsModal");
    const statsDiv = document.getElementById("tspResultStats");
    const comparisonDiv = document.getElementById("tspComparison");
    
    resultsModal.classList.remove("hidden");
    comparisonDiv.classList.add("hidden");
    
    // Store result for export
    comparisonResults.lastResult = { ...result, algorithm, executionTime };
    document.getElementById("btnExportResults").disabled = false;
    
    // Display statistics
    const algorithmNames = {
        'ga': 'Genetic Algorithm',
        'sa': 'Simulated Annealing',
        'de': 'Differential Evolution'
    };
    
    let statsHTML = `
        <div class="stat-item">
            <div class="stat-label">Algoritma</div>
            <div class="stat-value">${algorithmNames[algorithm]}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Jarak Total</div>
            <div class="stat-value">${(result.bestDistance / 1000).toFixed(2)} km</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Waktu Eksekusi</div>
            <div class="stat-value">${executionTime.toFixed(0)} ms</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Iterasi/Generasi</div>
            <div class="stat-value">${result.iterations || result.generations}</div>
        </div>
    `;

    if (result.seed !== undefined && result.seed !== null) {
        statsHTML += `
        <div class="stat-item">
            <div class="stat-label">Seed</div>
            <div class="stat-value">${result.seed}</div>
        </div>`;
    }
    
    // Add GA-specific statistics
    if (algorithm === 'ga' && result.stats) {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-label">Improvement</div>
                <div class="stat-value">${result.stats.improvementPercent}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Convergence Gen</div>
                <div class="stat-value">${result.stats.convergenceGeneration}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Crossovers</div>
                <div class="stat-value">${result.stats.totalCrossovers}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Mutations</div>
                <div class="stat-value">${result.stats.totalMutations}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Local Searches</div>
                <div class="stat-value">${result.stats.totalLocalSearches}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Diversity Restarts</div>
                <div class="stat-value">${result.stats.diversityRestarts}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Final Diversity</div>
                <div class="stat-value">${result.stats.finalDiversity}</div>
            </div>
        `;
    }
    
    statsDiv.innerHTML = statsHTML;
    
    // Visualize tour
    tspVisualizer.drawTour(result.bestTour, result.bestDistance, algorithmNames[algorithm]);
    
    // Visualize convergence
    convergenceChart.updateData(
        result.fitnessHistory,
        result.avgFitnessHistory,
        `Konvergensi ${algorithmNames[algorithm]}`
    );
    
    // Draw on map
    drawTourOnMap(result.bestTour);
    
    showNotification(`Optimasi selesai! Jarak: ${(result.bestDistance / 1000).toFixed(2)} km`, "success");
}

async function compareAllAlgorithms() {
    const startHospitalId = parseInt(document.getElementById("startHospital").value);
    const useSeed = document.getElementById("useSeed").checked;
    const seedValue = document.getElementById("globalSeed").value;
    
    const resultsModal = document.getElementById("resultsModal");
    const comparisonDiv = document.getElementById("tspComparison");
    
    resultsModal.classList.remove("hidden");
    comparisonDiv.classList.remove("hidden");
    
    const tbody = document.getElementById("tspComparisonBody");
    tbody.innerHTML = `
        <tr>
            <td>Genetic Algorithm</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td><span class="status-badge status-running">Running...</span></td>
        </tr>
        <tr>
            <td>Simulated Annealing</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td><span class="status-badge status-running">Waiting...</span></td>
        </tr>
        <tr>
            <td>Differential Evolution</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td><span class="status-badge status-running">Waiting...</span></td>
        </tr>
    `;
    
    comparisonResults = {};
    
    // Run GA
    try {
        showLoading(true);
        const startTime = performance.now();
        let seeded = false; let seedGA = null;
        if (useSeed) { seedGA = applySeed(seedValue || 'default'); seeded = true; }
        const gaResult = await runGeneticAlgorithm(startHospitalId, null);
        if (seeded) { gaResult.seed = seedGA; restoreRandom(); }
        const endTime = performance.now();
        
        comparisonResults.ga = {
            distance: gaResult.bestDistance,
            time: endTime - startTime,
            iterations: gaResult.generations,
            tour: gaResult.bestTour,
            seed: gaResult.seed
        };
        
        updateComparisonRow(0, comparisonResults.ga, 'completed');
    } catch (error) {
        updateComparisonRow(0, null, 'error');
    }
    
    // Run SA
    try {
        const startTime = performance.now();
        let seeded = false; let seedSA = null;
        if (useSeed) { seedSA = applySeed(seedValue || 'default'); seeded = true; }
        const saResult = await runSimulatedAnnealing(startHospitalId, null);
        if (seeded) { saResult.seed = seedSA; restoreRandom(); }
        const endTime = performance.now();
        
        comparisonResults.sa = {
            distance: saResult.bestDistance,
            time: endTime - startTime,
            iterations: saResult.iterations,
            tour: saResult.bestTour,
            seed: saResult.seed
        };
        
        updateComparisonRow(1, comparisonResults.sa, 'completed');
    } catch (error) {
        updateComparisonRow(1, null, 'error');
    }
    
    // Run DE
    try {
        const startTime = performance.now();
        let seeded = false; let seedDE = null;
        if (useSeed) { seedDE = applySeed(seedValue || 'default'); seeded = true; }
        const deResult = await runDifferentialEvolution(startHospitalId, null);
        if (seeded) { deResult.seed = seedDE; restoreRandom(); }
        const endTime = performance.now();
        
        comparisonResults.de = {
            distance: deResult.bestDistance,
            time: endTime - startTime,
            iterations: deResult.generations,
            tour: deResult.bestTour,
            seed: deResult.seed
        };
        
        updateComparisonRow(2, comparisonResults.de, 'completed');
        showLoading(false);
        
        // Show best result on map
        const bestAlgo = Object.keys(comparisonResults).reduce((a, b) => 
            comparisonResults[a].distance < comparisonResults[b].distance ? a : b
        );
        drawTourOnMap(comparisonResults[bestAlgo].tour);
        
        showNotification("Perbandingan selesai! Lihat tabel hasil.", "success");
    } catch (error) {
        updateComparisonRow(2, null, 'error');
        showLoading(false);
    }
}

function updateComparisonRow(rowIndex, result, status) {
    const tbody = document.getElementById("tspComparisonBody");
    const row = tbody.rows[rowIndex];
    
    if (result) {
        row.cells[1].textContent = (result.distance / 1000).toFixed(2);
        row.cells[2].textContent = result.time.toFixed(0);
        row.cells[3].textContent = result.iterations;
    } else {
        row.cells[1].textContent = '-';
        row.cells[2].textContent = '-';
        row.cells[3].textContent = '-';
    }
    
    const statusBadge = row.cells[4].querySelector('.status-badge');
    statusBadge.className = `status-badge status-${status}`;
    statusBadge.textContent = status === 'completed' ? 'Selesai' : (status === 'error' ? 'Error' : 'Running...');
}

function showParameters(algorithm) {
    document.getElementById("tspParametersGA").classList.add("hidden");
    document.getElementById("tspParametersSA").classList.add("hidden");
    document.getElementById("tspParametersDE").classList.add("hidden");
    
    if (algorithm === "ga") {
        document.getElementById("tspParametersGA").classList.remove("hidden");
    } else if (algorithm === "sa") {
        document.getElementById("tspParametersSA").classList.remove("hidden");
    } else if (algorithm === "de") {
        document.getElementById("tspParametersDE").classList.remove("hidden");
    }
}

function resetMap() {
    if (polylineLayer) {
        polylineLayer.remove();
        polylineLayer = null;
    }
    map.setView([-10.16, 123.61], 12);
    comparisonResults = {};
    document.getElementById("btnExportResults").disabled = true;
    showNotification("Peta direset", "info");
}

// Export results to JSON/CSV/PNG
function exportResults() {
    if (!comparisonResults.lastResult) {
        showNotification("Tidak ada hasil untuk di-export", "error");
        return;
    }
    
    const result = comparisonResults.lastResult;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Export Hasil Optimasi</h3>
            <div style="margin: 20px 0;">
                <h4>Data Export</h4>
                <button onclick="exportJSON()" class="btn-primary">Export JSON</button>
                <button onclick="exportCSV()" class="btn-success">Export CSV Tour</button>
                <button onclick="exportFullCSV()" class="btn-info">Export Full CSV</button>
                <hr style="margin: 15px 0;">
                <h4>Image Export</h4>
                <button onclick="exportTourPNG()" class="btn-primary">Export Tour PNG</button>
                <button onclick="exportConvergencePNG()" class="btn-success">Export Convergence PNG</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function exportJSON() {
    const result = comparisonResults.lastResult;
    const exportData = {
        algorithm: result.algorithm,
        timestamp: new Date().toISOString(),
        seed: result.seed ?? null,
        bestDistance: result.bestDistance,
        executionTime: result.executionTime,
        tour: result.bestTour.map(id => {
            const h = hospitals.find(x => x.id === id);
            return {
                id: h.id,
                name: h.name,
                lat: h.lat,
                lng: h.lng
            };
        }),
        statistics: result.stats || {},
        fitnessHistory: result.fitnessHistory,
        diversityHistory: result.diversityHistory || []
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsp_result_${result.algorithm}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification("Data berhasil di-export sebagai JSON", "success");
}

function exportCSV() {
    const result = comparisonResults.lastResult;
    let csv = "No,Hospital_ID,Hospital_Name,Latitude,Longitude,Road_Class\n";
    
    result.bestTour.forEach((id, index) => {
        const h = hospitals.find(x => x.id === id);
        csv += `${index + 1},${h.id},${h.name},${h.lat},${h.lng},${h.road_class}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsp_tour_${result.algorithm}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification("Tour berhasil di-export sebagai CSV", "success");
}

function exportFullCSV() {
    const result = comparisonResults.lastResult;
    let csv = "Generation,Best_Fitness,Avg_Fitness,Diversity\n";
    
    for (let i = 0; i < result.fitnessHistory.length; i++) {
        const best = result.fitnessHistory[i];
        const avg = result.avgFitnessHistory ? result.avgFitnessHistory[i] : '';
        const div = result.diversityHistory ? result.diversityHistory[i] : '';
        csv += `${i},${best},${avg},${div}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsp_convergence_${result.algorithm}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification("Data konvergensi berhasil di-export sebagai CSV", "success");
}

function exportTourPNG() {
    const canvas = document.getElementById('tspTourCanvas');
    if (!canvas) {
        showNotification("Canvas tidak tersedia", "error");
        return;
    }
    
    const link = document.createElement('a');
    link.download = `tsp_tour_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showNotification("Tour diagram berhasil di-export sebagai PNG", "success");
}

function exportConvergencePNG() {
    const canvas = document.getElementById('tspConvergenceCanvas');
    if (!canvas) {
        showNotification("Canvas tidak tersedia", "error");
        return;
    }
    
    const link = document.createElement('a');
    link.download = `tsp_convergence_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showNotification("Grafik konvergensi berhasil di-export sebagai PNG", "success");
}

// Benchmark functionality
let benchmarkResults = [];

function showBenchmarkModal() {
    document.getElementById('benchmarkModal').style.display = 'block';
}

async function runBenchmark() {
    const algorithm = document.getElementById('benchmarkAlgorithm').value;
    const trials = parseInt(document.getElementById('benchmarkTrials').value);
    const seedMode = document.getElementById('benchmarkSeedMode').value;
    const useSeed = document.getElementById('useSeed').checked;
    const baseSeed = document.getElementById('globalSeed').value;
    
    if (!hospitals || hospitals.length < 2) {
        showNotification("Belum ada data RS atau data tidak cukup untuk benchmark", "error");
        return;
    }
    
    // Hide start button, show progress
    document.getElementById('btnStartBenchmark').disabled = true;
    document.getElementById('benchmarkProgress').style.display = 'block';
    document.getElementById('benchmarkTotalTrials').textContent = trials;
    
    benchmarkResults = [];
    
    for (let i = 0; i < trials; i++) {
        document.getElementById('benchmarkCurrentTrial').textContent = i + 1;
        document.getElementById('benchmarkProgressBar').style.width = ((i + 1) / trials * 100) + '%';
        
        // Determine seed for this trial
        let trialSeed = null;
        if (useSeed || seedMode === 'same') {
            if (seedMode === 'same') {
                trialSeed = baseSeed || 'benchmark';
            } else {
                trialSeed = (baseSeed || 'benchmark') + '_' + i;
            }
        }
        
        // Apply seed if needed
        if (trialSeed) applySeed(trialSeed);
        
        // Run algorithm
        let result;
        const startTime = performance.now();
        
        if (algorithm === 'ga') {
            result = await runGeneticAlgorithmInternal();
        } else if (algorithm === 'sa') {
            result = await runSimulatedAnnealingInternal();
        } else if (algorithm === 'de') {
            result = await runDifferentialEvolutionInternal();
        }
        
        const endTime = performance.now();
        
        // Restore random
        if (trialSeed) restoreRandom();
        
        // Save trial result
        benchmarkResults.push({
            trial: i + 1,
            seed: trialSeed,
            bestDistance: result.bestDistance,
            executionTime: endTime - startTime,
            bestTour: result.bestTour
        });
        
        // Small delay to allow UI update
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Display results
    displayBenchmarkResults(algorithm);
    
    // Reset UI
    document.getElementById('btnStartBenchmark').disabled = false;
    document.getElementById('benchmarkProgress').style.display = 'none';
    document.getElementById('benchmarkModal').style.display = 'none';
}

function displayBenchmarkResults(algorithm) {
    const distances = benchmarkResults.map(r => r.bestDistance);
    const times = benchmarkResults.map(r => r.executionTime);
    
    const stats = {
        distance: {
            mean: distances.reduce((a, b) => a + b) / distances.length,
            median: median(distances),
            std: standardDeviation(distances),
            min: Math.min(...distances),
            max: Math.max(...distances)
        },
        time: {
            mean: times.reduce((a, b) => a + b) / times.length,
            median: median(times),
            std: standardDeviation(times),
            min: Math.min(...times),
            max: Math.max(...times)
        }
    };
    
    // Show results in modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Benchmark Results - ${algorithm.toUpperCase()}</h3>
            <p><strong>Trials:</strong> ${benchmarkResults.length}</p>
            
            <h4>Distance Statistics (km)</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><th style="border: 1px solid #ddd; padding: 8px;">Metric</th><th style="border: 1px solid #ddd; padding: 8px;">Value</th></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Mean</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.distance.mean.toFixed(3)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Median</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.distance.median.toFixed(3)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Std Dev</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.distance.std.toFixed(3)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Min</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.distance.min.toFixed(3)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Max</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.distance.max.toFixed(3)}</td></tr>
            </table>
            
            <h4>Execution Time Statistics (ms)</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><th style="border: 1px solid #ddd; padding: 8px;">Metric</th><th style="border: 1px solid #ddd; padding: 8px;">Value</th></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Mean</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.time.mean.toFixed(2)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Median</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.time.median.toFixed(2)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Std Dev</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.time.std.toFixed(2)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Min</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.time.min.toFixed(2)}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;">Max</td><td style="border: 1px solid #ddd; padding: 8px;">${stats.time.max.toFixed(2)}</td></tr>
            </table>
            
            <h4>Individual Trials</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><th style="border: 1px solid #ddd; padding: 8px;">Trial</th><th style="border: 1px solid #ddd; padding: 8px;">Distance (km)</th><th style="border: 1px solid #ddd; padding: 8px;">Time (ms)</th><th style="border: 1px solid #ddd; padding: 8px;">Seed</th></tr>
                    ${benchmarkResults.map(r => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${r.trial}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${r.bestDistance.toFixed(3)}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${r.executionTime.toFixed(2)}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.8em;">${r.seed || 'none'}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="exportBenchmarkCSV('${algorithm}')" class="btn-success">Export to CSV</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    showNotification(`Benchmark selesai: ${benchmarkResults.length} trials`, "success");
}

function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function standardDeviation(arr) {
    const mean = arr.reduce((a, b) => a + b) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

function exportBenchmarkCSV(algorithm) {
    let csv = "Trial,Distance_km,Time_ms,Seed\n";
    benchmarkResults.forEach(r => {
        csv += `${r.trial},${r.bestDistance},${r.executionTime},${r.seed || 'none'}\n`;
    });
    
    // Add statistics summary
    const distances = benchmarkResults.map(r => r.bestDistance);
    const times = benchmarkResults.map(r => r.executionTime);
    csv += "\nStatistics Summary\n";
    csv += "Metric,Distance_km,Time_ms\n";
    csv += `Mean,${(distances.reduce((a,b)=>a+b)/distances.length).toFixed(3)},${(times.reduce((a,b)=>a+b)/times.length).toFixed(2)}\n`;
    csv += `Median,${median(distances).toFixed(3)},${median(times).toFixed(2)}\n`;
    csv += `Std Dev,${standardDeviation(distances).toFixed(3)},${standardDeviation(times).toFixed(2)}\n`;
    csv += `Min,${Math.min(...distances).toFixed(3)},${Math.min(...times).toFixed(2)}\n`;
    csv += `Max,${Math.max(...distances).toFixed(3)},${Math.max(...times).toFixed(2)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_${algorithm}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification("Benchmark data berhasil di-export sebagai CSV", "success");
}

// Internal algorithm runners (without visualization, for benchmark)
async function runGeneticAlgorithmInternal() {
    const populationSize = parseInt(document.getElementById("gaPopulationSize").value);
    const generations = parseInt(document.getElementById("gaGenerations").value);
    const mutationRate = parseFloat(document.getElementById("gaMutationRate").value);
    const crossoverRate = parseFloat(document.getElementById("gaCrossoverRate").value);
    const selectionMethod = document.getElementById("gaSelectionMethod").value;
    const crossoverMethod = document.getElementById("gaCrossoverMethod").value;
    const mutationMethod = document.getElementById("gaMutationMethod").value;
    const elitismCount = parseInt(document.getElementById("gaElitismCount").value);
    const adaptiveMutation = document.getElementById("gaAdaptiveMutation").checked;
    const localSearchProb = parseFloat(document.getElementById("gaLocalSearchProb").value);
    const diversityThreshold = parseFloat(document.getElementById("gaDiversityThreshold").value);
    const stagnationLimit = parseInt(document.getElementById("gaStagnationLimit").value);
    
    const ga = new GeneticAlgorithm(hospitals, distanceMatrix);
    ga.setParameters(
        populationSize, generations, mutationRate, crossoverRate,
        selectionMethod, crossoverMethod, mutationMethod, elitismCount,
        adaptiveMutation, localSearchProb, diversityThreshold, stagnationLimit
    );
    
    return await ga.run();
}

async function runSimulatedAnnealingInternal() {
    const initialTemp = parseFloat(document.getElementById("saInitialTemp").value);
    const finalTemp = parseFloat(document.getElementById("saFinalTemp").value);
    const coolingRate = parseFloat(document.getElementById("saCoolingRate").value);
    const iterationsPerTemp = parseInt(document.getElementById("saIterationsPerTemp").value);
    const coolingSchedule = document.getElementById("saCoolingSchedule").value;
    const reheating = document.getElementById("saReheating").checked;
    const reheatThreshold = parseInt(document.getElementById("saReheatThreshold").value);
    const earlyStop = document.getElementById("saEarlyStop").checked;
    
    const sa = new SimulatedAnnealing(hospitals, distanceMatrix);
    sa.setParameters(
        initialTemp, finalTemp, coolingRate, iterationsPerTemp,
        coolingSchedule, reheating, reheatThreshold, earlyStop
    );
    
    return await sa.run();
}

async function runDifferentialEvolutionInternal() {
    const populationSize = parseInt(document.getElementById("dePopulationSize").value);
    const generations = parseInt(document.getElementById("deGenerations").value);
    const F = parseFloat(document.getElementById("deF").value);
    const CR = parseFloat(document.getElementById("deCR").value);
    const strategy = document.getElementById("deStrategy").value;
    const crossoverType = document.getElementById("deCrossoverType").value;
    const selfAdaptive = document.getElementById("deSelfAdaptive").checked;
    
    const de = new DifferentialEvolution(hospitals, distanceMatrix);
    de.setParameters(populationSize, generations, F, CR, strategy, crossoverType, selfAdaptive);
    
    return await de.run();
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    loadDataset();
    
    // Algorithm selection
    document.getElementById("algorithmSelect").addEventListener("change", (e) => {
        showParameters(e.target.value);
    });
    
    // Run TSP
    document.getElementById("btnRunTSP").addEventListener("click", runTSPOptimization);
    
    // Compare algorithms
    document.getElementById("btnCompareTSP").addEventListener("click", compareAllAlgorithms);
    
    // Benchmark
    document.getElementById("btnBenchmark").addEventListener("click", showBenchmarkModal);
    document.getElementById("btnStartBenchmark").addEventListener("click", runBenchmark);
    
    // Show parameters modal
    document.getElementById("btnShowParameters").addEventListener("click", () => {
        document.getElementById("parametersModal").classList.remove("hidden");
        const algorithm = document.getElementById("algorithmSelect").value;
        showParameters(algorithm);
    });
    
    // Close parameters modal
    document.getElementById("closeParameters").addEventListener("click", () => {
        document.getElementById("parametersModal").classList.add("hidden");
    });
    
    // Close results modal
    document.getElementById("closeResults").addEventListener("click", () => {
        document.getElementById("resultsModal").classList.add("hidden");
    });
    
    // Reset
    document.getElementById("btnReset").addEventListener("click", resetMap);
    
    // Export results
    document.getElementById("btnExportResults").addEventListener("click", exportResults);
    
    // Close modal when clicking outside
    window.onclick = function (event) {
        const parametersModal = document.getElementById("parametersModal");
        const resultsModal = document.getElementById("resultsModal");
        
        if (event.target === parametersModal) {
            parametersModal.classList.add("hidden");
        }
        if (event.target === resultsModal) {
            resultsModal.classList.add("hidden");
        }
    };
    
    // Initialize with GA parameters visible
    showParameters('ga');
});
