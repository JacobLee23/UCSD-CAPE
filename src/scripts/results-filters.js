/**
 * 
 */


function insertCAPEResultsFilters(message, sender, sendResponse) {
    if (message.type != "filters") { return; }

    const filters = new CAPEResultsFilters(message.queryParameters.Name, message.queryParameters.CourseNumber);
    filters.insertForm();

    sendResponse(true);
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
        const step = 5;
        const min = _adjustToMultiple(Math.min(...values), step, false);
        const max = _adjustToMultiple(Math.max(...values), step, true);
        return [...Array(max - min + 1).keys()].map((x) => x + min);
    }

    /**
     * 
     */
    get enrollment() {
        const values = _uniqueValues(this._scrapeTableColumn(4).map((e) => parseInt(e.innerText.trim())));
        const step = 25;
        const max = _adjustToMultiple(Math.max(...values), step);
        return [...Array(max / step + 1).keys()].map((x) => step * x);
    }

    /**
     * 
     */
    get evaluations() {
        const values = _uniqueValues(this._scrapeTableColumn(5).map((e) => parseInt(e.innerText.trim())));
        const step = 25;
        const max = _adjustToMultiple(Math.max(...values), step);
        return [...Array(max / step + 1).keys()].map((x) => step * x);
    }

    /**
     * 
     */
    get recommendClass() {
        return [...Array(11).keys()].map((x) => 10 * x);
    }

    /**
     * 
     */
    get recommendInstructor() {
        return [...Array(11).keys()].map((x) => 10 * x);
    }

    /**
     * 
     */
    get studyHoursPerWeek() {
        const values = _uniqueValues(this._scrapeTableColumn(6).map((e) => parseFloat(e.innerText.trim())));
        const step = 5;
        const max = _adjustToMultiple(Math.ceil(Math.max(...values)), step);
        return [...Array(max / step + 1).keys()].map((x) => step * x);
    }

    /**
     * 
     */
    get averageExpectedGrade() {
        return [...Array(17).keys()].map((x) => 0.25 * x);
    }

    /**
     * 
     */
    get averageReceivedGrade() {
        return [...Array(17).keys()].map((x) => 0.25 * x);
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
        form.id = form.name = "cape-results-filters";
        form.addEventListener("submit", CAPEResultsFilters.formData);

        this.formFields.forEach((e) => { form.appendChild(e) });

        const inputSubmit = document.createElement("input");
        inputSubmit.type = "submit";
        inputSubmit.value = "Filter Results";

        const inputReset = document.createElement("input");
        inputReset.type = "reset";
        inputReset.value = "Reset Form";

        form.appendChild(inputSubmit);
        form.appendChild(inputReset);

        return form;
    }

    /**
     * 
     */
    get instructor() {
        const fieldset = new _Checkbox("instructor", this.table.instructor);
        return fieldset.fieldset;
    }

    /**
     * 
     */
    get courseNumber() {
        const fieldset = new _Checkbox("course-number", this.table.courseNumber);
        return fieldset.fieldset;
    }

    /**
     * 
     */
    get quarter() {
        const fieldset = new _Checkbox("quarter", this.table.quarter, 1);
        return fieldset.fieldset;
    }

    get year() {
        const fieldset = new _InputRange("year", this.table.year, 1);
        return fieldset.fieldset;
    }

    get enrollment() {
        const fieldset = new _InputRange("enrollment", this.table.enrollment, 1);
        return fieldset.fieldset;
    }

    get evaluations() {
        const fieldset = new _InputRange("evaluations", this.table.evaluations, 1);
        return fieldset.fieldset;
    }

    get recommendClass() {
        const fieldset = new _InputRange("recommend-class", this.table.recommendClass, 0.1);
        return fieldset.fieldset;
    }

    get recommendInstructor() {
        const fieldset = new _InputRange("recommend-instructor", this.table.recommendInstructor, 0.1);
        return fieldset.fieldset;
    }

    get studyHoursPerWeek() {
        const fieldset = new _InputRange("study-hours-per-week", this.table.studyHoursPerWeek, 0.01);
        return fieldset.fieldset;
    }

    get averageExpectedGrade() {
        const fieldset = new _InputRange("average-expected-grade", this.table.averageExpectedGrade, 0.01);
        return fieldset.fieldset;
    }

    get averageReceivedGrade() {
        const fieldset = new _InputRange("average-received-grade", this.table.averageExpectedGrade, 0.01);
        return fieldset.fieldset;
    }

    /**
     * 
     */
    insertForm() {
        this.removeForm();

        const eTable = document.getElementById("ContentPlaceHolder1_UpdatePanel1").querySelector("div.field");
        eTable.insertAdjacentElement("afterend", this.form);

        let options, button;

        options = Array.from(
            document.querySelectorAll(
                "fieldset[name='instructor'] > div.field-option > input[type='checkbox']"
            )
        );
        button = document.querySelector("fieldset[name='instructor'] > legend > button.field-select-all")
        if (this.queryParameters.name) {
            document.getElementById(
                `instructor-${this.table.instructor.indexOf(this.queryParameters.name)}`
            ).click();
        } else {
            options.forEach((e) => { e.click(); });
        }
        if (options.every((e) => e.checked)) {}
        

        if (this.queryParameters.courseNumber) {
            document.getElementById(
                `course-number-${this.table.courseNumber.indexOf(this.queryParameters.courseNumber)}`
            ).click();
        } else {
            Array.from(
                document.querySelectorAll(
                    "fieldset[name='courseNumber'] > div.field-option > input[type='checkbox']"
                )
            ).forEach((e) => { e.click(); });
            document.querySelector(
                "fieldset[name='courseNumber'] > legend > button.field-select-all"
            ).innerText = "De-Select All";
        }

        options = Array.from(
            document.querySelectorAll(
                "fieldset[name='quarter'] > div.field-option > input[type='checkbox']"
            )
        );
        options.forEach((e) => { e.click(); });
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
            "instructor", "course-number", "quarter"
        ];
        const fieldsInputRange = [
            "year", "enrollment", "evaluations", "recommend-class", "recommend-instructor",
            "study-hours-per-week", "average-expected-grade", "average-received-grade"
        ];

        fieldsCheckbox.forEach(
            (x) => {
                const elements = document.querySelectorAll(
                    `form#cape-results-filters > fieldset[name='${x}'] > div.field-option > input[type='checkbox']`
                );
                data.set(x, CAPEResultsFilters.dataCheckbox(elements));
            }
        );
        fieldsInputRange.forEach(
            (x) => {
                const elementMin = document.getElementById(`${x}-minimum-range`);
                const elementMax = document.getElementById(`${x}-maximum-range`);
                data.set(x, CAPEResultsFilters.dataInputRange(elementMin, elementMax));
            }
        );

        return Object.fromEntries(data);
    }

    /**
     * 
     * @param {*} elements 
     * @returns 
     */
    static dataCheckbox(elements) {
        const data = new Map();
        elements.forEach(
            (e) => { data.set(e.nextSibling.innerText.trim(), e.checked); }
        )
        return data;
    }

    /**
     * 
     * @param {*} elementMin 
     * @param {*} elementMax 
     * @returns 
     */
    static dataInputRange(elementMin, elementMax) {
        const data = new Map();
        data.set("minimum", parseFloat(elementMin.value));
        data.set("maximum", parseFloat(elementMax.value));
        return data;
    }
}


