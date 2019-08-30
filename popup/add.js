var currentHost = '';

function toggleActive() {
    browser.storage.local.get().then((storedSettings) => {   
        storedSettings.active = !storedSettings.active; 
        browser.storage.local.set(storedSettings);
    });
}

function remove(host) {
    console.log("Removing: ", host);
    browser.storage.sync.get().then((storedSettings) => {
        storedSettings.blockedHosts = storedSettings.blockedHosts.filter(item => item !== host)       
        browser.storage.sync.set(storedSettings);
    });
}

function add(host) {
    console.log("Adding: ", host);
    browser.storage.sync.get().then((storedSettings) => {   
        hosts = new Set(storedSettings.blockedHosts);
        hosts.add(host);

        storedSettings.blockedHosts = Array.from(hosts)
        browser.storage.sync.set(storedSettings);
    });

}

function refreshContent() {
    browser.storage.sync.get().then((storedSettings) => {
        document.querySelector("banned-list").setAttribute( "items",  storedSettings.blockedHosts.join(" "))
    });
}

function refreshActive() {
    browser.storage.local.get().then((storedSettings) => {        
        var status = !!storedSettings.active;
        var a = document.getElementById('status')
        while (a.firstChild) {
            a.removeChild(a.firstChild);
        }
        a.appendChild( document.createTextNode(status ? "ON" : "OFF"));
        a.onclick = toggleActive;
    });
}

function refreshCurrent() {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        currentHost = new URL(tabs[0].url).host;
        var a = document.getElementById('current')
        while (a.firstChild) {
            a.removeChild(a.firstChild);
        }
        a.appendChild( document.createTextNode(currentHost) );
        a.onclick = (e) => {
            add(currentHost);
        };
      });
    
}

function refresh() {
    refreshActive();
    refreshContent();
    refreshCurrent();
}

browser.storage.onChanged.addListener(refresh)

refresh();



