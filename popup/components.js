class BannedList extends HTMLElement {
    static get template() {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = `
            <ul></ul>
        `;
        return tmpl
    }

    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['items'];
    }

    refresh() {
        var ul = this.querySelector("ul");
        if (!ul) {
            return;
        }

        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }

        this.getAttribute("items").split(" ").forEach(item => {
            
            var el = new BannedListItem()
            el.setAttribute("item", item)
            ul.appendChild(el);
            
        });
    }


    connectedCallback() {
        var content = BannedList.template.content.cloneNode(true);

        this.appendChild(content);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal != newVal) {
            this.refresh();
        }
        
    }
}


class BannedListItem extends HTMLElement {

    static get template() {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = `
            <li><a href="#" onclick='this.onClick'></a></li>
        `;
        return tmpl
    }

    constructor() {
        super();
    }

    onClick(e) {
        console.log("clicked")
        window.postMessage('remove', this.innerText)
    }

    connectedCallback() {
        var content = BannedListItem.template.content.cloneNode(true);

        var el = content.querySelector('li > a');
        el.innerText = this.getAttribute('item');
        
        this.appendChild(content);
    }

    disconnectedCallback() {
    }
}

customElements.define('banned-list', BannedList);
customElements.define('banned-list-item', BannedListItem);