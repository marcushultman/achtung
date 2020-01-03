<template>
  <form class="session-form" @submit.prevent="joinSession">
    <h1>Achtung, die Kurve!</h1>
    <p>Nulla nostrud tempor incididunt ad velit reprehenderit nulla eiusmod dolore sint aliquip voluptate enim ut id.</p>
    <input type="number" v-model="code" min="0" placeholder="0123" maxlength="4">
    <input type="submit" :disabled="code.length !== 4" value="Join session">
    <button @click="requestFullscreen">Go fullscreen</button>
  </form>
</template>

<script>
export default {
  props: {
    client: Object,
  },
  data() {
    return {
      callbacks: null,
      code: ''
    };
  },
  mounted() {
    this.callbacks = this.client.createCallbacks({
      $connected: (id, session) => this.$router.push({ name: 'home', params: { session }})
    });
  },
  beforeDestroy() {
    this.client.resetCallbacks(this.callbacks);
  },
  methods: {
    joinSession() {
      this.client.join(this.code);
    },
    requestFullscreen() {
      document.body.requestFullscreen();
    }
  }
}
</script>

<style>
html, body {
  background: #333;
}
</style>

<style lang="scss" scoped>
.session-form {
  padding: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
input {
  margin: 8px;
  background: none;
  color: inherit;
  font-family: inherit;
  outline: none;
}
input[type=number] {
  padding: 4px;
  border: none;
  border-bottom: 1px solid #999;
  font-size: 20px;
  text-align: center;
}
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=submit] {
  padding: 8px 32px;
  border: 1px dashed #999;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
input[type="submit"]:disabled {
  color: #999;
}
</style>
