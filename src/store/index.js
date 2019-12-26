import Vue from 'vue'
import Vuex from 'vuex'
import config from './config'

Vue.use(Vuex)

export default client => {
  const store = new Vuex.Store({
    modules: { config },
    state: {
      id: null,
      title: null,
      text: null,
      url: null,
    },
    mutations: {
      setId(state, id) {
        state.id = id;
      },
      setUrlParams(state, { title, text, url }) {
        Object.assign(state, { title, text, url });
      },
    },
  });
  client.createCallbacks({
    $connected: id => store.commit('setId', id),
    ['params']: params => store.commit('setUrlParams', params), 
  });
  window.addEventListener('DOMContentLoaded', () => {
    const parsedUrl = new URL(window.location);
    const title = parsedUrl.searchParams.get('title');
    const text = parsedUrl.searchParams.get('text');
    const url = parsedUrl.searchParams.get('url');
    const params = { title, text, url };
    store.commit('setUrlParams', params);
    client.send('params', params);
  });
  return store;
}
