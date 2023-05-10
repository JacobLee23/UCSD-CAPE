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
        case "results":
            payload = new CAPEResults(message.queryParameters.Name, message.queryParameters.CourseNumber);
            break;
        case "report":
            payload = new CAPEReport(parseInt(message.queryParameters.sectionid));
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
    capeType = "results";

    /**
     * 
     * @param {*} name 
     * @param {*} courseNumber 
     */
    constructor(name, courseNumber) {
        this.name = name, this.courseNumber = courseNumber;

        this.results = [];

        const headers = [
            "instructor", "course", "courseNumber", "sectionID", "reportURL",
            "reportType", "term", "quarter", "year", "enrollment",
            "evaluations", "recdClass", "recdInstructor", "studyHoursPerWeek", "avgExpectedGrade",
            "expectedGPA", "avgReceivedGrade", "receivedGPA"
        ];
        this.results.push(headers);
        this.results.push(...this.scrapeRows());
    }

    /**
     * 
     * @returns 
     */
    scrapeRows() {
        const elementTable = document.getElementById("ContentPlaceHolder1_gvCAPEs");
        const elementRows = Array.from(elementTable.querySelectorAll("tbody > tr")).map(
            (element) => Array.from(element.querySelectorAll("td"))
        );

        let reCourseNumber = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        let reGrade = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;
        let reReportURL = /^(CAPEReport\.aspx\?sectionid=(\d+)|\.\.\/(scripts\/detailedStats\.asp\?SectionId=(\d+)))$/;
        let reTerm = /^(FA|WI|SP|SU|S1|S2)(\d+)$/;

        const res = [];
        for (let i = 0; i < elementRows.length; ++i) {
            const elements = elementRows[i];
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
                reportType = "DetailedStats";
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

            console.log(row);
        }

        return res;
    }
}


/**
 * 
 */
class CAPEReport {
    capeType = "report";

