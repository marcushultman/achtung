const findById = (selection, id) => selection.find(device => device.id === id);
const findByPosition = (selection, x, y) => selection.find(device => device.x === x && device.y === y);

export default {
  state: {
    selection: [],
  },
  getters: {
    devices: ({ selection }) => selection,   
    top: ({ selection }) => selection.length ? Math.min(...selection.map(({ y }) => y)) : 0,
    left: ({ selection }) => selection.length ? Math.min(...selection.map(({ x }) => x)) : 0,
    right: ({ selection }) => selection.length ? Math.max(...selection.map(({ x }) => x)) : 0,
    bottom: ({ selection }) => selection.length ? Math.max(...selection.map(({ y }) => y)) : 0,
    width: (state, getters) => 1 + getters.right - getters.left,
    height: (state, getters) => 1 + getters.bottom - getters.top,
    findById: ({ selection }) => (id) => findById(selection, id),
    findByPosition: ({ selection }) => (x, y) => findByPosition(selection, x, y),
    columns: ({ selection }) => selection.reduce((columns, { x, deviceWidth }) =>
        Object.assign(columns, { [x]: Math.max(columns[x] || 0, deviceWidth) }), {}),
    rows: ({ selection }) => selection.reduce((rows, { y, deviceHeight }) =>
        Object.assign(rows, { [y]: Math.max(rows[y] || 0, deviceHeight) }), {}),
  },
  mutations: {
    reset(state) {
      state.selection = [];
    },
    select(state, { x, y, id, deviceWidth, deviceHeight }) {
      if (!findByPosition(state.selection, x, y)) {
        state.selection = [
          ...state.selection.filter(device => device.id !== id),
          { x, y, id, deviceWidth, deviceHeight }
        ];
      }
    },
    deselect(state, id) {
      state.selection = [...state.selection.filter(device => device.id !== id)];
    },
    setSelection(state, selection) {
      state.selection = selection;
    },
  }
};
