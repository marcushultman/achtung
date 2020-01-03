<template>
  <div class="device-form config-nav">
    <h1>Achtung, die Kurve!</h1>
    <p>Anim velit consequat aute dolore est labore elit nulla dolore dolore officia nostrud ullamco enim enim.</p>
    <router-link :to="{ name: 'config' }">Setup devices</router-link>
  </div>
</template>

<script>
export default {
  props: {
    client: Object,
  },
  data() {
    return {
      callbacks: null,
    };
  },
  mounted() {
    this.callbacks = this.client.createCallbacks({
      ['config:open']: () => this.$router.push({ name: 'config' }),
    });
  },
  beforeDestroy() {
    this.client.resetCallbacks(this.callbacks);
  }
}
</script>

<style lang="scss" scoped>
.device-form {
  padding: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
a {
  margin: 8px;
  padding: 8px 32px;
  border: 1px dashed #999;
  border-radius: 4px;
  background: none;
  color: inherit;
  font-size: 16px;
  outline: none;
  text-decoration: none;
}
</style>
