/**
 * 
 */


/**
 * 
 * @param {*} tab 
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
    const response = chrome.tabs.sendMessage(tab.id, data).then(
        (x) => { downloadCAPEData(x); }
    );
}


/**
 * 
 * @param {*} payload 
 * @returns 
 */
function downloadCAPEData(payload) {
    if (!payload.CAPEType) { return; }

    const dataURL = [
        "data:text/json;charset=utf-8",
        encodeURIComponent(JSON.stringify(payload))
    ].join(",");

    let filename;
    switch (payload.CAPEType) {
        case "results":
            filename = `CAPEResults-${payload.courseNumber.split(" ").join("")}-${Date.now()}.json`;
            break;
        case "report":
            filename = `CAPEReport-${payload.sectionID}-${Date.now()}.json`;
            break;
        default:
            return;
    }

    chrome.downloads.download(
        {filename: filename, saveAs: true, url: dataURL}
    );
}


chrome.action.onClicked.addListener(scrapeCAPEPage);
