export default class Color {
  static get(n) {
    switch(n % 24) {
      case 0:
        return '#ff0000';
      case 1:
        return '#00ff00';
      case 2:
        return '#0000ff';
      case 3:
        return '#ffff00';
      case 4:
        return '#00ffff';
      case 5:
        return '#ff00ff';
      case 6:
        return '#880000';
      case 7:
        return '#008800';
      case 8:
        return '#000088';
      case 9:
        return '#888800';
      case 10:
        return '#008888';
      case 11:
        return '#880088';
      case 12:
        return '#440000';
      case 13:
        return '#004400';
      case 14:
        return '#000044';
      case 15:
        return '#444400';
      case 16:
        return '#004444';
      case 17:
        return '#440044';
      case 18:
        return '#bb0000';
      case 19:
        return '#00bb00';
      case 20:
        return '#0000bb';
      case 21:
        return '#bbbb00';
      case 22:
        return '#00bbbb';
      case 23:
        return '#bb00bb';
    }
    return 'white';
  }
}