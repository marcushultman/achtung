<template>
  <div class="configuration" ref="configuration"
      @touchstart="touchstart"
      @touchend="touchend"
      @touchcancel="touchend">
    <div class="arrow" :style="arrowStyle">&rarr;</div>
  </div>
</template>

<script>
import ConfigBuilder from './config_builder';

function normalize(value, max) {
  return 2 * value / max - 1;
}

function findTouch(e, id) {
  for (let i = 0; i < e.changedTouches.length; ++i) {
    const touch = e.changedTouches.item(i);
    if (touch.identifier === id) {
      return touch;
    }
  }
}

export default {
  props: {
    id: {
      type: String,
      required: true
    },
    threshold: {
      type: Number,
      default: 0.05
    },
  },
  data() {
    return {
      width: 0,
      height: 0,
      builder: null,
      touchId: null,
      touchEndTime: 0,
    };
  },
  computed: {
    tracing() {
      return !!this.builder;
    },
    arrowStyle() {
      if (!this.builder || !this.builder.trace.length) {
        return { visibility: 'hidden', transform: `translate(-50%, -50%)` };
      }
      return {
        opacity: this.builder.traceIndex >= 0 ? 1 : 0.5,
        transform: `translate(-50%, -50%) rotate(${this.builder.headRotation}deg)`
      };
    }
  },
  mounted() {
    this.width = this.$refs.configuration.offsetWidth;
    this.height = this.$refs.configuration.offsetHeight;
  },
  methods: {
    ensureBuilderCreated() {
      if (this.builder) {
        return;
      }
      this.builder = new ConfigBuilder(
          this.id,
          this.threshold,
          (event, payload) => this.$emit('send', { event, payload }),
          config => {
            this.reset();
            this.$emit('finish', config);
          },
          () => {
            this.reset();
          });
    },
    // helper functions
    makePoint(touch) {
      const { clientX: x, clientY: y } = touch;
      return [normalize(x, this.width), normalize(y, this.height)];
    },
    onEvent(event, payload) {
      this.ensureBuilderCreated();
      this.builder.onEvent(event, payload);
    },
    reset() {
      this.builder = null;
      this.touchId = null;
      this.touchEndTime = 0;
    },
    touchstart(e) {
      const touch = e.changedTouches[0];
      const point = this.makePoint(touch);

      this.ensureBuilderCreated();
      this.builder.inputStart(point);
      this.touchId = touch.identifier;
    },
    touchend(e) {
      const touch = findTouch(e, this.touchId);
      if (!touch) {
        return;
      }
      if (Date.now() - this.touchEndTime < 500) {
        this.builder.finish();
      } else {
        this.builder.inputEnd(this.makePoint(touch));
      }
      this.touchId = null;
      this.touchEndTime = Date.now();
    },
  }
}
</script>

<style lang="scss" scoped>
.configuration {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 360px;
  transition: transform 500ms ease;
  transform-origin: 50% 55%;
}
</style>