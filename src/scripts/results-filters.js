/**
 * 
 */


function insertCAPEResultsFilters(message, sender, sendResponse) {
    if (message.type != "filters") { return; }

    const filters = new CAPEResultsFilters(message.queryParameters.Name, message.queryParameters.CourseNumber);
}


/**
 * 
 */
class CAPEResultsFilters {
    /**
     * 
     * @param {*} name 
     * @param {*} courseNumber 
     */
    constructor(name, courseNumber) {
        this.name = name, this.courseNumber = courseNumber;

        this.eTable = document.getElementById("ContentPlaceHolder1_gvCAPEs")
    }

    /**
     * 
     * @param {*} ncolumn 
     * @returns 
     */
    _scrapeTableColumn(ncolumn) {
        return Array.from(
            this.eTable.querySelectorAll(`tbody > tr > td:nth-child(${ncolumn})`)
        );
    }

    /**
     * 
     * @returns 
     */
    scrapeInstructors() {
        const elements = this._scrapeTableColumn(1);
        return Array.from(
            new Set(elements.map((e) => e.innerText.trim()))
        ).sort()
    }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
