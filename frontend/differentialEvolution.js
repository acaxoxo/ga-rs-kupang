// Differential Evolution (DE) untuk Travelling Salesman Problem (TSP)
// Evolution strategy dengan vektor diferensial

class DifferentialEvolution {
    constructor(distanceMatrix, hospitals) {
        this.distanceMatrix = distanceMatrix;
        this.hospitals = hospitals;
        this.n = hospitals.length;
        
        // Parameter DE
        this.populationSize = 100;
        this.generations = 500;
        this.F = 0.8;          // Mutation factor (scaling factor)
        this.CR = 0.9;         // Crossover probability
        this.strategy = 'rand/1'; // rand/1, best/1, current-to-best/1
        this.crossoverType = 'binomial'; // binomial, exponential
        this.selfAdaptive = false; // Enable self-adaptive F and CR (jDE)
        this.Fl = 0.1;         // Lower bound for F in self-adaptive
        this.Fu = 0.9;         // Upper bound for F in self-adaptive
        
        // State
        this.population = [];
        this.bestSolution = null;
        this.bestFitness = Infinity;
        this.fitnessHistory = [];
        this.avgFitnessHistory = [];
        this.currentGeneration = 0;
    }
    
    // Set custom parameters
    setParameters(params) {
        if (params.populationSize) this.populationSize = params.populationSize;
        if (params.generations) this.generations = params.generations;
        if (params.F) this.F = params.F;
        if (params.CR) this.CR = params.CR;
        if (params.strategy) this.strategy = params.strategy;
        if (params.crossoverType) this.crossoverType = params.crossoverType;
        if (params.selfAdaptive !== undefined) this.selfAdaptive = params.selfAdaptive;
        if (params.Fl) this.Fl = params.Fl;
        if (params.Fu) this.Fu = params.Fu;
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
    
    // Generate random tour
    generateRandomTour() {
        const tour = Array.from({ length: this.n }, (_, i) => i);
        
        // Fisher-Yates shuffle
        for (let i = tour.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tour[i], tour[j]] = [tour[j], tour[i]];
        }
        
        return tour;
    }
    
    // Initialize population
    initializePopulation() {
        this.population = [];
        
        for (let i = 0; i < this.populationSize; i++) {
            const tour = this.generateRandomTour();
            const fitness = this.calculateTourDistance(tour);
            
            this.population.push({
                tour: tour,
                fitness: fitness
            });
            
            if (fitness < this.bestFitness) {
                this.bestFitness = fitness;
                this.bestSolution = [...tour];
            }
        }
        
        this.fitnessHistory.push(this.bestFitness);
        this.avgFitnessHistory.push(this.getAverageFitness());
    }
    
    // Get average fitness
    getAverageFitness() {
        const sum = this.population.reduce((acc, ind) => acc + ind.fitness, 0);
        return sum / this.population.length;
    }
    
    // Select random individuals (excluding current)
    selectRandomIndividuals(currentIndex, count) {
        const indices = [];
        
        while (indices.length < count) {
            const randomIdx = Math.floor(Math.random() * this.populationSize);
            
            if (randomIdx !== currentIndex && !indices.includes(randomIdx)) {
                indices.push(randomIdx);
            }
        }
        
        return indices.map(idx => this.population[idx]);
    }
    
    // Convert tour to position-based representation for mutation
    tourToPositions(tour) {
        const positions = new Array(tour.length);
        const remaining = [...tour];
        
        for (let i = 0; i < tour.length; i++) {
            const city = tour[i];
            const pos = remaining.indexOf(city);
            positions[i] = pos;
            remaining.splice(pos, 1);
        }
        
        return positions;
    }
    
    // Convert position-based representation back to tour
    positionsToTour(positions) {
        const tour = [];
        const remaining = Array.from({ length: positions.length }, (_, i) => i);
        
        for (let i = 0; i < positions.length; i++) {
            const pos = Math.floor(positions[i]) % remaining.length;
            const city = remaining[pos];
            tour.push(city);
            remaining.splice(pos, 1);
        }
        
        return tour;
    }
    
    // Mutation: DE/rand/1
    mutationRand1(baseIdx) {
        const [r1, r2, r3] = this.selectRandomIndividuals(baseIdx, 3);
        
        // Convert to position vectors
        const pos1 = this.tourToPositions(r1.tour);
        const pos2 = this.tourToPositions(r2.tour);
        const pos3 = this.tourToPositions(r3.tour);
        
        // Mutant vector: v = r1 + F * (r2 - r3)
        const mutant = pos1.map((val, i) => {
            return val + this.F * (pos2[i] - pos3[i]);
        });
        
        return mutant;
    }
    
    // Mutation: DE/best/1
    mutationBest1(baseIdx) {
        const [r1, r2] = this.selectRandomIndividuals(baseIdx, 2);
        
        const posBest = this.tourToPositions(this.bestSolution);
        const pos1 = this.tourToPositions(r1.tour);
        const pos2 = this.tourToPositions(r2.tour);
        
        // Mutant vector: v = best + F * (r1 - r2)
        const mutant = posBest.map((val, i) => {
            return val + this.F * (pos1[i] - pos2[i]);
        });
        
        return mutant;
    }
    
    // Mutation: DE/current-to-best/1
    mutationCurrentToBest1(baseIdx, target) {
        const [r1, r2] = this.selectRandomIndividuals(baseIdx, 2);
        
        const posCurrent = this.tourToPositions(target);
        const posBest = this.tourToPositions(this.bestSolution);
        const pos1 = this.tourToPositions(r1.tour);
        const pos2 = this.tourToPositions(r2.tour);
        
        // Mutant vector: v = current + F * (best - current) + F * (r1 - r2)
        const mutant = posCurrent.map((val, i) => {
            return val + this.F * (posBest[i] - val) + this.F * (pos1[i] - pos2[i]);
        });
        
        return mutant;
    }
    
