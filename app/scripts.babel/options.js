'use strict';

{
  const logger = new Logger('options');

  class OptionsView {
    constructor() {
      this.model = new Model();
      this.addListeners();
      chrome.storage.sync.get(DEFAULT_OPTIONS, options => {
        logger.logEvent('chrome.storage.sync.get', options);
        for (let key in options) {
          this.model.set(key, options[key]);
        }
      });
    }
    addListeners() {
      this.model.onChange(key => {
        logger.logEvent('model.onChange', key, this.model.get(key));
        chrome.storage.sync.set({[key]: this.model.get(key)});
        this.updateView();
      });
      this.model.onAdd(key => {
        logger.logEvent('model.onAdd', key, this.model.get(key));
        chrome.storage.sync.set({[key]: this.model.get(key)});
        this.updateView();
      });
      jQuery('#enabled-by-default').change(e => {
        const checked = jQuery(e.currentTarget).is(':checked');
        logger.logEvent('#enabled-by-default.change', checked);
        this.model.set('enabled_by_default', checked);
      });
    }
    updateView() {
      logger.logEvent('updateView');
      jQuery('#enabled-by-default')
        .prop('checked', this.model.get('enabled_by_default'));
    }
  };

  jQuery(() => {
    const options = new OptionsView;
  });
};

console.log('wikipreview - options script loaded');
