<template>
  <div class="configuration" ref="configuration"
      @touchstart="touchstart"
      @touchend="touchend"
      @touchcancel="touchend"
      @touchmove="touchmove">
    <canvas ref="canvas" :width="width" :height="height"></canvas>
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
      touchTraces: [],
      error: false,
      success: false,
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
      const direction = this.builder.headDirection;
      const traced = this.builder && this.builder.traceIndex >= 0;
      const rotation = [-90, 180, 90, 0][direction];
      return {
        opacity: traced ? 1 : 0.5,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`
      };
    }
  },
  watch: {
    touchTraces() {
      this.drawTrace();
    }
  },
  mounted() {
    this.width = this.$refs.configuration.offsetWidth;
    this.height = this.$refs.configuration.offsetHeight;
  },
  methods: {
    createBuilder() {
      if (this.builder) {
        return;
      }
      this.builder = new ConfigBuilder(
          this.id,
          this.threshold,
          (event, payload) => this.$emit('send', { event, payload }),
          config => {
            this.reset();
            this.success = true;
            setTimeout(() => this.success = false, 500);
            this.$emit('finish', config);
          },
          () => {
            this.reset();
            this.error = true;
            setTimeout(() => this.error = false, 500);
          });
    },
    // helper functions
    makePoint(touch) {
      const { clientX: x, clientY: y } = touch;
      return [normalize(x, this.width), normalize(y, this.height)];
    },
    onEvent(event, payload) {
      this.createBuilder();
      this.builder.onEvent(event, payload);
    },
    reset() {
      this.builder = null;
      this.touchId = null;
      this.touchEndTime = 0;
      this.touchTraces = [];
    },
    touchstart(e) {
      const touch = e.changedTouches[0];
      const point = this.makePoint(touch);

      this.createBuilder();
      this.builder.inputStart(point);
      this.touchId = touch.identifier;

      const trace = [];
      const { clientX: x, clientY: y} = touch;
      trace.push([x, y]);
      this.touchTraces.push(trace);
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
    touchmove(e) {
      const touch = findTouch(e, this.touchId);
      if (!touch) {
        return;
      }
      const { clientX: x, clientY: y} = touch;
      this.touchTraces[this.touchTraces.length - 1].push([x, y]);
    },
    drawTrace() {
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.width, this.height);

      const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
      gradient.addColorStop(0, 'purple');
      gradient.addColorStop(.5 ,'orange');
      gradient.addColorStop(1, 'red');
      ctx.strokeStyle = gradient;

      ctx.lineWidth = 15;
      this.touchTraces.forEach(trace => {
        ctx.beginPath();
        ctx.moveTo(...trace[0]);
        trace.slice(1).forEach(point => ctx.lineTo(...point));
        ctx.stroke();
      });
    }
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
canvas {
  position: absolute;
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