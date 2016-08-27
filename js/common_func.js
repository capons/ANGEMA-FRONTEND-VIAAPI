
function getQueryVariable(variable, query) {
    query = query.match(/(\?.*)/)[1]; //split off the query string
    query = query.substring(1); //remove the first "?"
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}