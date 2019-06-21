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
        var content = document.getElementById('popup-content');
        content.innerHTML = '';

        storedSettings.blockedHosts.forEach( (_host) => {

            var a = document.createElement("a")
            a.onclick = (e) => {
                remove(_host);
                e.preventDefault();
            }
            a.href = '#';
            a.appendChild(document.createTextNode(_host));

            var li = document.createElement("li");
            li.appendChild(a);
            content.appendChild( li );
        });
    });
}

function refreshActive() {
    browser.storage.local.get().then((storedSettings) => {        
        var status = !!storedSettings.active;
        var a = document.getElementById('status')
        a.innerHTML = status ? "ON" : "OFF";
        a.onclick = toggleActive;
    });
}

function refreshCurrent() {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        currentHost = new URL(tabs[0].url).host;
        var a = document.getElementById('current')
        a.innerHTML = currentHost;    
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


