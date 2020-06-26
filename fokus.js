
var defaultBlockedHosts = [
    "twitter.com",
    'ycombinator.com',
    'techmeme.com',
    'facebook.com',
    'reddit.com',
    'youtube.com'
];

var state = {
    active: false,
    blockedHosts: defaultBlockedHosts
}

function updateChangedState(changes) {
    if ('active' in changes) {
        state.active = changes.active.newValue;
    }
    if ('enabledUntil' in changes) {
        state.enabledUntil = changes.enabledUntil.newValue;
    }
    if ('blockedHosts' in changes) {
        state.blockedHosts = changes.blockedHosts.newValue;
    }

    updateUX();
}

function updateState(data) {
    if ('active' in data) {
        state.active = data.active
    }
    if ('enabledUntil' in data) {
        state.enabledUntil = data.newValue;
    }
    if ('blockedHosts' in data) {
        state.blockedHosts = data.blockedHosts
    }

    updateUX();
}

function updateUX() {
    console.log("status", state.active)
    state.active ?
        browser.browserAction.setIcon({ path: "icons/on.svg" }) :
        browser.browserAction.setIcon({ path: "icons/off.svg" });
}

async function init() {
    await browser.storage.local.get(updateState);
    await browser.storage.sync.get(updateState);
};

init()

browser.storage.onChanged.addListener(updateChangedState);

function cancel(requestDetails) {

    if (!state.active) {
        return;
    }

    if (state.enabledUntil && Date.now() < state.enabledUntil ) {
        console.log('temporarily enabled')
        return;
    }

    const host = new URL(requestDetails.url).host;

    if (state.blockedHosts && state.blockedHosts.includes(host)) {
        console.log("Blocking: ", host)
    
        browser.storage.sync.get("stats").then((storedSettings) => {
            const stats = storedSettings.stats || {};            
            const today = new Intl.DateTimeFormat('en-US').format(new Date());
            
            if (!stats[today]) {
                stats[today] = []
            }

            let hostEntry = stats[today].filter( e => e.host == host )[0]
            
            console.log(hostEntry)
            if (!hostEntry) {
                hostEntry = {host: host, count: 0}
                stats[today].push(hostEntry);
            }

            hostEntry.count += 1;
            
            storedSettings.stats = stats;
            browser.storage.sync.set(storedSettings);
        });

        const blocked = browser.extension.getURL("popup/no.html") + "?" + requestDetails.url

        return { redirectUrl: blocked };
    }

}

browser.webRequest.onBeforeRequest.addListener(
    cancel,
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking"]
);



// // Log any errors from the proxy script
// browser.proxy.onError.addListener(error => {
//     console.error(`Proxy error: ${error.message}`);
// });