/**
 * 
 */
class _Fieldset {
    /**
     * 
     * @param {*} name 
     * @returns 
     */
    static fieldset(name) {
        const fieldset = document.createElement("fieldset");
        fieldset.name = name;
        fieldset.appendChild(_Fieldset.legend(name));

        return fieldset;
    }

    /**
     * 
     * @param {*} name 
     * @returns 
     */
    static legend(name) {
        const legend = document.createElement("legend");

        const span = document.createElement("span");
        span.classList.add("field-name");
        span.innerText = name.split("-").map(
            (s) => s[0].toUpperCase().concat(s.slice(1).toLowerCase())
        ).join(" ");
        legend.appendChild(span);

        return legend;
    }
}


/**
 * 
 */
class _Checkbox {
    /**
     * 
     * @param {*} name 
     * @param {*} values 
     */
    constructor(name, values) {
        this.name = name, this.values = values;

        this.fieldset = _Fieldset.fieldset(this.name);
        this.fieldset.querySelector("legend").appendChild(this.buttonSelectAll());
        this.checkboxes().forEach((e) => { this.fieldset.appendChild(e); });
    }

    /**
     * 
     */
    checkboxes() {
        const elements = [];

        for (let i = 0; i < this.values.length; ++i) {
            const div = document.createElement("div");
            div.classList.add("field-option");

            const input = document.createElement("input");
            input.type = "checkbox";
            input.addEventListener("input", _Checkbox.modifyButtonText);

            const label = document.createElement("label");
            label.innerText = this.values[i];

            input.id = label.setAttribute = `${this.name}-${i}`;

            div.appendChild(input);
            div.appendChild(label);
            elements.push(div);
        }

        return elements;
    }

