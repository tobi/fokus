
import { html, useState, useEffect, useCallback, render } from './preact/standalone.module.js';


function ToggleActive(props) {
    const isActive = props.active;

    const toggle = useCallback(() => {        
        browser.storage.local.get().then((storedSettings) => {
            storedSettings.active = !storedSettings.active;    
            browser.storage.local.set(storedSettings);
        });
    }, [isActive]);

    const label = isActive ? "ON" : "OFF";
    const link = html`<a href="#" onclick=${toggle} id='status'>${label}</a>`;

    return html`Blocking: ${link}`
}

function HostList(props) {
    const list = props.hosts;
    
    const removeHost = useCallback((host) => {        
        console.log("removing", host)
        
        browser.storage.sync.get().then((storedSettings) => {
            storedSettings.blockedHosts = storedSettings.blockedHosts.filter(item => item !== host)
            browser.storage.sync.set(storedSettings);
        });
    }, []);

    if(list.length == 0) {
        return "Add websites here"
    }

    return list.map(e => html`<${HostEntry} host=${e} onclick=${() => removeHost(e)} />`);
}

function HostEntry(props) {
    return html`<li><a href="#" class="btn" onclick=${props.onclick}>✖</a> ${props.host}</li>`
}

function AddCurrent(props) {
    const currentHost = props.currentHost;
    const hosts = props.hosts;

    const addHost = useCallback((host) => {        
        console.log("adding", host)
        browser.storage.sync.get().then((storedSettings) => {
            const hosts = new Set(storedSettings.blockedHosts);
            hosts.add(currentHost);
    
            storedSettings.blockedHosts = Array.from(hosts)
            browser.storage.sync.set(storedSettings);
        });
    }, [currentHost]); 


    if (currentHost == "") {
        return "fokus time";
    }

    if (hosts.includes(currentHost)) {
        return "Already blocked 💀"
    }
    
    return html`Add: <a href=# onclick=${() => addHost(currentHost)}>${currentHost}</a>`
}


function Popup() {
    const [isActive, setActive] = useState(null);
    const [blockedHosts, setBlockedHosts] = useState([]);
    const [currentHost, setCurrentHost] = useState("");

    useEffect(() => {
        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = new URL(tabs[0].url);

            if(url.protocol  == 'http:' || url.protocol == 'https:') {
                const host = url.host;
                setCurrentHost(host);
            }            
        });
    }, [])

    useEffect(() => {
        browser.storage.local.get("active").then(local => setActive(local.active || false))
    }, []);

    useEffect(() => { 
        browser.storage.sync.get("blockedHosts").then(sync => setBlockedHosts(sync.blockedHosts || []));
    }, []);

    useEffect(() => { 
        function handleStatusChange(data) { 
            if('active' in data) {
                setActive(data.active.newValue); 
            }

            if('blockedHosts' in data) {
                setBlockedHosts(data.blockedHosts.newValue); 
            }
        } 

        browser.storage.onChanged.addListener(handleStatusChange)
        return () => {
            browser.storage.onChanged.removeListener(handleStatusChange); 
        }; 
    }, []);

    return html`
    <header>
        <${ToggleActive} active=${isActive} />
    </header>
    <section class="list">                
      <${HostList} hosts=${blockedHosts}/>
    </section>
    <footer>
        <${AddCurrent} hosts=${blockedHosts} currentHost=${currentHost}/>
    </footer>
    `
}

const app = html`<${Popup} />`

render(app, document.body)