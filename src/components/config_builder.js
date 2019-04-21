const kUp = 0;
const kLeft = 1;
const kDown = 2;
const kRight = 3;

export default class ConfigBuilder {
  constructor(id, threshold, send, onConfig, onReset) {
    console.assert(id !== null && id.length);
    Object.assign(this, { id, threshold, send, onConfig, onReset, }, {
      traceIndex: -1,
      trace: [],
      startPoint: null,
    });
  }
  // computed
  get headDirection() {
    if (this.traceIndex >= 0) {
      return this.trace[this.traceIndex].direction;
    } else if (this.trace.length) {
      return this.trace[this.trace.length - 1].direction;
    } else {
      return kRight;
    }
  }
  get headRotation() {
    return [-90, 180, 90, 0][this.headDirection];
  }
  // state redirects
  onEvent(event, payload) {
    switch (event) {
      case 'checkpoint': return this.onRemoteCheckpoint(payload);
      case 'end': return this.onRemoteEnd(payload);
      case 'reset': return this.onReset();
    }
  }
  inputStart(point) {
    this.startPoint = point;
  }
  inputEnd(point) {
    this.onLocalCheckpoint(point);
    this.startPoint = null;
  }
  finish() {
    this.onLocalEnd();
    this.startPoint = null;
  }
  onLocalCheckpoint(point) {
    const { id } = this;
    const direction = this.getDirection(point);
    const index = this.trace.length;
    this.trace.push({ id, direction });
    this.traceIndex = index;
    this.send('checkpoint', this.trace);
  }
  onRemoteCheckpoint(trace) {
    this.trace = trace;
  }
  onLocalEnd() {
    try {
      const config = configFromTrace(this.trace);
      this.send('end', config);
      this.onConfig(config);
    } catch(e) {
      this.send('reset');
      this.onReset();
      throw e;
    }
  }
  onRemoteEnd({ size, items }) {
    this.onConfig(new Config(size, items));
  }
  // helpers
  getDirection(point) {
    const x = this.startPoint[0] - point[0], y = this.startPoint[1] - point[1];
    const x2 = x * x, y2 = y * y;
    const distance2 = x2 + y2;
    if (distance2 < this.threshold) {
      return this.headDirection;
    } else if (x2 > y2) {
      return x > 0 ? kLeft : kRight;
    } else {
      return y > 0 ? kUp : kDown;
    }
  }
}

// supports 16x16 grid [0-255]
function makeKey(x, y) { return (y << 4) + x; }

function configFromTrace(trace) {
  let current = [0, 0], min = [0, 0], max = [0, 0];

  const traverseNext = direction => ({
    [kUp]:    () => min[1] = Math.min(min[1], --current[1]),
    [kLeft]:  () => min[0] = Math.min(min[0], --current[0]),
    [kDown]:  () => max[1] = Math.max(max[1], ++current[1]),
    [kRight]: () => max[0] = Math.max(max[0], ++current[0]),
  })[direction]();

  for (const checkpoint of trace.slice(0, -1)) {
    traverseNext(checkpoint.direction);
  }

  const size = [-min[0] + max[0] + 1, -min[1] + max[1] + 1];
  const items = {};

  current = [-min[0], -min[1]];
  for (const checkpoint of trace) {
    const { id } = checkpoint;
    const [x, y] = current;
    const key = makeKey(x, y);
    if (items[key]) {
      throw new Error('device mismatch');
    }
    items[key] = { id, x, y };
    traverseNext(checkpoint.direction);
  }
  return new Config(size, items);
}

class Config {
  constructor(size, items) {
    this.size = size;
    this.items = items;
  }
}
