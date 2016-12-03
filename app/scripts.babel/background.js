'use strict';

class Widget {
  constructor(tabId, enabled) {
    this.tabId = tabId;
    this.enabled = enabled;
  }
}

class EnableState {
  constructor() {
    this.enableMap = {};
  }

  toggle(tabId) {
    this.setEnabled(tabId, !this.enabled(tabId));
    return this.enabled(tabId);
  }

  enabled(tabId) {
    const val = this.enableMap[tabId];
    return val === undefined ? true : val;
  }

  setEnabled(tabId, val) {
    this.enableMap[tabId] = val;
  }
}

const enableState = new EnableState();

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  chrome.pageAction.show(tabId);
});

chrome.pageAction.onClicked.addListener(tab => {
  chrome.pageAction.setTitle({title: 'click' + new Date(), tabId: tab.id});
  console.log('page action clicked');
});

console.log('wikipreview - background.js loaded');
