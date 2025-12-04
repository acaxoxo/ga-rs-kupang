// Genetic Algorithm (GA) untuk Travelling Salesman Problem (TSP)
// Optimasi rute kunjungan semua rumah sakit dengan jarak minimum

class GeneticAlgorithm {
    constructor(distanceMatrix, hospitals) {
        this.distanceMatrix = distanceMatrix;
        this.hospitals = hospitals;
        this.n = hospitals.length;
        
        // Parameter GA
        this.populationSize = 100;
        this.generations = 500;
        this.mutationRate = 0.02;
        this.crossoverRate = 0.8;
        this.elitismCount = 2;
        this.tournamentSize = 5;
        
        // Advanced Parameters
        this.adaptiveMutation = false;
        this.localSearchProb = 0.1;
        this.diversityThreshold = 0.1;
        this.stagnationLimit = 50;
        this.selectionMethod = 'tournament'; // tournament, roulette, rank
        this.crossoverMethod = 'ox'; // ox, pmx, erx
        this.mutationMethod = 'swap'; // swap, inversion, scramble
        
        // State
        this.population = [];
        this.bestSolution = null;
        this.bestFitness = Infinity;
        this.worstFitness = -Infinity;
        this.fitnessHistory = [];
        this.avgFitnessHistory = [];
        this.diversityHistory = [];
        this.currentGeneration = 0;
        this.stagnationCounter = 0;
        this.lastBestFitness = Infinity;
        
        // Statistics
        this.stats = {
            totalCrossovers: 0,
            totalMutations: 0,
            totalLocalSearches: 0,
            convergenceGeneration: null,
            diversityRestarts: 0
        };
    }
    
    // Set custom parameters
    setParameters(params) {
        if (params.populationSize) this.populationSize = params.populationSize;
        if (params.generations) this.generations = params.generations;
        if (params.mutationRate) this.mutationRate = params.mutationRate;
        if (params.crossoverRate) this.crossoverRate = params.crossoverRate;
        if (params.elitismCount) this.elitismCount = params.elitismCount;
        if (params.tournamentSize) this.tournamentSize = params.tournamentSize;
        if (params.adaptiveMutation !== undefined) this.adaptiveMutation = params.adaptiveMutation;
        if (params.localSearchProb) this.localSearchProb = params.localSearchProb;
        if (params.diversityThreshold) this.diversityThreshold = params.diversityThreshold;
        if (params.stagnationLimit) this.stagnationLimit = params.stagnationLimit;
        if (params.selectionMethod) this.selectionMethod = params.selectionMethod;
        if (params.crossoverMethod) this.crossoverMethod = params.crossoverMethod;
        if (params.mutationMethod) this.mutationMethod = params.mutationMethod;
    }
    
    // Calculate diversity of population (genetic diversity)
    calculateDiversity() {
        if (this.population.length === 0) return 0;
        
        let totalDiversity = 0;
        const sampleSize = Math.min(20, this.population.length);
        
        for (let i = 0; i < sampleSize; i++) {
            for (let j = i + 1; j < sampleSize; j++) {
                const tour1 = this.population[i].tour;
                const tour2 = this.population[j].tour;
                
                // Count different positions
                let differences = 0;
                for (let k = 0; k < tour1.length; k++) {
                    if (tour1[k] !== tour2[k]) differences++;
                }
                
                totalDiversity += differences / tour1.length;
            }
        }
        
        const pairs = (sampleSize * (sampleSize - 1)) / 2;
        return pairs > 0 ? totalDiversity / pairs : 0;
    }
    
    // Adaptive mutation rate based on diversity
    getAdaptiveMutationRate() {
        if (!this.adaptiveMutation) return this.mutationRate;
        
        const diversity = this.calculateDiversity();
        
        // Increase mutation if diversity is low
        if (diversity < this.diversityThreshold) {
            return Math.min(this.mutationRate * 2, 0.5);
        }
        
        return this.mutationRate;
    }
    
    // 2-opt local search improvement
    twoOptImprovement(tour) {
        let improved = [...tour];
        let bestDistance = this.calculateTourDistance(improved);
        let improvement = true;
        
        while (improvement) {
            improvement = false;
            
            for (let i = 0; i < improved.length - 1; i++) {
                for (let j = i + 2; j < improved.length; j++) {
                    // Reverse segment between i and j
                    const newTour = [...improved];
                    let left = i + 1;
                    let right = j;
                    
                    while (left < right) {
                        [newTour[left], newTour[right]] = [newTour[right], newTour[left]];
                        left++;
                        right--;
                    }
                    
                    const newDistance = this.calculateTourDistance(newTour);
                    
                    if (newDistance < bestDistance) {
                        improved = newTour;
                        bestDistance = newDistance;
                        improvement = true;
                        this.stats.totalLocalSearches++;
                        break;
                    }
                }
                
                if (improvement) break;
            }
        }
        
        return improved;
    }
    
