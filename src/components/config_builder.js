const kUp = 0;
const kLeft = 1;
const kDown = 2;
const kRight = 3;

function isCenter(point, threshold) {
  const [x, y] = point;
  return x > -threshold && x < threshold && y > -threshold && y < threshold;
}
function borderForPoint([x, y]) {
  if (x > 0 && x > Math.abs(y)) {
    return kRight;
  } else if (x < -Math.abs(y)) {
    return kLeft;
  }
  return y > 0 ? kDown : kUp;
}

export default class ConfigBuilder {
  constructor(id, threshold, send, onConfig, onReset) {
    console.assert(id !== null && id.length);
    this.id = id;
    this.threshold = threshold;
    this.trace = null;
    this.startPoint = null;
    this.send = send;
    this.onConfig = onConfig;
    this.onReset = onReset;
  }
  // computed
  get isTracing() {
    return this.trace != null;
  }
  get emptyTrace() {
    return this.trace.length == 0;
  }
  get isStart() {
    return this.startPoint === null;
  }
  // state redirects
  onEvent(event, payload) {
    switch (event) {
      case 'start': return this.onRemoteStart();
      case 'checkpoint': return this.onRemoteCheckpoint(payload);
      case 'end': return this.onRemoteEnd(payload);
      case 'reset': return this.onReset();
    }
  }
  inputStart(point) {
    if (isCenter(point, this.threshold)) {
      this.onLocalStart();
    } else {
      this.onLocalCheckpointStart(point);
    }
  }
  inputEnd(point) {
    if (!this.isStart && this.emptyTrace) {
      this.onReset();
      throw new Error('missing start');
    }
    if (isCenter(point, this.threshold)) {
      this.onLocalEnd();
    } else {
      this.onLocalCheckpoint(point);
    }
  }
  // state management
  onLocalStart() {
    if (this.isTracing) {
      throw new Error('illegal state');
    }
    this.beginCheckpoint(null);
    this.trace = [];
    this.send('start');
  }
  onRemoteStart() {
    this.trace = this.trace || [];
  }
  onLocalCheckpointStart(startPoint) {
    this.beginCheckpoint(startPoint);
    this.trace = this.trace || [];
  }
  onLocalCheckpoint(endPoint) {
    this.pushCheckpoint(endPoint);
    this.send('checkpoint', this.trace);
  }
  onRemoteCheckpoint(trace) {
    this.trace = trace;
  }
  onLocalEnd() {
    this.pushCheckpoint(null);
    console.assert(this.trace[0].start === null);
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
  // state helpers
  beginCheckpoint(startPoint) {
    this.startPoint = startPoint;
  }
  pushCheckpoint(endPoint) {
    const { id, startPoint } = this;
    const start = startPoint ? borderForPoint(startPoint) : null;
    const end = endPoint ? borderForPoint(endPoint) : null;
    this.trace.push({ id, start, end });
    this.startPoint = null;
  }
}

function flip(x) { return (x + 2) % 4; }

// function align({ end }, checkpoint) {
//   if (end % 2 !== checkpoint.start % 2) {
//     throw new Error('illegal device rotation');
//   }
//   if (end === flip(checkpoint.start)) {
//     return;
//   }
//   // todo: flipped
// }

// function createGrid([sizeX, sizeY]) {
//   return Array(sizeY).fill(null).map(() => Array(sizeX).fill(null));
// }

// supports 16x16 grid [0-255]
function makeKey(x, y) { return (y << 4) + x; }

function configFromTrace(trace) {
  // if (trace.length === 1) {
  //   throw new Error('single mode disabled');
  // }
  let current = [0, 0], min = [0, 0], max = [0, 0];

  const traverseNext = direction => ({
    [kUp]:    () => min[1] = Math.min(min[1], --current[1]),
    [kLeft]:  () => min[0] = Math.min(min[0], --current[0]),
    [kDown]:  () => max[1] = Math.max(max[1], ++current[1]),
    [kRight]: () => max[0] = Math.max(max[0], ++current[0]),
  })[direction]();

  for (let i = 0; i < trace.length - 1; ++i) {
    if (trace[i].end !== flip(trace[i + 1].start)) {
      throw new Error('illegal device rotation');
    }
    traverseNext(trace[i].end);
  }

  const size = [ -min[0] + max[0] + 1, -min[1] + max[1] + 1 ];
  const items = {};

  current = [ -min[0], -min[1] ];
  for (let i = 0; i < trace.length; ++i) {
    const { id, end } = trace[i];
    const [x, y] = current;
    const key = makeKey(x, y);
    if (items[key] && items[key].id !== id) {
      throw new Error('device mismatch');
    }
    items[key] = { id, x, y };
    if (end !== null) {
      traverseNext(end);
    }
  }
  return new Config(size, items);
}

class Config {
  constructor(size, items) {
    this.size = size;
    this.items = items;
  }
}
