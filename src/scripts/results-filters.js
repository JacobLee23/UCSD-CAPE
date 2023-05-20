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
        this.queryParameters = { name: name, courseNumber: courseNumber };

        this.table = new CAPEResultsTable();
    }

    /**
     * 
     */
    get form() {
        const form = document.createElement("form");
        form.classList.add("cape-results-filters");
        form.setAttribute("name", "cape-results-filters");

        const formFields = [
            this.instructor,
            this.courseNumber,
            this.quarter,
            this.year,
            // this.enrollment,
            // this.evaluations,
            // this.recommendClass,
            // this.recommendInstructor,
            // this.studyHoursPerWeek,
            this.averageExpectedGrade,
            this.averageReceivedGrade
        ]
        formFields.forEach((e) => { form.appendChild(e) });

        const inputSubmit = document.createElement("input");
        inputSubmit.setAttribute("type", "submit");
        inputSubmit.setAttribute("value", "Filter Results");
        form.appendChild(inputSubmit);

        const inputReset = document.createElement("input");
        inputReset.setAttribute("type", "reset");
        inputReset.setAttribute("value", "Reset Form");
        form.appendChild(inputReset);

        return form;
    }

    /**
     * 
     */
    get instructor() {
        const fieldset = this._fieldset("instructor", this.table.instructor);

        if (this.queryParameters.name) {
            fieldset.querySelector(
                `input#instructor-${this.table.instructor.indexOf(this.queryParameters.name)}`
            ).click();
        }

        return fieldset;
    }

    /**
     * 
     */
    get courseNumber() {
        const fieldset = this._fieldset("course-number", this.table.courseNumber);

        if (this.queryParameters.courseNumber) {
            fieldset.querySelector(
                `input#course-number-${this.table.courseNumber.indexOf(this.queryParameters.courseNumber)}`
            ).click();
        }

        return fieldset;
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
        const fieldset = document.createElement("fieldset");
        fieldset.setAttribute("name", name);
        fieldset.appendChild(this._fieldLegend(name));

        const table = document.createElement("table");
        table.appendChild(this._fieldCheckboxes(name, values));
        fieldset.appendChild(table);

        return fieldset;
    }

    _fieldLegend(name) {
        const legend = document.createElement("legend");

        const span = document.createElement("span");
        span.classList.add("field-name");
        span.innerText = name.split("-").map(
            (s) => s[0].toUpperCase().concat(s.slice(1).toLowerCase())
        ).join(" ");
        legend.append(span);

        legend.appendChild(this._fieldToggleButton(name));

        return legend;
    }

    /**
     * 
     * @param {*} name 
     * @returns 
     */
    _fieldToggleButton(name) {
        const span = document.createElement("span");
        span.classList.add("toggle-field");

        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("onmouseover", "style='text-decoration: underline'");
        button.setAttribute("onmouseout", "style='text-decoration: none'")
        button.addEventListener(
            "click",
            () => {
                const element = document.querySelector(`fieldset[name='${name}'] > table > tr.filter-field`);
                const isVisible = (!element.style.visibility || element.style.visibility === "visible");
                element.style.visibility = (isVisible ? "collapse" : "visible");
            }
        )
        button.innerText = "(Hide/Show Field)";

        span.appendChild(button);

        return span;
    }

    /**
     * 
     * @param {*} name 
     * @param {*} values 
     * @returns 
     */
    _fieldCheckboxes(name, values) {
        const tr = document.createElement("tr");
        tr.classList.add("filter-field")

        for (let i = 0; i < values.length; ++i) {
            const id = `${name}-${i}`;

            const div = document.createElement("div");
            div.classList.add("field-option");

            const input = document.createElement("input");
            input.setAttribute("type", "checkbox");
            input.setAttribute("id", id);
            input.setAttribute("value", String(i));
            div.appendChild(input);

            const label = document.createElement("label");
            label.setAttribute("for", id);
            label.innerText = values[i];
            div.appendChild(label);

            tr.appendChild(div);
        }

        return tr;
    }

    /**
     * 
     */
    insertForm() {
        const eTable = document.getElementById("ContentPlaceHolder1_UpdatePanel1").querySelector("div.field");
        eTable.insertAdjacentElement("afterend", this.form);
    }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
