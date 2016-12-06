'use strict';

{
  const EVENT_SUFFIX = '.wikipreview';
  const SELECTOR = 'a[href^="/wiki/"]';

  class Tooltip {
    constructor(el, api) {
      this.el = el;
      this.$el = jQuery(el);
      this.tip = new Opentip(el);
      this.doAsyncQuery = true;
      this.api = api;
    }
    installHandlers() {
      this.tip.activate();
      this.$el
        .on('mouseover' + EVENT_SUFFIX, (e) => {
          if (!this.doAsyncQuery)
            return;

          this.tip.setContent('loading');
          this.api.queryTopic(parseTopicFromUrl(this.$el.attr('href')), content => {
            this.doAsyncQuery = false;
            this.tip.setContent(content);
          }, e => {
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

  class WidgetView {
    constructor() {
      this.model = new Model();
      this.api = new WikiApi();
      this.initialized = false;
      this.enabled = false;
      this.tooltips = [];
      this.addListeners();

      // now trigger the background script to update the widget
      chrome.runtime.sendMessage({notify: true});
    }
    addListeners() {
      this.model.onChange(key => {
        if (key === 'enabled') {
          if (this.model.get(key))
            this.enable();
          else
            this.disable();
        }
      });
      chrome.runtime.onMessage.addListener(message => {
        for (let key in message)
          this.model.set(key, message[key]);
      });
    }
    enable() {
      if (this.enabled)
        return;
      this.initialize();
      this.enableTooltips();
      this.enabled = true;
    }
    disable() {
      if (!this.enabled)
        return;
      this.disableTooltips();
      this.enabled = false;
    }
    initialize() {
      if (this.initialized)
        return;
      this.uninstallTooltips();
      this.installTooltips();
      this.initialized = true;
    }
    installTooltips() {
      jQuery(SELECTOR).each((i, el) => {
        this.tooltips.push(new Tooltip(el, this.api));
      });
    }
    uninstallTooltips() {
      this.disableTooltips();
      this.tooltips = [];
    }
    enableTooltips() {
      this.tooltips.forEach(tooltip => tooltip.installHandlers());
    }
    disableTooltips() {
      this.tooltips.forEach(tooltip => tooltip.uninstallHandlers());
    }
  }

  jQuery(() => {
    // FIXME this is probably not the right way to do this
    // remove title attribute from links so that they don't get in the way
    jQuery('a[href^="/wiki/"]').removeAttr('title');

    const widget = new WidgetView();
  });
};
