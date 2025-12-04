// DE Web Worker
importScripts('../differentialEvolution.js');

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    if (type === 'run') {
        const { distanceMatrix, hospitals, parameters } = data;
        
        const de = new DifferentialEvolution(distanceMatrix, hospitals);
        de.setParameters(parameters);
        
        // Run DE with progress reporting
        const originalRun = de.run.bind(de);
        de.run = async function(callback) {
            de.initializePopulation();
            
            for (let gen = 0; gen < de.generations; gen++) {
                de.evolveGeneration();
                
                if (gen % 10 === 0) {
                    self.postMessage({
                        type: 'progress',
                        data: {
                            generation: gen,
                            bestFitness: de.bestFitness,
                            avgFitness: de.getAverageFitness(),
                            bestTour: de.bestSolution
                        }
                    });
                }
            }
            
            return {
                bestTour: de.bestSolution,
                bestDistance: de.bestFitness,
                fitnessHistory: de.fitnessHistory,
                avgFitnessHistory: de.avgFitnessHistory,
                generations: de.generations
            };
        };
        
        de.run().then(result => {
            self.postMessage({
                type: 'complete',
                data: result
            });
        }).catch(error => {
            self.postMessage({
                type: 'error',
                data: error.message
            });
        });
    }
};
