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
        const values = _uniqueValues(
            this._scrapeTableColumn(3).map(
                (e) => parseInt(re.exec(e.innerText.trim())[2]) + 2000
            )
        );
        return [
            _adjustToMultiple(Math.min(...values), 5, false),
            _adjustToMultiple(Math.max(...values), 5, true)
        ];
    }

    /**
     * 
     */
    get enrollment() {
        let values = _uniqueValues(this._scrapeTableColumn(4).map((e) => parseInt(e.innerText.trim())));
        return [0, _adjustToMultiple(Math.max(...values), 25)];
    }

    /**
     * 
     */
    get evaluations() {
        let values = _uniqueValues(this._scrapeTableColumn(5).map((e) => parseInt(e.innerText.trim())));
        return [0, _adjustToMultiple(Math.max(...values), 25)];
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
        return [0, _adjustToMultiple(Math.ceil(Math.max(...values)), 5)];
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
            this.year,
            this.enrollment,
            this.evaluations,
            this.recommendClass,
            this.recommendInstructor,
            this.studyHoursPerWeek,
            this.averageExpectedGrade,
            this.averageReceivedGrade
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

        return form;
    }

    /**
     * 
     */
    get instructor() {
        const fieldset = new _Checkbox("instructor", this.table.instructor);

        if (this.queryParameters.name) {
            const element = fieldset.fieldset.querySelector(
                `input#instructor-${this.table.instructor.indexOf(this.queryParameters.name)}`
            );
            Array.from(fieldset.fieldset.querySelectorAll("input")).forEach((e) => { e.click(); });
            element.click();
        }

        return fieldset.fieldset;
    }

    /**
     * 
     */
    get courseNumber() {
        const fieldset = new _Checkbox("course-number", this.table.courseNumber);

        if (this.queryParameters.courseNumber) {
            const element = fieldset.fieldset.querySelector(
                `input#course-number-${this.table.courseNumber.indexOf(this.queryParameters.courseNumber)}`
            );
            Array.from(fieldset.fieldset.querySelectorAll("input")).forEach((e) => { e.click(); });
            element.click();
        }

        return fieldset.fieldset;
    }

    /**
     * 
     */
    get quarter() {
        const fieldset = new _Checkbox("quarter", this.table.quarter);
        return fieldset.fieldset;
    }

    get year() {
        const fieldset = new _InputRange("year", ...this.table.year);
        return fieldset.fieldset;
    }

    get enrollment() {
        const fieldset = new _InputRange("enrollment", ...this.table.enrollment);
        return fieldset.fieldset;
    }

    get evaluations() {
        const fieldset = new _InputRange("evaluations", ...this.table.evaluations);
        return fieldset.fieldset;
    }

    get recommendClass() {
        const fieldset = new _InputRange("recommend-class", ...this.table.recommendClass);
        return fieldset.fieldset;
    }

    get recommendInstructor() {
        const fieldset = new _InputRange("recommend-instructor", ...this.table.recommendInstructor);
        return fieldset.fieldset;
    }

    get studyHoursPerWeek() {
        const fieldset = new _InputRange("study-hours-per-week", ...this.table.studyHoursPerWeek);
        return fieldset.fieldset;
    }

    get averageExpectedGrade() {
        const fieldset = new _InputRange("average-expected-grade", ...this.table.averageExpectedGrade);
        return fieldset.fieldset;
    }

    get averageReceivedGrade() {
        const fieldset = new _InputRange("average-received-grade", ...this.table.averageExpectedGrade);
        return fieldset.fieldset;
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
                const options = Array.from(
                    e.querySelectorAll(
                        "table > tr.filter-field > div.field-option > input[type='checkbox']"
                    )
                );
                const button = e.querySelector(
                    "legend > button.field-select-all"
                );

                if (button) {
                    button.innerText = (
                        options.map((e) => e.checked).some((x) => !Boolean(x)) ? "Select All": "De-Select All"
                    );
                }
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
        const fieldsCheckbox = [
            "instructor",
            "course-number",
            "quarter"
        ];
        const fieldsInputRange = [
            "year",
            "enrollment",
            "evaluations",
            "recommend-class",
            "recommend-instructor",
            "study-hours-per-week",
            "average-expected-grade",
            "average-received-grade"
        ];

        fieldsCheckbox.forEach(
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
        fieldsInputRange.forEach(
            (x) => {
                const fieldData = new Map();
                const fields = ["minimum", "maximum"];
                fields.forEach(
                    (y) => {
                        fieldData.set(
                            y, parseInt(
                                document.querySelector(
                                    `form#cape-results-filters > fieldset[name='${x}'] input#${x}-${y}[type='range']`
                                ).value
                            )
                        );
                    }
                );
                data.set(x, fieldData);
            }
        );

        console.log(data);
        return Object.fromEntries(data);
    }
}


