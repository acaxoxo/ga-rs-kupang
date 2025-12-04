// GA Web Worker
importScripts('../geneticAlgorithm.js');

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    if (type === 'run') {
        const { distanceMatrix, hospitals, parameters } = data;
        
        const ga = new GeneticAlgorithm(distanceMatrix, hospitals);
        ga.setParameters(parameters);
        
        // Override run to use postMessage for progress
        const originalRun = ga.run.bind(ga);
        ga.run = async function(callback) {
            ga.initializePopulation();
            
            for (let gen = 0; gen < ga.generations; gen++) {
                ga.evolveGeneration();
                
                if (gen % 10 === 0) {
                    self.postMessage({
                        type: 'progress',
                        data: {
                            generation: gen,
                            bestFitness: ga.bestFitness,
                            avgFitness: ga.getAverageFitness(),
                            diversity: ga.calculateDiversity(),
                            bestTour: ga.bestSolution
                        }
                    });
                }
            }
            
            return ga.getBestSolution();
        };
        
        ga.run().then(result => {
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
