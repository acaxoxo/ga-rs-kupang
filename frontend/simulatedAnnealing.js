// Simulated Annealing (SA) untuk Travelling Salesman Problem (TSP)
// Probabilistic search dengan cooling schedule

class SimulatedAnnealing {
    constructor(distanceMatrix, hospitals) {
        this.distanceMatrix = distanceMatrix;
        this.hospitals = hospitals;
        this.n = hospitals.length;
        
        // Parameter SA
        this.initialTemperature = 10000;
        this.finalTemperature = 0.1;
        this.coolingRate = 0.995;  // Geometric cooling
        this.iterationsPerTemp = 100;
        this.coolingSchedule = 'geometric'; // geometric, linear, exponential, logarithmic
        this.reheating = false;
        this.reheatThreshold = 100; // iterations without improvement
        this.earlyStopEnabled = false;
        this.earlyStopThreshold = 0.001; // improvement threshold
        this.earlyStopWindow = 50; // check improvement over this window
        
        // State
        this.currentSolution = null;
        this.currentCost = Infinity;
        this.bestSolution = null;
        this.bestCost = Infinity;
        this.temperature = this.initialTemperature;
        this.costHistory = [];
        this.temperatureHistory = [];
        this.acceptanceHistory = [];
        this.iteration = 0;
        this.noImprovementCount = 0;
        this.totalAccepted = 0;
        this.totalRejected = 0;
    }
    
    // Set custom parameters
    setParameters(params) {
        if (params.initialTemperature) this.initialTemperature = params.initialTemperature;
        if (params.finalTemperature) this.finalTemperature = params.finalTemperature;
        if (params.coolingRate) this.coolingRate = params.coolingRate;
        if (params.iterationsPerTemp) this.iterationsPerTemp = params.iterationsPerTemp;
        if (params.coolingSchedule) this.coolingSchedule = params.coolingSchedule;
        if (params.reheating !== undefined) this.reheating = params.reheating;
        if (params.reheatThreshold) this.reheatThreshold = params.reheatThreshold;
        if (params.earlyStopEnabled !== undefined) this.earlyStopEnabled = params.earlyStopEnabled;
        if (params.earlyStopThreshold) this.earlyStopThreshold = params.earlyStopThreshold;
        if (params.earlyStopWindow) this.earlyStopWindow = params.earlyStopWindow;
    }
    
    // Calculate total distance of a tour
    calculateTourDistance(tour) {
        let totalDistance = 0;
        
        for (let i = 0; i < tour.length - 1; i++) {
            totalDistance += this.distanceMatrix[tour[i]][tour[i + 1]];
        }
        
        // Complete the cycle
        totalDistance += this.distanceMatrix[tour[tour.length - 1]][tour[0]];
        
        return totalDistance;
    }
    
    // Generate random initial tour
    generateRandomTour() {
        const tour = Array.from({ length: this.n }, (_, i) => i);
        
        // Fisher-Yates shuffle
        for (let i = tour.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tour[i], tour[j]] = [tour[j], tour[i]];
        }
        
