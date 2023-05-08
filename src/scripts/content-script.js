/**
 * 
 */


/**
 * 
 * @param {*} message 
 * @param {*} sender 
 * @param {*} sendResponse 
 * @returns 
 */
function scrapeCAPEPage(message, sender, sendResponse) {
    let payload;
    switch (message.type) {
        case "results":
            payload = new CAPEResults(
                message.queryParameters.get("Name"),
                message.queryParameters.get("CourseNumber")
            );
        case "report":
            payload = new CAPEReport(
                parseInt(message.queryParameters.get("sectionid"))
            );
        default:
            payload = null;
    }

    sendResponse(payload);

    return true;
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
     * @param {*} name 
     * @param {*} courseNumber 
     */
    constructor(name, courseNumber) {
        this.name = name, this.courseNumber = courseNumber;

        this.results = [];

        this.elementTable = document.querySelector(
            "div#ContentPlaceHolder1_UpdatePanel1 > div > table.styled"
        );

        this.results.push(this.headers);
        this.results.push(...this.scrapeRows());
    }

    /**
     * 
     * @returns 
     */
    scrapeRows() {
        const elementRows = Array.from(this.elementTable.querySelectorAll("tbody > tr")).map(
            (element) => Array.from(element.querySelectorAll("td"))
        );

        let reCourseNumber = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        let reGrade = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;
        let reReportURL = /^CAPEReport\.aspx\?sectionid=(\d+)$/;
        let reTerm = /^(FA|WI|SP|S1|S2)(\d+)$/;

        const res = [];
        for (let i = 0; i < elementRows.length; ++i) {
            const elements = elementRows[i];
            const row = [];

            const href = elements[1].querySelector("a")?.getAttribute("href");
            
            row.push(elements[0].innerText?.trim());
            row.push(elements[1].innerText?.trim());
            row.push(reCourseNumber.exec(elements[1].innerText?.trim())?.at(2));
            row.push(reReportURL.exec(href)?.at(1));
            row.push(href);
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
        }

        return res;
    }
}


/**
 * 
 */
class CAPEReport {

    /**
     * 
     * @param {*} sectionID 
     */
    constructor(sectionID) {
        this.sectionID = sectionID;

        this.report = new Map();

        this.report.set(
            "ReportTitle",
            document.getElementById("ContentPlaceHolder1_lblReportTitle")?.innerText
        );
        this.report.set(
            "CourseDescription",
            document.getElementById("ContentPlaceHolder1_lblCourseDescription")?.innerText
        );
        this.report.set(
            "Instructor",
            document.getElementById("ContentPlaceHolder1_lblInstructorName")?.innerText
        );
        this.report.set(
            "Quarter",
            document.getElementById("ContentPlaceHolder1_lblTermCode")?.innerText
        );
        this.report.set(
            "Enrollment",
            parseInt(document.getElementById("ContentPlaceHolder1_lblEnrollment")?.innerText)
        );
        this.report.set(
            "Evaluations",
            parseInt(document.getElementById("ContentPlaceHolder1_lblEvaluationsSubmitted")?.innerText)
        );

        this.report.set("Statistics", this.scrapeStatistics());
        this.report.set("Grades", this.scrapeGrades());
        this.report.set("Questionnaire", this.scrapeQuestionnaire());
    }
    
    /**
     * 
     * @returns 
     */
    scrapeStatistics() {
        const res = new Map();

        const elementTable = document.getElementById("ContentPlaceHolder1_tblStatistics");
        const elementTData = Array.from(
            elementTable.querySelectorAll("tbody > tr:first-child > td > span")
        );

        const reGrade = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;
        const reResponse = /(\d+\.\d+)\s\((.*)\)/;
        let match;

        const cellData = new Map();

        // "Recommend the instructor"
        match = reGrade.exec(elementTData?.at(0)?.textContent?.trim());
        cellData.set("n", parseInt(match?.at(1)));
        cellData.set("pct", match?.at(1));
        res.set("RecommendInstructor", cellData);
        cellData.clear();

        // "Recommend the course"
        match = reGrade.exec(elementTData?.at(1)?.textContent?.trim());
        cellData.set("n", parseInt(match?.at(1)));
        cellData.set("pct", match?.at(1));
        res.set("RecommendCourse", cellData);
        cellData.clear();

        // "Exams represent the course material"
        match = reResponse.exec(elementTData?.at(2)?.textContent?.trim());
        cellData.set("rating", parseFloat(match?.at(1)));
        cellData.set("response", match?.at(2));
        res.set("ExamsRepresentCourseMaterial", cellData);
        cellData.clear();

        // "Instructor is clear and audible"
        match = reResponse.exec(elementTData?.at(3)?.textContent?.trim());
        cellData.set("rating", parseFloat(match?.at(1)));
        cellData.set("response", match?.at(2));
        res.set("InstructorClearAndAudible", cellData);
        cellData.clear();

        return res;
    }

