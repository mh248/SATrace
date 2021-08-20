function escapeHTML(str) {
    return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function sendRequest(path, callback) {
    var url = window.location.protocol + "//" + window.location.host + path;
    var http = new XMLHttpRequest();
    http.overrideMimeType("text/plain; charset=UTF-8");
    http.open("GET", url, true);
    if (callback) {
	http.onreadystatechange = function () {
            if (http.readyState != 4) {
	        return;
            }
            if (http.status != 200) {
	        alert("Server is not responding : " + http.status);
	        return;
            }
            callback(http);
        };
    }
    http.send(null);
}

function EncodeHTMLForm(data) {
    var params = [];
    for(var name in data) {
        var value = data[name];
        var param = encodeURIComponent(name).replace(/%20/g, "+")
            + "=" + encodeURIComponent(value).replace(/%20/g, "+");
        params.push(param);
    }
    return params.join("&");
}

function postRequest(path, data, callback) {
    var url = window.location.protocol + "//" + window.location.host + path;
    var http = new XMLHttpRequest();
    http.overrideMimeType("text/plain; charset=UTF-8");
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    if (callback) {
	http.onreadystatechange = function () {
            if (http.readyState != 4) {
	        return;
            }
            if (http.status != 200) {
	        alert("Server is not responding : " + http.status);
	        return;
            }
            callback(http);
        };
    }
    http.send(EncodeHTMLForm(data));
}
