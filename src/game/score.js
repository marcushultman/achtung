export default class Score {
  constructor () {
    this.results = [{}]
  }

  commit() {
    this.results.push({});
  }

  add(id, points) {
    const result = this.results[this.results.length - 1];
    result[id] = (result[id] || 0) + points;
  }

  set(id, points) {
    const result = this.results[this.results.length - 1];
    const changed = points !== result[id];
    result[id] = points;
    return changed;
  }

  max() {
    return Object.keys(this.result).reduce((max, id) => Math.max(max, this.result[id]), 0);
  }

  getTotalResult() {
    const result = Object.entries(this.results.reduce((total, result) => {
      Object.keys(result).forEach(key => total[key] = (total[key] || 0) + result[key]);
      return total;
    }, {}));
    result.sort((lhs, rhs) => rhs[1] - lhs[1]);
    return result;
  }
}