/**
 * 
 */


/**
 * 
 * @param {*} tab 
 * @returns 
 */
function scrapeCAPEPage(tab) {
    if (!(tab.url && tab.url.includes("cape.ucsd.edu/responses/"))) { return; }

    const queryParameters = new URLSearchParams(tab.url.split("?")[1]);

    let message = new Map();
    message.set("queryParameters", Object.fromEntries(queryParameters.entries()));
    message.set("url", tab.url);

    if (tab.url.includes("Results.aspx")) { message.set("type", "results"); }
    else if (tab.url.includes("CAPEReport.aspx")) { message.set("type", "report"); }
    else { return; }

    const data = Object.fromEntries(message);
    const response = chrome.tabs.sendMessage(tab.id, data);
    response.then((x) => { console.log(x); });
}


chrome.action.onClicked.addListener(scrapeCAPEPage);
