import Vue from 'vue'
import Color from '../game/color'

const getPlayersForDevice = (players, device_id) =>
    Object.keys(players).filter(player_id => players[player_id].device_id === device_id);

function hasPlayers(store) {
  return Object.keys(store.state.achtung.players).length;
}

function sendPlayers(client, { players }) {
  client.send('achtung:players', players);
}

export function createGameCallbacks(client, store) {
  return {
    $join: () => hasPlayers(store) && sendPlayers(client, store.state.achtung),
    $left: peer => store.commit('removePlayers', peer.id),
    ['achtung:players']: players => store.commit('setPlayers', players),
  };
}

export default client => ({
  state: {
    players: {},
    colors: Color.all()
  },
  getters: {
    getPlayersForDevice({ players }) {
      return (device_id) => getPlayersForDevice(players, device_id)
          .map(player_id => Object.assign({ player_id }, players[player_id]));
    },
  },
  mutations: {
    setPlayers(state, players) {
      state.players = players;
    },
    addPlayer({ players, colors }, { player_id, device_id, align, offset }) {
      const [color] = colors.splice(0, 1);
      Vue.set(players, player_id, { device_id, align, offset, color });
    },
    removePlayer({ players, colors }, player_id) {
      colors.push(players[player_id].color);
      Vue.delete(players, player_id);
    },
    removePlayers({ players, colors }, device_id) {
      getPlayersForDevice(players, device_id).forEach(player_id => {
        colors.push(players[player_id].color);
        Vue.delete(players, player_id);
      });
    }
  },
  actions: {
    addPlayer({ commit, state }, player) {
      commit('addPlayer', player);
      sendPlayers(client, state);
    },
    removePlayer({ commit, state }, player_id) {
      commit('removePlayer', player_id);
      sendPlayers(client, state);
    }
  }
});
