
var defaultBlockedHosts = [
    "twitter.com",
    'ycombinator.com',
    'techmeme.com',
    'facebook.com',
    'reddit.com',
    'youtube.com'
];

var active = false;

var state = {
    active: false, 
    blockedHosts: defaultBlockedHosts
}

function updateState(data) {
    
    console.log("updating state, ", data)
    if ('blockedHosts' in data) {
        state.blockedHosts = data.blockedHosts;
    }
    if ('active' in data) {
        state.active = data.active;
    }

    updateUX(data)
}

function updateUX(data) {
    state.active ?
        browser.browserAction.setIcon({ path: "icons/on.svg" }) :
        browser.browserAction.setIcon({ path: "icons/off.svg" });
}

browser.storage.local.get(updateState) 
browser.storage.onChanged.addListener(newData => {

    let data = {}
    if(newData.blockedHosts && newData.blockedHosts.newValue)
        data.blockedHosts = newData.blockedHosts.newValue
    if(newData.active && newData.active.newValue)
        data.active = newData.active.newValue

    updateState(data);
})

browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });

function isTopFrame(requestInfo) {
    return requestInfo.parentFrameId == -1;
}

function handleProxyRequest(requestInfo) {
    if(!state.active) {
        return { type: "direct" };
    }

    if(isTopFrame(requestInfo)) {

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


browser.storage.sync.get(updateState);


// Log any errors from the proxy script
browser.proxy.onError.addListener(error => {
    console.error(`Proxy error: ${error.message}`);
});

