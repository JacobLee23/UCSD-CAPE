/**
 * 
 */


function insertCAPEResultsFilters(message, sender, sendResponse) {
    if (message.type != "filters") { return; }

    const filters = new CAPEResultsFilters(message.queryParameters.Name, message.queryParameters.CourseNumber);
    filters.insertForm();
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
class CAPEResultsTable {
    /**
     * 
     */
    constructor() {
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

    /**
     * 
     * @param {*} array 
     * @returns 
     */
    _columnValues(array) { return Array.from(new Set(array)).sort(); }

    /**
     * 
     * @returns 
     */
    _gradeOptions() {
        const res = [];
        Array.from("ABCDF").forEach((a) => res.push(...["+", "", "-"].map((b) => a.concat(b))));
        return res;
    }

    /**
     * 
     * @returns 
     */
    _gpaRange() { return [0, 4]; }

    /**
     * 
     * @returns 
     */
    _percentageRange() { return [0, 100]; }

    /**
     * 
     */
    get instructor() {
        return this._columnValues(this._scrapeTableColumn(1).map((e) => e.innerText.trim()));
    }

    /**
     * 
     */
    get courseNumber() {
        const re = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        return this._columnValues(this._scrapeTableColumn(2).map((e) => re.exec(e.innerText.trim())[0]));
    }

    /**
     * 
     */
    get quarter() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return this._columnValues(this._scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[1]));
    }

    /**
     * 
     */
    get year() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return this._columnValues(this._scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[2])).map(
            (x) => 2000 + parseInt(x)
        );
    }

    /**
     * 
     */
    get yearRange() {
        return [
            adjustToMultiple(Math.min(this.year), 5, false),
            adjustToMultiple(Math.max(this.year), 5, true)
        ];
    }

    /**
     * 
     */
    get enrollmentRange() {
        let values = this._columnValues(this._scrapeTableColumn(4).map((e) => parseInt(e.innerText.trim())));
        return [0, adjustToMultiple(Math.max(values), 25)];
    }

    /**
     * 
     */
    get evaluationsRange() {
        let values = this._columnValues(this._scrapeTableColumn(5).map((e) => parseInt(e.innerText.trim())));
        return [0, adjustToMultiple(Math.max(values), 25)];
    }

    /**
     * 
     */
    get recommendClass() { return this._percentageRange(); }

    /**
     * 
     */
    get recommendInstructor() { return this._percentageInstructor(); }

    /**
     * 
     */
    get studyHoursPerWeek() {
        let values = this._columnValues(this._scrapeTableColumn(6).map((e) => parseFloat(e.innerText.trim())));
        return [0, adjustToMultiple(Math.ceil(Math.max(values)), 5)];
    }

    /**
     * 
     */
    get averageExpectedGrade() { return this._gradeOptions(); }

    /**
     * 
     */
    get averageExpectedGradeRange() { return this._gpaRange(); }

    /**
     * 
     */
    get averageReceivedGrade() { return this._gradeOptions(); }

    /**
     * 
     */
    get averageReceivedGradeRange() { return this._gpaRange(); }
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

        this.table = new CAPEResultsTable();
    }

    /**
     * 
     */
    get form() {
        const element = document.createElement("form");
        element.setAttribute("name", "cape-results-filters");

        element.appendChild(this.instructor);
        element.appendChild(this.courseNumber);
        element.appendChild(this.quarter);
        element.appendChild(this.year);
        element.appendChild(this.averageExpectedGrade);
        element.appendChild(this.averageReceivedGrade);

        const inputSubmit = document.createElement("input");
        inputSubmit.setAttribute("type", "submit");
        inputSubmit.setAttribute("value", "Filter Results");
        element.appendChild(inputSubmit);

        const inputReset = document.createElement("reset");
        inputReset.setAttribute("type", "reset");
        inputReset.setAttribute("value", "Reset Form");
        element.appendChild(inputReset);

        return element;
    }

    /**
     * 
     */
    get instructor() {
        const element = this._fieldset("instructor", this.table.instructor);

        if (this.name) {
            element.querySelector(
                `input#instructor-${this.table.instructor.indexOf(this.name)}`
            ).click();
        }

        return element;
    }

    /**
     * 
     */
    get courseNumber() {
        const element = this._fieldset("course-number", this.table.courseNumber);

        if (this.courseNumber) {
            element.querySelector(
                `input#course-number-${this.table.courseNumber.indexOf(this.courseNumber)}`
            ).click();
        }

        return element;
    }

    /**
     * 
     */
    get quarter() { return this._fieldset("quarter", this.table.quarter); }

    /**
     * 
     */
    get year() { return this._fieldset("year", this.table.year); }

    /**
     * 
     */
    get averageExpectedGrade() {
        return this._fieldset("average-expected-grade", this.table.averageExpectedGrade);
    }

    /**
     * 
     */
    get averageReceivedGrade() {
        return this._fieldset("average-received-grade", this.table.averageReceivedGrade);
    }

    /**
     * 
     * @param {*} name 
     * @param {*} values 
     * @returns 
     */
    _fieldset(name, values) {
        const element = document.createElement("fieldset");
        element.setAttribute("name", name);

        const legend = document.createElement("legend");
        legend.innerText = name.split("-").map(
            (s) => s[0].toUpperCase().concat(s.slice(1).toLowerCase())
        ).join(" ");
        element.appendChild(legend);

        values.forEach(
            (x) => {
                const i = value.indexOf(x);
                const id = `${name}-${i}`;

                const div = document.createElement("div");

                const input = document.createElement("input");
                input.setAttribute("type", "checkbox");
                input.setAttribute("id", id);
                input.setAttribute("value", String(i));
                div.appendChild(input);

                const label = document.createElement("label");
                label.setAttribute("for", id);
                label.innerText = x;
                div.appendChild(label);

                element.appendChidl(div);
            }
        );

        return element;
    }

    /**
     * 
     */
    insertForm() {
        const eTable = document.getElementById("ContentPlaceHolder1_gvCAPEs");
        eTable.insertAdjacentElement("beforebegin", this.form);
    }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
