function floydWarshall(dist) {
    const n = dist.length;
    const next = Array.from({ length: n }, () => Array(n).fill(null));
    const changes = Array.from({ length: n }, () => Array(n).fill(false));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (dist[i][j] < Infinity) {
                next[i][j] = j;
            }
        }
    }

    for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                    next[i][j] = next[i][k];
                    changes[i][j] = true;
                }
            }
        }
    }

    return { dist, next, changes };
}

function reconstructPath(next, i, j) {
    if (next[i][j] === null) return [];
    let path = [i];
    while (i !== j) {
        i = next[i][j];
        path.push(i);
    }
    return path;
}
