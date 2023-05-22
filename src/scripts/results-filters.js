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
function _adjustToMultiple(x, n, increment = true) {
    while (x % n != 0) { x += (increment ? 1 : -1); }
    return x;
}


function _uniqueValues(array) { return Array.from(new Set(array)).sort(); }


/**
 * 
 */
class CAPEResultsTable {
    /**
     * 
     */
    get eTable() {
        return document.getElementById("ContentPlaceHolder1_gvCAPEs");
    }

    /**
     * 
     */
    get instructor() {
        return _uniqueValues(this._scrapeTableColumn(1).map((e) => e.innerText.trim()));
    }

    /**
     * 
     */
    get courseNumber() {
        const re = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        return _uniqueValues(this._scrapeTableColumn(2).map((e) => re.exec(e.innerText.trim())[0]));
    }

    /**
     * 
     */
    get quarter() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return _uniqueValues(this._scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[1]));
    }

    /**
     * 
     */
    get year() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        const values = _uniqueValues(this._scrapeTableColumn(3).map(
            (e) => parseInt(re.exec(e.innerText.trim())[2])) + 2000
        );
        return [
            _adjustToMultiple(Math.min(values), 5, false),
            _adjustToMultiple(Math.max(values), 5, true)
        ];
    }

    /**
     * 
     */
    get enrollment() {
        let values = _uniqueValues(this._scrapeTableColumn(4).map((e) => parseInt(e.innerText.trim())));
        return [0, _adjustToMultiple(Math.max(values), 25)];
    }

    /**
     * 
     */
    get evaluations() {
        let values = _uniqueValues(this._scrapeTableColumn(5).map((e) => parseInt(e.innerText.trim())));
        return [0, _adjustToMultiple(Math.max(values), 25)];
    }

    /**
     * 
     */
    get recommendClass() { return [0, 100]; }

    /**
     * 
     */
    get recommendInstructor() { return [0, 100]; }

    /**
     * 
     */
    get studyHoursPerWeek() {
        let values = _uniqueValues(this._scrapeTableColumn(6).map((e) => parseFloat(e.innerText.trim())));
        return [0, _adjustToMultiple(Math.ceil(Math.max(values)), 5)];
    }

    /**
     * 
     */
    get averageExpectedGrade() { return [0, 4]; }

    /**
     * 
     */
    get averageReceivedGrade() { return [0, 4]; }

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
        
        this.formFields = [
            this.instructor,
            this.courseNumber,
            this.quarter,
            // this.year,
            // this.enrollment,
            // this.evaluations,
            // this.recommendClass,
            // this.recommendInstructor,
            // this.studyHoursPerWeek,
            // this.averageExpectedGrade,
            // this.averageReceivedGrade
        ];
    }

    /**
     * 
     */
    get form() {
        const form = document.createElement("form");
        form.setAttribute("id", "cape-results-filters")
        form.setAttribute("name", "cape-results-filters");

        this.formFields.forEach((e) => { form.appendChild(e) });

        const inputSubmit = document.createElement("input");
        inputSubmit.setAttribute("type", "submit");
        inputSubmit.setAttribute("value", "Filter Results");
        form.appendChild(inputSubmit);

        const inputReset = document.createElement("input");
        inputReset.setAttribute("type", "reset");
        inputReset.setAttribute("value", "Reset Form");
        form.appendChild(inputReset);

        form.addEventListener("submit", CAPEResultsFilters.formData);
        console.log(form);

        return form;
    }

    /**
     * 
     */
    get instructor() {
        const fieldset = this._fieldset("instructor", this.table.instructor);

        if (this.queryParameters.name) {
            const element = fieldset.querySelector(
                `input#instructor-${this.table.instructor.indexOf(this.queryParameters.name)}`
            );
            Array.from(fieldset.querySelectorAll("input")).forEach((e) => { e.click(); });
            element.click();
        }

        return fieldset;
    }

    /**
     * 
     */
    get courseNumber() {
        const fieldset = this._fieldset("course-number", this.table.courseNumber);

        if (this.queryParameters.courseNumber) {
            const element = fieldset.querySelector(
                `input#course-number-${this.table.courseNumber.indexOf(this.queryParameters.courseNumber)}`
            );
            Array.from(fieldset.querySelectorAll("input")).forEach((e) => { e.click(); });
            element.click();
        }

        return fieldset;
    }

    /**
     * 
     */
    get quarter() { return this._fieldset("quarter", this.table.quarter); }

    /**
     * 
     * @param {*} name 
     * @param {*} values 
     * @returns 
     */
    _fieldset(name, values) {
        const fieldset = document.createElement("fieldset");
        fieldset.setAttribute("name", name);
        fieldset.appendChild(this._fieldsetLegend(name));

        const table = document.createElement("table");
        table.appendChild(this._fieldsetCheckbox(name, values));
        fieldset.appendChild(table);

        return fieldset;
    }

    /**
     * 
     * @param {*} name 
     * @returns 
     */
    _fieldsetLegend(name) {
        const legend = document.createElement("legend");

        const span = document.createElement("span");
        span.classList.add("field-name");
        span.innerText = name.split("-").map(
            (s) => s[0].toUpperCase().concat(s.slice(1).toLowerCase())
        ).join(" ");
        legend.append(span);

        legend.appendChild(this._fieldsetToggleButton(name));
        legend.appendChild(this._fieldsetSelectAllButton(name));

        return legend;
    }

    /**
     * 
     * @returns 
     */
    _fieldsetButton() {
        const button = document.createElement("button");

        button.classList.add("field-control");
        button.setAttribute("type", "button");
        button.setAttribute("onmouseover", "style='text-decoration: underline'");
        button.setAttribute("onmouseout", "style='text-decoration: none'");

        return button;
    }

    /**
     * 
     * @param {*} name 
     * @returns 
     */
    _fieldsetSelectAllButton(name) {
        const button = this._fieldsetButton();

        button.classList.add("field-select-all");
        button.addEventListener(
            "click",
            () => {
                const options = Array.from(
                    document.querySelectorAll(
                        `fieldset[name='${name}'] > table > tr.filter-field > div.field-option > input[type='checkbox']`
                    )
                );
                const element = document.querySelector(
                    `fieldset[name='${name}'] > legend > button.field-select-all`
                );
                if (options.map((e) => e.checked).some((x) => !Boolean(x))) {
                    options.forEach(
                        (e) => {
                            if (!e.checked) { e.click() };
                            element.innerText = "De-Select All";
                        }
                    );
                } else {
                    options.forEach(
                        (e) => {
                            if (e.checked) { e.click(); }
                            element.innerText = "Select All";
                        }
                    );
                }
            }
        );

        button.innerText = "Select All";

        return button;
    }

    /**
     * 
     * @param {*} name 
     * @returns 
     */
    _fieldsetToggleButton(name) {
        const button = this._fieldsetButton();

        button.classList.add("toggle-field");
        button.addEventListener(
            "click",
            () => {
                const tr = document.querySelector(`fieldset[name='${name}'] > table > tr.filter-field`);
                const button = document.querySelector(`fieldset[name='${name}'] > legend > button.field-select-all`);
                const isVisible = (!tr.style.visibility || tr.style.visibility === "visible");
                tr.style.visibility = (isVisible ? "collapse" : "visible");
                button.style.visibility = (isVisible ? "hidden" : "visible");
            }
        );
        button.innerText = "(Hide/Show Field)";

        return button;
    }

    /**
     * 
     * @param {*} name 
     * @param {*} values 
     * @returns 
     */
    _fieldsetCheckbox(name, values) {
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
            input.click();
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
        this.removeForm();

        const eTable = document.getElementById("ContentPlaceHolder1_UpdatePanel1").querySelector("div.field");
        eTable.insertAdjacentElement("afterend", this.form);

        this.formFields.forEach(
            (e) => {
                const options = e.querySelectorAll(
                    "table > tr.filter-field > div.field-option > input[type='checkbox']"
                );
                const button = e.querySelector(
                    "legend > button.field-select-all"
                );
                button.innerText = (
                    Array.from(options).map((e) => e.checked).some((x) => !Boolean(x)) ? "Select All": "De-Select All"
                );
            }
        );
    }

    removeForm() {
        const form = document.getElementById("cape-results-filters");
        if (form) { form.remove() }
    }

    /**
     * 
     * @param {*} event 
     */
    static formData(event) {
        event.preventDefault();

        const data = new Map();
        const checkboxFields = [
            "instructor", "course-number", "quarter"
        ];

        checkboxFields.forEach(
            (x) => {
                const fieldData = new Map();
                const elements = Array.from(
                    document.querySelectorAll(
                        `form#cape-results-filters > fieldset[name='${x}'] input[type='checkbox']`
                    )
                );
                elements.forEach(
                    (e) => { fieldData.set(e.nextSibling.innerText.trim(), e.checked); }
                );
                data.set(x, fieldData);
            }
        );

        return Object.fromEntries(data);
    }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
