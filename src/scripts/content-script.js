/**
 * 
 */

import { CAPEResults, CAPEReport } from "./scraper.js";


chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        let payload;
        switch (message.type) {
            case "results":
                payload = new CAPEResults(
                    message.queryParameters.get("Name"),
                    message.queryParameters.get("CourseNumber")
                );
            case "report":
                payload = new CAPEReport(
                    parseInt(message.queryParameters.get("sectionid"))
                );
            default:
                payload = null;
        }

        sendResponse(payload);
    }
)
