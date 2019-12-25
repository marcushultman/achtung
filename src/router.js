import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import DeviceSetup from './views/DeviceSetup.vue'

Vue.use(Router)

export default client => new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      props: { client },
      beforeEnter: (to, from, next) => {
        next();
      },
      children: [{
        path: '/config',
        name: 'config',
        component: DeviceSetup,
        props: { client }
      }]
    },
  ]
})
