process.stdin.resume();
process.stdin.setEncoding('utf8');
// Your code here!
var g1 = [[0,1],[1,2],[2,3],[1,3],[3,4],[0,4]];

function cnfDirectGCP(graph, nof_color) {
    let cnf = [];
    let nof_edges = graph.length;        
    let nof_nodes = getNofNodes();
    // console.log(nof_nodes + ' ' + nof_edges);
    function x(sign,n,i) { return sign + 'x_' + n + '_' + i; };
    function getNofNodes() {
	let nodes = new Set();
	for (let i = 0; i < nof_edges; i++) {
	    nodes.add(graph[i][0]);
	    nodes.add(graph[i][1]);
	}
	return nodes.size;
    };
    function encodeVar(n) {
	// at-most-one
	for (let i = 0; i < nof_color; i++) {
	    for (let j = i+1; j < nof_color; j++) {
		cnf.push([x('-',n,i), x('-',n,j)]);
	    }
	}
	// at-least-one
	let clause = [];
	for (let i = 0; i < nof_color; i++) {
	    clause.push(x('',n,i));
	}
	cnf.push(clause);
    };

    // ==================================================
    // define variables x_i \in {0, ..., nof_color-1}
    // ==================================================    
    for (let i = 0; i < nof_nodes; i++) {
	encodeVar(i);
    }

    // ==================================================    
    // define constraints
    // ==================================================
    for (let i = 0; i < nof_edges; i++) {
     	let n0 = graph[i][0];
     	let n1 = graph[i][1];
     	for (let j = 0; j < nof_color; j++) {
     	    cnf.push([x('-',n0,j),x('-',n1,j)]);
     	}
     }
    
    return cnf;
}
let cnf = cnfDirectGCP(g1,3)
for (let i = 0; i < cnf.length; i++) {
    if (cnf[i].length == 3) {
        let n0 = cnf[i][0];
        let n1 = cnf[i][1];
        let n2 = cnf[i][2];
        console.log('%s %s %s', n0, n1, n2);
    } else {
        let n0 = cnf[i][0];
        let n1 = cnf[i][1];
        console.log('%s %s', n0, n1);
    }
}