/**
 * 
 */

import { CAPEResults, CAPEReport } from "./scraper.js";


chrome.action.onClicked.addListener(
    (tab: chrome.tabs.Tab): void => {
        if (!(tab.url && tab.url.includes("cape.ucsd.edu/responses/"))) { return; }

        const queryParameters = new URLSearchParams(tab.url.split("?")[1]);

        let message;
        if (tab.url.includes("Results.aspx")) {
            message = {
                url: tab.url,
                queryParameters: queryParameters,
                type: "results",
                payload: new CAPEResults(
                    <string>queryParameters.get("Name"), <string>queryParameters.get("CourseNumber")
                )
            }
        } else if (tab.url.includes("CAPEReport.aspx")) {
            message = {
                url: tab.url,
                queryParameters: queryParameters,
                type: "results",
                payload: new CAPEReport(
                    <number>parseInt(<string>queryParameters.get("sectionid"))
                )
            }
        }

        chrome.runtime.sendMessage(message);
    }
)
