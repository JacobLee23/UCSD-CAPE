/**
 * 
 */


function insertCAPEResultsFilters(message, sender, sendResponse) {
    if (message.type != "filters") { return; }

    const filters = new CAPEResultsFilters(message.queryParameters.Name, message.queryParameters.CourseNumber);
}


/**
 * 
 * @param {*} x 
 * @param {*} n 
 * @param {*} increment 
 * @returns 
 */
function adjustToMultiple(x, n, increment = true) {
    while (x % n != 0) { x += (increment ? 1 : -1); }
    return x;
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
        this._name = name, this._courseNumber = courseNumber;

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
        Array.from("ABCDF").forEach((a) => res.push(...["+", "", "-"].map((b) => a.concat(b))));
        return res;
    }

    _gpaRange() { return [0, 4]; }

    _percentageRange() { return [0, 100]; }

    get instructor() {
        return this._filterOptions(
            this._scrapeTableColumn(1).map((e) => e.innerText.trim())
        );
    }

    get courseNumber() {
        const re = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        return this._filterOptions(
            this._scrapeTableColumn(2).map((e) => re.exec(e.innerText.trim())[0])
        );
    }

    get quarter() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return this._filterOptions(
            this._scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[1])
        );
    }

    get year() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return this._filterOptions(
            this._scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[2])
        ).map((x) => 2000 + parseInt(x));
    }

    get yearRange() {
        return [
            adjustToMultiple(Math.min(this.year), 5, false),
            adjustToMultiple(Math.max(this.year), 5, true)
        ];
    }

    get enrollmentRange() {
        let values = this._filterOptions(
            this._scrapeTableColumn(4).map((e) => parseInt(e.innerText.trim()))
        );
        return [0, adjustToMultiple(Math.max(values), 25)];
    }

    get evaluationsRange() {
        let values = this._filterOptions(
            this._scrapeTableColumn(5).map((e) => parseInt(e.innerText.trim()))
        );
        return [0, adjustToMultiple(Math.max(values), 25)];
    }

    get recommendClass() { return this._percentageRange(); }

    get recommendInstructor() { return this._percentageInstructor(); }

    get studyHoursPerWeek() {
        let values = this._filterOptions(
            this._scrapeTableColumn(6).map((e) => parseFloat(e.innerText.trim()))
        );
        return [0, adjustToMultiple(Math.ceil(Math.max(values)), 5)];
    }

    get averageExpectedGrade() { return this._gradeOptions(); }

    get averageExpectedGradeRange() { return this._gpaRange(); }

    get averageReceivedGrade() { return this._gradeOptions(); }

    get averageReceivedGradeRange() { return this._gpaRange(); }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
