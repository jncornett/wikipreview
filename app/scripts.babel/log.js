class Logger {
  constructor(...context) {
    this.appName = 'wikipreview';
    this.context = context;
  }

  logEvent(...args) {
    const prefix = [this.appName].concat(this.context).join(' - ');
    console.log(prefix, '[event]', ...args);
  }

  getChild(context) {
    return new Logger(...this.context, context);
  }
};
