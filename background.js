const API_KEY = "e228bc40ca4e49e554097851064ef63f30612f735d23955ef72012fb97d4d259"

const options = (resourceURL = "") => {
  return {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-apikey": API_KEY,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ url: resourceURL })
  }
};

function fetchUrlData(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: false }, // Use the ID of the first active tab
          func: (url, API_KEY) => {
            return fetch('https://www.virustotal.com/api/v3/urls', {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'x-apikey': API_KEY,
                'content-type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({ url: url }),
            })
              .then(response => response.json())
              .catch(error => { throw error });
          },
          args: [url, API_KEY]
        }, (injectionResults) => {
          // if (chrome.runtime.lastError || !injectionResults || injectionResults[0].result === undefined) {
          //   console.error(chrome.runtime.lastError || new Error('Failed to execute script'));
          // } else {
          //   // Handle injectionResults or further actions
          // }
        });
      } else {
        console.error('No active tab found');
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scanUrl",
    title: "Scan URL with GuardLink",
    contexts: ["link"],
  });
  scanHistoryUrls();
  chrome.alarms.create('scanHistory', { periodInMinutes: 120 });
});

chrome.runtime.onStartup.addListener(() => {
  scanHistoryUrls();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'scanHistory') {
    scanHistoryUrls();
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scanUrl") {
    scanUrl(info.linkUrl);
  }
});

function scanUrl(url) {
  setLoading(true);
  const resource = url;
  fetchUrlData(resource)
    .then((data) => {
      chrome.storage.local.set({ lastScan: data }, () => {
        chrome.action.openPopup();
        setLoading(false);
      });
    })
    .catch((err) => {
      console.error(err.message);
      setLoading(false);
    });
}

function scanHistoryUrls() {
  setLoading(true);
  chrome.history.search({ text: "", maxResults: 100 }, (historyItems) => {
    let urlsToScan = historyItems.map((item) => item.url);
    let scanPromises = urlsToScan.map((url) => {
      const resource = url;
      return fetchUrlData(resource)
        .then((data) => {
          if (data.positives > 0) {
            chrome.storage.local.get({ vulnerabilities: [] }, (result) => {
              let vulnerabilities = result.vulnerabilities || [];
              vulnerabilities.push({ url, data });
              chrome.storage.local.set({ vulnerabilities });
            });
          }
        });
    });

    Promise.all(scanPromises)
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        console.error(err.message);
        setLoading(false);
      });
  });
}

function setLoading(isLoading) {
  chrome.storage.local.set({ isLoading });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.isLoading) {
    chrome.runtime.sendMessage({ isLoading: changes.isLoading.newValue });
  }
});