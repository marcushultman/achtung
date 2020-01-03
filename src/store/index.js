import Vue from 'vue'
import Vuex from 'vuex'
import createConfig, { createConfigCallbacks } from './config'
import createAchtung, { createGameCallbacks } from './achtung'

Vue.use(Vuex)

function onLocationUpdate(client, store) {
  const parsedUrl = new URL(window.location);
  const title = parsedUrl.searchParams.get('title');
  const text = parsedUrl.searchParams.get('text');
  const url = parsedUrl.searchParams.get('url');
  const params = { title, text, url };
  if (url) {
    store.commit('setUrlParams', params);
    client.send('params', params);
  }
}

function sendParams(client, store) {
  if (store.state.params.url !== null) {
    client.send('params', store.state.params);
  }
}

function createCallbacks(client, store) {
  return {
    $connected: (id, session) => store.commit('setId', { id, session }),
    $join: () => sendParams(client, store),
    ['params']: params => store.commit('setUrlParams', params), 
  };
}

export default client => {
  const store = new Vuex.Store({
    modules: {
      config: createConfig(client),
      achtung: createAchtung(client),
    },
    state: {
      id: null,
      session: null,
      params: {
        title: null,
        text: null,
        url: null,
      },
    },
    mutations: {
      setId(state, { id, session }) {
        state.id = id;
        state.session = session;
      },
      setUrlParams(state, params) {
        state.params = params;
      },
    },
    getters: {
      title: ({ params }) => params.title,
      text: ({ params }) => params.text,
      url: ({ params }) => params.url,
    }
  });
  client.createCallbacks(createCallbacks(client, store));
  client.createCallbacks(createConfigCallbacks(client, store));
  client.createCallbacks(createGameCallbacks(client, store));
  window.addEventListener('DOMContentLoaded', () => onLocationUpdate(client, store));
  onLocationUpdate(client, store);
  return store;
}
