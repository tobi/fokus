
import { html, useState, useEffect, useCallback, render } from './preact/standalone.module.js';


function BlockingStatus(props) {
    const [isActive, setActive] = useState(null);

    useEffect(() => {
        browser.storage.local.get().then(data => {
            setActive(data.active); 
        })
    }, []);

    useEffect(() => { 
        function handleStatusChange(data) { 
            if('active' in data) {
                setActive(data.active.newValue); 
            }
        } 

        browser.storage.onChanged.addListener(handleStatusChange)
        return () => {
            browser.storage.onChanged.removeListener(handleStatusChange); 
        }; 
    }, []);

    const toggle = useCallback(() => {        
        browser.storage.local.get().then((storedSettings) => {
            storedSettings.active = !storedSettings.active;    
            browser.storage.local.set(storedSettings);
        });
    }, [isActive]);


    let label = isActive ? "ON" : "OFF";

    return html`<a href="#" onclick=${toggle} id='status'>${label}</a>`
}

function HostList(props) {
    const [list, setList] = useState([]);
    
    useEffect(() => { 
        browser.storage.sync.get().then((storedSettings) => {
            setList(storedSettings.blockedHosts);
        });
    }, []);

    useEffect(() => { 
        function handleStatusChange(data) { 
            if('blockedHosts' in data) {
                setList(data.blockedHosts.newValue);
            } 
        }

        browser.storage.onChanged.addListener(handleStatusChange)
        return () => {
            browser.storage.onChanged.removeListener(handleStatusChange); 
        }; 
    }, []);


    const removeHost = useCallback((host) => {        
        console.log("removing", host)
        
        browser.storage.sync.get().then((storedSettings) => {
            storedSettings.blockedHosts = storedSettings.blockedHosts.filter(item => item !== host)
            browser.storage.sync.set(storedSettings);
        });
    });


    return html`
        <div>
        ${list.map(e => html`
            <${HostEntry} host=${e} onclick=${() => removeHost(e)} />
        `)}
        </div>`
}

function HostEntry(props) {
    return html`<li><a href="#" class="btn" onclick=${props.onclick}>✖</a> ${props.host}</li>`
}

function AddCurrent(props) {
    const [currentHost, setCurrentHost] = useState("")

    useEffect(() => {
        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const host = new URL(tabs[0].url).host;
            setCurrentHost(host);
        });
    }, [])

    const addHost = useCallback((host) => {        
        console.log("adding", host)
        browser.storage.sync.get().then((storedSettings) => {
            const hosts = new Set(storedSettings.blockedHosts);
            hosts.add(host);
    
            storedSettings.blockedHosts = Array.from(hosts)
            browser.storage.sync.set(storedSettings);
        });
    });    

    return html`Add: <button onclick=${() => addHost(currentHost)}>${currentHost}</button>`
}

const app = html`
    <div><span>Blocking: </span><${BlockingStatus} /></div>
    <hr/>
    <${HostList}/>
    <hr/>
    <${AddCurrent}/>`

render(app, document.body)