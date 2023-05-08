/**
 * 
 */

import { CAPEResults, CAPEReport } from "./scraper.js";


chrome.runtime.onMessage.addListener(
    (message: any, sender: chrome.runtime.MessageSender, sendResponse: Function): Boolean => {
        let payload;
        switch (message.type) {
            case "results":
                payload = new CAPEResults(
                    <string>message.queryParameters.get("Name"),
                    <string>message.queryParameters.get("CourseNumber")
                );
            case "report":
                payload = new CAPEReport(
                    parseInt(<string>message.queryParameters.get("sectionid"))
                );
            default:
                payload = null;
        }

        sendResponse(payload);

        return true;
    }
)