    /**
     * 
     * @param {*} sectionID 
     */
    constructor(sectionID) {
        this.sectionID = sectionID;

        const report = new Map();

        report.set(
            "reportTitle",
            document.getElementById("ContentPlaceHolder1_lblReportTitle")?.innerText
        );
        report.set(
            "courseDescription",
            document.getElementById("ContentPlaceHolder1_lblCourseDescription").innerText
        );
        report.set(
            "instructor",
            document.getElementById("ContentPlaceHolder1_lblInstructorName").innerText
        );
        report.set(
            "quarter",
            document.getElementById("ContentPlaceHolder1_lblTermCode").innerText
        );
        report.set(
            "enrollment",
            parseInt(document.getElementById("ContentPlaceHolder1_lblEnrollment").innerText)
        );
        report.set(
            "evaluations",
            parseInt(document.getElementById("ContentPlaceHolder1_lblEvaluationsSubmitted").innerText)
        );

        report.set("statistics", this.scrapeStatistics());
        report.set("grades", this.scrapeGrades());
        report.set("questionnaire", this.scrapeQuestionnaire());

        this.report = Object.fromEntries(report.entries());
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

        const reGrade = /^(\d+)\s(\d+%)$/;
        const reResponse = /(\d+\.\d+)\s\((.*)\)/;
        let match;

        // "Recommend the instructor"
        match = reGrade.exec(elementTData[0].innerText.trim());
        res.set(
            "recdInstructor",
            {n: parseInt(match[1]), pct: match[2]}
        );

        // "Recommend the course"
        match = reGrade.exec(elementTData[1].innerText.trim());
        res.set(
            "recdCourse",
            {n: parseInt(match[1]), pct: match[2]}
        );

        // "Exams represent the course material"
        match = reResponse.exec(elementTData[2].innerText.trim());
        res.set(
            "examsRepresentCourseMaterial",
            {avgRating: parseFloat(match[1]), avgResponse: match[2]}
        );

        // "Instructor is clear and audible"
        match = reResponse.exec(elementTData[3].innerText.trim());
        res.set(
            "instructorClearAndAudible",
            {avgRating: parseFloat(match[1]), avgResponse: match[2]}
        );

        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeGrades() {
        const grades = new Map();
        grades.set("expected", "ContentPlaceHolder1_pnlExpectedGrades");
        grades.set("received", "ContentPlaceHolder1_pnlGradesReceived");

        const res = new Map();

        const reAverageGrade = /^([ABCDF][+\-]?)\saverage\s\((\d+\.\d+)\)$/;

        let key, value;
        let entries = Array.from(grades.entries());
        for (let i = 0; i < grades.size; ++i) {
            [key, value] = entries[i];

            const data = new Map();

            const elementGrade = document.getElementById(value);
            const elementHeader = elementGrade.querySelector("h4 > span");
            const elementTable = elementGrade.querySelector("table.styled");
            const elementTHeader = Array.from(elementTable.querySelectorAll("thead > tr:first-child > th"));
            const elementTData = Array.from(elementTable.querySelectorAll("tbody > tr")).map(
                (element) => Array.from(element.querySelectorAll("td"))
            );

            const match = reAverageGrade.exec(elementHeader.innerHTML);
            data.set("avgGrade", match?.at(1));
            data.set("gpa", parseFloat(match?.at(2)));

            const theaders = elementTHeader.map((element) => element.textContent);
            const tdata = elementTData.map(
                (a) => a.map((element) => element.textContent?.split(" ").join(""))
            );

            const gradeData = new Map();
            for (let j = 0; j < theaders.length; ++j) {
                gradeData.set(theaders[j], {n: parseInt(tdata[0][j]), pct: tdata[1][j]});
            }
            data.set("grades", Object.fromEntries(gradeData));

            res.set(key, Object.fromEntries(data));
        }

        return Object.fromEntries(res.entries());
    }

    /**
     * 
     * @returns 
     */
    scrapeQuestionnaire() {
        return [
            ...Array.from(Array(3).keys()).map((x) => x + 1).map((x) => this.scrapeIndividualQuestion(x)),
            ...Array.from(Array(3).keys()).map((x) => x + 5).map((x) => this.scrapeIndividualQuestion(x)),
            ...Array.from(Array(5).keys()).map((x) => x + 9).map((x) => this.scrapeQuestionGroup(9, x)),
            this.scrapeIndividualQuestion(14),
            ...Array.from(Array(10).keys()).map((x) => x + 16).map((x) => this.scrapeQuestionGroup(16, x)),
            this.scrapeIndividualQuestion(28)
        ];
    }

    /**
     * 
     * @param {*} nChoiceText 
     * @returns 
     */
    scrapeIndividualQuestion(nChoiceText) {
        const idChoiceText = `ContentPlaceHolder1_dlQuestionnaire_trChoiceText_${nChoiceText}`;
        const idQuestionText = `ContentPlaceHolder1_dlQuestionnaire_tdQuestionText_${nChoiceText}`;
        
        const containerOptions = document.getElementById(idChoiceText);
        const containerResponses = document.getElementById(idQuestionText);
        
        return this.scrapeQuestion(containerOptions, containerResponses);
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

        const containerOptions = document.getElementById(idChoiceText);
        const containerResponses = document.getElementById(idQuestionText);

        return this.scrapeQuestion(containerOptions, containerResponses);
    }

    /**
     * 
     * @param {*} containerOptions 
     * @param {*} containerResponses 
     * @returns 
     */
    scrapeQuestion(containerOptions, containerResponses) {
        const res = new Map();

        const reGrade = /^(\d+)<br>(\d+%)<br>$/;

        const elementOptions = Array.from(containerOptions.querySelectorAll("td")).slice(1);
        const elementResponses = Array.from(containerResponses.parentElement.querySelectorAll("td span")).slice(1);
        const textOptions = elementOptions.map((element) => element.innerText.trim());
        const textResponses = elementResponses.map((element) => element.innerText.trim());

        const options = ["prompt", ...textOptions.slice(0, -3), "n", "mean", "std"];
        const responses = [];

        responses.push(textResponses[0]);
        responses.push
        responses.push(
            ...Array.from(elementResponses).slice(1, -3).map(
                (e) => {
                    const match = reGrade.exec(e.innerHTML);
                    return {n: parseInt(match[1]), pct: match[2]};
                }
            )
        )
        responses.push(parseInt(textResponses.at(-3)));
        responses.push(parseFloat((textResponses.at(-2))));
        responses.push(parseFloat((textResponses.at(-1))));

        options.forEach((x) => { res.set(x, responses[options.indexOf(x)]); });
        return Object.fromEntries(res);
    }
}


chrome.runtime.onMessage.addListener(scrapeCAPEPage);
