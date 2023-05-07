chrome.action.onClicked.addListener(
    async (tab) => {
        if (!(tab.url && tab.url.includes("cape.ucsd.edu/responses/"))) { return; }

        const queryParameters = new URLSearchParams(tab.url.split("?")[1]);

        let message = { queryParameters: queryParameters };
        if (tab.url.includes("Results.aspx")) { message.type = "results"; }
        else if (tab.url.includes("CAPEReport.aspx")) { message.type = "report"; }

        console.log(message);

        const response = await chrome.tabs.sendMessage(tab.id, message);
        response.then((response) => { console.log(response); });
    }
);
