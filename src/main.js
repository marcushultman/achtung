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
}).$mount('#app')

window.addEventListener('DOMContentLoaded', () => {
  const parsedUrl = new URL(window.location);
  console.log('Title shared: ' + parsedUrl.searchParams.get('title'));
  console.log('Text shared: ' + parsedUrl.searchParams.get('text'));
  console.log('URL shared: ' + parsedUrl.searchParams.get('url'));
});
