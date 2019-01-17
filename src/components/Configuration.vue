<template>
  <div class="configuration"
      @touchstart="touchstart"
      @touchend="touchend"
      @touchcancel="touchend"
      @touchmove="touchmove">
    <canvas ref="canvas" :width="width" :height="height"></canvas>
    <div class="glow" :style="glowStyle"></div>
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
  return null;
}

export default {
  props: {
    id: {
      type: String,
      required: true
    },
    width: Number,
    height: Number,
  },
  data() {
    return {
      builder: null,
      touchId: null,
      touchTraces: [],
      error: false,
      success: false,
      threshold: 2 / 3,
    };
  },
  computed: {
    tracing() {
      return !!this.builder;
    },
    glowStyle() {
      const glowWidth = 1.5 * this.width * (1 - this.threshold);
      const glow = this.error ? '#ff8888' : this.tracing ? '#ffff88' : this.success && '#88ff88';
      return glow && { boxShadow: `inset 0 0 ${glowWidth}px ${glow}` };
    }
  },
  watch: {
    touchTraces() {
      this.drawTrace();
    }
  },
  methods: {
    ensureBuilder() {
      if (!this.builder) {
        this.createBuilder();
      }
    },
    createBuilder() {
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
      this.ensureBuilder();
      this.builder.onEvent(event, payload);
    },
    reset() {
      this.builder = null;
      this.touchId = null;
      this.touchTraces = [];
    },
    touchstart(e) {
      const touch = e.changedTouches[0];
      const point = this.makePoint(touch);

      this.ensureBuilder();
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
      this.builder.inputEnd(this.makePoint(touch));
      this.touchId = null;
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
      gradient.addColorStop(0, '#666');
      gradient.addColorStop(.5, '#999');
      gradient.addColorStop(1, '#333');
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

<style scoped lang="scss">
.configuration {
  display: flex;
  width: 100%;
  height: 100%;
}
canvas {
  position: absolute;
}
.glow {
  flex: 1;
  transition: box-shadow 0.5s ease-in-out;
} 
</style>