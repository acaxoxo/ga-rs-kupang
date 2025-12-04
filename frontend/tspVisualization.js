// TSP Visualization untuk menampilkan tour cycle dan konvergensi algoritma
// Mendukung GA, SA, dan DE

class TSPVisualizer {
    constructor(canvasId, hospitals, distMatrix) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.hospitals = hospitals;
        this.distMatrix = distMatrix;
        this.currentTour = null;
        this.currentDistance = 0;
        
        this.initCanvas();
    }
    
    initCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }
    
    // Draw TSP tour on map coordinates
    drawTour(tour, distance, algorithm = 'GA') {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!tour || tour.length === 0) {
            this.ctx.fillStyle = '#6c757d';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Belum ada tour yang dihitung', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        
        // Title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Tour Optimal - ${algorithm}`, this.canvas.width / 2, 30);
        
        // Distance info
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Total Jarak: ${(distance / 1000).toFixed(2)} km`, this.canvas.width / 2, 55);
        
        // Scale hospitals to canvas
        const margin = 80;
        const drawWidth = this.canvas.width - 2 * margin;
        const drawHeight = this.canvas.height - 2 * margin - 60; // Extra space for title
        
        // Get lat/lng bounds
        const lats = this.hospitals.map(h => h.lat);
        const lngs = this.hospitals.map(h => h.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        // Scale function
        const scaleX = (lng) => margin + ((lng - minLng) / (maxLng - minLng)) * drawWidth;
        const scaleY = (lat) => margin + 60 + ((maxLat - lat) / (maxLat - minLat)) * drawHeight;
        
        // Draw tour edges
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);
        
        this.ctx.beginPath();
        for (let i = 0; i < tour.length; i++) {
            const currentIdx = tour[i];
            const nextIdx = tour[(i + 1) % tour.length];
            
            const current = this.hospitals[currentIdx];
            const next = this.hospitals[nextIdx];
            
            const x1 = scaleX(current.lng);
            const y1 = scaleY(current.lat);
            const x2 = scaleX(next.lng);
            const y2 = scaleY(next.lat);
            
            if (i === 0) {
                this.ctx.moveTo(x1, y1);
            }
            this.ctx.lineTo(x2, y2);
            
            // Draw arrow
            this.drawArrow(x1, y1, x2, y2, '#c0392b');
        }
        this.ctx.stroke();
        
        // Draw hospitals
        tour.forEach((idx, tourIdx) => {
            const hospital = this.hospitals[idx];
            const x = scaleX(hospital.lng);
            const y = scaleY(hospital.lat);
            
            // Node circle
            const isStart = tourIdx === 0;
            this.ctx.fillStyle = isStart ? '#27ae60' : '#3498db';
            this.ctx.beginPath();
            this.ctx.arc(x, y, isStart ? 12 : 10, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Tour order number
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText((tourIdx + 1).toString(), x, y + 3);
        });
        
        // Legend
        this.drawTourLegend();
    }
    
    drawArrow(fromX, fromY, toX, toY, color) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 10;
        
        const arrowX = fromX + (toX - fromX) * 0.6;
        const arrowY = fromY + (toY - fromY) * 0.6;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
            arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
            arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawTourLegend() {
        const legendX = 20;
        const legendY = this.canvas.height - 50;
        
        // Start node
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.arc(legendX, legendY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('RS Awal/Akhir', legendX + 15, legendY + 4);
        
        // Other nodes
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.arc(legendX + 150, legendY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillText('RS Lainnya', legendX + 165, legendY + 4);
    }
}

// Convergence Chart Visualizer
class ConvergenceChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.avgData = [];
        this.title = 'Convergence Chart';
        
        this.initCanvas();
    }
    
    initCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 400;
    }
    
    // Update chart data
    updateData(fitnessHistory, avgFitnessHistory = null, title = 'Convergence Chart') {
        this.data = fitnessHistory;
        this.avgData = avgFitnessHistory;
        this.title = title;
        this.draw();
    }
    
    // Draw the convergence chart
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.data || this.data.length === 0) {
            this.ctx.fillStyle = '#6c757d';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Belum ada data konvergensi', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        
        // Title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.title, this.canvas.width / 2, 25);
        
        // Chart area
        const margin = { top: 50, right: 40, bottom: 50, left: 70 };
        const chartWidth = this.canvas.width - margin.left - margin.right;
        const chartHeight = this.canvas.height - margin.top - margin.bottom;
        
        // Get data range
        const maxValue = Math.max(...this.data);
        const minValue = Math.min(...this.data);
        const valueRange = maxValue - minValue;
        
        // Scale functions
        const scaleX = (index) => margin.left + (index / (this.data.length - 1)) * chartWidth;
        const scaleY = (value) => margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        
        // Draw grid
        this.drawGrid(margin, chartWidth, chartHeight, minValue, maxValue);
        
        // Draw average fitness line (if available)
        if (this.avgData && this.avgData.length > 0) {
            this.ctx.strokeStyle = '#95a5a6';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            
            this.avgData.forEach((value, index) => {
                const x = scaleX(index);
                const y = scaleY(value);
                
                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Draw best fitness line
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        this.data.forEach((value, index) => {
            const x = scaleX(index);
            const y = scaleY(value);
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // Draw axes labels
        this.drawAxisLabels(margin, chartWidth, chartHeight, minValue, maxValue);
        
        // Draw legend
        this.drawLegend(margin);
    }
    
    drawGrid(margin, width, height, minValue, maxValue) {
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        const numHLines = 5;
        for (let i = 0; i <= numHLines; i++) {
            const y = margin.top + (height / numHLines) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(margin.left, y);
            this.ctx.lineTo(margin.left + width, y);
            this.ctx.stroke();
        }
        
        // Vertical grid lines
        const numVLines = 10;
        for (let i = 0; i <= numVLines; i++) {
            const x = margin.left + (width / numVLines) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, margin.top);
            this.ctx.lineTo(x, margin.top + height);
            this.ctx.stroke();
        }
        
        // Border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(margin.left, margin.top, width, height);
    }
    
    drawAxisLabels(margin, width, height, minValue, maxValue) {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px Arial';
        
        // Y-axis label
        this.ctx.save();
        this.ctx.translate(15, margin.top + height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Jarak (meter)', 0, 0);
        this.ctx.restore();
        
        // Y-axis values
        const numYLabels = 5;
        this.ctx.textAlign = 'right';
        for (let i = 0; i <= numYLabels; i++) {
            const value = maxValue - ((maxValue - minValue) / numYLabels) * i;
            const y = margin.top + (height / numYLabels) * i;
            this.ctx.fillText((value / 1000).toFixed(1) + ' km', margin.left - 10, y + 4);
        }
        
        // X-axis label
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Generasi / Iterasi', margin.left + width / 2, this.canvas.height - 10);
        
        // X-axis values
        const numXLabels = 10;
        for (let i = 0; i <= numXLabels; i++) {
            const value = Math.floor((this.data.length / numXLabels) * i);
            const x = margin.left + (width / numXLabels) * i;
            this.ctx.fillText(value.toString(), x, this.canvas.height - margin.bottom + 20);
        }
    }
    
    drawLegend(margin) {
        const legendX = margin.left + 20;
        const legendY = margin.top + 20;
        
        // Best fitness line
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY);
        this.ctx.lineTo(legendX + 30, legendY);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Best Fitness', legendX + 40, legendY + 4);
        
        // Average fitness line (if available)
        if (this.avgData && this.avgData.length > 0) {
            this.ctx.strokeStyle = '#95a5a6';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(legendX, legendY + 20);
            this.ctx.lineTo(legendX + 30, legendY + 20);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            this.ctx.fillText('Avg Fitness', legendX + 40, legendY + 24);
        }
    }
}
