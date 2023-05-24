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
    constructor() {
        this.table = document.getElementById("ContentPlaceHolder1_gvCAPEs");

        this.instructor = this._instructor();
        this.courseNumber = this._courseNumber();
        this.quarter = this._quarter();
        this.year = this._year();
        this.enrollment = this._enrollment();
        this.evaluations = this._evaluations();
        this.recommendClass = this._recommendClass();
        this.recommendInstructor = this._recommendInstructor();
        this.studyHoursPerWeek = this._studyHoursPerWeek();
        this.averageExpectedGrade = this._averageExpectedGrade();
        this.averageReceivedGrade = this._averageReceivedGrade();
    }

    /**
     * 
     */
    _instructor() {
        return _uniqueValues(this.scrapeTableColumn(1).map((e) => e.innerText.trim()));
    }

    /**
     * 
     */
    _courseNumber() {
        const re = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        return _uniqueValues(this.scrapeTableColumn(2).map((e) => re.exec(e.innerText.trim())[0]));
    }

    /**
     * 
     */
    _quarter() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        return _uniqueValues(this.scrapeTableColumn(3).map((e) => re.exec(e.innerText.trim())[1]));
    }

    /**
     * 
     */
    _year() {
        const re = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;
        const values = _uniqueValues(
            this.scrapeTableColumn(3).map(
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
    _enrollment() {
        const values = _uniqueValues(this.scrapeTableColumn(4).map((e) => parseInt(e.innerText.trim())));
        const step = 25;
        const max = _adjustToMultiple(Math.max(...values), step);
        return [...Array(max / step + 1).keys()].map((x) => step * x);
    }

    /**
     * 
     */
    _evaluations() {
        const values = _uniqueValues(this.scrapeTableColumn(5).map((e) => parseInt(e.innerText.trim())));
        const step = 25;
        const max = _adjustToMultiple(Math.max(...values), step);
        return [...Array(max / step + 1).keys()].map((x) => step * x);
    }

    /**
     * 
     */
    _recommendClass() { return [...Array(11).keys()].map((x) => 10 * x); }

    /**
     * 
     */
    _recommendInstructor() { return [...Array(11).keys()].map((x) => 10 * x); }

    /**
     * 
     */
    _studyHoursPerWeek() {
        const values = _uniqueValues(this.scrapeTableColumn(6).map((e) => parseFloat(e.innerText.trim())));
        const step = 5;
        const max = _adjustToMultiple(Math.ceil(Math.max(...values)), step);
        return [...Array(max / step + 1).keys()].map((x) => step * x);
    }

    /**
     * 
     */
    _averageExpectedGrade() { return [...Array(17).keys()].map((x) => 0.25 * x); }

    /**
     * 
     */
    _averageReceivedGrade() { return [...Array(17).keys()].map((x) => 0.25 * x); }

    /**
     * 
     * @param {*} ncolumn 
     * @returns 
     */
    scrapeTableColumn(ncolumn) {
        return Array.from(this.table.querySelectorAll(`tbody > tr > td:nth-child(${ncolumn})`));
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
            this.instructor = new _Select("instructor", this.table.instructor),
            this.courseNumber = new _Select("course-number", this.table.courseNumber),
            this.quarter = new _Checkbox("quarter", this.table.quarter, 1),
            this.year = new _InputRange("year", this.table.year, 1),
            this.enrollment = new _InputRange("enrollment", this.table.enrollment, 1),
            this.evaluations = new _InputRange("evaluations", this.table.evaluations, 1),
            this.recommendClass = new _InputRange("recommend-class", this.table.recommendClass, 0.1),
            this.recommendInstructor = new _InputRange("recommend-instructor", this.table.recommendInstructor, 0.1),
            this.studyHoursPerWeek = new _InputRange("study-hours-per-week", this.table.studyHoursPerWeek, 0.01),
            this.averageExpectedGrade = new _InputRange("average-expected-grade", this.table.averageExpectedGrade, 0.01),
            this.averageReceivedGrade = new _InputRange("average-received-grade", this.table.averageReceivedGrade, 0.01)
        ];
    }

    /**
     * 
     */
    get form() {
        const form = document.createElement("form");
        form.id = form.name = "cape-results-filters";
        form.addEventListener("submit", CAPEResultsFilters.formData);

        this.formFields.forEach((x) => { form.appendChild(x.fieldset) });

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
    insertForm() {
        this.removeForm();

        const eTable = document.getElementById("ContentPlaceHolder1_UpdatePanel1").querySelector("div.field");
        eTable.insertAdjacentElement("afterend", this.form);

        if (this.queryParameters.name != "") {
            this.instructor.selectDefaults(this.queryParameters.name);
        }
        else {
            this.instructor.selectDefaults();
        }

        if (this.queryParameters.courseNumber != "") {
            this.courseNumber.selectDefaults(this.queryParameters.courseNumber);
        }
        else {
            this.courseNumber.selectDefaults();
        }

        this.quarter.selectDefaults();
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
        const fieldsSelect = ["instructor", "course-number"];
        const fieldsCheckbox = ["quarter"];
        const fieldsInputRange = [
            "year", "enrollment", "evaluations", "recommend-class", "recommend-instructor",
            "study-hours-per-week", "average-expected-grade", "average-received-grade"
        ];

        fieldsSelect.forEach(
            (x) => {
                const elements = document.getElementById(x).querySelectorAll("option");
                data.set(x, CAPEResultsFilters.dataSelect(elements));
            }
        )
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
    static dataSelect(elements) {
        const data = new Map();
        elements.forEach(
            (e) => { data.set(e.value, e.checked); }
        );
        return data;
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
class _Select {
    /**
     * 
     * @param {*} name 
     * @param {*} values 
     */
    constructor(name, values) {
        this.name = name, this.values = values;

        this.fieldset = _Fieldset.fieldset(this.name);
        this.fieldset.querySelector("legend").appendChild(this.buttonSelectAll());
        this.fieldset.appendChild(this.options());
    }

    /**
     * 
     * @returns 
     */
    options() {
        const select = document.createElement("select");
        select.id = select.name = `${this.name}`;
        select.multiple = true;
        select.addEventListener("change", this.modifyButtonText);

        this.values.forEach(
            (x) => {
                const option = document.createElement("option");
                option.value = option.innerText = x;
                select.appendChild(option);
            }
        );

        return select;
    }

    /**
     * 
     * @returns 
     */
    buttonSelectAll() {
        const button = document.createElement("button");

        button.classList.add("field-select-all");
        button.type = "button";
        button.onmouseover = "style='text-decoration: underline'";
        button.onmouseout = "style='text-decoration: none'";
        button.setAttribute("type", "button");
        button.addEventListener("click", _Select.selectAll);
        button.innerText = "Select All";

        return button;
    }

    /**
     * 
     * @param  {...any} values 
     */
    selectDefaults(...values) {
        const options = Array.from(
            this.fieldset.querySelectorAll(`select#${this.name} > option`)
        );

        if (values.length === 0) {
            options.forEach((e) => { e.selected = true; });
        } else {
            values.forEach((x) => { options[values.indexOf(x)].selected = true; });
        }
    }

    /**
     * 
     * @param {*} event 
     */
    static selectAll(event) {
        const options = Array.from(
            this.parentElement.parentElement.querySelectorAll("select > option")
        );
        if (options.every((e) => e.selected)) { options.forEach((e) => { e.selected = false; }); }
        else { options.forEach((e) => { e.selected = true; }); }
    }

    /**
     * 
     * @param {*} event 
     */
    static modifyButtonText(event) {
        console.log(this);
        const options = Array.from(
            this.parentElement.parentElement.querySelectorAll("select > option")
        );
        this.innerText = (
            options.every((e) => e.selected) ? "De-Select All" : "Select All"
        );
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

        this.values.forEach(
            (x) => {
                const div = document.createElement("div");
                div.classList.add("field-option");

                const input = document.createElement("input");
                input.type = "checkbox";
                input.addEventListener("input", _Checkbox.modifyButtonText);

                const label = document.createElement("label");
                label.innerText = input.value = x;

                input.id = label.setAttribute = `${this.name}-${this.values.indexOf(x)}`;

                div.appendChild(input);
                div.appendChild(label);
                elements.push(div);
            }
        );

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
     * @param  {...any} values 
     */
    selectDefaults(...values) {
        if (values.length === 0) {
            Array.from(
                this.fieldset.querySelectorAll("div.field-option > input[type='checkbox']")
            ).forEach((e) => { e.click(); });
        } else {
            values.forEach(
                (x) => {
                    this.fieldset.querySelector(
                        `div.field-option > input[type='checkbox'][value='${x}']`
                    ).click();
                }
            );
        }
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
    }

    /**
     * 
     * @param {*} button 
     * @returns 
     */
    static modifyButtonText(event) {
        const options = Array.from(
            this.parentElement.parentElement.querySelectorAll("div.field-option > input[type='checkbox']")
        );
        this.innerText = (options.every((e) => e.checked) ? "De-Select All" : "Select All");
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

        this.fields = ["minimum", "maximum"];

        this.fieldset = _Fieldset.fieldset(this.name);
        this.inputs().forEach((e) => { this.fieldset.appendChild(e); });
    }

    /**
     * 
     * @param {*} id 
     * @returns 
     */
    _datalist(id) {
        const datalist = document.createElement("datalist");
        datalist.id = `${id}-list`;
        this.values.forEach(
            (y) => {
                const option = document.createElement("option");
                option.value = option.label = y;
                datalist.appendChild(option);
            }
        );

        return datalist;
    }

    /**
     * 
     * @param {*} id 
     * @param {*} field 
     * @returns 
     */
    _input(id, field) {
        const input = document.createElement("input");
        input.id = id;
        input.min = this.min, input.max = this.max, input.step = this.step;
        input.value = [this.min, this.max][this.fields.indexOf(field)];

        return input;
    }

    /**
     * 
     * @param {*} id 
     * @param {*} field 
     * @returns 
     */
    _inputNumber(id, field) {
        const input = this._input(`${id}-number`, field);
        input.type = "number";
        input.addEventListener("change", _InputRange.validateInputNumber);

        return input;
    }

    /**
     * 
     * @param {*} id 
     * @param {*} field 
     * @returns 
     */
    _inputRange(id, field) {
        const input = this._input(`${id}-range`, field);
        input.type = "range";
        input.setAttribute("list", `${id}-list`);
        input.addEventListener("input", _InputRange.validateInputRange);

        return input;
    }

    /**
     * 
     * @returns 
     */
    inputs() {
        const elements = []

        this.fields.forEach(
            (x) => {
                const div = document.createElement("div");
                div.id = `${this.name}-${x}`;
                div.classList.add("field-range");

                const label = document.createElement("label");
                label.innerText = x[0].toUpperCase().concat(x.slice(1).toLowerCase());

                div.appendChild(label);
                div.appendChild(this._inputNumber(div.id, x));
                div.appendChild(this._inputRange(div.id, x));
                div.appendChild(this._datalist(div.id));
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
        if (this.id.includes("minimum")) {
            other = document.getElementById(
                `${this.parentElement.parentElement.name}-maximum-number`
            );
            if (this.value > other.value) { this.value = other.value; }
        } else if (this.id.includes("maximum")) {
            other = document.getElementById(
                `${this.parentElement.parentElement.name}-minimum-number`
            );
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
        if (this.id.includes("minimum")) {
            other = document.getElementById(
                `${this.parentElement.parentElement.name}-maximum-range`
            );
            if (this.value > other.value) { this.value = other.value; }
        } else if (this.id.includes("maximum")) {
            other = document.getElementById(
                `${this.parentElement.parentElement.name}-minimum-range`
            );
            if (this.value < other.value) { this.value = other.value; }
        } else {
            throw new Error();
        }

        this.previousSibling.value = this.value;
    }
}


chrome.runtime.onMessage.addListener(insertCAPEResultsFilters);
