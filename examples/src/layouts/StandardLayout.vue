<template>
  <div>
    <div>
      <router-link to="/">Home</router-link> |
      <router-link to="/clock">Clock</router-link> |
      <router-link to="/echo">Echo</router-link>
    </div>

    <hr>

    <router-view></router-view>
  </div>
</template>