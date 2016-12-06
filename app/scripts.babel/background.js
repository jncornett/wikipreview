'use strict';

{
  const logger = new Logger('background');

  class WidgetView {
    constructor(tabId, defaults = {}) {
      this.tabId = tabId;
      this.model = new Model();
      for (let key in defaults)
        this.model.set(key, defaults[key]);
      this.model.set('enabled', this.model.get('enabled_by_default'));
      this.addListeners();
      // refresh the view
      this.updateView();
    }
    addListeners() {
      this.model.onChange(key => {
        const val = this.model.get(key);
        this.sendMessageToContentScript({[key]: val});
        if (key === 'enabled')
          this.updateView();
      });
      chrome.pageAction.onClicked.addListener(tab => {
        if (tab.id === this.tabId) {
          this.model.set('enabled', !this.model.get('enabled'));
        }
      });
      chrome.runtime.onMessage.addListener((request, sender) => {
        if (sender.tab.id === this.tabId && request.notify) {
          const obj = {};
          for (let [k, v] of this.model.getMap())
            obj[k] = v;
          this.sendMessageToContentScript(obj);
        }
      });
    }
    updateView() {
      this.showPageAction();
      this.setStatusIcon(this.model.get('enabled'));
    }
    setStatusIcon(enabled) {
      chrome.pageAction.setIcon({
        tabId: this.tabId,
        path: enabled ?
          '../images/icon-enabled-128.png' :
          '../images/icon-disabled-128.png'
      });
    }
    showPageAction() {
      chrome.pageAction.show(this.tabId);
    }
    sendMessageToContentScript(message) {
      chrome.tabs.sendMessage(this.tabId, message);
    }
  }

  class AppView {
    constructor(defaults = {}) {
      this.defaults = defaults;
      this.widgets = new Map();
      this.addListeners();
      // get initial settings
      chrome.storage.sync.get(defaults, options => {
        logger.logEvent('chrome.storage.sync.get', options);
        this.defaults = options;
      });
    }
    addListeners() {
      chrome.tabs.onUpdated.addListener(tabId => {
        logger.logEvent('chrome.tabs.onUpdated', tabId);
        if (this.widgets.has(tabId))
          this.widgets.get(tabId).updateView();
        else
          this.widgets.set(tabId, new WidgetView(tabId, this.defaults));
      });
      chrome.tabs.onRemoved.addListener(tabId => {
        logger.logEvent('chrome.tabs.onRemoved', tabId);
        this.widgets.delete(tabId);
      });
      // the placement of this callback means that changes are
      // only propagated to *new* widgets
      chrome.storage.onChanged.addListener((changes, areaName) => {
        logger.logEvent('chrome.storage.onChanged', changes, areaName);
        if (areaName !== 'sync')
          return;

        for (let key in changes) {
          const change = changes[key];
          if ('newValue' in change)
            this.defaults[key] = change.newValue;
          else
            delete this.defaults[key];
        }
      });
    }
  }

  const app = new AppView(DEFAULT_OPTIONS);
};

console.log('wikipreview - background.js loaded');
