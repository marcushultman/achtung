
function addOffsets(iterable) {
  let prev = 0;
  for (const it of iterable) {
    it[0] += prev;
    prev = it[0];
  }
  return iterable;
}

export default class RangeMap extends Map {
  constructor(iterable) {
    const with_offsets = addOffsets(iterable);
    super(with_offsets);
    this.max = [...with_offsets].slice(-1)[0][0];
  }

  get(key) {
    for (const [end, value] of this) {
      if (end > key) {
        return value;
      }
    }
    return null;
  }
}
