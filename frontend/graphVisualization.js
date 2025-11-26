// Graph Visualization untuk Floyd-Warshall Algorithm
// Menampilkan graf berarah dengan node (RS) dan edge (jalur)

class GraphVisualizer {
    constructor(canvasId, hospitals, distMatrix) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.hospitals = hospitals;
        this.distMatrix = distMatrix;
        this.nodes = [];
        this.edges = [];
        this.selectedEdge = null;
        this.highlightedPath = [];
        
        this.initCanvas();
        this.createNodes();
        this.createEdges();
    }
    
    initCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = 220; // Radius lingkaran untuk meletakkan node
    }
    
    createNodes() {
        const n = this.hospitals.length;
        const angleStep = (2 * Math.PI) / n;
        
        this.hospitals.forEach((hospital, index) => {
            const angle = index * angleStep - Math.PI / 2; // Mulai dari atas
            const x = this.centerX + this.radius * Math.cos(angle);
            const y = this.centerY + this.radius * Math.sin(angle);
            
            this.nodes.push({
                id: hospital.id,
                name: hospital.name,
                type: hospital.type,
                roadClass: hospital.road_class,
                x: x,
                y: y,
                radius: 25,
                color: this.getNodeColor(hospital.road_class)
            });
        });
    }
    
    getNodeColor(roadClass) {
        const colors = {
            'arteri_primer': '#e74c3c',     // Merah - RS di jalan utama
            'arteri_sekunder': '#f39c12',   // Orange - RS di jalan sekunder
            'jalan_lokal': '#3498db'        // Biru - RS di jalan lokal
        };
        return colors[roadClass] || '#95a5a6';
    }
    
    getEdgeColor(roadClass) {
        const colors = {
            'arteri_primer': '#c0392b',
            'arteri_sekunder': '#d68910',
            'jalan_lokal': '#2980b9'
        };
        return colors[roadClass] || '#7f8c8d';
    }
    
    createEdges() {
        const n = this.hospitals.length;
        const threshold = 10000; // Hanya tampilkan edge jarak < 10km untuk clarity
        
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const dist = this.distMatrix[i][j];
                if (dist < threshold && dist > 0) {
                    // Tentukan road class edge berdasarkan node tujuan
                    const roadClass = this.hospitals[j].road_class;
                    
                    this.edges.push({
                        from: i,
                        to: j,
                        distance: dist,
                        weight: Math.round(dist / 100) / 10, // km dengan 1 desimal
                        roadClass: roadClass,
                        color: this.getEdgeColor(roadClass)
                    });
                }
            }
        }
    }
    
    draw(mode = 'default') {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Judul
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Graf Berarah - Jaringan Rumah Sakit Kupang', this.centerX, 30);
        
        if (mode === 'default') {
            this.drawEdges();
        } else if (mode === 'weighted') {
            this.drawWeightedEdges();
        } else if (mode === 'path') {
            this.drawPathHighlight();
        }
        
        this.drawNodes();
        this.drawLegend();
    }
    
    drawEdges() {
        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];
            
            this.ctx.strokeStyle = edge.color;
            this.ctx.lineWidth = 1.5;
            this.ctx.globalAlpha = 0.3;
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1.0;
        });
    }
    
    drawWeightedEdges() {
        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];
            
            // Edge line
            this.ctx.strokeStyle = edge.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.stroke();
            
            // Arrow head (panah untuk menunjukkan arah)
            this.drawArrow(fromNode.x, fromNode.y, toNode.x, toNode.y, edge.color);
            
            this.ctx.globalAlpha = 1.0;
            
            // Weight label (bobot edge)
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(midX - 20, midY - 10, 40, 20);
            
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${edge.weight} km`, midX, midY + 4);
        });
    }
    
    drawArrow(fromX, fromY, toX, toY, color) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 15;
        const arrowWidth = 8;
        
        // Posisi arrow di 70% dari panjang edge
        const arrowX = fromX + (toX - fromX) * 0.7;
        const arrowY = fromY + (toY - fromY) * 0.7;
        
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
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
        this.ctx.globalAlpha = 1.0;
    }
    
    drawPathHighlight() {
        if (this.highlightedPath.length < 2) {
            this.drawEdges();
            return;
        }
        
        // Draw all edges faded
        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];
            
            this.ctx.strokeStyle = '#bdc3c7';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.stroke();
        });
        
        this.ctx.globalAlpha = 1.0;
        
        // Highlight path
        for (let i = 0; i < this.highlightedPath.length - 1; i++) {
            const fromId = this.highlightedPath[i];
            const toId = this.highlightedPath[i + 1];
            const fromNode = this.nodes[fromId];
            const toNode = this.nodes[toId];
            
            // Thick red line for path
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.lineWidth = 4;
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.stroke();
            
            // Arrow
            this.drawArrow(fromNode.x, fromNode.y, toNode.x, toNode.y, '#c0392b');
            
            // Distance label
            const dist = this.distMatrix[fromId][toId];
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(midX - 25, midY - 12, 50, 24);
            
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${(dist / 1000).toFixed(1)} km`, midX, midY + 4);
        }
    }
    
    drawNodes() {
        this.nodes.forEach((node, index) => {
            // Node circle
            this.ctx.fillStyle = node.color;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Node ID
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.id, node.x, node.y + 5);
            
            // Node name (outside circle)
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '11px Arial';
            
            // Wrap text if too long
            const maxWidth = 100;
            const words = node.name.split(' ');
            let line = '';
            let y = node.y + node.radius + 15;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    this.ctx.fillText(line, node.x, y);
                    line = word + ' ';
                    y += 12;
                } else {
                    line = testLine;
                }
            });
            this.ctx.fillText(line, node.x, y);
        });
    }
    
    drawLegend() {
        const legendX = 20;
        const legendY = this.canvas.height - 120;
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(legendX, legendY, 200, 100);
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(legendX, legendY, 200, 100);
        
        // Title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Klasifikasi Jalan:', legendX + 10, legendY + 20);
        
        // Legend items
        const items = [
            { color: '#e74c3c', label: 'Arteri Primer' },
            { color: '#f39c12', label: 'Arteri Sekunder' },
            { color: '#3498db', label: 'Jalan Lokal' }
        ];
        
        items.forEach((item, i) => {
            const y = legendY + 40 + i * 20;
            
            // Color box
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(legendX + 10, y - 8, 15, 15);
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.strokeRect(legendX + 10, y - 8, 15, 15);
            
            // Label
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '11px Arial';
            this.ctx.fillText(item.label, legendX + 32, y + 3);
        });
    }
    
    setHighlightedPath(path) {
        this.highlightedPath = path;
        this.draw('path');
    }
    
    clearHighlight() {
        this.highlightedPath = [];
        this.draw('default');
    }
}

// Helper function to create graph visualization modal
function showGraphVisualization(hospitals, distMatrix, mode = 'weighted') {
    const modal = document.getElementById('graphModal');
    if (!modal) {
        console.error('Graph modal not found');
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Initialize visualizer
    if (!window.graphVisualizer) {
        window.graphVisualizer = new GraphVisualizer('graphCanvas', hospitals, distMatrix);
    }
    
    window.graphVisualizer.draw(mode);
}

function closeGraphModal() {
    const modal = document.getElementById('graphModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function updateGraphMode(mode) {
    if (window.graphVisualizer) {
        window.graphVisualizer.draw(mode);
    }
}

function highlightPathInGraph(path) {
    if (window.graphVisualizer) {
        window.graphVisualizer.setHighlightedPath(path);
    }
}
