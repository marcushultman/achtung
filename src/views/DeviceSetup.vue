<template>
  <transition name="fade">
    <div class="device-setup" @click="finish">
      <div v-if="loading">loading...</div>
      <template v-else>
        <h1>Device configuration</h1>
        <div class="help">Align the devices according to the grid. Tap on the corresponding grid cell <b>on each device</b> to acknownledge the device placement.</div>
        <div class="grid" :style="gridStyle">
          <div v-for="{ x, y, device }, i in coordinates" :key="i" class="device"
              :class="{ selected: device, local: isLocal(x, y) }"
              :style="deviceStyle(x, y, device)"
              @click.stop="select(x, y)">
            <template v-if="device">
              <div class="screen"></div>
              <div class="button">⊚</div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </transition>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex'

const SCALE = 0.035;

export default {
  name: 'DeviceSetup',
  props: {
    client: Object,
  },
  data() {
    return {
      callbacks: null,
      deviceWidth: window.innerWidth,
      deviceHeight: window.innerHeight,
    };
  },
  computed: {
    ...mapState(['id']),
    loading() { return !this.id; },
    ...mapGetters([
      'bottom',
      'findById',
      'findByPosition',
      'left',
      'right',
      'top',
      'width',
    ]),
    coordinates() {
      const coordinates = [];
      for (let y = this.top - 1; y < this.bottom + 2; ++y) {
        for (let x = this.left - 1; x < this.right + 2; ++x) {
          coordinates.push({ x, y, device: this.findByPosition(x, y) });
        }
      }
      return coordinates;
    },
    gridStyle() {
      return { gridTemplateColumns: 'auto '.repeat(this.width + 2) };
    },
    deviceStyle() {
      return (x, y, device) => device ? {
        minWidth: `${Math.round(SCALE * device.deviceWidth)}mm`,
        minHeight: `${Math.round(SCALE * device.deviceHeight)}mm`,
        alignSelf: y >= (this.bottom + this.top) / 2 ? 'start' : 'end',
        justifySelf: x >= (this.right + this.left) / 2 ? 'start' : 'end',
      } : {};
    },
  },
  mounted() {
    window.onresize = () => this.updateDeviceInfo();
    this.callbacks = this.client.createCallbacks({
      $join: () => this.client.send('config:request'),
      ['config:finish']: () => this.$router.push('/'),
    });
    this.client.send('config:request');
  },
  beforeDestroy() {
    delete window.onresize;
    this.client.resetCallbacks(this.callbacks);
  },
  methods: {
    ...mapMutations(['reset']),
    select(x, y) {
      this.$store.commit('select', {
        x, y,
        id: this.id,
        deviceWidth: this.deviceWidth,
        deviceHeight: this.deviceHeight,
      });
      this.client.send('config:selection', this.$store.state.config.selection);
    },
    isLocal(x, y) {
      const selected = this.findById(this.id);
      return selected && selected.x === x && selected.y === y;
    },
    finish() {
      this.$router.push('/');
      this.client.send('config:finish');
    },
    updateDeviceInfo() {
      this.deviceWidth = window.innerWidth;
      this.deviceHeight = window.innerHeight;
    },
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
  align-items: center;
  justify-content: center;
}
h1 {
  margin: 0px;
}
.help {
  max-width: 400px;
  margin: 16px 0;
}
.grid {
  display: grid;
  grid-gap: 3px;
}
.device {
  min-width: 48px;
  min-height: 64px;
  border: 1px dashed #999;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  &.selected {
    background: #888;
    border: 1px solid black;
    border-radius: 4px;
  }
  &.local { background: #abc; }
  & .screen {
    flex: 1;
    margin: 4px;
    background: #ffffff44;
    display: flex;
    align-items: center;
    justify-content: center;
    &::after {
      content: "//";
      font-size: 48px;
      color: #ffffff88;
    }
  }
  & .button {
    flex: 0 18px;
    font-size: 18px;
    line-height: 12px;
    color: #444;
  }
}
</style>
