// graphviz is running
let running = false;
// playing animation
let playing = false;
// trace of SAT solver
let traceLenth = 0;
let tracePos = -1;
// cache
let traceCache = [];
let prevGraph = null;
// graphviz
let graphviz;
// animation wait (ms)
let wait = 200;
let seed = 12345678;
let heuristics;
let spec;

window.onload = initUpload;

function initUpload() {
    var file = document.getElementById('inputFile');

    file.onchange = function () {
        var fileList = file.files;
        var reader = new FileReader();
        reader.readAsText(fileList[0]);

        reader.onload = function () {
            document.getElementById('clauses').textContent = reader.result;
        };
    };

}

function init() {
    running = false;
    playing = false;
    traceLenth = 0;
    tracePos = -1;
    traceCache = [];
    prevGraph = null;
    graphviz = d3.select("#graph").graphviz()
        .transition(function () {
            return d3.transition("main")
                .ease(d3.easeLinear)
                .delay(0)
                .duration(300);
        });
    document.getElementById("trace").style.display = "none";
    document.getElementById("status").innerHTML = "";
    document.getElementById("message").innerHTML = "";
    document.getElementById("learnt").innerHTML = "";
    document.getElementById("graph").innerHTML = "";
    document.getElementById("output").innerHTML = "";
}

function refresh() {
    if (traceLength == 0) {
        document.getElementById("trace").style.display = "none";
        return;
    }
    document.getElementById("trace").style.display = "block";
    if (playing && tracePos >= traceLength - 1) {
        playing = false;
    }
    if (playing) {
        document.getElementById("playStopButton").innerHTML = "Stop";
    } else {
        document.getElementById("playStopButton").innerHTML = "Play";
        if (tracePos < traceLength - 1) {
            document.getElementById("playStopButton").disabled = false;
        } else {
            document.getElementById("playStopButton").disabled = true;
        }
    }
    document.getElementById("prevButton").disabled = true;
    document.getElementById("nextButton").disabled = true;
    if (!running && !playing) {
        if (tracePos > 0)
            document.getElementById("prevButton").disabled = false;
        if (tracePos < traceLength - 1)
            document.getElementById("nextButton").disabled = false;
    }
    let status = "";
    if (playing) {
        status = "Playing ";
    } else if (running) {
        status = "Running ";
    }
    status += "Step " + (tracePos + 1) + " / " + traceLength;
    document.getElementById("status").innerHTML = status;
}

function solve() {
    init();
    let outputNode = document.getElementById("output");
    outputNode.innerHTML = "Solving";
    let clauses = document.getElementById("clauses").value;
    seed = document.getElementById("seed").value;
    spec = document.getElementById("spec").value;
    let params = { "c": "solve", "clauses": clauses, "seed": seed, "heuristics": heuristics, "spec": spec };
    postRequest("/api", params, function (http) {
        var result = http.responseText;
        if (result != "") {
            var json = JSON.parse(result)
            outputNode.innerHTML = escapeHTML(json.result.output);
            traceLength = json.result.traceLength;
            refresh();
        }
    });
}

function prevTrace() {
    if (tracePos <= 0)
        return;
    tracePos--;
    showTrace();
}

function nextTrace() {
    if (tracePos >= traceLength)
        return;
    tracePos++;
    showTrace();
}

function playStopButton() {
    playing = !playing;
    refresh();
    if (playing)
        nextTrace();
}

function findNode(lit) {
    let node = d3.selectAll(".node").filter(
        function (d, i) { return d3.select(this).select("title").text() == lit; }
    );
    return node;
}

function setFill(lit, fill) {
    findNode(lit).select("ellipse").attr("fill", fill);
}

function interactive() {
    if (playing && tracePos < traceLength - 1) {
        setTimeout(() => nextTrace(), wait);
    } else {
        d3.selectAll(".node").on("click", function () {
            let lit0 = d3.select(this).select("title").text();
            let selected = d3.select(this).select("ellipse").attr("fill") != "none";
            if (!selected) {
                setFill(lit0, "lightgray");
            } else {
                setFill(lit0, "none");
                let reason = d3.select(this).select("a").attr("title").split(" ");
                console.log(reason);
                for (let lit of reason) {
                    let xlit = lit.startsWith("-") ? lit.substr(1) : "-" + lit;
                    if (xlit != lit0)
                        setFill(xlit, "lightgray");
                }
            }
        });
    }
}

