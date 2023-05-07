RE = {
    averageGrade: /^([ABCDF][+\-]?)\saverage\s\((\d+\.\d+)\)$/,
    courseNumber: /^(\w{3,4})\s(\d{1,3}\w{0,2})/,
    float: /(\d+)\s(\d+%)/,
    grade: /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/,
    reportURL: /^CAPEReport\.aspx\?sectionid=(\d+)$/,
    response: /(\d+\.\d+)\s\((.*)\)/,
    term: /^(FA|WI|SP|S1|S2)(\d+)$/
}


/**
 * 
 */
class CAPEResults {
    headers = [
        "Instructor", "Course", "CourseNumber", "SectionNumber", "ReportURL",
        "Term", "Quarter", "Year", "Enrollment", "Evaluations",
        "RecommendClass", "RecommendInstructor", "StudyHoursPerWeek", "AverageExpectedGrade", "expectedGPA",
        "AverageReceivedGrade", "ReceivedGPA"
    ]

    /**
     * 
     * @param {*} queryParameters 
     */
    constructor(queryParameters) {
        this.name, this.courseNumber = queryParameters.values();

        this.results = [];

        this.elementTable = document.querySelector(
            "div#ContentPlaceHolder1_UpdatePanel1 > div > table.styled"
        );

        this.results.push(this.scrapeHeaders());
        this.results.push(...this.scrapeRows());
    }

    /**
     * 
     * @returns 
     */
    scrapeRows() {
        const elementRows = [...this.elementTable.querySelectorAll("tbody > tr")].map(
            (element) => [...element.querySelectorAll("td")]
        );

        const res = [
            elementRows.map((elements) => elements[0].innerText.trim()),
            elementRows.map((elements) => elements[1].innerText.trim()),
            elementRows.map((elements) => RE.courseNumber.exec(elements[1].innerText.trim())[2]),
            elementRows.map((elements) => parseInt(RE.reportURL.exec(elements[1].querySelector("a").getAttribute("href"))[1])),
            elementRows.map((elements) => elements[1].querySelector("a").getAttribute("href")),
            
            elementRows.map((elements) => elements[2].innerText.trim()),
            elementRows.map((elements) => RE.term.exec(elements[2].innerText.trim())[1]),
            elementRows.map((elements) => parseInt(re[2].exec(elements[2].innerText.trim())[2])),
            elementRows.map((elements) => parseInt(elements[3].innerText.trim())),
            elementRows.map((elements) => parseInt(elements[4].innerText.trim())),
            
            elementRows.map((elements) => elements[5].innerText.trim()),
            elementRows.map((elements) => elements[6].innerText.trim()),
            elementRows.map((elements) => parseFloat(elements[7].innerText.trim())),
            elementRows.map((elements) => RE.grade.exec(elements[8].innerText.trim())[1]),
            elementRows.map((elements) => parseFloat(re[3].exec(elements[8].innerText.trim())[2])),
            
            elementRows.map((elements) => RE.grade.exec(elements[9].innerText.trim())[1]),
            elementRows.map((elements) => parseFloat(re[3].exec(elements[9].innerText.trim())[2])),
        ];

        return res;
    }
}


/**
 * 
 */
class CAPEReport {

    /**
     * 
     * @param {*} queryParameters 
     */
    constructor(queryParameters) {
        this.sectionId = parseInt(queryParameters.get("sectionid"));

        this.report = new Map(
            [
                ["ReportTitle", document.getElementById("ContentPlaceHolder1_lblReportTitle").innerText],
                ["CourseDescription", document.getElementById("ContentPlaceHolder1_lblCourseDescription").innerText],
                ["Instructor", document.getElementById("ContentPlaceHolder1_lblInstructorName").innerText],
                ["Quarter", document.getElementById("ContentPlaceHolder1_lblTermCode").innerText],
                ["Enrollment", parseInt(document.getElementById("ContentPlaceHolder1_lblEnrollment").innerText)],
                ["Evaluations", parseInt(document.getElementById("ContentPlaceHolder1_lblEvaluationsSubmitted").innerText)],
            ]
        );

        this.report.set("Statistics", this.scrapeStatistics());
        this.report.set("Grades", this.scrapeGrades());
        this.report.set("Questionnaire", this.scrapeQuestionnaire())
    }

    /**
     * 
     * @returns 
     */
    scrapeStatistics() {
        const res = new Map();

        const elementTable = document.getElementById("ContentPlaceHolder1_tblStatistics");
        const elementTData = elementTable.querySelectorAll("tbody > tr:first-child > td > span");

        let match;

        // "Recommend the instructor"
        match = RE.grade.exec(elementTData[0].innerText.trim());
        res.set("recommendInstructor", new Map([["n", parseInt(match[1])], ["pct", match[2]]]));

        // "Recommend the course"
        match = RE.grade.exec(elementTData[1].innerText.trim());
        res.set("recommendCourse", new Map([["n", parseInt(match[1])], ["pct", match[2]]]));

        // "Exams represent the course material"
        match = RE.response.exec(elementTData[2].innerText.trim());
        res.set("examsRepresentCourseMaterial", new Map([["n", parseFloat(match[1])], ["response", match[2]]]));

        // "Instructor is clear and audible"
        match = RE.response.exec(elementTData[3].innerText.trim());
        res.set("instructorClearAndAudible", new Map([["n", parseFloat(match[1])], ["response", match[2]]]));

        return res;
    }

