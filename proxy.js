var blockedHosts = [];
var active = false;
const allow = "DIRECT";
const deny = "PROXY 127.0.0.1:65535";

// tell the background script that we are ready
browser.runtime.sendMessage("init");

// listen for updates to the blocked host list
browser.runtime.onMessage.addListener((message) => {
  browser.runtime.sendMessage(message);

  if('active' in message) {
    active = !!message.active;
    browser.runtime.sendMessage("Proxy-blocker: active:"+ active);
    return;
  }

  if('blockedHosts' in message) {
    blockedHosts = message.blockedHosts;
    return;
  }

});

// required PAC function that will be called to determine
// if a proxy should be used.
function FindProxyForURL(url, host) {
  if (!active) {
    return allow;
  }

  let action = allow;

  blockedHosts.forEach((banned) => {
    if (host.indexOf(banned) != -1) {
      browser.runtime.sendMessage(`Proxy-blocker: blocked ${url}`);
      action = deny;
    }
  });


  return action;
}