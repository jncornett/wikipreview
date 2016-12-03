'use strict';

// represents an 'instance' of the extension (tied to a chrome tab)
class Widget {
  constructor(tabId, enabled) {
    this.tabId = tabId;
    this.enabled = enabled == undefined ? true : enabled;
  }
  toggle() {
    if (this.enabled)
      this.disable();
    else
      this.enable();
    return this.enabled;
  }
  enable() {
    if (!this.enabled) {
      this.enabled = true;
      this.notifyContentScript();
      this.updateExtensionIcon();
    }
  }
  disable() {
    if (this.enabled) {
      this.enabled = false;
      this.notifyContentScript();
      this.updateExtensionIcon();
    }
  }
  handleRequest(request) {
    if (request.notify == 'enabled') {
      this.notifyContentScript();
      return true;
    }
    return false;
  }
  notifyContentScript() {
      chrome.tabs.sendMessage(this.tabId, {enabled: this.enabled});
  }
  updateExtensionIcon() {
    chrome.pageAction.setIcon({
      tabId: this.tabId,
      path: this.enabled ?
        '../images/icon-enabled-128.png' :
        '../images/icon-disabled-128.png'
    });
  }
}

// manage the entire app state
class App {
  constructor() {
    this.widgetMap = {};
  }
  getWidget(tabId) {
    if (!(tabId in this.widgetMap))
      this.widgetMap[tabId] = new Widget(tabId);

    return this.widgetMap[tabId];
  }
  removeWidget(tabId) {
    const result = tabId in this.widgetMap;
    if (result)
      delete this.widgetMap[tabId];
    return result;
  }
}

const app = new App();

chrome.tabs.onUpdated.addListener(tabId => {
  console.log('wikipreview - [event] page ' + tabId + ' updated');
  chrome.pageAction.show(tabId);
  app.getWidget(tabId).updateExtensionIcon();
});

chrome.tabs.onRemoved.addListener(tabId => {
  console.log('wikipreview - [event] page ' + tabId + ' closed');
  const result = app.removeWidget(tabId);
  if (!result)
    throw 'wikipreview - could not remove widget for ' + tabId +
      ' because it does not exist';
});

chrome.runtime.onMessage.addListener((request, sender) => {
  console.log('wikipreview - [event] receive message from ' + sender.tab.id +
      ': ' + JSON.stringify(request));
  const result = app.getWidget(sender.tab.id).handleRequest(request);
  if (!result)
    throw 'wikipreview - could not handle message from ' + sender.tab.id;
});

chrome.pageAction.onClicked.addListener(tab => {
  console.log('wikipreview - [event] page action clicked for ' + tab.id);
  const result = app.getWidget(tab.id).toggle();
  console.log('wikpreview - enabled is ' + result + ' for ' + tab.id);
});

console.log('wikipreview - background.js loaded');
