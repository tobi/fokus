
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
    if ('blockedHosts' in changes) {
        state.blockedHosts = changes.blockedHosts.newValue;
    }

    updateUX();
}

function updateState(data) {
    if ('active' in data) {
        state.active = data.active
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
    console.log("initialized")
};

init()

browser.storage.onChanged.addListener(updateChangedState);

browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });

function handleProxyRequest(requestInfo) {
    if(!state.active) {
        return { type: "direct" };
    }

    if(requestInfo.parentFrameId == -1) {
        const hostname = new URL(requestInfo.url).hostname;

        for (let index = 0; index < state.blockedHosts.length; index++) {
            const block = state.blockedHosts[index];

            if (hostname.indexOf(block) != -1) {
             
                console.log('Blocked:', hostname)
                return { type: "http", host: "127.0.0.1", port: 65535 };

            }
        }
    }
    // Return instructions to open the requested webpage
    return { type: "direct" };
}

// Log any errors from the proxy script
browser.proxy.onError.addListener(error => {
    console.error(`Proxy error: ${error.message}`);
});