    /**
     * 
     */
    buttonSelectAll() {
        const button = document.createElement("button");

        button.classList.add("field-select-all");
        button.type = "button";
        button.onmouseover = "style='text-decoration: underline'";
        button.onmouseout = "style='text-decoration: none'";
        button.setAttribute("type", "button");
        button.addEventListener("click", _Checkbox.selectAll);
        button.innerText = "Select All";

        return button;
    }

    /**
     * 
     * @param {*} event 
     */
    static selectAll(event) {
        const options = Array.from(
            this.parentElement.parentElement.querySelectorAll(
                "div.field-option > input[type='checkbox']"
            )
        );
        if (options.every((e) => e.checked)) { options.forEach((e) => { e.click(); }); }
        else { options.forEach((e) => { if (!e.checked) { e.click(); }; }); }

        _Checkbox.modifyButtonText(this);
    }

    /**
     * 
     * @param {*} button 
     * @returns 
     */
    static modifyButtonText(event) {
        const button = this.parentElement.parentElement.querySelector("legend > button.field-select-all");
        const options = Array.from(
            this.parentElement.parentElement.querySelectorAll(
                "div.field-option > input[type='checkbox']"
            )
        );
        button.innerText = (
            options.every((e) => e.checked) ? "De-Select All" : "Select All"
        );
    }
}


/**
 * 
 */
class _InputRange {
    /**
     * 
     * @param {*} name 
     * @param {*} values 
     */
    constructor(name, values, step) {
        this.name = name, this.values = values;
        this.min = Math.min(...this.values), this.max = Math.max(...this.values);
        this.step = new String(step);

        this.fieldset = _Fieldset.fieldset(this.name);
        this.inputs().forEach((e) => { this.fieldset.appendChild(e); });
    }

    inputs() {
        const elements = []

        const fields = ["minimum", "maximum"];
        fields.forEach(
            (x) => {
                const id = `${this.name}-${x}`;

                const div = document.createElement("div");
                div.classList.add("field-range");

                const label = document.createElement("label");
                label.innerText = x[0].toUpperCase().concat(x.slice(1).toLowerCase());

                const inputNumber = document.createElement("input");
                inputNumber.type = "number";
                inputNumber.id = `${id}-number`;
                inputNumber.addEventListener("change", _InputRange.validateInputNumber);

                const inputRange = document.createElement("input");
                inputRange.type = "range";
                inputRange.id = `${id}-range`;
                inputRange.addEventListener("input", _InputRange.validateInputRange);

                inputNumber.min = inputRange.min = this.min;
                inputNumber.max = inputRange.max = this.max;
                inputNumber.step = inputRange.step = this.step;
                inputNumber.value = inputRange.value = [this.min, this.max][fields.indexOf(x)];

                const datalist = document.createElement("datalist");
                inputRange.setAttribute("list", datalist.id = `${id}-list`);
                this.values.forEach(
                    (y) => {
                        const option = document.createElement("option");
                        option.value = option.label = y;
                        datalist.appendChild(option);
                    }
                );

                div.appendChild(label);
                div.appendChild(inputNumber);
                div.appendChild(inputRange);
                div.appendChild(datalist);
                elements.push(div);
            }
        );

        return elements;
    }

    /**
     * 
     * @param {*} event 
     */
    static validateInputNumber(event) {
        let other;
        if (this.parentElement.nextSibling) {
            other = this.parentElement.nextSibling.querySelector("input[type='number']");
            if (this.value > other.value) { this.value = other.value; }
        } else if (this.parentElement.previousSibling) {
            other = this.parentElement.previousSibling.querySelector("input[type='number']");
            if (this.value < other.value) { this.value = other.value; }
        } else {
            throw new Error();
        }

        this.nextSibling.value = this.value;
    }

    /**
     * 
     * @param {*} event 
     */
    static validateInputRange(event) {
        let other;
        if (this.parentElement.nextSibling) {
            other = this.parentElement.nextSibling.querySelector("input[type='range']");
            if (this.value > other.value) { this.value = other.value; }
        } else if (this.parentElement.previousSibling) {
            other = this.parentElement.previousSibling.querySelector("input[type='range']");
            if (this.value < other.value) { this.value = other.value; }
        } else {
            throw new Error();
        }

        this.previousSibling.value = this.value;
    }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
