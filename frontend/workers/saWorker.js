// SA Web Worker
importScripts('../simulatedAnnealing.js');

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    if (type === 'run') {
        const { distanceMatrix, hospitals, parameters } = data;
        
        const sa = new SimulatedAnnealing(distanceMatrix, hospitals);
        sa.setParameters(parameters);
        
        // Run SA with progress reporting
        const originalRun = sa.run.bind(sa);
        sa.run = async function(callback) {
            sa.initialize();
            
            let iterationCount = 0;
            const maxIterations = 50000;
            
            while (sa.temperature > sa.finalTemperature && iterationCount < maxIterations) {
                for (let i = 0; i < sa.iterationsPerTemp; i++) {
                    sa.iterate();
                    iterationCount++;
                    
                    if (iterationCount % 100 === 0) {
                        self.postMessage({
                            type: 'progress',
                            data: {
                                iteration: iterationCount,
                                temperature: sa.temperature,
                                currentCost: sa.currentCost,
                                bestCost: sa.bestCost,
                                bestTour: sa.bestSolution
                            }
                        });
                    }
                }
                
                sa.costHistory.push(sa.bestCost);
                sa.temperatureHistory.push(sa.temperature);
                
                if (sa.reheating && sa.noImprovementCount >= sa.reheatThreshold) {
                    sa.performReheating();
                }
                
                if (sa.shouldStopEarly()) {
                    break;
                }
                
                sa.applyCooling(iterationCount);
            }
            
            const acceptanceRate = sa.totalAccepted / (sa.totalAccepted + sa.totalRejected);
            
            return {
                bestTour: sa.bestSolution,
                bestDistance: sa.bestCost,
                costHistory: sa.costHistory,
                temperatureHistory: sa.temperatureHistory,
                acceptanceHistory: sa.acceptanceHistory,
                iterations: iterationCount,
                acceptanceRate: acceptanceRate,
                finalTemperature: sa.temperature
            };
        };
        
        sa.run().then(result => {
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
