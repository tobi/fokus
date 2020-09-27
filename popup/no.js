// https://unpkg.com/htm@3.0.4/preact/standalone.module.js
import { html, useState, useEffect, useMemo, render } from './preact/standalone.module.js';

function BlockedHost(props) {
    const {host, count} = props;

    return html`<div>${host}: ${count}</div>` 
}

function FokusTime(props) {
    return html`
        <header>
         Fokus time    
        </header>`
}

function Stats(props) {
    const [hosts, setHosts] = useState([]);

    useMemo(() => {
        browser.storage.sync.get("stats").then(data => {
            if("stats" in data) {
                const today = new Intl.DateTimeFormat('en-US').format(new Date());
                setHosts(data.stats[today] || []);
            }
        });
    }, [hosts])

    return html`
        <section class=list>
        ${hosts.map(t => html`<${BlockedHost} host=${t.host} count=${t.count} />`)}
        </section>`
}

function EnableTemporarily(props) {
    const [enabledUntil, setEnabledUntil] = useState(0);
    const [lastUrl, setLastUrl] = useState(null);

    useMemo(() => {
        const referrer = window.location.search.substring(1);

        if (referrer != "") {
            setLastUrl(referrer)
        }
        
    }, [lastUrl])

    useMemo(() => {
        browser.storage.local.get("enabledUntil").then(data => {
            if("enabledUntil" in data) {
                setEnabledUntil(data.enabledUntil);
            }
        });
    }, [enabledUntil])

    function enable(seconds) {
        let t = new Date();
        t.setSeconds(t.getSeconds() + seconds);
        const millis = t.getTime();

        browser.storage.local.set({enabledUntil: millis});
        setEnabledUntil(millis);
    }

    return html`
        <section class="list buttons">
        <button onclick=${() => enable(60)}>Enable 1 minute</button>

        <button onclick=${() => enable(60*5)}>Enable 5 minute</button>

        <button onclick=${() => enable(60*24)}>Enable 24 minute</button>
        </section>`
}

const app = html`
    <div id="fokus">
        <${FokusTime} />
        <${Stats} />
        <${EnableTemporarily} />
    </div>
`

render(app, document.body);
