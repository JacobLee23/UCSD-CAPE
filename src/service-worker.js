/**
 * 
 */


/**
 * 
 */
class CAPEPage {
    /**
     * 
     * @param {*} tab 
     * @returns 
     */
    static scrape(tab) {
        if (!tab.url) { return; }

        const queryParameters = new URLSearchParams(tab.url.split("?")[1]);

        const message = new Map();
        message.set("queryParameters", Object.fromEntries(queryParameters.entries()));
        message.set("url", tab.url);

        if (tab.url.includes("Results.aspx")) { message.set("type", "CAPEResults"); }
        else if (tab.url.includes("CAPEReport.aspx")) { message.set("type", "CAPEReport"); }
        else if (tab.url.includes("detailedStats.asp")) { message.set("type", "SelfCAPE"); }
        else { return; }

        const data = Object.fromEntries(message);
        chrome.tabs.sendMessage(tab.id, data).then(
            (x) => { CAPEPage.download(x); }
        );
    }
    
    /**
     * 
     * @param {*} payload 
     */
    static download(payload) {
        if (!(payload && payload.capeType)) { return; }

        const dataURL = [
            "data:text/json;charset=utf-8",
            encodeURIComponent(JSON.stringify(payload))
        ].join(",");

        let filename;
        switch (payload.capeType) {
            case "CAPEResults":
                filename = `CAPEResults-${payload.courseNumber.split(" ").join("")}-${Date.now()}.json`;
                break;
            case "CAPEReport":
                filename = `CAPEReport-${payload.sectionID}-${Date.now()}.json`;
                break;
            case "SelfCAPE":
                filename = `SelfCAPE-${payload.sectionID}-${Date.now()}.json`;
                break;
            default:
                return;
        }

        chrome.downloads.download(
            {filename: filename, saveAs: true, url: dataURL}
        );
    }
}


chrome.action.onClicked.addListener(CAPEPage.scrape);
