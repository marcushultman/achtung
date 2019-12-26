<template>
  <transition name="fade">
    <div class="device-setup" @click="finish">
      <p>
        <span>{{ offsetX }}</span>,
        <span>{{ offsetY }}</span>
      </p>
      <div v-if="loading">loading...</div>
      <!-- <div v-else v-for="y in coordinates.y" :key="y" class="row">
        <div v-for="x in coordinates.x" :key="x" class="device"
            :class="{ selected: findByPosition(x, y), local: isLocal(x, y) }"
            :style="deviceStyle(findByPosition(x, y))"
            @click.stop="select(x, y)">
        </div>
      </div> -->
      <div v-else class="grid" :style="gridStyle">
        <div v-for="{ x, y, device }, i in all" :key="i" ref="dev" class="device"
            :class="{ selected: device, local: isLocal(x, y) }"
            :style="deviceStyle(x, y, device)"
            @click.stop="select(x, y)">
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

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
      offsetX: 0.5,
      offsetY: 0.5,
      dragStart: null,
      dragWidth: 0,
      dragHeight: 0,
    };
  },
  computed: {
    ...mapState(['id']),
    loading() { return !this.id; },
    ...mapGetters(['width', 'height', 'top', 'left', 'right', 'bottom', 'findById', 'findByPosition']),
    coordinates() {
      return {
        x: Array.from(Array(2 + this.width).keys()).map(x => x + this.left - 1),
        y: Array.from(Array(2 + this.height).keys()).map(y => y + this.top - 1),
      };
    },
    all() {
      const list = [];
      for (let y of this.coordinates.y) {
        for (let x of this.coordinates.x) {
          list.push({ x, y, device: this.findByPosition(x, y) });
        }
      }
      return list;
    },
    gridStyle() {
      return {
        gridTemplateColumns: 'auto '.repeat(this.coordinates.x.length),
      };
    },
    deviceStyle() {
      return (x, y, device) => {
        return device ? ({
          minWidth: `${Math.round(0.05 * device.deviceWidth)}mm`,
          minHeight: `${Math.round(0.05 * device.deviceHeight)}mm`,
          alignSelf: y >= (this.bottom + this.top) / 2 ? 'start' : 'end',
          justifySelf: x >= (this.right + this.left) / 2 ? 'start' : 'end',
        }) : {};
      };
    },
  },
  mounted() {
    window.onresize = () => this.updateDeviceInfo();
    this.callbacks = this.client.createCallbacks({
      $join: () => { this.client.send('config:request'); },
      ['config:selection']: selection => this.$store.commit('setSelection', selection),
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
      this.$store.commit('select', { x, y, id: this.id,
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
  justify-content: center;
  align-items: center;
}
.grid {
  display: grid;
  grid-gap: 2px;
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
  min-width: 48px;
  min-height: 64px;
  border: 1px dashed #666;
  border-radius: 16px;
  &.selected {
    background: #aad;
    border: 1px solid black;
    border-radius: 4px;
  }
  &.local { background: #88a; }
}
</style>
