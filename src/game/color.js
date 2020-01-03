export default class Color {
  static all() {
    const all = [];
    for (let i = 0; i < 24; ++i) {
      all.push(Color.get(i));
    }
    return all;
  }
  static get(n) {
    return [
      { value: '#ff0000', name: 'Red' },
      { value: '#00ff00', name: 'Green' },
      { value: '#0000ff', name: 'Blue' },
      { value: '#ffff00', name: 'Yellow' },
      { value: '#00ffff', name: 'Cyan' },
      { value: '#ff00ff', name: 'Magenta' },
      { value: '#880000', name: 'Shady Red' },
      { value: '#008800', name: 'Shady Green' },
      { value: '#000088', name: 'Shady Blue' },
      { value: '#888800', name: 'Shady Yellow' },
      { value: '#008888', name: 'Shady Cyan' },
      { value: '#880088', name: 'Shady Magenta' },
      { value: '#440000', name: 'Dark red' },
      { value: '#004400', name: 'Dark green' },
      { value: '#000044', name: 'Dark blue' },
      { value: '#444400', name: 'Dark yellow' },
      { value: '#004444', name: 'Dark cyan' },
      { value: '#440044', name: 'Dark magenta' },
      { value: '#bb0000', name: 'Light red' },
      { value: '#00bb00', name: 'Light green' },
      { value: '#0000bb', name: 'Light blue' },
      { value: '#bbbb00', name: 'Light yellow' },
      { value: '#00bbbb', name: 'Light cyan' },
      { value: '#bb00bb', name: 'Light magenta' },
     ][n % 24];
  }
}