    /**
     * 
     * @returns 
     */
    scrapeGrades() {
        const grades = new Map(
            [
                ["expected", "ContentPlaceHolder1_pnlExpectedGrades"],
                ["received", "ContentPlaceHolder1_pnlGradesReceived"]
            ]
        );
        const res = new Map();

        [...grades.entries()].forEach(
            (key, value) => {
                const data = new Map();
                const gradeElement = document.getElementById(value);

                const element = gradeElement.querySelector("h4 > span");
                data.set("averageGrade", RE.averageGrade.exec(element.innerText)[1]);
                data.set("GPA", parseFloat(RE.averageGrade.exec(element.innerText)[2]));

                const elementTable = gradeElement.querySelector("table.styled");
                const elementTHeader = [...elementTable.querySelectorAll("thead > tr:first-child > th")];
                const elementTData = [...elementTable.querySelectorAll("tbody > tr")].map(
                    (element) => [...element.querySelectorAll("td")]
                )
                const theaders = elementTHeader.map((element) => element.innerText);
                const tdata = elementTData.map((a) => a.map((element) => element.innerText.split(" ").join("")))

                gradeData = new Map()
                theaders.forEach(
                    (header) => {
                        const index = theaders.indexOf(header);
                        gradeData.set(header, new Map([["n", parseInt(tdata[0][index])], ["pct", tdata[1][index]]]))
                    }
                )
                data.set("grades", gradeData);

                res.set(key, data);
            }
        )

        return res;
    }

    /**
     * 
     * @returns 
     */
    scrapeQuestionnaire() {
        return [
            ...[...Array(3).keys()].map((x) => x + 1).map(this.scrapeIndividualQuestion),
            ...[...Array(3).keys()].map((x) => x + 5).map(this.scrapeIndividualQuestion),
            ...[...Array(5).keys()].map((x) => x + 9).map((x) => this.scrapeQuestionGroup(9, x)),
            this.scrapeIndividualQuestion(14),
            ...[...Array(10).keys()].map((x) => x + 16).map((x) => this.scrapeQuestionGroup(16, x)),
            this.scrapeIndividualQuestion(28)
        ];
    }

    /**
     * 
     * @param {*} elementOptions 
     * @param {*} elementResponses 
     * @returns 
     */
    scrapeQuestion(elementOptions, elementResponses) {
        const textOptions = [...elementOptions.getElementsByTagName("td")].map(
            (element) => element.innerText
        );
        const textResponses = [...elementResponses.getElementsByTagName("td")].slice(1).map(
            (element) => element.innerText
        );

        const options = ["Prompt", ...textOptions.slice(1, -3).map((s) => s.trim()), "n", "mean", "std"];
        const responses = [
            textResponses[0],
            ...textResponses.slice(1, -3).map(
                (s) => {
                    match = RE.grade.exec(s);
                    return new Map([["n", parseInt(match[1])], ["pct", match[2]]]);
                }
            ),
            parseInt(textResponses.at(-3).trim()),
            parseFloat(textOptions.at(-2).trim()),
            parseFloat(textOptions.at(-1).trim())
        ];

        const data = options.map((x) => [x, responses[options.indexOf(x)]]);
        return new Map(data);
    }

    /**
     * 
     * @param {*} nChoiceText 
     * @returns 
     */
    scrapeIndividualQuestion(nChoiceText) {
        const id = `ContentPlaceHolder1_dlQuestionnaire_trChoiceText_${nChoiceText}`;
        
        const elementOptions = document.getElementById(id);
        const elementResponses = elementOptions.nextElementSibling;
        
        return this.scrapeQuestion(elementOptions, elementResponses);
    }
    
    /**
     * 
     * @param {*} nChoiceText 
     * @param {*} nQuestionText 
     * @returns 
     */
    scrapeQuestionGroup(nChoiceText, nQuestionText) {
        const idChoiceText = `ContentPlaceHolder1_dlQuestionnaire_trChoiceText_${nChoiceText}`;
        const idQuestionText = `ContentPlaceHolder1_dlQuestionnaire_tdQuestionText_${nQuestionText}`;

        const elementOptions = document.getElementById(idChoiceText);
        const elementResponses = elementOptions.getElementById(idQuestionText);

        return this.scrapeQuestion(elementOptions, elementResponses);
    }
}
