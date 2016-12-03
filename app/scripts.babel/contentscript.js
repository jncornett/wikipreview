'use strict';

const DEFAULT_API_REGEX = /\/wiki\/(.*)/;
const DEFAULT_API_ENDPOINT = '/w/api.php';
const DEFAULT_API_PROPS = {
  exsentences: 3,
  action: 'query',
  prop: 'extracts',
  explaintext: 1,
  exintro: 1,
  format: 'json',
  redirects: 1
};
const EVENT_SUFFIX = '.wikipreview';
const DEFAULT_WIDGET_OPTIONS = {
  selector: 'a[href^="/wiki/"]'
};

class Api {
  constructor(regex, endpoint, props) {
    this.regex = regex || DEFAULT_API_REGEX;
    this.endpoint = endpoint || DEFAULT_API_ENDPOINT;
    this.props = props || DEFAULT_API_PROPS;
  }
  query(url, callback, error) {
    let target = this.regex.exec(url);
    if (!target)
      return false;

    console.log('query', arguments);
    jQuery.get(
      this.endpoint,
      jQuery.extend(this.props, {titles: unescape(target[1])}),
      response => this.getContent(response, callback, error)
    )
  }
  getContent(response, callback, error) {
    if (!callback)
      return;

    try {
      let pages = response.query.pages;
      for (var pageid in pages) {
        try {
          const val = pages[pageid].extract;
          if (val) {
            callback(val);
            return;
          }
        } catch(e) {}
      }
    } catch(e) {}
    if (error)
      error({reason: 'unable to parse response', response: response});
  }
}

class Tooltip {
  constructor(el) {
    this.el = el;
    this.$el = jQuery(el);
    this.tip = new Opentip(el);
    this.doAsyncQuery = true;
  }
  installHandlers(api) {
    this.tip.activate();
    this.$el
      .on('mouseover' + EVENT_SUFFIX, (e) => {
        if (!this.doAsyncQuery)
          return;

        this.tip.setContent('loading');
        api.query(this.$el.attr('href'), (content) => {
          this.doAsyncQuery = false;
          this.tip.setContent(content);
        }, (e) => {
          this.doAsyncQuery = false;
          this.tip.deactivate();
          console.log('wikipreview - error', e);
        });
      });
  }
  uninstallHandlers() {
    this.tip.deactivate();
    this.$el.off('mouseover' + EVENT_SUFFIX);
  }
}

class Widget {
  constructor(options) {
    this.initialized = false;
    this.enabled = false;
    this.options = jQuery.extend(DEFAULT_WIDGET_OPTIONS, options);
    this.tooltips = [];
    this.api = new Api();
  }
  log() {
    let args = [...arguments];
    args.unshift('wikipreview -');
    console.log(...args);
  }
  initialize() {
    if (this.initialized)
      return;
    this.log('initializing');
    this.installTooltips();
    this.initialized = true;
  }
  enable() {
    if (this.enabled)
      return;
    this.initialize();
    this.log('enabling');
    this.enableTooltips();
    this.enabled = true;
  }
  disable() {
    if (!this.enabled)
      return;
    this.disableTooltips();
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
  installTooltips() {
    this.uninstallTooltips();
    jQuery(this.options.selector).each((i, el) => {
      this.tooltips.push(new Tooltip(el));
    });
  }
  uninstallTooltips() {
    this.disableTooltips();
    this.tooltips = [];
  }
  enableTooltips() {
    this.tooltips.forEach(tooltip => tooltip.installHandlers(this.api));
  }
  disableTooltips() {
    this.tooltips.forEach(tooltip => tooltip.uninstallHandlers());
  }
}

// entry point
jQuery(() => {
  // FIXME this is probably not the right way to do this
  // remove title attribute from links so that they don't get in the way
  jQuery('a[href^="/wiki/"]').removeAttr('title');
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
