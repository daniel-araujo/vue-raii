import Vue from 'vue';
import VueRouter from 'vue-router';
import VueRaii from '../..';
import routes from 'vue-auto-routing';
import StandardLayout from './layouts/StandardLayout.vue';

Vue.use(VueRaii);
Vue.use(VueRouter);

let router = new VueRouter({
  routes: [
    {
      path: '/',
      component: StandardLayout,
      children: routes
    }
  ]
})

new Vue({
  el: document.body,
  render: h => h('RouterView'),
  router
});
