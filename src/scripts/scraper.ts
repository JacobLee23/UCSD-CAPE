/**
 * 
 */


/**
 * 
 */
export class CAPEResults {
    name: string;
    courseNumber: string;
    results: (string | number)[][];
    elementTable: HTMLElement;

    headers: string[] = [
        "Instructor", "Course", "CourseNumber", "SectionNumber", "ReportURL",
        "Term", "Quarter", "Year", "Enrollment", "Evaluations",
        "RecommendClass", "RecommendInstructor", "StudyHoursPerWeek", "AverageExpectedGrade", "expectedGPA",
        "AverageReceivedGrade", "ReceivedGPA"
    ]

    /**
     * 
     * @param {*} queryParameters 
     */
    constructor(name: string, courseNumber: string) {
        this.name = name, this.courseNumber = courseNumber;

        this.results = [];

        this.elementTable = <HTMLElement>document.querySelector(
            "div#ContentPlaceHolder1_UpdatePanel1 > div > table.styled"
        );

        this.results.push(this.headers);
        this.results.push(...this.scrapeRows());
    }

    /**
     * 
     * @returns 
     */
    scrapeRows(): (string | number)[][] {
        const elementRows: HTMLElement[][] = [...this.elementTable.querySelectorAll("tbody > tr")].map(
            (element) => [...element.querySelectorAll("td")]
        );

        let reCourseNumber: RegExp = /^(\w{3,4})\s(\d{1,3}\w{0,2})/;
        let reGrade: RegExp = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;
        let reReportURL: RegExp = /^CAPEReport\.aspx\?sectionid=(\d+)$/;
        let reTerm: RegExp = /^(FA|WI|SP|S1|S2)(\d+)$/;

        const res: (string | number)[][] = [];
        for (let i: number = 0; i < elementRows.length; ++i) {
            const elements: HTMLElement[] = elementRows[i];
            const row: (string | number)[] = [];

            const href = <string>elements[1].querySelector("a")?.getAttribute("href");
            
            row.push(elements[0].innerText.trim());
            row.push(elements[1].innerText.trim());
            row.push(<string>reCourseNumber.exec(elements[1].innerText.trim())?.at(2));
            row.push(<string>reReportURL.exec(href)?.at(1));
            row.push(href);
            row.push(elements[2].innerText.trim());
            row.push(<string>reTerm.exec(elements[2].innerText.trim())?.at(1));
            row.push(parseInt(<string>reTerm.exec(elements[2].innerText.trim())?.at(2)));
            row.push(parseInt(elements[3].innerText.trim()));
            row.push(parseInt(elements[4].innerText.trim()));
            row.push(elements[5].innerText.trim());
            row.push(elements[6].innerText.trim());
            row.push(parseFloat(elements[7].innerText.trim()));
            row.push(<string>reGrade.exec(elements[8].innerText.trim())?.at(1));
            row.push(parseFloat(<string>reGrade.exec(elements[8].innerText.trim())?.at(2)));
            row.push(<string>reGrade.exec(elements[9].innerText.trim())?.at(1));
            row.push(parseFloat(<string>reGrade.exec(elements[9].innerText.trim())?.at(2)));
        }

        return res;
    }
}


/**
 * 
 */
export class CAPEReport {
    sectionID: number;
    report: Map<string, any>

    /**
     * 
     * @param sectionID 
     */
    constructor(sectionID: number) {
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
            parseInt(<string>document.getElementById("ContentPlaceHolder1_lblEnrollment")?.innerText)
        );
        this.report.set(
            "Evaluations",
            parseInt(<string>document.getElementById("ContentPlaceHolder1_lblEvaluationsSubmitted")?.innerText)
        );

