/**
 * 
 */


/**
 * 
 * @param {*} message 
 * @param {*} sender 
 * @param {*} sendResponse 
 */
function scrapeCAPEPage(message, sender, sendResponse) {
    let payload;
    switch (message.type) {
        case "CAPEResults":
            payload = new CAPEResults(message.queryParameters.Name, message.queryParameters.CourseNumber);
            break;
        case "CAPEReport":
            payload = new CAPEReport(parseInt(message.queryParameters.sectionid));
            break;
        case "SelfCAPE":
            payload = new SelfCAPE(parseInt(message.queryParameters.SectionId));
            break;
        default:
            payload = null;
    }

    sendResponse(payload);
}


/**
 * 
 */
class CAPEResults {
    capeType = "CAPEResults";

    /**
     * 
     * @param {*} name 
     * @param {*} courseNumber 
     */
    constructor(name, courseNumber) {
        this.name = name, this.courseNumber = courseNumber;

        this.data = [];

        const headers = [
            "instructor", "course", "courseNumber", "sectionID", "reportURL",
            "reportType", "term", "quarter", "year", "enrollment",
            "evaluations", "recommendClass", "recommendInstructor", "studyHoursPerWeek", "avgExpectedGrade",
            "expectedGPA", "avgReceivedGrade", "receivedGPA"
        ];
        this.data.push(headers);
        this.data.push(...this.scrapeRows());
    }

    /**
     * 
     * @returns 
     */
    scrapeRows() {
        const eTable = document.getElementById("ContentPlaceHolder1_gvCAPEs");
        const eTableData = Array.from(eTable.querySelectorAll("tbody > tr")).map(
            (element) => Array.from(element.querySelectorAll("td"))
        );

        let reCourseNumber = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        let reGrade = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;
        let reReportURL = /^(CAPEReport\.aspx\?sectionid=(\d+)|\.\.\/(scripts\/detailedStats\.asp\?SectionId=(\d+)))$/;
        let reTerm = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;

        const res = [];
        for (let i = 0; i < eTableData.length; ++i) {
            const elements = eTableData[i];
            const row = [];

            const href = elements[1].querySelector("a").getAttribute("href");
            const match = reReportURL.exec(href);
            let sectionID = 0, reportType = "", url = "";
            if (match?.at(2)) {
                sectionID = parseInt(match[2]);
                reportType = "CAPEReport";
                url = `https://cape.ucsd.edu/${match[1]}`;
            }
            else if (match?.at(4)) {
                sectionID = parseInt(match[4]);
                reportType = "SelfCAPE";
                url = `https://cape.ucsd.edu/${match[3]}`;
            }
            
            row.push(elements[0].innerText?.trim());
            row.push(elements[1].innerText?.trim());
            row.push(reCourseNumber.exec(elements[1].innerText?.trim())?.at(0));
            row.push(sectionID);
            row.push(url);
            row.push(reportType);
            row.push(elements[2].innerText?.trim());
            row.push(reTerm.exec(elements[2].innerText?.trim())?.at(1));
            row.push(parseInt(reTerm.exec(elements[2].innerText?.trim())?.at(2)));
            row.push(parseInt(elements[3].innerText?.trim()));
            row.push(parseInt(elements[4].innerText?.trim()));
            row.push(elements[5].innerText?.trim());
            row.push(elements[6].innerText?.trim());
            row.push(parseFloat(elements[7].innerText?.trim()));
            row.push(reGrade.exec(elements[8].innerText?.trim())?.at(1));
            row.push(parseFloat(reGrade.exec(elements[8].innerText?.trim())?.at(2)));
            row.push(reGrade.exec(elements[9].innerText?.trim())?.at(1));
            row.push(parseFloat(reGrade.exec(elements[9].innerText?.trim())?.at(2)));

            res.push(row);
        }

        return res;
    }
}


/**
 * 
 */
class CAPEReport {
    capeType = "CAPEReport";

