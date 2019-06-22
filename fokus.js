defaultSettings = {
    "blockedHosts": [
        "twitter.com",
        'example.com',
        'news.ycombinator.com',
        'techmeme.com',
        'facebook.com',
        'reddit.com',
        'youtube.com'
    ]
};

const proxyScriptURL = "proxy.js";
browser.proxy.register(proxyScriptURL);

browser.storage.onChanged.addListener((newSettings) => {
    if ('blockedHosts' in newSettings) {
        console.log("Forwarding blockedHosts");
        browser.runtime.sendMessage({ blockedHosts: newSettings.blockedHosts.newValue }, { toProxyScript: true });
    }

    if ('active' in newSettings) {
        console.log("Forwarding active:", newSettings.active.newValue);
        browser.runtime.sendMessage({ active: newSettings.active.newValue }, { toProxyScript: true });


        newSettings.active.newValue ? 
            browser.browserAction.setIcon({path: "icons/on.svg"}) :
            browser.browserAction.setIcon({path: "icons/off.svg"});
    }
});


// Initialize the proxy
function handleInit() {

    browser.storage.sync.get().then((storedSettings) => {
        // if there are stored settings, update the proxy with them...
        if (storedSettings.blockedHosts) {
            browser.runtime.sendMessage(storedSettings, { toProxyScript: true });
            // ...otherwise, initialize storage with the default values
        } else {
            browser.storage.sync.set(defaultSettings);
        }

    }).catch(() => {
        console.log("Error retrieving stored settings");
    });

    browser.storage.local.get().then((storedSettings) => {
        if (storedSettings.active) {
            browser.runtime.sendMessage(storedSettings, { toProxyScript: true });
        }
    }).catch(() => {
        console.log("Error retrieving stored settings");
    });



}

function handleMessage(message, sender) {

    if (message == 'toggle' && sender.url == browser.extension.getURL("popup/add.html")) {
        browser.runtime.sendMessage("toggle", { toProxyScript: true });
        return
    }

    // only handle messages from the proxy script
    if (sender.url == browser.extension.getURL("proxy.js")) {
        if (message == 'init' ) {
            handleInit(message);
        } else {
            // just log it
            console.log(message);
        }
        return
    }

    console.log("Unknown message: ", message, ' from ', sender.url)
}

browser.runtime.onMessage.addListener(handleMessage);