        return tour;
    }
    
    // Generate neighbor using 2-opt swap
    twoOptSwap(tour) {
        const neighbor = [...tour];
        
        // Select two random positions
        let i = Math.floor(Math.random() * tour.length);
        let j = Math.floor(Math.random() * tour.length);
        
        // Ensure i < j
        if (i > j) {
            [i, j] = [j, i];
        }
        
        // Reverse segment between i and j
        while (i < j) {
            [neighbor[i], neighbor[j]] = [neighbor[j], neighbor[i]];
            i++;
            j--;
        }
        
        return neighbor;
    }
    
    // Generate neighbor using swap
    swapNeighbor(tour) {
        const neighbor = [...tour];
        
        const i = Math.floor(Math.random() * tour.length);
        const j = Math.floor(Math.random() * tour.length);
        
        [neighbor[i], neighbor[j]] = [neighbor[j], neighbor[i]];
        
        return neighbor;
    }
    
    // Generate neighbor using insertion
    insertionNeighbor(tour) {
        const neighbor = [...tour];
        
        const i = Math.floor(Math.random() * tour.length);
        const j = Math.floor(Math.random() * tour.length);
        
        // Remove element at i and insert at j
        const element = neighbor.splice(i, 1)[0];
        neighbor.splice(j, 0, element);
        
        return neighbor;
    }
    
    // Acceptance probability (Metropolis criterion)
    acceptanceProbability(currentCost, newCost, temperature) {
        if (newCost < currentCost) {
            return 1.0; // Always accept better solution
        }
        
        // Accept worse solution with probability
        return Math.exp(-(newCost - currentCost) / temperature);
    }
    
    // Geometric cooling schedule
    geometricCooling() {
        this.temperature *= this.coolingRate;
    }
    
    // Linear cooling schedule (alternative)
    linearCooling(initialTemp, finalTemp, iteration, maxIterations) {
        return initialTemp - ((initialTemp - finalTemp) * iteration / maxIterations);
    }
    
    // Exponential cooling schedule (alternative)
    exponentialCooling(initialTemp, alpha, iteration) {
        return initialTemp * Math.pow(alpha, iteration);
    }
    
    // Logarithmic cooling schedule (alternative)
    logarithmicCooling(initialTemp, iteration) {
        return initialTemp / Math.log(iteration + 2);
    }
    
    // Initialize the algorithm
    initialize() {
        this.currentSolution = this.generateRandomTour();
        this.currentCost = this.calculateTourDistance(this.currentSolution);
        this.bestSolution = [...this.currentSolution];
        this.bestCost = this.currentCost;
        this.temperature = this.initialTemperature;
        
        this.costHistory = [this.bestCost];
        this.temperatureHistory = [this.temperature];
        this.acceptanceHistory = [];
        this.iteration = 0;
        this.noImprovementCount = 0;
        this.totalAccepted = 0;
        this.totalRejected = 0;
    }
    
    // Apply cooling schedule
    applyCooling(iterationCount) {
        if (this.coolingSchedule === 'linear') {
            this.temperature = this.linearCooling(this.initialTemperature, this.finalTemperature, iterationCount, 50000);
        } else if (this.coolingSchedule === 'exponential') {
            this.temperature = this.exponentialCooling(this.initialTemperature, this.coolingRate, iterationCount);
        } else if (this.coolingSchedule === 'logarithmic') {
            this.temperature = this.logarithmicCooling(this.initialTemperature, iterationCount);
        } else {
            // Default: geometric
            this.geometricCooling();
        }
    }
    
    // Reheat if stagnating
    performReheating() {
        this.temperature = Math.min(this.temperature * 2, this.initialTemperature);
        this.noImprovementCount = 0;
    }
    
    // Check early stopping condition
    shouldStopEarly() {
        if (!this.earlyStopEnabled || this.costHistory.length < this.earlyStopWindow) {
            return false;
        }
        
        const recent = this.costHistory.slice(-this.earlyStopWindow);
        const improvement = (recent[0] - recent[recent.length - 1]) / recent[0];
        return improvement < this.earlyStopThreshold;
    }
    
    // Run one iteration
    iterate() {
        // Generate neighbor
        const neighbor = this.twoOptSwap(this.currentSolution);
        const neighborCost = this.calculateTourDistance(neighbor);
        
        // Calculate acceptance probability
        const acceptProb = this.acceptanceProbability(
            this.currentCost,
            neighborCost,
            this.temperature
        );
        
        // Decide whether to accept
        const accepted = Math.random() < acceptProb;
        
        if (accepted) {
            this.currentSolution = neighbor;
            this.currentCost = neighborCost;
            this.totalAccepted++;
            
            // Update best solution if improved
            if (neighborCost < this.bestCost) {
                this.bestSolution = [...neighbor];
                this.bestCost = neighborCost;
                this.noImprovementCount = 0;
            } else {
                this.noImprovementCount++;
            }
        } else {
            this.totalRejected++;
            this.noImprovementCount++;
        }
        
        this.acceptanceHistory.push(accepted ? 1 : 0);
        this.iteration++;
        
        return accepted;
    }
    
    // Run the SA algorithm
    async run(callback = null) {
        this.initialize();
        
        let iterationCount = 0;
        const maxIterations = 50000; // Safety limit
        
        while (this.temperature > this.finalTemperature && iterationCount < maxIterations) {
            // Perform iterations at current temperature
            for (let i = 0; i < this.iterationsPerTemp; i++) {
                this.iterate();
                iterationCount++;
                
                // Callback for visualization
                if (callback && iterationCount % 100 === 0) {
                    await callback({
                        iteration: iterationCount,
                        temperature: this.temperature,
                        currentCost: this.currentCost,
                        bestCost: this.bestCost,
                        bestTour: this.bestSolution
                    });
                }
            }
            
            // Record history
            this.costHistory.push(this.bestCost);
            this.temperatureHistory.push(this.temperature);
            
            // Check for reheating
            if (this.reheating && this.noImprovementCount >= this.reheatThreshold) {
                this.performReheating();
            }
            
            // Check early stopping
            if (this.shouldStopEarly()) {
                console.log(`Early stopping at iteration ${iterationCount}`);
                break;
            }
            
            // Apply cooling schedule
            this.applyCooling(iterationCount);
        }
        
        const acceptanceRate = this.totalAccepted / (this.totalAccepted + this.totalRejected);
        
        return {
            bestTour: this.bestSolution,
            bestDistance: this.bestCost,
            costHistory: this.costHistory,
            temperatureHistory: this.temperatureHistory,
            acceptanceHistory: this.acceptanceHistory,
            iterations: iterationCount,
            acceptanceRate: acceptanceRate,
            finalTemperature: this.temperature
        };
    }
    
    // Get current best solution
    getBestSolution() {
        return {
            tour: this.bestSolution,
            distance: this.bestCost,
            costHistory: this.costHistory,
            temperatureHistory: this.temperatureHistory,
            acceptanceHistory: this.acceptanceHistory
        };
    }
    
    // Get acceptance rate
    getAcceptanceRate() {
        if (this.acceptanceHistory.length === 0) return 0;
        
        const accepted = this.acceptanceHistory.filter(x => x === 1).length;
        return (accepted / this.acceptanceHistory.length) * 100;
    }
}