function negneg(lit) {
    console.log(lit);
    if (lit.startsWith("-")) return lit.substring(1);
    else return "-" + lit;
}

function showTrace() {
    if (tracePos < 0 || traceLength <= tracePos)
        return;
    refresh();
    if (traceCache[tracePos]) {
        document.getElementById("message").innerHTML = traceCache[tracePos].message;
        graphviz.renderDot(traceCache[tracePos].graph).on("end", () => interactive());
    } else {
        running = true;
        refresh();
        let params = { "c": "getTrace", "i": tracePos };
        postRequest("/api", params, function (http) {
            var result = http.responseText;
            running = false;
            refresh();
            if (result != "") {
                var json = JSON.parse(result)
                traceCache[tracePos] = json.result;
                document.getElementById("message").innerHTML = json.result.message;
                if (json.result.message.startsWith("Learn")) {
                    var learn = document.getElementById("learnt").innerHTML;
                    learn += "<br />";
                    learn += json.result.message;
                    document.getElementById("learnt").innerHTML = learn;
                    var le = json.result.message.replace(/'/g, "").replace("Learn ", "").split(" ");
                    console.log(le);
                    for (var i = 0; i < le.length; i++) {
                        setFill(negneg(le[i]), "red");
                        console.log(negneg(le[i]));
                    }
                }
                if (json.result.graph) {
                    prevGraph = json.result.graph;
                    graphviz.renderDot(json.result.graph).on("end", () => interactive());
                } else {
                    traceCache[tracePos].graph = prevGraph;
                    interactive();
                }
            }
        });
    }
}

function selectOrder(sel) {
    let i = sel.selectedIndex;
    heuristics = sel.options[i].text;
}

function selectCNF(sel) {
    init();
    let i = sel.selectedIndex;
    let text = sel.options[i].text;
    let args = text.split(/ +/);
    let cnf = [];
    switch (args[0]) {
        case "UNSAT":
            cnf = cnfUNSAT(args[1]);
            break;
        case "Rivest":
            cnf = [[1, 2, -3], [2, 3, -4], [3, 4, 1], [4, -1, 2], [-1, -2, 3], [-2, -3, 4], [-3, -4, -1], [-4, 1, -2]];
            break;
        case "Waerden":
            cnf = cnfWaerden(args[1], args[2], args[3]);
            break;
        case "PigeonHole_SymBreak_Hole":
            cnf = [['p_0_1', 'p_0_2', 'p_0_3'], ['p_1_1', 'p_1_2', 'p_1_3'], ['p_2_1', 'p_2_2', 'p_2_3'], ['p_3_1', 'p_3_2', 'p_3_3'], ['-p_0_1', '-p_1_1'], ['-p_0_1', '-p_2_1'], ['-p_0_1', '-p_3_1'], ['-p_1_1', '-p_2_1'], ['-p_1_1', '-p_3_1'], ['-p_2_1', '-p_3_1'], ['-p_0_2', '-p_1_2'], ['-p_0_2', '-p_2_2'], ['-p_0_2', '-p_3_2'], ['-p_1_2', '-p_2_2'], ['-p_1_2', '-p_3_2'], ['-p_2_2', '-p_3_2'], ['-p_0_3', '-p_1_3'], ['-p_0_3', '-p_2_3'], ['-p_0_3', '-p_3_3'], ['-p_1_3', '-p_2_3'], ['-p_1_3', '-p_3_3'], ['-p_2_3', '-p_3_3'], ['-p_0_1', 'p_0_2'], ['-p_0_1', 'a_1_1_0'], ['p_0_2', 'a_1_1_0'], ['-p_1_1', 'p_1_2', '-a_1_1_0'], ['-p_1_1', 'a_1_1_1', '-a_1_1_0'], ['p_1_2', 'a_1_1_1', '-a_1_1_0'], ['-p_2_1', 'p_2_2', '-a_1_1_1'], ['-p_2_1', 'a_1_1_2', '-a_1_1_1'], ['p_2_2', 'a_1_1_2', '-a_1_1_1'], ['-p_3_1', 'p_3_2', '-a_1_1_2'], ['-p_0_2', 'p_0_3'], ['-p_0_2', 'a_1_2_0'], ['p_0_3', 'a_1_2_0'], ['-p_1_2', 'p_1_3', '-a_1_2_0'], ['-p_1_2', 'a_1_2_1', '-a_1_2_0'], ['p_1_3', 'a_1_2_1', '-a_1_2_0'], ['-p_2_2', 'p_2_3', '-a_1_2_1'], ['-p_2_2', 'a_1_2_2', '-a_1_2_1'], ['p_2_3', 'a_1_2_2', '-a_1_2_1'], ['-p_3_2', 'p_3_3', '-a_1_2_2']];
            break;
        case "PigeonHole_SymBreak_Pigeon":
            cnf = [['p_0_1', 'p_0_2', 'p_0_3'], ['p_1_1', 'p_1_2', 'p_1_3'], ['p_2_1', 'p_2_2', 'p_2_3'], ['p_3_1', 'p_3_2', 'p_3_3'], ['-p_0_1', '-p_1_1'], ['-p_0_1', '-p_2_1'], ['-p_0_1', '-p_3_1'], ['-p_1_1', '-p_2_1'], ['-p_1_1', '-p_3_1'], ['-p_2_1', '-p_3_1'], ['-p_0_2', '-p_1_2'], ['-p_0_2', '-p_2_2'], ['-p_0_2', '-p_3_2'], ['-p_1_2', '-p_2_2'], ['-p_1_2', '-p_3_2'], ['-p_2_2', '-p_3_2'], ['-p_0_3', '-p_1_3'], ['-p_0_3', '-p_2_3'], ['-p_0_3', '-p_3_3'], ['-p_1_3', '-p_2_3'], ['-p_1_3', '-p_3_3'], ['-p_2_3', '-p_3_3'], ['-p_0_1', 'p_1_1'], ['-p_0_1', 'a_2_0_0'], ['p_1_1', 'a_2_0_0'], ['-p_0_2', 'p_1_2', '-a_2_0_0'], ['-p_0_2', 'a_2_1_0', '-a_2_0_0'], ['p_1_2', 'a_2_1_0', '-a_2_0_0'], ['-p_0_3', 'p_1_3', '-a_2_1_0'], ['-p_1_1', 'p_2_1'], ['-p_1_1', 'a_2_0_1'], ['p_2_1', 'a_2_0_1'], ['-p_1_2', 'p_2_2', '-a_2_0_1'], ['-p_1_2', 'a_2_1_1', '-a_2_0_1'], ['p_2_2', 'a_2_1_1', '-a_2_0_1'], ['-p_1_3', 'p_2_3', '-a_2_1_1'], ['-p_2_1', 'p_3_1'], ['-p_2_1', 'a_2_0_2'], ['p_3_1', 'a_2_0_2'], ['-p_2_2', 'p_3_2', '-a_2_0_2'], ['-p_2_2', 'a_2_1_2', '-a_2_0_2'], ['p_3_2', 'a_2_1_2', '-a_2_0_2'], ['-p_2_3', 'p_3_3', '-a_2_1_2']];
            break;
        case "PigeonHole_SymBreak_Both":
            cnf = [['p_0_1', 'p_0_2', 'p_0_3'], ['p_1_1', 'p_1_2', 'p_1_3'], ['p_2_1', 'p_2_2', 'p_2_3'], ['p_3_1', 'p_3_2', 'p_3_3'], ['-p_0_1', '-p_1_1'], ['-p_0_1', '-p_2_1'], ['-p_0_1', '-p_3_1'], ['-p_1_1', '-p_2_1'], ['-p_1_1', '-p_3_1'], ['-p_2_1', '-p_3_1'], ['-p_0_2', '-p_1_2'], ['-p_0_2', '-p_2_2'], ['-p_0_2', '-p_3_2'], ['-p_1_2', '-p_2_2'], ['-p_1_2', '-p_3_2'], ['-p_2_2', '-p_3_2'], ['-p_0_3', '-p_1_3'], ['-p_0_3', '-p_2_3'], ['-p_0_3', '-p_3_3'], ['-p_1_3', '-p_2_3'], ['-p_1_3', '-p_3_3'], ['-p_2_3', '-p_3_3'], ['-p_0_1', 'p_0_2'], ['-p_0_1', 'a_1_1_0'], ['p_0_2', 'a_1_1_0'], ['-p_1_1', 'p_1_2', '-a_1_1_0'], ['-p_1_1', 'a_1_1_1', '-a_1_1_0'], ['p_1_2', 'a_1_1_1', '-a_1_1_0'], ['-p_2_1', 'p_2_2', '-a_1_1_1'], ['-p_2_1', 'a_1_1_2', '-a_1_1_1'], ['p_2_2', 'a_1_1_2', '-a_1_1_1'], ['-p_3_1', 'p_3_2', '-a_1_1_2'], ['-p_0_2', 'p_0_3'], ['-p_0_2', 'a_1_2_0'], ['p_0_3', 'a_1_2_0'], ['-p_1_2', 'p_1_3', '-a_1_2_0'], ['-p_1_2', 'a_1_2_1', '-a_1_2_0'], ['p_1_3', 'a_1_2_1', '-a_1_2_0'], ['-p_2_2', 'p_2_3', '-a_1_2_1'], ['-p_2_2', 'a_1_2_2', '-a_1_2_1'], ['p_2_3', 'a_1_2_2', '-a_1_2_1'], ['-p_3_2', 'p_3_3', '-a_1_2_2'], ['-p_0_1', 'p_1_1'], ['-p_0_1', 'a_2_0_0'], ['p_1_1', 'a_2_0_0'], ['-p_0_2', 'p_1_2', '-a_2_0_0'], ['-p_0_2', 'a_2_1_0', '-a_2_0_0'], ['p_1_2', 'a_2_1_0', '-a_2_0_0'], ['-p_0_3', 'p_1_3', '-a_2_1_0'], ['-p_1_1', 'p_2_1'], ['-p_1_1', 'a_2_0_1'], ['p_2_1', 'a_2_0_1'], ['-p_1_2', 'p_2_2', '-a_2_0_1'], ['-p_1_2', 'a_2_1_1', '-a_2_0_1'], ['p_2_2', 'a_2_1_1', '-a_2_0_1'], ['-p_1_3', 'p_2_3', '-a_2_1_1'], ['-p_2_1', 'p_3_1'], ['-p_2_1', 'a_2_0_2'], ['p_3_1', 'a_2_0_2'], ['-p_2_2', 'p_3_2', '-a_2_0_2'], ['-p_2_2', 'a_2_1_2', '-a_2_0_2'], ['p_3_2', 'a_2_1_2', '-a_2_0_2'], ['-p_2_3', 'p_3_3', '-a_2_1_2']];
            break;
        case "PigeonHole":
            cnf = cnfPigeonHole(args[1]);
            break;
        case "Sudoku":
            cnf = cnfSudoku();
            break;
        case "QueenGraphOrder":
            cnf = cnfQueenGraphOrder(args[1], args[2]);
            break;
        case "QueenGraphDirect":
            cnf = cnfQueenGraphDirect(args[1], args[2]);
            break;
        case "JSAI2010":
            cnf = [['x1', 'x13'], ['-x1', '-x2', 'x14'], ['x3', 'x15'], ['x4', 'x16'], ['-x5', '-x3', 'x6'], ['-x5', '-x7'], ['-x6', 'x7', 'x8'], ['-x4', '-x8', '-x9'], ['-x1', 'x9', '-x10'], ['x9', 'x11', '-x14'], ['x10', '-x11', 'x12'], ['-x2', '-x11', '-x12']];
            break;
    }

    document.getElementById("clauses").innerHTML =
        cnf.map(c => c.join(" ").trim()).join("\n");
}


