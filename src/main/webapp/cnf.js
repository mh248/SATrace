function cnfUNSAT(n) {
    if (n == 0)
        return [[]];
    let cnf = [];
    for (let clause of cnfUNSAT(n - 1)) {
        cnf.push(clause.concat("-x"+n));
        cnf.push(clause.concat("x"+n));
    }
    return cnf;
}

function range(from, to, by) {
    let r = [];
    if (by < 0) {
        for (let i = from; i > to; i += by)
            r.push(i);
    } else {
        for (let i = from; i < to; i += by)
            r.push(i);
    }
    return r;
}

function cnfQueenGraphDirect(n,d) {
    function x(i,j,a) { return 'x_' + i + j + '_' + a; };
    function negx(i,j,a) { return '-x_' + i + j + '_' + a; };
    let cnf = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            cnf.push(range(0,d,1).map(k => x(i,j,k)));
        }
    }//ここまで(15)式
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k= 0; k < d; k++) {
                for (let r = i+1; r < n; r++) {
                    cnf.push([negx(i,j,k),negx(r,j,k)]);
                }
                for (let r = j+1; r < n; r++) {
                    cnf.push([negx(i,j,k),negx(i,r,k)]);
                }
            }
        }
    }//ここまで飛車
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k= 1; k <= d; k++) {
                for (let r = i+1; r < n; r++) { 
                    for(let c = 0; c < n; c++) {
                        if (i+j == r+c) {//左下
                            cnf.push([negx(i,j,k),negx(r,c,k)]);
                        }
                        else if (j-i == c-r) {//右下
                            cnf.push([negx(i,j,k),negx(r,c,k)]);
                        }
                    }
                }
            }
        }
    }//ここまで角
    return cnf;
}

function cnfQueenGraphOrder(n,d) {
    function x(i,j,a) { return 'x_' + i + j + '_' + a; };
    function negx(i,j,a) { return '-x_' + i + j + '_' + a; };
    let cnf = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k= 1; k < d; k++) {
                cnf.push([negx(i,j,k+1), x(i,j,k)]);
            }
        }
    }//ここまで公理節
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k = 1; k <= d; k++) {
                for (let r = i+1; r < n; r++) {
                    if (k == 1) cnf.push([x(i,j,k),x(r,j,k)]);
                    else if (k == d) cnf.push([negx(i,j,k-1),negx(r,j,k-1)]);
                    else cnf.push([negx(i,j,k-1),x(i,j,k),negx(r,j,k-1),x(r,j,k)]);
                }
                for (let r = j+1; r < n; r++) {
                    if (k == 1) cnf.push([x(i,j,k),x(i,r,k)]);
                    else if (k == d) cnf.push([negx(i,j,k-1),negx(i,r,k-1)]);
                    else cnf.push([negx(i,j,k-1),x(i,j,k),negx(i,r,k-1),x(i,r,k)]);
                }
            }
        }
    }//ここまで飛車
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k= 1; k <= d; k++) {
                for (let r = i+1; r < n; r++) { 
                    for(let c = 0; c < n; c++) {
                        if (i+j == r+c) {//左下
                            if (k == 1) cnf.push([x(i,j,k),x(r,c,k)]);
                            else if (k == d) cnf.push([negx(i,j,k-1),negx(r,c,k-1)]);
                            else cnf.push([negx(i,j,k-1),x(i,j,k),negx(r,c,k-1),x(r,c,k)]);
                        }
                        else if (j-i == c-r) {//右下
                            if (k == 1) cnf.push([x(i,j,k),x(r,c,k)]);
                            else if (k == d) cnf.push([negx(i,j,k-1),negx(r,c,k-1)]);
                            else cnf.push([negx(i,j,k-1),x(i,j,k),negx(r,c,k-1),x(r,c,k)]);
                        }
                    }
                }
            }
        }
    }//ここまで角
    return cnf;
}

