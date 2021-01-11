
import {removeSubdomain} from './lib/domains.js'

var defaultBlockedHosts = [
    'twitter.com',
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

function popup(url) {
    return chrome.extension.getURL("popup/no.html") + "?" + url
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
    state.active ?
        chrome.browserAction.setIcon({ path: "icons/on.svg" }) :
        chrome.browserAction.setIcon({ path: "icons/off.svg" });
}

function shouldCancel(url) {
    if (!state.active) {
        return false;
    }

    if (state.enabledUntil && Date.now() < state.enabledUntil ) {
        console.log('temporarily enabled')
        return false;
    }

    const host = removeSubdomain(url);

    if (state.blockedHosts && state.blockedHosts.includes(host)) {
        console.log("Blocking: ", host)
    
        // update stats
        chrome.storage.sync.get("stats", (storedSettings) => {
            const stats = storedSettings.stats || {};            
            const today = new Intl.DateTimeFormat('en-US').format(new Date());
            
            if (!stats[today]) {
                stats[today] = []
            }

            let hostEntry = stats[today].filter( e => e.host == host )[0]
            
            if (!hostEntry) {
                hostEntry = {host: host, count: 0}
                stats[today].push(hostEntry);
            }

            hostEntry.count += 1;
            
            storedSettings.stats = stats;
            chrome.storage.sync.set(storedSettings);            
        });

        return true;
    }
    return false;
}

async function init() {
    console.log("init")
    await chrome.storage.local.get(updateState);
    await chrome.storage.sync.get(updateState);
};

init();


chrome.storage.onChanged.addListener(updateChangedState);


// Attempt to cancel the request once its initiated
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const url = new URL(details.url);
        if (details.frameId == 0 && shouldCancel(url.hostname)) {
            return {redirectUrl: popup(details.url)}
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame", "xmlhttprequest"] },
    ["blocking"]
);

// In some cases, like PWAs in cache, we don't get a onBeforeRequest event at all. In those cases
// we double check once the navigate is completed and redirect then. Twitter.com is a good example of this. 
chrome.webNavigation.onCompleted.addListener(
    (details) => {
        const url = new URL(details.url);

        if (details.frameId == 0 && shouldCancel(url.hostname)) {            
            chrome.tabs.update(details.tabId, {url: popup(details.url)})            
        }
    }
);
