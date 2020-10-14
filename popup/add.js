// https://unpkg.com/htm@3.0.4/preact/standalone.module.js
import { html, useState, useEffect, useCallback, render } from './preact/standalone.module.js';
import { removeSubdomain } from '../lib/domains.js'

function ToggleActive(props) {
    const isActive = props.active;

    const toggle = useCallback(() => {
        chrome.storage.local.get((storedSettings) => {
            storedSettings.active = !storedSettings.active;    
            storedSettings.enabledUntil = 0;    
            chrome.storage.local.set(storedSettings);
        });
    }, [isActive]);

    const label = isActive ? "ON" : "OFF";

    let until = ''

    if (Date.now() < props.enabledUntil) {
        const sec = Math.floor((props.enabledUntil- Date.now()) / 1000 );
        const min = Math.floor(sec / 60) 
        if(min > 0 )
            until = `(enabled: ${min}:${sec % 60}s)`
        else 
            until = `(enabled: ${sec}s)`
        
    }

    const link = html`<a href="#" onclick=${toggle} id='status'>${label}</a> ${until}`;

    return html`Blocking: ${link}`
}

function HostList(props) {
    const list = props.hosts;
    
    const removeHost = useCallback((host) => {        
        console.log("removing", host)
        
        chrome.storage.sync.get((storedSettings) => {
            storedSettings.blockedHosts = storedSettings.blockedHosts.filter(item => item !== host)
            chrome.storage.sync.set(storedSettings);
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
        chrome.storage.sync.get((storedSettings) => {
            const hosts = new Set(storedSettings.blockedHosts);
            hosts.add(currentHost);
    
            storedSettings.blockedHosts = Array.from(hosts)
            chrome.storage.sync.set(storedSettings);
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
    const [enabledUntil, setEnabledUntil] = useState(0);
    const [blockedHosts, setBlockedHosts] = useState([]);
    const [currentHost, setCurrentHost] = useState("");

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = new URL(tabs[0].url);

            if(url.protocol  == 'http:' || url.protocol == 'https:') {
                const host = removeSubdomain(url.host);
                setCurrentHost(host);
            }            
        });
    }, [])

    useEffect(() => {
        chrome.storage.local.get("enabledUntil", local => setEnabledUntil(local.enabledUntil || 0))
    }, []);

    useEffect(() => {
        chrome.storage.local.get("active", local => setActive(local.active || false))
    }, []);

    useEffect(() => { 
        chrome.storage.sync.get("blockedHosts", sync => setBlockedHosts(sync.blockedHosts || []));
    }, []);

    useEffect(() => { 
        function handleStatusChange(data) { 
            if('active' in data) {
                setActive(data.active.newValue); 
            }
            if('enabledUntil' in data) {
                setEnabledUntil(data.enabledUntil.newValue);             }

            if('blockedHosts' in data) {
                setBlockedHosts(data.blockedHosts.newValue); 
            }
        } 

        chrome.storage.onChanged.addListener(handleStatusChange)
        return () => {
            chrome.storage.onChanged.removeListener(handleStatusChange); 
        }; 
    }, []);

    return html`
    <header>
        <${ToggleActive} active=${isActive} enabledUntil=${enabledUntil} />
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