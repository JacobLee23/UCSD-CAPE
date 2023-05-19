/**
 * 
 */


function insertCAPEResultsFilters(message, sender, sendResponse) {
    if (message.type != "filters") { return; }

    const filters = new CAPEResultsFilters(message.queryParameters.Name, message.queryParameters.CourseNumber);
    console.log(filters.instructors);
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

        this.eTable = document.getElementById("ContentPlaceHolder1_gvCAPEs");
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

    _filterOptions(array) { return Array.from(new Set(array)).sort(); }

    _gradeOptions() {
        const res = [];
        Array.from("ABCDF").forEach(
            (a) => res.push(...["+", "", "-"].map((b) => a.concat(b)))
        );
        return res;
    }

    get instructors() {
        return this._filterOptions(
            this._scrapeTableColumn(1).map((e) => e.innerText.trim())
        );
    }

    get courseNumbers() {
        const re = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        return this._filterOptions(
            this._scrapeTableColumn(2).map((e) => re.exec(e.innerText.trim())[0])
        );
    }

    get quarters() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return this._filterOptions(
            this._scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[1])
        );
    }

    get years() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return this._filterOptions(
            this._scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[2])
        );
    }

    get averageExpectedGrade() { return this._gradeOptions(); }

    get averageReceivedGrade() { return this._gradeOptions(); }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
