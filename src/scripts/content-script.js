import { CAPEResults, CAPEReport } from "./scraper.js"


chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        sendResponse("Hello world!");
        return true;
    }
);