/**
 * 
 */
class _Fieldset {
    /**
     * 
     * @param {*} name 
     */
    constructor(name) { this.name = name; }

    /**
     * 
     */
    get fieldset() { return this._fieldset(); }

    /**
     * 
     */
    get legend() { return this._legend(); }

    /**
     * 
     */
    get buttonToggle() {
        const button = this._buttonControl();

        button.classList.add("toggle-field");
        button.addEventListener(
            "click",
            () => {
                const tr = document.querySelector(
                    `fieldset[name='${this.name}'] > table > tr.filter-field`
                );
                const isVisible = (!tr.style.visibility || tr.style.visibility === "visible");
                tr.style.visibility = (isVisible ? "collapse" : "visible");
            }
        );
        button.innerText = "(Hide/Show Field)";

        return button;
    }

    /**
     * 
     * @returns 
     */
    _fieldset() {
        const fieldset = document.createElement("fieldset");
        fieldset.setAttribute("name", this.name);
        fieldset.appendChild(this.legend);

        return fieldset;
    }

    /**
     * 
     * @returns 
     */
    _legend() {
        const legend = document.createElement("legend");

        const span = document.createElement("span");
        span.classList.add("field-name");
        span.innerText = this.name.split("-").map(
            (s) => s[0].toUpperCase().concat(s.slice(1).toLowerCase())
        ).join(" ");
        legend.appendChild(span);

        return legend;
    }

    _buttonControl() {
        const button = document.createElement("button");

        button.classList.add("field-control");
        button.setAttribute("type", "button");
        button.setAttribute("onmouseover", "style='text-decoration: underline'");
        button.setAttribute("onmouseout", "style='text-decoration: none'");

        return button;
    }
}


/**
 * 
 */
class _Checkbox extends _Fieldset {
    /**
     * 
     * @param {*} name 
     * @param {*} values 
     */
    constructor(name, values) {
        super(name);
        this.values = values;
    }

    /**
     * 
     */
    get fieldset() {
        const fieldset = this._fieldset();

        const table = document.createElement("table");
        table.appendChild(this.checkboxes);
        fieldset.appendChild(table);

        return fieldset;
    }

    /**
     * 
     */
    get legend() {
        const legend = this._legend()

        legend.appendChild(this.buttonToggle);
        legend.appendChild(this.buttonSelectAll);

        return legend;
    }

    /**
     * 
     */
    get checkboxes() {
        const tr = document.createElement("tr");
        tr.classList.add("filter-field")

        for (let i = 0; i < this.values.length; ++i) {
            const id = `${this.name}-${i}`;

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
            label.innerText = this.values[i];
            div.appendChild(label);

            tr.appendChild(div);
        }

        return tr;
    }

    /**
     * 
     */
    get buttonSelectAll() {
        const button = this._buttonControl();

        button.classList.add("field-select-all");
        button.addEventListener(
            "click",
            () => {
                const options = Array.from(
                    document.querySelectorAll(
                        `fieldset[name='${this.name}'] > table > tr.filter-field > div.field-option > input[type='checkbox']`
                    )
                );
                const element = document.querySelector(
                    `fieldset[name='${this.name}'] > legend > button.field-select-all`
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
}


/**
 * 
 */
class _InputRange extends _Fieldset {
    /**
     * 
     * @param {*} name 
     * @param {*} min 
     * @param {*} max 
     */
    constructor(name, min, max) {
        super(name);
        this.min = min, this.max = max;
    }

    /**
     * 
     */
    get fieldset() {
        const fieldset = this._fieldset();

        const table = document.createElement("table");
        table.appendChild(this.inputs);
        fieldset.appendChild(table);

        return fieldset;
    }

    get legend() {
        const legend = this._legend();

        legend.append(this.buttonToggle);

        return legend;
    }

    get inputs() {
        const tr = document.createElement("tr");
        tr.classList.add("filter-field")

        const fields = ["minimum", "maximum"];
        fields.forEach(
            (x) => {
                const id = `${this.name}-${x}`;

                const div = document.createElement("div");
                div.classList.add("field-range");

                const label = document.createElement("label");
                label.setAttribute("for", id);
                label.innerText = x[0].toUpperCase().concat(x.slice(1).toLowerCase());
                div.appendChild(label);

                const input = document.createElement("input");
                input.setAttribute("type", "range");
                input.setAttribute("id", id);
                div.appendChild(input);

                tr.appendChild(div);
            }
        );

        return tr;
    }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