        this.report.set("Statistics", this.scrapeStatistics());
        this.report.set("Grades", this.scrapeGrades());
        this.report.set("Questionnaire", this.scrapeQuestionnaire())
    }

    /**
     * 
     * @returns 
     */
    scrapeStatistics(): Map<string, any> {
        const res: Map<string, any> = new Map();

        const elementTable = <HTMLElement>document.getElementById("ContentPlaceHolder1_tblStatistics");
        const elementTData = [
            ...elementTable.querySelectorAll("tbody > tr:first-child > td > span")
        ];

        const reGrade: RegExp = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;
        const reResponse: RegExp = /(\d+\.\d+)\s\((.*)\)/;
        let match;
        let data: Map<string, string | number> = new Map();

        // "Recommend the instructor"
        match = reGrade.exec(<string>elementTData?.at(0)?.textContent?.trim());
        data.set("n", parseInt(<string>match?.at(1)));
        data.set("pct", <string>match?.at(1));
        res.set("RecommendInstructor", data);
        data.clear();

        // "Recommend the course"
        match = reGrade.exec(<string>elementTData?.at(1)?.textContent?.trim());
        data.set("n", parseInt(<string>match?.at(1)));
        data.set("pct", <string>match?.at(1));
        res.set("RecommendCourse", data);
        data.clear();

        // "Exams represent the course material"
        match = reResponse.exec(<string>elementTData?.at(2)?.textContent?.trim());
        data.set("rating", parseFloat(<string>match?.at(1)));
        data.set("response", <string>match?.at(2));
        res.set("ExamsRepresentCourseMaterial", data);
        data.clear();

        // "Instructor is clear and audible"
        match = reResponse.exec(<string>elementTData?.at(3)?.textContent?.trim());
        data.set("rating", parseFloat(<string>match?.at(1)));
        data.set("response", <string>match?.at(2));
        res.set("InstructorClearAndAudible", data);
        data.clear();

        return res;
    }

    /**
     * 
     */
    scrapeGrades(): Map<string, any> {
        const grades: Map<string, string> = new Map();
        grades.set("expected", "ContentPlaceHolder1_pnlExpectedGrades");
        grades.set("received", "ContentPlaceHolder1_pnlGradesReceived");

        const res: Map<string, any> = new Map();

        const reAverageGrade: RegExp = /^([ABCDF][+\-]?)\saverage\s\((\d+\.\d+)\)$/;

        let key: string, value: string
        for (let i: number = 0; i < grades.size; ++i) {
            key = [...grades.keys()][i], value = [...grades.values()][i];
            
            const data: Map<string, any> = new Map();
            const elementGrade = <HTMLElement>document.getElementById(value)

            const elementHeader = <Element>elementGrade.querySelector("h4 > span");

            const match = reAverageGrade.exec(<string>elementHeader.textContent);
            data.set("AverageGrade", <string>match?.at(1));
            data.set("GPA", parseFloat(<string>match?.at(2)));

            const elementTable = <HTMLElement>elementGrade.querySelector("table.styled");
            const elementTHeader = [
                ...elementTable.querySelectorAll("thead > tr:first-child > th")
            ];
            const elementTData = [
                ...elementHeader.querySelectorAll("tbody > tr")
            ].map((element: Element): Element[] => [...element.querySelectorAll("td")]);

            const theaders: string[] = elementTHeader.map(
                (element: Element): string => <string>element.textContent
            );
            const tdata: string[][] = elementTData.map(
                (a: Element[]): string[] => a.map(
                    (element: Element): string => <string>element.textContent?.split(" ").join("")
                )
            );

            const gradeData: Map<string, any> = new Map();
            for (let j: number = 0; j < theaders.length; ++j) {
                const cellData: Map<string, string | number> = new Map();
                cellData.set("n", parseInt(tdata[0][j]));
                cellData.set("pct", tdata[1][j]);
                gradeData.set(theaders[j], cellData);
            }
            data.set("Grades", gradeData);

            res.set(key, data);
        }

        return res
    }

    /**
     * 
     * @returns 
     */
    scrapeQuestionnaire(): Map<string, any>[] {
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
    scrapeQuestion(elementOptions: HTMLElement, elementResponses: HTMLElement): Map<string, any> {
        const res: Map<string, any> = new Map();

        const reGrade: RegExp = /^([ABCDF][+\-]?)\s\((\d+\.\d+)\)$/;

        const textOptions: string[] = [...elementOptions.getElementsByTagName("td")].map(
            (element) => element.innerText
        );
        const textResponses: string[] = [...elementResponses.getElementsByTagName("td")].slice(1).map(
            (element) => element.innerText
        );

        const options: string[] = ["Prompt", ...textOptions.slice(1, -3).map((s) => s.trim()), "n", "mean", "std"];
        const responses: (string | number | Map<string, string | number>)[] = [];

        responses.push(textResponses[0]);
        responses.push(
            ...textResponses.slice(1, -3).map(
                (s: string): Map<string, string | number> => {
                    const data: Map<string, string | number> = new Map();
                    const match = reGrade.exec(s);
                    data.set("n", parseInt(<string>match?.at(1)));
                    data.set("pct", <string>match?.at(2));
                    return data;
                }
            )
        )
        responses.push(parseInt(<string>textResponses.at(-3)?.trim()));
        responses.push(parseFloat((<string>textOptions.at(-2))?.trim()));
        responses.push(parseFloat((<string>textOptions.at(-1))?.trim()));

        options.forEach((x) => { res.set(x, responses[options.indexOf(x)]); });
        return res;
    }

    /**
     * 
     * @param nChoiceText 
     * @returns 
     */
    scrapeIndividualQuestion(nChoiceText: number): Map<string, any> {
        const id = `ContentPlaceHolder1_dlQuestionnaire_trChoiceText_${nChoiceText}`;
        
        const elementOptions = <HTMLElement>document.getElementById(id);
        const elementResponses = <HTMLElement>elementOptions.nextElementSibling;
        
        return this.scrapeQuestion(elementOptions, elementResponses);
    }
    
    /**
     * 
     * @param nChoiceText 
     * @param nQuestionText 
     * @returns 
     */
    scrapeQuestionGroup(nChoiceText: number, nQuestionText: number): Map<string, any> {
        const idChoiceText = `ContentPlaceHolder1_dlQuestionnaire_trChoiceText_${nChoiceText}`;
        const idQuestionText = `ContentPlaceHolder1_dlQuestionnaire_tdQuestionText_${nQuestionText}`;

        const elementOptions = <HTMLElement>document.getElementById(idChoiceText);
        const elementResponses = <HTMLElement>document.getElementById(idQuestionText);

        return this.scrapeQuestion(elementOptions, elementResponses);
    }
}
