<template>
  <div v-show="device" class="video-fragment" :style="parentStyle">
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
      state: 'pause',
      videoId: 'ULrxa1KVzZU',
      playerVars: {
        start: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
      }
    };
  },
  methods: {
    async playing() {
      if (this.state !== 'play') {
        const time = await this.player.getCurrentTime();
        this.client.send('video:playing', { timestamp: Date.now(), time });
        this.state = 'play';
      }
    },
    async paused() {
      if (this.state !== 'paused') {
        const time = await this.player.getCurrentTime();
        this.client.send('video:paused', { timestamp: Date.now(), time });
        this.state = 'paused';
      }
    }
  },
  computed: {
    ...mapState(['id']),
    ...mapGetters(['findById', 'top', 'left', 'width', 'height']),
    player() { return this.$refs.youtube.player; },
    device() { return this.findById(this.id); },
    style() { return { transform: `scale(${this.width})` }; },
    parentStyle() {
      if (!this.device) {
        return;
      }
      const fullWidth = this.width * window.innerWidth;
      // const fullHeight = this.height * window.innerHeight;
      const x = (this.left - this.device.x) * window.innerWidth;
      const y = (this.top - this.device.y) * window.innerHeight;
      // const y = (fullHeight - fullWidth) / 2 - this.device.y * window.innerHeight;
      return {
        width: `${fullWidth}px`,
        transform: `translate(${x}px, ${y}px)`,
      };
    },
  },
  watch: {
    width() { this.$refs.youtube.resizeProportionally(); },
    device() { this.$refs.youtube.resizeProportionally(); },
  },
  mounted() {
    this.client.on('video:playing', ({ timestamp, time }) => {
      this.state = 'play';
      const position = time + (Date.now() - timestamp) / 1000;
      const seekTarget = Math.ceil(position);
      this.player.seekTo(seekTarget, true);
      setTimeout(() => this.player.playVideo(), (seekTarget - position) * 1000);
    });
    this.client.on('video:paused', async ({ time }) => {
      this.state = 'paused';
      await this.player.pauseVideo();
      await this.player.seekTo(time, true);
    });
  },
}
</script>

<style lang="scss" scoped>
.video-fragment {
  display: flex;
  transform-origin: top left;
}
</style>
