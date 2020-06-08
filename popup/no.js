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

const app = html`
    <${FokusTime} />
    <${Stats} />
`

render(app, document.body)
