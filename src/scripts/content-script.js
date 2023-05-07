class CAPEResults {
    headers = [
        "instructor", "course", "subject", "courseNumber", "sectionNumber",
        "reportURL", "term", "quarter", "year", "enrollment",
        "evaluations", "recommendClass", "recommendInstructor", "studyHoursPerWeek", "averageExpectedGrade",
        "expectedGPA", "averageReceivedGrade", "receivedGPA"
    ]

    constructor() {
        this.results = [];

        this.elementTable = document.querySelector(
            "div#ContentPlaceHolder1_UpdatePanel1 > div > table.styled"
        );

        this.results.push(this.scrapeHeaders());
        this.results.push(...this.scrapeRows());

        this.resultsJSON = JSON.stringify(this.results);
    }

    scrapeRows() {
        const elementRows = [...this.elementTable.querySelectorAll("tbody > tr")].map(
            (element) => { return [...element.querySelectorAll("td")]; }
        );

        re = [
            /^(\w{3,4})\s(\d{1,3}\w{0,2})/,
            /^CAPEReport\.aspx\?sectionid=(\d+)$/,
            /^(FA|WI|SP|S1|S2)(\d+)$/,
            /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/,
        ];

        const res = [
            elementRows.map((elements) => { return elements[0].innerText.trim() }),
            elementRows.map((elements) => { return elements[1].innerText.trim() }),
            elementRows.map((elements) => { return re[0].exec(elements[1].innerText.trim())[1] }),
            elementRows.map((elements) => { return re[0].exec(elements[1].innerText.trim())[2] }),
            elementRows.map((elements) => { return parseInt(re[1].exec(elements[1].querySelector("a").getAttribute("href"))[1]) }),

            elementRows.map((elements) => { return elements[1].querySelector("a").getAttribute("href") }),
            elementRows.map((elements) => { return elements[2].innerText.trim() }),
            elementRows.map((elements) => { return re[2].exec(elements[2].innerText.trim())[1] }),
            elementRows.map((elements) => { return parseInt(re[2].exec(elements[2].innerText.trim())[2]) }),
            elementRows.map((elements) => { return parseInt(elements[3].innerText.trim()) }),

            elementRows.map((elements) => { return parseInt(elements[4].innerText.trim()) }),
            elementRows.map((elements) => { return elements[5].innerText.trim() }),
            elementRows.map((elements) => { return elements[6].innerText.trim() }),
            elementRows.map((elements) => { return parseFloat(elements[7].innerText.trim()) }),
            elementRows.map((elements) => { return re[3].exec(elements[8].innerText.trim())[1] }),

            elementRows.map((elements) => { return parseFloat(re[3].exec(elements[8].innerText.trim())[2]) }),
            elementRows.map((elements) => { return re[3].exec(elements[9].innerText.trim())[1] }),
            elementRows.map((elements) => { return parseFloat(re[3].exec(elements[9].innerText.trim())[2]) }),
        ];

        return res;
    }
}


class CAPEReport {
    constructor() {
        this.report = new Map();

        this.report.set("reportTitle", document.getElementById("ContentPlaceHolder1_lblReportTitle").innerText);
        this.report.set("courseDescription", document.getElementById("ContentPlaceHolder1_lblCourseDescription").innerText);
        this.report.set("instructorName", document.getElementById("ContentPlaceHolder1_lblInstructorName").innerText);
        this.report.set("quarter", document.getElementById("ContentPlaceHolder1_lblTermCode").innerText);
        this.report.set("enrollment", parseInt(document.getElementById("ContentPlaceHolder1_lblEnrollment").innerText));
        this.report.set("evaluationsSubmitted", parseInt(document.getElementById("ContentPlaceHolder1_lblEvaluationsSubmitted").innerText));

        this.report.set("statistics", this.scrapeStatistics());
        this.report.set("grades", this.scrapeGrades());
        this.report.set("additionalComments", this.scrapeAdditionalComments());

        this.reportJSON = JSON.stringify(this.report);
    }

    scrapeStatistics() {
        const res = new Map();

        const elementTable = document.getElementById("ContentPlaceHolder1_tblStatistics");
        const elementTData = elementTable.querySelectorAll("tbody > tr:first-child > td > span");

        let re;
        let data;

        // "Recommend the instructor"
        re = /(\d{2})\s(\d{2}%)/;
        data = new Map(
            [
                ["n", parseInt(re.exec(elementTData[0].innerText)[1])],
                ["pct", re.exec(elementTData[0].innerText)[2]]
            ]
        )
        res.set("recommendInstructor", data);

        // "Recommend the course"
        re = /(\d{2})\s(\d{2}%)/;
        data = new Map(
            [
                ["n", parseInt(re[0].exec(elementTData[1].innerText)[1])],
                ["pct", re[0].exec(elementTData[1].innerText)[2]]
            ]
        )
        res.set("recommendCourse", data);

        // "Exams represent the course material"
        re = /(\d+\.\d+)\s\((.*)\)/;
        data = new Map(
            [
                ["n", parseFloat(re[1].exec(elementTData[2].innerText)[1])],
                ["response", re[1].exec(elementTData[2].innerText)[2]]
            ]
        )
        res.set("examsRepresentCourseMaterial", data);

        // "Instructor is clear and audible"
        re = /(\d+\.\d+)\s\((.*)\)/;
        data = [
            ["n", parseFloat(re[1].exec(elementTData[3].innerText)[1])],
            ["response", re[1].exec(elementTData[3].innerText)[2]]
        ]
        res.set("instructorClearAndAudible", data);

        return res;
    }

    scrapeGrades() {
        const grades = new Map(
            [
                ["expected", "ContentPlaceHolder1_pnlExpectedGrades"],
                ["received", "ContentPlaceHolder1_pnlGradesReceived"]
            ]
        );
        const res = new Map();

        const re = /^([ABCDF][+\-]?)\saverage\s\((\d+\.\d+)\)$/;

        [...grades.keys()].forEach(
            (grade) => {
                const data = new Map();
                const gradeElement = document.getElementById(grades.get(grade));

                const element = gradeElement.querySelector("h4 > span");
                data.set("averageGrade", re.exec(element.innerText)[1]);
                data.set("GPA", parseFloat(re.exec(element.innerText)[2]));

                const elementTable = gradeElement.querySelector("table.styled");
                const elementTHeader = [...elementTable.querySelectorAll("thead > tr:first-child > th")];
                const elementTData = [...elementTable.querySelectorAll("tbody > tr")].map(
                    (element) => { return [...element.querySelectorAll("td")]; }
                )
                const theaders = elementTHeader.map(
                    (element) => { return element.innerText; }
                );
                const tdata = elementTData.map(
                    (a) => {
                        return a.map(
                            (element) => { return element.innerText.split(" ").join(""); }
                        );
                    }
                )

                gradeData = new Map()
                theaders.forEach(
                    (header) => {
                        gradeData.set(
                            header,
                            new Map(
                                [
                                    ["n", parseInt(tdata[0][theaders.indexOf(header)])],
                                    ["pct", tdata[1][theaders.indexOf(header)]]
                                ]
                            )
                        )
                    }
                )
                data.set("grades", gradeData);

                res.set(grade, data);
            }
        )

        return res;
    }
}
