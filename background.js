const options = (resourceURL = "") => {
  return {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-apikey":
        "e228bc40ca4e49e554097851064ef63f30612f735d23955ef72012fb97d4d259",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ url: resourceURL })
  }
};

function fetchUrlData(url) {

  const newOptions = options(url)
  return fetch(url, newOptions)
    .then((response) => response.json())
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scanUrl",
    title: "Scan URL with GuardLink",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scanUrl") {
    scanUrl(info.linkUrl);
  }
});

function scanUrl(url) {
  const resource = url;
  fetchUrlData(resource)
    .then((data) => {
      chrome.storage.local.set({ lastScan: data }, () => {
        chrome.action.openPopup();
      });
    });
}

chrome.webNavigation.onCompleted.addListener(() => {
  chrome.history.search({ text: "", maxResults: 100 }, (historyItems) => {
    let urlsToScan = historyItems.map((item) => item.url);
    // Call VirusTotal API for each URL
    urlsToScan.forEach((url) => {
      const resource = url;
      fetchUrlData(resource)
        .then((data) => {
          if (data.positives > 0) {
            chrome.storage.local.get({ vulnerabilities: [] }, (result) => {
              let vulnerabilities = result.vulnerabilities;
              vulnerabilities.push({ url, data });
              chrome.storage.local.set({ vulnerabilities });
            });
          }
        });
    });
  });
});
