import Vue from 'vue'
import Vuex from 'vuex'
import config from './config'

Vue.use(Vuex)

export default client => {
  const store = new Vuex.Store({
    modules: { config },
    state: {
      id: null,
    },
    mutations: {
      setId(state, id) {
        state.id = id;
      },
    },
  });
  client.onConnected(id => store.commit('setId', id));
  return store;
}
