<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
  background: #333;
  overscroll-behavior: none;
  user-select: none;
  overflow: hidden;
}
#app {
  height: 100%;
  font-family: "Times New Roman", Times, serif;
  /*font-family: 'Avenir', Helvetica, Arial, sans-serif;*/
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  background: black;
  color: white;
  /*background: white;*/
  /*color: #2c3e50;*/
}
</style>
