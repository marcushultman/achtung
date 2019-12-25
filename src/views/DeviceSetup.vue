<template>
  <transition name="fade">
    <div class="device-setup" @click="finish">
      <div v-if="loading">loading...</div>
      <div v-else v-for="y in coordinates.y" :key="y" class="row">
        <div v-for="x in coordinates.x" :key="x" class="device"
            :class="{ selected: findByPosition(x, y), current: isCurrent(x, y) }"
            @click.stop="select(x, y)">
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex'

export default {
  name: 'DeviceSetup',
  props: {
    client: Object,
  },
  computed: {
    ...mapState(['id']),
    loading() { return !this.id; },
    ...mapGetters(['width', 'height', 'left', 'top', 'findById', 'findByPosition']),
    coordinates() {
      return {
        x: Array.from(Array(2 + this.width).keys()).map(x => x + this.left - 1),
        y: Array.from(Array(2 + this.height).keys()).map(y => y + this.top - 1),
      };
    },
  },
  mounted() {
    this.client.send('config:request');
    this.client.onPeerJoin((peer) => {
      console.log('onPeerJoin', peer);
      this.client.send('config:selection', this.$store.state.config.selection);
    });
    this.client.onPeerLeft(peer => this.$store.commit('deselect', peer.id));
    this.client.on('config:selection', selection => this.$store.commit('setSelection', selection));
    this.client.on('config:finish', () => this.$router.push('/'));
  },
  methods: {
    ...mapMutations(['reset']),
    select(x, y) {
      this.$store.commit('select', { x, y, id: this.id });
      this.client.send('config:selection', this.$store.state.config.selection);
    },
    isCurrent(x, y) {
      const selected = this.findById(this.id);
      return selected && selected.x === x && selected.y === y;
    },
    finish() {
      this.$router.push('/');
      this.client.send('config:finish');
    }
  }
}
</script>

<style scoped lang="scss">
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s, transform .2s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(-20%);
}
.device-setup {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.row {
  display: flex;
  &:first-child .device { border-top: 0; }
  &:last-child .device { border-bottom: 0; }
  & .device {
    &:first-child { border-left: 0; }
    &:last-child { border-right: 0; }
  }
}
.device {
  width: 48px;
  height: 64px;
  line-height: 64px;
  font-size: 18px;
  color: gray;
  border: 1px solid black;
  &.selected { background: #aad; }
  &.current { background: #88a; }
}
</style>
