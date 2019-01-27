<template>
  <div class="home">
    <router-link to="config">Config</router-link>
  </div>
</template>

<script>
export default {
  name: 'home',
}
</script>

<style lang="scss" scoped>
.home {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
a {
  background: #3388aa;
  color: white;
  padding: 8px 32px;
  border-radius: 32px;
  font-size: 22px;
  text-decoration: none;
}
</style>
