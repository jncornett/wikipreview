'use strict';

class Widget {
  constructor() {
    this.initialized = false;
    this.enabled = false;
  }
  log() {
    let args = [...arguments];
    args.unshift("wikipreview -");
    console.log(...args);
  }
  initialize() {
    if (this.initialized)
      return;
    this.log('intializing');
    this.initialized = true;
  }
  enable() {
    if (this.enabled)
      return;
    this.initialize();
    this.log('enabling');
    this.enabled = true;
  }
  disable() {
    if (!this.enabled)
      return;
    this.log('disabling');
    this.enabled = false;
  }
  handleMessage(message) {
    this.log('handle message:', JSON.stringify(message));
    if ('enabled' in message) {
      if (message.enabled)
        this.enable();
      else
        this.disable();
      return true;
    }
    return false;
  }
}

// entry point
$(function() {
  const widget = new Widget();
  // add a listener for enable/disable requests
  chrome.runtime.onMessage.addListener(message => {
    const result = widget.handleMessage(message);
    if (!result)
      throw 'could not handle message from background script';
  });

  // let the background script know we're ready to receive enable/disable requests
  // this will trigger the initial state message
  console.log('wikipreview - request initial enabled state');
  chrome.runtime.sendMessage({notify: 'enabled'});
});
