import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import createRouter from './router'
import createStore from './store'
import Client from './network/client';

Vue.config.productionTip = false

const client = new Client();

new Vue({
  router: createRouter(client),
  store: createStore(client),
  render: h => h(App)
}).$mount('#app');