function cnfWaerden(j, k, n) {
    let cnf = [];
    for (let d = 1; d <= n; d++) {
        for (let i = 1; i <= n; i++) {
            if (i+(j-1)*d <= n) {
                let clause = range(i, i+(j-1)*d+1, d).map(i => "x" + i);
                cnf.push(clause);
            }
        }
    }
    for (let d = 1; d <= n; d++) {
        for (let i = 1; i <= n; i++) {
            if (i+(k-1)*d <= n) {
                let clause = range(i, i+(k-1)*d+1, d).map(i => "-x" + i);
                cnf.push(clause)
            }
        }
    }
    return cnf;
}
/*
function cnfPigeonHole(n) {
    function p(i, j) { return  i*n + j + 1; };
    let cnf = [];
    for (let i = 0; i <= n; i++)
        cnf.push(range(0, n, 1).map(j => p(i,j)));
    for (let j = 0; j < n; j++) {
        for (let i = 0; i <= n; i++)
            for (let k = i+1; k <= n; k++)
                cnf.push([-p(i,j), -p(k,j)]);
    }
    return cnf;
}
*/
function cnfPigeonHole(n) {
    function p(i, j) { return  "p_"+i+"_"+j; };
    function negp(i, j) {return  "-p_"+i+"_"+j;}
    let cnf = [];
    for (let i = 0; i <= n; i++)
        cnf.push(range(0, n, 1).map(j => p(i,j)));
    for (let j = 0; j < n; j++) {
        for (let i = 0; i <= n; i++)
            for (let k = i+1; k <= n; k++)
                cnf.push([negp(i,j), negp(k,j)]);
    }
    return cnf;
}

function cnfSudoku() {
    function x(i,j,a) { return 'x_' + i + j + '_' + a; };
    function negx(i,j,a) { return '-x_' + i + j + '_' + a; };
    function under(i,j,a) {
        let r = [];
        for (let k = (i-1)/3*3+1; k <= (i-1)/3*3+3; k++) {
            for (let l = j+1; l <= (j-1)/3*3+3; l++) {
                if (k != i) r.push([k, l, a]);
            }
        }
        return r;
    }; 
    let cnf = [];
    let clause1 = [];
    let mondai = [[0,3,0,2,0,0,6,0,0],
    [2,0,0,0,0,0,0,0,3],
    [0,7,0,0,5,0,0,0,0],
    [0,0,5,0,0,4,0,0,0],
    [0,0,0,0,0,6,0,0,9],
    [0,0,0,0,7,0,0,3,0],
    [0,0,0,0,0,0,0,4,0],
    [9,2,0,1,0,0,0,0,5],
    [0,0,0,9,2,0,1,7,0]];

    for (let i = 1; i <= 9; i++) {
        for (let j = 1; j <= 9; j++) {
            for (let a = 1; a <= 9; a++) {
                clause1.push(x(i,j,a)); //(4)
                for (let r = 0; r < under(i,j,a).size; r++) { 
                    cnf.push([negx(i,j,a), negx(under(i,j,a)[r])]); //マス
                }
                for (let b = a + 1; b <= 9; b++) {
                    cnf.push([negx(i,j,a), negx(i,j,b)]); //(5)
                }
                for (let k = 1; k <= 9; k++) {
                    for (let l = 1; l <= 9; l++) {
                        if (i < k && j == l) cnf.push([negx(i,j,a), negx(k,l,a)]); //よこ
                        if (i == k && j < l) cnf.push([negx(i,j,a), negx(k,l,a)]); //たて
                    } 
                }
            }
            cnf.push(clause1);
            
        }
    }
    for (let c = 0; c < 9; c++) {
        for (let d = 0; d < 9; d++) {
            if (mondai[c][d] > 0) {
                console.log(mondai[c][d]);
                cnf.push([x(c+1, d+1, mondai[c][d]),""]);
            }
        }
    }
    return cnf;
}