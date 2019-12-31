export default class Score {
  constructor () {
    this.reset();
  }

  add(id, points) {
    this.result[id] = (this.result[id] || 0) + points;
  }

  set(id, points) {
    this.result[id] = points;
  }

  get(id) {
    return this.result[id] || 0;
  }

  max() {
    return Object.keys(this.result).reduce((max, id) => Math.max(max, this.result[id]), 0);
  }

  reset() {
    this.result = {}
  }
}