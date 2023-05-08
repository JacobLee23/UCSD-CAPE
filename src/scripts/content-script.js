import { CAPEResults, CAPEReport } from "./scraper.js"


chrome.action.onClicked.addListener(
    (tab) => {
        if (!(tab.url && tab.url.includes("cape.ucsd.edu/responses/"))) { return; }

        const queryParameters = new URLSearchParams(tab.url.split("?")[1]);

        let message = { url: tab.url, queryParameters: queryParameters };
        if (tab.url.includes("Results.aspx")) {
            message.type = "results";
            message.payload = CAPEResults(queryParameters);
        } else if (tab.url.includes("CAPEReport.aspx")) {
            message.type = "report";
            message.paylod = CAPEReport(queryParameters);
        }

        chrome.runtime.sendMessage(message);
    }
)