    // Greedy initialization (nearest neighbor heuristic)
    generateGreedyTour(startCity = 0) {
        const tour = [startCity];
        const unvisited = new Set(Array.from({ length: this.n }, (_, i) => i));
        unvisited.delete(startCity);
        
        let currentCity = startCity;
        
        while (unvisited.size > 0) {
            let nearestCity = -1;
            let minDistance = Infinity;
            
            for (const city of unvisited) {
                const distance = this.distanceMatrix[currentCity][city];
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestCity = city;
                }
            }
            
            tour.push(nearestCity);
            unvisited.delete(nearestCity);
            currentCity = nearestCity;
        }
        
        return tour;
    }
    
    // Roulette wheel selection (fitness proportionate)
    rouletteWheelSelection() {
        // Convert to maximization (invert fitness)
        const maxFitness = Math.max(...this.population.map(ind => ind.fitness));
        const fitnessValues = this.population.map(ind => maxFitness - ind.fitness + 1);
        const totalFitness = fitnessValues.reduce((sum, f) => sum + f, 0);
        
        let randomValue = Math.random() * totalFitness;
        let sum = 0;
        
        for (let i = 0; i < this.population.length; i++) {
            sum += fitnessValues[i];
            if (sum >= randomValue) {
                return this.population[i];
            }
        }
        
        return this.population[this.population.length - 1];
    }
    
    // Rank-based selection
    rankSelection() {
        const sorted = [...this.population].sort((a, b) => a.fitness - b.fitness);
        const n = sorted.length;
        const ranks = Array.from({ length: n }, (_, i) => n - i);
        const totalRank = (n * (n + 1)) / 2;
        
        let randomValue = Math.random() * totalRank;
        let sum = 0;
        
        for (let i = 0; i < n; i++) {
            sum += ranks[i];
            if (sum >= randomValue) {
                return sorted[i];
            }
        }
        
        return sorted[n - 1];
    }
    
    // Edge recombination crossover (ERX)
    edgeRecombinationCrossover(parent1, parent2) {
        const size = parent1.length;
        const offspring = [];
        
        // Build edge table
        const edgeTable = new Map();
        
        for (let i = 0; i < size; i++) {
            const city = parent1[i];
            const edges = new Set();
            
            // Add edges from parent1
            const prev1 = parent1[(i - 1 + size) % size];
            const next1 = parent1[(i + 1) % size];
            edges.add(prev1);
            edges.add(next1);
            
            // Add edges from parent2
            const idx2 = parent2.indexOf(city);
            const prev2 = parent2[(idx2 - 1 + size) % size];
            const next2 = parent2[(idx2 + 1) % size];
            edges.add(prev2);
            edges.add(next2);
            
            edgeTable.set(city, edges);
        }
        
        // Start with random city
        let current = parent1[0];
        offspring.push(current);
        
        while (offspring.length < size) {
            // Remove current from all edge lists
            for (const edges of edgeTable.values()) {
                edges.delete(current);
            }
            
            const edges = edgeTable.get(current);
            
            if (edges && edges.size > 0) {
                // Choose city with fewest edges
                let minEdges = Infinity;
                let nextCity = -1;
                
                for (const city of edges) {
                    if (!offspring.includes(city)) {
                        const cityEdges = edgeTable.get(city);
                        if (cityEdges.size < minEdges) {
                            minEdges = cityEdges.size;
                            nextCity = city;
                        }
                    }
                }
                
                if (nextCity !== -1) {
                    current = nextCity;
                } else {
                    // Pick random unvisited city
                    const unvisited = Array.from({ length: size }, (_, i) => i)
                        .filter(c => !offspring.includes(c));
                    current = unvisited[Math.floor(Math.random() * unvisited.length)];
                }
            } else {
                // Pick random unvisited city
                const unvisited = Array.from({ length: size }, (_, i) => i)
                    .filter(c => !offspring.includes(c));
                current = unvisited[Math.floor(Math.random() * unvisited.length)];
            }
            
            offspring.push(current);
        }
        
        return offspring;
    }
    
    // Restart population if stagnation detected
    restartPopulation() {
        console.log(`Diversity restart at generation ${this.currentGeneration}`);
        
        // Keep elite individuals
        const sortedPop = [...this.population].sort((a, b) => a.fitness - b.fitness);
        const elites = sortedPop.slice(0, this.elitismCount);
        
        // Generate new random population
        this.population = [...elites];
        
        while (this.population.length < this.populationSize) {
            const tour = this.generateRandomTour();
            const fitness = this.calculateTourDistance(tour);
            this.population.push({ tour, fitness });
        }
        
        this.stats.diversityRestarts++;
        this.stagnationCounter = 0;
    }
    
    // Calculate total distance of a tour (fitness function)
    calculateTourDistance(tour) {
        let totalDistance = 0;
        
        // Sum distances between consecutive cities
        for (let i = 0; i < tour.length - 1; i++) {
            totalDistance += this.distanceMatrix[tour[i]][tour[i + 1]];
        }
        
        // Add distance from last city back to first (complete cycle)
        totalDistance += this.distanceMatrix[tour[tour.length - 1]][tour[0]];
        
        return totalDistance;
    }
    
    // Generate random tour (permutation of city indices)
    generateRandomTour() {
        const tour = Array.from({ length: this.n }, (_, i) => i);
        
        // Fisher-Yates shuffle
        for (let i = tour.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tour[i], tour[j]] = [tour[j], tour[i]];
        }
        
        return tour;
    }
    
    // Initialize population with random tours
    initializePopulation() {
        this.population = [];
        
        // Add some greedy solutions for better initial population
        const greedyCount = Math.floor(this.populationSize * 0.2);
        for (let i = 0; i < greedyCount; i++) {
            const startCity = i % this.n;
            const tour = this.generateGreedyTour(startCity);
            const fitness = this.calculateTourDistance(tour);
            
            this.population.push({
                tour: tour,
                fitness: fitness
            });
            
            // Track best solution
            if (fitness < this.bestFitness) {
                this.bestFitness = fitness;
                this.bestSolution = [...tour];
            }
        }
        
        // Fill rest with random tours
        for (let i = greedyCount; i < this.populationSize; i++) {
            const tour = this.generateRandomTour();
            const fitness = this.calculateTourDistance(tour);
            
            this.population.push({
                tour: tour,
                fitness: fitness
            });
            
            // Track best solution
            if (fitness < this.bestFitness) {
                this.bestFitness = fitness;
                this.bestSolution = [...tour];
            }
        }
        
        // Update worst fitness for statistics
        this.worstFitness = Math.max(...this.population.map(ind => ind.fitness));
        
        this.fitnessHistory.push(this.bestFitness);
        this.avgFitnessHistory.push(this.getAverageFitness());
        this.diversityHistory.push(this.calculateDiversity());
    }
    
    // Get average fitness of population
    getAverageFitness() {
        const sum = this.population.reduce((acc, ind) => acc + ind.fitness, 0);
        return sum / this.population.length;
    }
    
    // Tournament selection
    tournamentSelection() {
        let best = null;
        
        for (let i = 0; i < this.tournamentSize; i++) {
            const randomIdx = Math.floor(Math.random() * this.population.length);
            const candidate = this.population[randomIdx];
            
            if (best === null || candidate.fitness < best.fitness) {
                best = candidate;
            }
        }
        
        return best;
    }
    
    // Order Crossover (OX)
    orderCrossover(parent1, parent2) {
        const size = parent1.length;
        
        // Select random crossover points
        let point1 = Math.floor(Math.random() * size);
        let point2 = Math.floor(Math.random() * size);
        
        if (point1 > point2) {
            [point1, point2] = [point2, point1];
        }
        
        // Create offspring
        const offspring = new Array(size).fill(-1);
        
        // Copy segment from parent1
        for (let i = point1; i <= point2; i++) {
            offspring[i] = parent1[i];
        }
        
        // Fill remaining positions from parent2
        let currentPos = (point2 + 1) % size;
        let parent2Pos = (point2 + 1) % size;
        
        while (offspring.includes(-1)) {
            const gene = parent2[parent2Pos];
            
            if (!offspring.includes(gene)) {
                offspring[currentPos] = gene;
                currentPos = (currentPos + 1) % size;
            }
            
            parent2Pos = (parent2Pos + 1) % size;
        }
        
        return offspring;
    }
    
    // Partially Mapped Crossover (PMX) - Alternative
    pmxCrossover(parent1, parent2) {
        const size = parent1.length;
        const offspring = new Array(size).fill(-1);
        
        // Select crossover points
        let point1 = Math.floor(Math.random() * size);
        let point2 = Math.floor(Math.random() * size);
        
        if (point1 > point2) {
            [point1, point2] = [point2, point1];
        }
        
        // Copy segment from parent1
        for (let i = point1; i <= point2; i++) {
            offspring[i] = parent1[i];
        }
        
        // Map remaining genes from parent2
        for (let i = 0; i < size; i++) {
            if (i >= point1 && i <= point2) continue;
            
            let gene = parent2[i];
            
            // Check if gene already exists in offspring
            while (offspring.includes(gene)) {
                const idx = parent2.indexOf(gene);
                gene = parent1[idx];
            }
            
            offspring[i] = gene;
        }
        
        return offspring;
    }
    
    // Swap mutation (exchange two random cities)
    swapMutation(tour) {
        const mutated = [...tour];
        
        const idx1 = Math.floor(Math.random() * tour.length);
        const idx2 = Math.floor(Math.random() * tour.length);
        
        [mutated[idx1], mutated[idx2]] = [mutated[idx2], mutated[idx1]];
        
        return mutated;
    }
    
    // Inversion mutation (reverse a random segment)
    inversionMutation(tour) {
        const mutated = [...tour];
        
        let point1 = Math.floor(Math.random() * tour.length);
        let point2 = Math.floor(Math.random() * tour.length);
        
        if (point1 > point2) {
            [point1, point2] = [point2, point1];
        }
        
        // Reverse segment
        while (point1 < point2) {
            [mutated[point1], mutated[point2]] = [mutated[point2], mutated[point1]];
            point1++;
            point2--;
        }
        
        return mutated;
    }
    
    // Scramble mutation (shuffle a random segment)
    scrambleMutation(tour) {
        const mutated = [...tour];
        
        let point1 = Math.floor(Math.random() * tour.length);
        let point2 = Math.floor(Math.random() * tour.length);
        
        if (point1 > point2) {
            [point1, point2] = [point2, point1];
        }
        
        // Extract segment
        const segment = mutated.slice(point1, point2 + 1);
        
        // Shuffle segment (Fisher-Yates)
        for (let i = segment.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [segment[i], segment[j]] = [segment[j], segment[i]];
        }
        
        // Put back shuffled segment
        for (let i = point1; i <= point2; i++) {
            mutated[i] = segment[i - point1];
        }
        
        return mutated;
    }
    
    // Evolve population for one generation
    evolveGeneration() {
        const newPopulation = [];
        
        // Elitism: keep best individuals
        const sortedPop = [...this.population].sort((a, b) => a.fitness - b.fitness);
        for (let i = 0; i < this.elitismCount; i++) {
            newPopulation.push({
                tour: [...sortedPop[i].tour],
                fitness: sortedPop[i].fitness
            });
        }
        
        // Get adaptive mutation rate
        const currentMutationRate = this.getAdaptiveMutationRate();
        
        // Generate offspring
        while (newPopulation.length < this.populationSize) {
            // Selection (configurable method)
            let parent1, parent2;
            if (this.selectionMethod === 'roulette') {
                parent1 = this.rouletteWheelSelection();
                parent2 = this.rouletteWheelSelection();
            } else if (this.selectionMethod === 'rank') {
                parent1 = this.rankSelection();
                parent2 = this.rankSelection();
            } else {
                parent1 = this.tournamentSelection();
                parent2 = this.tournamentSelection();
            }
            
            let offspring;
            
            // Crossover (configurable method)
            if (Math.random() < this.crossoverRate) {
                if (this.crossoverMethod === 'pmx') {
                    offspring = this.pmxCrossover(parent1.tour, parent2.tour);
                } else if (this.crossoverMethod === 'erx') {
                    offspring = this.edgeRecombinationCrossover(parent1.tour, parent2.tour);
                } else {
                    offspring = this.orderCrossover(parent1.tour, parent2.tour);
                }
                this.stats.totalCrossovers++;
            } else {
                offspring = [...parent1.tour];
            }
            
            // Mutation with adaptive rate (configurable method)
            if (Math.random() < currentMutationRate) {
                if (this.mutationMethod === 'inversion') {
                    offspring = this.inversionMutation(offspring);
                } else if (this.mutationMethod === 'scramble') {
                    offspring = this.scrambleMutation(offspring);
                } else {
                    offspring = this.swapMutation(offspring);
                }
                this.stats.totalMutations++;
            }
            
            // Local search with probability
            if (Math.random() < this.localSearchProb) {
                offspring = this.twoOptImprovement(offspring);
            }
            
            // Add to new population
            const fitness = this.calculateTourDistance(offspring);
            newPopulation.push({
                tour: offspring,
                fitness: fitness
            });
            
            // Update best solution
            if (fitness < this.bestFitness) {
                this.bestFitness = fitness;
                this.bestSolution = [...offspring];
                this.stagnationCounter = 0;
            }
        }
        
        this.population = newPopulation;
        this.currentGeneration++;
        
        // Check for stagnation
        if (this.bestFitness === this.lastBestFitness) {
            this.stagnationCounter++;
        } else {
            this.stagnationCounter = 0;
        }
        this.lastBestFitness = this.bestFitness;
        
        // Restart if stagnated
        const diversity = this.calculateDiversity();
        if (this.stagnationCounter >= this.stagnationLimit && diversity < this.diversityThreshold) {
            this.restartPopulation();
        }
        
        // Update worst fitness
        this.worstFitness = Math.max(...this.population.map(ind => ind.fitness));
        
        // Track fitness and diversity history
        this.fitnessHistory.push(this.bestFitness);
        this.avgFitnessHistory.push(this.getAverageFitness());
        this.diversityHistory.push(diversity);
        
        // Detect convergence
        if (!this.stats.convergenceGeneration && this.bestFitness > 0) {
            const improvement = (this.fitnessHistory[0] - this.bestFitness) / this.fitnessHistory[0];
            if (improvement > 0.9) { // 90% improvement
                this.stats.convergenceGeneration = this.currentGeneration;
            }
        }
    }
    
    // Run the GA
    async run(callback = null) {
        const startTime = performance.now();
        this.initializePopulation();
        
        for (let gen = 0; gen < this.generations; gen++) {
            this.evolveGeneration();
            
            // Callback for visualization updates
            if (callback && gen % 10 === 0) {
                await callback({
                    generation: gen,
                    bestFitness: this.bestFitness,
                    worstFitness: this.worstFitness,
                    avgFitness: this.getAverageFitness(),
                    diversity: this.diversityHistory[this.diversityHistory.length - 1],
                    bestTour: this.bestSolution,
                    progress: (gen / this.generations) * 100
                });
            }
        }
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        return {
            bestTour: this.bestSolution,
            bestDistance: this.bestFitness,
            worstDistance: this.fitnessHistory[0], // Initial worst
            fitnessHistory: this.fitnessHistory,
            avgFitnessHistory: this.avgFitnessHistory,
            diversityHistory: this.diversityHistory,
            generations: this.generations,
            executionTime: executionTime,
            stats: {
                ...this.stats,
                improvementPercent: ((this.fitnessHistory[0] - this.bestFitness) / this.fitnessHistory[0] * 100).toFixed(2),
                finalDiversity: this.diversityHistory[this.diversityHistory.length - 1].toFixed(4),
                convergenceGeneration: this.stats.convergenceGeneration || this.generations
            }
        };
    }
    
    // Get current best solution
    getBestSolution() {
        return {
            tour: this.bestSolution,
            distance: this.bestFitness,
            fitnessHistory: this.fitnessHistory,
            avgFitnessHistory: this.avgFitnessHistory,
            diversityHistory: this.diversityHistory,
            stats: this.stats
        };
    }
    
    // Get detailed statistics
    getStatistics() {
        const fitness = this.population.map(ind => ind.fitness);
        const mean = this.getAverageFitness();
        const variance = fitness.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / fitness.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            generation: this.currentGeneration,
            bestFitness: this.bestFitness,
            worstFitness: this.worstFitness,
            avgFitness: mean,
            stdDev: stdDev,
            diversity: this.calculateDiversity(),
            populationSize: this.population.length,
            stagnationCounter: this.stagnationCounter,
            totalCrossovers: this.stats.totalCrossovers,
            totalMutations: this.stats.totalMutations,
            totalLocalSearches: this.stats.totalLocalSearches,
            diversityRestarts: this.stats.diversityRestarts
        };
    }
    
    // Reset algorithm
    reset() {
        this.population = [];
        this.bestSolution = null;
        this.bestFitness = Infinity;
        this.worstFitness = -Infinity;
        this.fitnessHistory = [];
        this.avgFitnessHistory = [];
        this.diversityHistory = [];
        this.currentGeneration = 0;
        this.stagnationCounter = 0;
        this.lastBestFitness = Infinity;
        this.stats = {
            totalCrossovers: 0,
            totalMutations: 0,
            totalLocalSearches: 0,
            convergenceGeneration: null,
            diversityRestarts: 0
        };
    }
}