    // Binomial crossover
    binomialCrossover(target, mutant) {
        const trial = new Array(target.length);
        const jRand = Math.floor(Math.random() * target.length);
        
        const targetPos = this.tourToPositions(target);
        
        for (let i = 0; i < target.length; i++) {
            if (Math.random() < this.CR || i === jRand) {
                trial[i] = mutant[i];
            } else {
                trial[i] = targetPos[i];
            }
        }
        
        return trial;
    }
    
    // Exponential crossover
    exponentialCrossover(target, mutant) {
        const trial = this.tourToPositions(target);
        const n = target.length;
        const startIdx = Math.floor(Math.random() * n);
        
        let i = startIdx;
        let L = 0;
        
        do {
            trial[i] = mutant[i];
            i = (i + 1) % n;
            L++;
        } while (Math.random() < this.CR && L < n);
        
        return trial;
    }
    
    // Order-based crossover for TSP (alternative to position vectors)
    orderBasedCrossover(target, mutantIndividual) {
        const trial = [...target];
        const n = target.length;
        
        // Randomly select positions to inherit from mutant
        const inheritPositions = [];
        for (let i = 0; i < n; i++) {
            if (Math.random() < this.CR) {
                inheritPositions.push(i);
            }
        }
        
        if (inheritPositions.length === 0) {
            return trial; // Return target if no positions selected
        }
        
        // Get cities from mutant at selected positions
        const citiesToInherit = inheritPositions.map(pos => mutantIndividual[pos]);
        
        // Remove these cities from trial
        const filteredTrial = trial.filter(city => !citiesToInherit.includes(city));
        
        // Insert cities from mutant at their positions
        let filteredIdx = 0;
        const result = new Array(n);
        
        for (let i = 0; i < n; i++) {
            if (inheritPositions.includes(i)) {
                result[i] = mutantIndividual[i];
            } else {
                result[i] = filteredTrial[filteredIdx];
                filteredIdx++;
            }
        }
        
        return result;
    }
    
    // Repair tour to ensure it's a valid permutation
    repairTour(tour) {
        const seen = new Set();
        const missing = [];
        const duplicates = [];
        
        // Find duplicates and missing cities
        for (let i = 0; i < this.n; i++) {
            if (!tour.includes(i)) {
                missing.push(i);
            }
        }
        
        for (let i = 0; i < tour.length; i++) {
            if (seen.has(tour[i])) {
                duplicates.push(i);
            } else {
                seen.add(tour[i]);
            }
        }
        
        // Replace duplicates with missing cities
        const repaired = [...tour];
        for (let i = 0; i < duplicates.length; i++) {
            repaired[duplicates[i]] = missing[i];
        }
        
        return repaired;
    }
    
    // Evolve one generation
    evolveGeneration() {
        const newPopulation = [];
        
        for (let i = 0; i < this.populationSize; i++) {
            const target = this.population[i].tour;
            
            // Self-adaptive F and CR (jDE)
            let F = this.F;
            let CR = this.CR;
            if (this.selfAdaptive) {
                if (Math.random() < 0.1) {
                    F = this.Fl + Math.random() * (this.Fu - this.Fl);
                }
                if (Math.random() < 0.1) {
                    CR = Math.random();
                }
            }
            
            // Mutation (strategy selection)
            let mutantPositions;
            if (this.strategy === 'best/1') {
                mutantPositions = this.mutationBest1(i);
            } else if (this.strategy === 'current-to-best/1') {
                mutantPositions = this.mutationCurrentToBest1(i, target);
            } else {
                // Default: rand/1
                mutantPositions = this.mutationRand1(i);
            }
            
            // Crossover (type selection)
            let trialPositions;
            if (this.crossoverType === 'exponential') {
                trialPositions = this.exponentialCrossover(target, mutantPositions);
            } else {
                // Default: binomial
                trialPositions = this.binomialCrossover(target, mutantPositions);
            }
            
            // Convert back to tour
            let trial = this.positionsToTour(trialPositions);
            
            // Repair if needed
            trial = this.repairTour(trial);
            
            // Selection
            const trialFitness = this.calculateTourDistance(trial);
            
            if (trialFitness <= this.population[i].fitness) {
                newPopulation.push({
                    tour: trial,
                    fitness: trialFitness
                });
                
                if (trialFitness < this.bestFitness) {
                    this.bestFitness = trialFitness;
                    this.bestSolution = [...trial];
                }
            } else {
                newPopulation.push(this.population[i]);
            }
        }
        
        this.population = newPopulation;
        this.currentGeneration++;
        
        this.fitnessHistory.push(this.bestFitness);
        this.avgFitnessHistory.push(this.getAverageFitness());
    }
    
    // Run the DE algorithm
    async run(callback = null) {
        this.initializePopulation();
        
        for (let gen = 0; gen < this.generations; gen++) {
            this.evolveGeneration();
            
            if (callback && gen % 10 === 0) {
                await callback({
                    generation: gen,
                    bestFitness: this.bestFitness,
                    avgFitness: this.getAverageFitness(),
                    bestTour: this.bestSolution
                });
            }
        }
        
        return {
            bestTour: this.bestSolution,
            bestDistance: this.bestFitness,
            fitnessHistory: this.fitnessHistory,
            avgFitnessHistory: this.avgFitnessHistory,
            generations: this.generations
        };
    }
    
    // Get current best solution
    getBestSolution() {
        return {
            tour: this.bestSolution,
            distance: this.bestFitness,
            fitnessHistory: this.fitnessHistory,
            avgFitnessHistory: this.avgFitnessHistory
        };
    }
}