    /**
     * 
     * @returns 
     */
    scrapeGrades() {
        const grades = {
            expected: "ContentPlaceHolder1_pnlExpectedGrades",
            received: "ContentPlaceHolder1_pnlGradesReceived"
        };

        const res = new Map();

        const reAverageGrade = /^([ABCDF][+\-]?)\saverage\s\((\d+\.\d+)\)$/;

        const keys = Array.from(grades.keys()), values = Array.from(grades.values());
        for (let i = 0; i < grades.size; ++i) {
            const key = keys[i], value = values[i];

            const data = new Map();

            const elementGrade = document.getElementById(value);
            const elementHeader = elementGrade.querySelector("h4 > span");
            const elementTable = elementGrade.querySelector("table.styled");
            const elementTHeader = Array.from(elementTable.querySelectorAll("thead > tr:first-child > th"));
            const elementTData = Array.from(elementHeader.querySelectorAll("tbody > tr")).map(
                (element) => Array.from(element.querySelectorAll("td"))
            );

            const match = reAverageGrade.exec(elementHeader.innerHTML);
            data.set("AverageGrade", match?.at(1));
            data.set("GPA", parseFloat(match?.at(2)));

            const theaders = elementTHeader.map((element) => element.textContent);
            const tdata = elementTData.map(
                (a) => a.map((element) => element.textContent?.split(" ").join(""))
            );

            const gradeData = new Map();
            for (let j = 0; j < theaders.length; ++j) {
                const cellData = new Map();
                cellData.set("n", parseInt(tdata[0][j]));
                cellData.set("pct", tdata[1][j]);
                gradeData.set(theaders[j], cellData);
            }
            data.set("Grades", gradeData);

            res.set(key, data);
        }

        return res;
    }

    /**
     * 
     * @returns 
     */
    scrapeQuestionnaire() {
        return [
            ...Array.from(Array(3).keys()).map((x) => x + 1).map(this.scrapeIndividualQuestion),
            ...Array.from(Array(3).keys()).map((x) => x + 5).map(this.scrapeIndividualQuestion),
            ...Array.from(Array(5).keys()).map((x) => x + 9).map((x) => this.scrapeQuestionGroup(9, x)),
            this.scrapeIndividualQuestion(14),
            ...Array.from(Array(10).keys()).map((x) => x + 16).map((x) => this.scrapeQuestionGroup(16, x)),
            this.scrapeIndividualQuestion(28)
        ];
    }

    /**
     * 
     * @param {*} elementOptions 
     * @param {*} elementResponses 
     * @returns 
     */
    scrapeQuestions(elementOptions, elementResponses) {
        const res = new Map();

        const reGrade = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;

        const textOptions = Array.from(elementOptions.getElementsByTagName("td")).map(
            (element) => element.innerText
        );
        const textResponses = Array.from(elementResponses.getElementsByTagName("td")).slice(1).map(
            (element) => element.innerText
        );

        const options = ["Prompt", ...textOptions.slice(1, -3).map((s) => s.trim()), "n", "mean", "std"];
        const responses = [];

        responses.push(textResponses[0]);
        responses.push(
            ...textResponses.slice(1, -3).map(
                (s) => {
                    const data = new Map();
                    const match = reGrade.exec(s);
                    data.set("n", parseInt(match?.at(1)));
                    data.set("pct", match?.at(2));
                    return data;
                }
            )
        )
        responses.push(parseInt(textResponses.at(-3)?.trim()));
        responses.push(parseFloat((textOptions.at(-2))?.trim()));
        responses.push(parseFloat((textOptions.at(-1))?.trim()));

        options.forEach((x) => { res.set(x, responses[options.indexOf(x)]); });
        return res;
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
        const elementResponses = document.getElementById(idQuestionText);

        return this.scrapeQuestion(elementOptions, elementResponses);
    }
}


chrome.runtime.onMessage.addListener(scrapeCAPEPage);
