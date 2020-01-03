import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home'
import DeviceSetup from './views/DeviceSetup'
import SessionForm from './views/SessionForm'

Vue.use(Router)

export default client => new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: SessionForm,
      props: { client },
    },
    {
      path: '/:session',
      name: 'home',
      component: Home,
      props: { client },  
      beforeEnter: (to, from, next) => {
        if (!/^\d{4}$/.test(to.params.session)) {
          next('/');
        } else {
          if (client.session !== to.params.session) {
            client.join(to.params.session);
          }
          next();
        }
      },
      children: [{
        path: 'config',
        name: 'config',
        component: DeviceSetup,
        props: { client }
      }]
    },
  ]
})