    /**
     * 
     * @param {*} sectionID 
     */
    constructor(sectionID) {
        this.sectionID = sectionID;

        const data = new Map();

        data.set(
            "reportTitle",
            document.getElementById("ContentPlaceHolder1_lblReportTitle").innerText
        );
        data.set(
            "courseDescription",
            document.getElementById("ContentPlaceHolder1_lblCourseDescription").innerText
        );
        data.set(
            "instructor",
            document.getElementById("ContentPlaceHolder1_lblInstructorName").innerText
        );
        data.set(
            "term",
            document.getElementById("ContentPlaceHolder1_lblTermCode").innerText
        );
        data.set(
            "enrollment",
            parseInt(document.getElementById("ContentPlaceHolder1_lblEnrollment").innerText)
        );
        data.set(
            "evaluations",
            parseInt(document.getElementById("ContentPlaceHolder1_lblEvaluationsSubmitted").innerText)
        );

        data.set("statistics", this.scrapeStatistics());
        data.set("grades", this.scrapeGrades());
        data.set("questionnaire", this.scrapeQuestionnaire());

        this.data = Object.fromEntries(data.entries());
    }
    
    /**
     * 
     * @returns 
     */
    scrapeStatistics() {
        const res = new Map();

        const eTable = document.getElementById("ContentPlaceHolder1_tblStatistics");
        const eTableData = Array.from(eTable.querySelectorAll("tbody > tr:first-child > td > span"));

        let re, match;

        re = /^(\d+)\s(\d+%)$/;

        // "Recommend the instructor"
        match = re.exec(eTableData[0].innerText.trim());
        res.set("recommendInstructor", {n: parseInt(match[1]), pct: match[2]});

        // "Recommend the course"
        match = re.exec(eTableData[1].innerText.trim());
        res.set("recommendCourse", {n: parseInt(match[1]), pct: match[2]});

        re = /(\d+\.\d+)\s\((.*)\)/;

        // "Exams represent the course material"
        match = re.exec(eTableData[2].innerText.trim());
        res.set("examsRepresentCourseMaterial", {avgRating: parseFloat(match[1]), avgResponse: match[2]});

        // "Instructor is clear and audible"
        match = re.exec(eTableData[3].innerText.trim());
        res.set("instructorClearAndAudible", {avgRating: parseFloat(match[1]), avgResponse: match[2]});

        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeGrades() {
        const res = new Map();

        const grades = new Map();
        grades.set("expected", "ContentPlaceHolder1_pnlExpectedGrades");
        grades.set("received", "ContentPlaceHolder1_pnlGradesReceived");

        const re = /^([ABCDF][+\-]?)\saverage\s\((\d+\.\d+)\)$/;

        const keys = Array.from(grades.keys()), values = Array.from(grades.values());
        for (let i = 0; i < grades.size; ++i) {
            const data = new Map();

            const eGrade = document.getElementById(values[i]);
            const eTable = eGrade.querySelector("table.styled");
            const eHeaders = Array.from(eTable.querySelectorAll("thead > tr:first-child > th"));
            const eDataRow = Array.from(eTable.querySelectorAll("tbody > tr:nth-child(2) > td"));
            const ePercentageRow = Array.from(eTable.querySelectorAll("tbody > tr:nth-child(2) > td"));

            const match = re.exec(eGrade.querySelector("h4 > span").innerHTML);
            const headers = eHeaders.map((e) => e.innerText);
            
            data.set("avgGrade", match[1]);
            data.set("gpa", parseFloat(match[2]));
            headers.forEach(
                (x) => {
                    const index = headers.indexOf(x);
                    data.set(
                        x, {
                            n: parseInt(eDataRow[index].innerText.trim()),
                            pct: ePercentageRow[index].innerText.trim().split(" ").join("")
                        }
                    );
                }
            );

            res.set(keys[i], Object.fromEntries(data));
        }

        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeQuestionnaire() {
        return [
            ...Array.from(Array(3).keys()).map((x) => x + 1).map((x) => this._scrapeIndividualQuestion(x)),
            ...Array.from(Array(3).keys()).map((x) => x + 5).map((x) => this._scrapeIndividualQuestion(x)),
            ...Array.from(Array(5).keys()).map((x) => x + 9).map((x) => this._scrapeQuestionGroup(9, x)),
            this._scrapeIndividualQuestion(14),
            ...Array.from(Array(10).keys()).map((x) => x + 16).map((x) => this._scrapeQuestionGroup(16, x)),
            this._scrapeIndividualQuestion(28)
        ];
    }

    /**
     * 
     * @param {*} nChoiceText 
     * @returns 
     */
    _scrapeIndividualQuestion(nChoiceText) {
        const idChoiceText = `ContentPlaceHolder1_dlQuestionnaire_trChoiceText_${nChoiceText}`;
        const idQuestionText = `ContentPlaceHolder1_dlQuestionnaire_tdQuestionText_${nChoiceText}`;
        
        const containerOptions = document.getElementById(idChoiceText);
        const containerResponses = document.getElementById(idQuestionText);
        
        return this._scrapeQuestion(containerOptions, containerResponses);
    }

    /**
     * 
     * @param {*} nChoiceText 
     * @param {*} nQuestionText 
     * @returns 
     */
    _scrapeQuestionGroup(nChoiceText, nQuestionText) {
        const idChoiceText = `ContentPlaceHolder1_dlQuestionnaire_trChoiceText_${nChoiceText}`;
        const idQuestionText = `ContentPlaceHolder1_dlQuestionnaire_tdQuestionText_${nQuestionText}`;

        const containerOptions = document.getElementById(idChoiceText);
        const containerResponses = document.getElementById(idQuestionText);

        return this._scrapeQuestion(containerOptions, containerResponses);
    }

    /**
     * 
     * @param {*} eOptionsContainer 
     * @param {*} eResponsesContainer 
     * @returns 
     */
    _scrapeQuestion(eOptionsContainer, eResponsesContainer) {
        const res = new Map();

        const re = /^(\d+)<br>(\d+%)<br>$/;

        const eOptions = Array.from(eOptionsContainer.querySelectorAll("td")).slice(1);
        const eResponses = Array.from(eResponsesContainer.parentElement.querySelectorAll("td span")).slice(1);

        const options = [
            "prompt",
            ...eOptions.slice(0, -3).map((e) => (e.innerText.trim())),
            "n", "mean", "std"
        ];
        const responses = [
            eResponses[0].innerText.trim(),
            ...eResponses.slice(1, -3).map(
                (e) => {
                    const match = re.exec(e.innerHTML);
                    return {n: parseInt(match[1]), pct: match[2]};
                }
            ),
            parseInt(eResponses.at(-3).innerText.trim()),
            parseFloat(eResponses.at(-2).innerText.trim()),
            parseFloat(eResponses.at(-1).innerText.trim())
        ];

        options.forEach((x) => { res.set(x, responses[options.indexOf(x)]); });
        return Object.fromEntries(res);
    }
}


/**
 * 
 */
class SelfCAPE {
    capeType = "SelfCAPE";

    /**
     * 
     * @param {*} sectionID 
     */
    constructor(sectionID) {
        this.sectionID = sectionID;

        const data = new Map();

        const re = /\d+$/;
        const eTable = document.querySelector("table:nth-child(1)");
        data.set("subject", eTable.querySelector("tbody > tr:first-child > td:nth-child(1)").innerText.trim());
        data.set("courseNumber", eTable.querySelector("tbody > tr:first-child > td:nth-child(2)").innerText.trim());
        data.set("instructor", eTable.querySelector("tbody > tr:first-child > td:nth-child(4)").innerText.trim());
        data.set("term", eTable.querySelector("tbody > tr:first-child > td:nth-child(5)").innerText.trim());
        data.set(
            "enrollment",
            parseInt(re.exec(eTable.querySelector("tbody > tr:last-child > td:nth-child(4)").innerText.trim())?.at(0))
        );
        data.set(
            "evaluations",
            parseInt(re.exec(eTable.querySelector("tbody > tr:last-child > td:nth-child(5)").innerText.trim())?.at(0))
        )

        data.set("classLevel", this.scrapeClassLevel());
        data.set("enrollmentReason", this.scrapeEnrollmentReason());
        data.set("expectedGrade", this.scrapeExpectedGrade());
        data.set("questionnaire", this.scrapeQuestionnaire());
        data.set("studyHoursPerWeek", this.scrapeStudyHoursPerWeek());
        data.set("attendanceFrequency", this.scrapeAttendanceFrequency());
        data.set("recommendCourse", this.scrapeRecommendCourse());
        data.set("recommendInstructor", this.scrapeRecommendInstructor());

        this.data = Object.fromEntries(data.entries());
    }

    /**
     * 
     * @param {*} cssTable 
     * @param {*} cssHeaders 
     * @returns 
     */
    _scrapeTableHeaders(cssTable, cssHeaders) {
        return Array.from(document.querySelectorAll(`${cssTable} ${cssHeaders}`)).map(
            (e) => e.innerText.trim()
        );
    }

    /**
     * 
     * @param {*} cssTable 
     * @param {*} cssPrompt 
     * @returns 
     */
    _scrapeTablePrompt(cssTable, cssPrompt) {
        return document.querySelector(`${cssTable} ${cssPrompt}`).innerText.trim();
    }

    /**
     * 
     * @param {*} cssTable 
     * @param {*} cssData 
     * @param {*} cssPercentages 
     * @returns 
     */
    _scrapeTableContent(cssTable, cssData, cssPercentages) {
        const eData = document.querySelectorAll(`${cssTable} ${cssData}`);
        const ePercentages = document.querySelectorAll(`${cssTable} ${cssPercentages}`);

        const res = [];
        for (let i = 0; i < (eData.length < ePercentages.length ? eData.length : ePercentages.length); ++i) {
            res.push({n: parseInt(eData[i].innerText.trim()), pct: ePercentages[i].innerText.trim()});
        }
        return res
    }

    /**
     * 
     * @returns 
     */
    scrapeClassLevel() {
        const res = new Map();

        const css = {
            table: "table:nth-child(2)",
            headers: "tr:nth-child(1) > th",
            prompt: "tr:nth-child(2) > td:nth-child(2)",
            data: "tr:nth-child(2) > td",
            percentages: "tr:nth-child(3) > td"
        };

        const headers = [
            "prompt", ...this._scrapeTableHeaders(css.table, css.headers).slice(0, -1), "n"
        ];
        const data = [
            this._scrapeTablePrompt(css.table, css.prompt),
            ...this._scrapeTableContent(css.table, css.data, css.percentages).slice(3, -1),
            parseInt(document.querySelector(`${css.table} ${css.data}:nth-last-child(1)`).innerText.trim())
        ];

        headers.forEach((x) => { res.set(x, data[headers.indexOf(x)]); });
        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeEnrollmentReason() {
        const res = new Map();

        const css = {
            table: "table:nth-child(3)",
            headers: "tr:nth-child(1) > th",
            prompt: "tr:nth-child(2) > td:nth-child(2)",
            data: "tr:nth-child(2) > td:nth-child(2) ~ td",
            percentages: "tr:nth-child(3) > td:nth-child(3) ~ td"
        };

        const headers = [
            "prompt", ...this._scrapeTableHeaders(css.table, css.headers).slice(0, -2), "n"
        ];
        const data = [
            this._scrapeTablePrompt(css.table, css.prompt),
            ...this._scrapeTableContent(css.table, css.data, css.percentages).slice(0, -2),
            parseInt(document.querySelector(`${css.table} ${css.data}:nth-last-child(1)`).innerText.trim()),
        ];

        headers.forEach((x) => { res.set(x, data[headers.indexOf(x)]); });
        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeExpectedGrade() {
        const res = new Map();

        const css = {
            table: "table:nth-child(4)",
            headers: "tr:nth-child(1) > th",
            prompt: "tr:nth-child(2) > td:nth-child(2)",
            data: "tr:nth-child(2) > td:nth-child(2) ~ td",
            percentages: "tr:nth-child(3) > td:nth-child(3) ~ td"
        };

        const headers = [
            "prompt", ...this._scrapeTableHeaders(css.table, css.headers).slice(0, -2), "n", "expectedGPA"
        ];
        const data = [
            this._scrapeTablePrompt(css.table, css.prompt),
            ...this._scrapeTableContent(css.table, css.data, css.percentages).slice(0, -2),
            parseInt(document.querySelector(`${css.table} ${css.data}:nth-last-child(2)`).innerText.trim()),
            parseFloat(document.querySelector(`${css.table} ${css.data}:nth-last-child(1)`).innerText.trim())
        ];

        headers.forEach((x) => { res.set(x, data[headers.indexOf(x)]); });
        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeQuestionnaire() {
        const res = [];

        const eTable = document.querySelector("table:nth-child(5)");
        const eHeaders = Array.from(eTable.querySelectorAll("tr:first-child > td"));
        const eDataRows = Array.from(eTable.querySelectorAll("tr:first-child ~ tr:nth-child(even)"));
        const ePercentageRows = Array.from(eTable.querySelectorAll("tr:first-child ~ tr:nth-child(odd)"));

        const headers = eHeaders.slice(3, -3).map((e) => e.innerText.trim());
        for (let i = 0; i < eDataRows.length; ++i) {
            const eData = Array.from(eDataRows[i].querySelectorAll("td")).slice(2);
            const ePercentages = Array.from(ePercentageRows[i].querySelectorAll("td")).slice(3);
            const ePrompt = eDataRows[i].querySelector("td:nth-child(2)");

            const data = new Map();
            data.set("prompt", ePrompt.innerText.trim());
            data.set(headers[0], parseInt(eData[2].innerText.trim()));
            for (let j = 1; j < headers.length; ++j) {
                data.set(
                    headers[j], {n: parseInt(eData[j].innerText.trim()), pct: ePercentages[j].innerText.trim()}
                );
            }
            data.set("n", parseInt(eData[eData.length - 3].innerText.trim()));
            data.set("mean", parseFloat(eData[eData.length - 2].innerText.trim()));
            data.set("std", parseFloat(eData[eData.length - 1].innerText.trim()));

            res.push(Object.fromEntries(data.entries()));
        }

        return res;
    }

    /**
     * 
     * @returns 
     */
    scrapeStudyHoursPerWeek() {
        const res = new Map();

        const css = {
            table: "table:nth-child(6)",
            headers: "tr:nth-child(1) > td",
            prompt: "tr:nth-child(2) > td:nth-child(2)",
            data: "tr:nth-child(2) > td",
            percentages: "tr:nth-child(3) > td"
        };

        const headers = [
            "prompt", ...this._scrapeTableHeaders(css.table, css.headers).slice(2, -2), "n", "mean"
        ];
        const data = [
            this._scrapeTablePrompt(css.table, css.prompt),
            ...this._scrapeTableContent(css.table, css.data, css.percentages).slice(2, -2),
            parseInt(document.querySelector(`${css.table} ${css.data}:nth-last-child(2)`).innerText.trim()),
            parseFloat(document.querySelector(`${css.table} ${css.data}:nth-last-child(1)`).innerText.trim())
        ]

        headers.forEach((x) => { res.set(x, data[headers.indexOf(x)]); });
        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeAttendanceFrequency() {
        const res = new Map();

        const css = {
            table: "table:nth-child(7)",
            headers: "tr:nth-child(1) > td",
            prompt: "tr:nth-child(2) > td:nth-child(2)",
            data: "tr:nth-child(2) > td",
            percentages: "tr:nth-child(3) > td"
        };

        const headers = [
            "prompt", ...this._scrapeTableHeaders(css.table, css.headers).slice(2, -2), "n"
        ];
        const data = [
            this._scrapeTablePrompt(css.table, css.prompt),
            ...this._scrapeTableContent(css.table, css.data, css.percentages).slice(2, -2),
            parseInt(document.querySelector(`${css.table} ${css.data}:nth-last-child(2)`).innerText.trim())
        ];

        headers.forEach((x) => { res.set(x, data[headers.indexOf(x)]); });
        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeRecommendCourse() {
        const res = new Map();

        const css = {
            table: "table:nth-child(8)",
            prompt: "tr:nth-child(2) > td:nth-child(2)",
            data: "tr:nth-child(2) > td",
            percentages: "tr:nth-child(3) > td"
        };

        const headers = ["prompt", "No", "Yes", "n"];
        const data = [
            this._scrapeTablePrompt(css.table, css.prompt),
            ...this._scrapeTableContent(css.table, css.data, css.percentages).slice(2, -2),
            parseInt(document.querySelector(`${css.table} ${css.data}:nth-last-child(2)`).innerText.trim())
        ];

        headers.forEach((x) => { res.set(x, data[headers.indexOf(x)]); });
        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeRecommendInstructor() {
        const res = new Map();

        const css = {
            table: "table:nth-child(9)",
            prompt: "tr:nth-child(1) > td:nth-child(2)",
            data: "tr:nth-child(1) > td",
            percentages: "tr:nth-child(2) > td"
        };

        const headers = ["prompt", "No", "Yes", "n"];
        const data = [
            this._scrapeTablePrompt(css.table, css.prompt),
            ...this._scrapeTableContent(css.table, css.data, css.percentages).slice(2, -2),
            parseInt(document.querySelector(`${css.table} ${css.data}:nth-last-child(2)`).innerText.trim())
        ];

        headers.forEach((x) => { res.set(x, data[headers.indexOf(x)]); });
        return Object.fromEntries(res.entries());
    }
}


chrome.runtime.onMessage.addListener(scrapeCAPEPage);
