<template>
  <div v-show="device" class="video-fragment" :style="style">
    <youtube :video-id="videoId" :player-vars="playerVars" ref="youtube"
        :fitParent="true" @playing="playing" @paused="paused"/>
  </div>
</template>

<script>
import Vue from 'vue';
import VueYoutube from 'vue-youtube';
import { mapState, mapGetters } from 'vuex';

Vue.use(VueYoutube);

export default {
  name: 'VideoFragment',
  props: {
    client: Object,
  },
  data() {
    return {
      callbacks: null,
      state: 'pause',
      videoId: 'ULrxa1KVzZU',
      playerVars: {
        start: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
      }
    };
  },
  methods: {
    async playing() {
      if (this.state !== 'play') {
        const timestamp = Date.now();
        const time = await this.player.getCurrentTime();
        this.client.send('video:playing', { timestamp, time });
        this.state = 'play';
      }
    },
    async paused() {
      if (this.state !== 'paused') {
        const timestamp = Date.now();
        const time = await this.player.getCurrentTime();
        this.client.send('video:paused', { timestamp, time });
        this.state = 'paused';
      }
    }
  },
  computed: {
    ...mapState(['id']),
    ...mapGetters(['devices', 'findById', 'columns', 'rows']),
    device() { return this.findById(this.id); },
    player() { return this.$refs.youtube.player; },
    style() {
      if (!this.device) {
        return;
      }
      const x = Object.entries(this.columns)
          .filter(([x]) => x < this.device.x)
          .reduce((sum, [x, col]) => sum - col, 0);
      const y = Object.entries(this.rows)
          .filter(([y]) => y < this.device.y)
          .reduce((sum, [y, row]) => sum - row, 0);
      const width = Object.values(this.columns).reduce((sum, col) => sum + col, 0);
      const height = Object.values(this.rows).reduce((sum, row) => sum + row, 0);
      return {
        transform: `translate(${x}px, ${y}px)`,
        width: `${width}px`,
        height: `${height}px`,
      };
    },
  },
  watch: {
    devices() { this.$refs.youtube.resizeProportionally(); },
  },
  mounted() {
    this.callbacks = this.client.createCallbacks({
      ['video:playing']: ({ timestamp, time }) => {
        this.state = 'play';
        const position = time + (Date.now() - timestamp) / 1000;
        const seekTarget = Math.ceil(position + 1);  // +1s extra buffer for fast play
        this.player.seekTo(seekTarget, true);
        setTimeout(() => this.player.playVideo(), (seekTarget - position) * 1000);
      },
      ['video:paused']: async ({ time }) => {
        this.state = 'paused';
        await this.player.pauseVideo();
        await this.player.seekTo(time, true);
      },
    });
  },
  beforeDestroy() {
    this.client.resetCallbacks(this.callbacks);
  },
}
</script>

<style lang="scss" scoped>
.video-fragment {
  display: flex;
  transform-origin: top left;
}
</style>
