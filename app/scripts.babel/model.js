class Model {
  constructor() {
    this.data = new Map();
    this.listeners = new Map();
  }
  has(key) { return this.data.has(key); }
  get(key) { return this.data.get(key); }
  set(key, value, trigger = true) {
    let event = 'add';
    if (this.data.has(key)) {
      const old = this.data.get(key);
      if (old == value)
        return; // no-op
      event = 'change';
    }
    this.data.set(key, value);
    if (trigger)
      this.trigger(event, key);
  }
  delete(key, trigger = true) {
    if (!this.data.has(key))
      return; // no-op
    this.data.delete(key);
    if (trigger)
      this.trigger('remove', key);
  }
  on(event, fn) {
    const listeners = this.listeners.get(event) || [];
    this.listeners.set(event, listeners.concat(fn));
  }
  onAdd(fn) { this.on('add', fn); }
  onChange(fn) { this.on('change', fn); }
  onRemove(fn) { this.on('remove', fn); }
  trigger(event, ...args) {
    const listeners = this.listeners.get(event) || [];
    for (let fn of listeners)
      fn(...args);
  }
  getMap() { return new Map(this.data); }
}
