class CAPEResults {
    constructor() {
        this.results = new Map();

        this.table = document.querySelector(
            "div#ContentPlaceHolder1_UpdatePanel1 > div > table.styled"
        );

        this.results.set("headers", this.scrapeHeaders());
        this.results.set("rows", this.results.scrapeRows());
    }

    scrapeHeaders() {
        const headers = [
            "instructor", "course", "subject", "courseNumber", "sectionNumber",
            "reportURL", "term", "quarter", "year", "enrollment",
            "evaluations", "recommendClass", "recommendInstructor", "studyHoursPerWeek", "averageExpectedGrade",
            "expectedGPA", "averageReceivedGrade", "receivedGPA"
        ]

        return headers;
    }

    scrapeRows() {
        const elementRows = [...this.table.querySelectorAll("tbody > tr")].map(
            (element) => { return [...element.querySelectorAll("td")]; }
        );

        re = [
            /^(\w{3,4})\s(\d{1,3}\w{0,2})/,
            /^CAPEReport\.aspx\?sectionid=(\d+)$/,
            /^(FA|WI|SP|S1|S2)(\d+)$/,
            /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/,
        ];

        const rows = [
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

        return rows;
    }
}
