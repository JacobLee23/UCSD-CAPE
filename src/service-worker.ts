console.log("Hello world!");


/**
 * 
 * @param tab 
 * @returns 
 */
function scrapeCAPEPage(tab: chrome.tabs.Tab): void {
    if (!(tab.url && tab.url.includes("cape.ucsd.edu/responses/"))) { return; }

    const queryParameters = new URLSearchParams(tab.url.split("?")[1]);

    let message;
    if (tab.url.includes("Results.aspx")) {
        message = {
            url: tab.url,
            queryParameters: queryParameters,
            type: "results"
        };
    } else if (tab.url.includes("CAPEReport.aspx")) {
        message = {
            url: tab.url,
            queryParameters: queryParameters,
            type: "report"
        };
    } else { return; }

    const response = chrome.tabs.sendMessage(
        <number>tab.id, message, (response) => { console.log(response); }
    );
}


chrome.action.onClicked.addListener(scrapeCAPEPage);
