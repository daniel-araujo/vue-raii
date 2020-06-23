import Vue from 'vue';
import VueRouter from 'vue-router';
import VueRaii from '../..';
import routes from 'vue-auto-routing';

Vue.use(VueRaii);
Vue.use(VueRouter);

let router = new VueRouter({
  // Pass the generated routes into the routes option
  routes
})

new Vue({
  el: document.body,
  render: h => h('RouterView'),
  router
});
