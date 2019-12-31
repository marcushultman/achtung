<template>
  <div v-show="device" class="image-fragment" :style="style">
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'ImageFragment',
  props: {
    client: Object,
  },
  data() {
    return {
      callbacks: null,
    };
  },
  computed: {
    ...mapState(['id']),
    ...mapGetters(['findById', 'columns', 'rows', 'url']),
    device() { return this.findById(this.id); },
    style() {
      if (!this.device) {
        return;
      }
      // localhost:8080/?url=https%3A%2F%2Fi.redditmedia.com%2FqH5nAx5HnNK92CnLXgZKfC09ONwSjaZejalUyUzTQTQ.jpg%3Fw%3D650%26s%3D7a848a073a47d29c993c5dba35f25fe2
      const backgroundImage = `url(${decodeURIComponent(this.url)})`;
      // const url = new URL(window.location).searchParams.get('text');
      // const backgroundImage = url
      //     ? `url(${decodeURIComponent(url)})`
      //     : 'url(https://gfx-bloggar.aftonbladet-cdn.se/wp-content/blogs.dir/428/files/2014/11/Skarmavbild-2014-11-28-kl.-11.05.36.png)';
      // const backgroundImage = 'url(https://i.redditmedia.com/qH5nAx5HnNK92CnLXgZKfC09ONwSjaZejalUyUzTQTQ.jpg?w=650&s=7a848a073a47d29c993c5dba35f25fe2)';
      // const backgroundImage = 'url(https://www.cloudberries.co.uk/wp-content/uploads/2018/01/shades-gradient-photoshop-1.jpg)';

      const x = Object.entries(this.columns)
          .filter(([x]) => x < this.device.x)
          .reduce((sum, [x, col]) => sum - col, 0);
      const y = Object.entries(this.rows)
          .filter(([y]) => y < this.device.y)
          .reduce((sum, [y, row]) => sum - row, 0);
      const width = Object.values(this.columns).reduce((sum, col) => sum + col, 0);
      // const height = Object.values(this.rows).reduce((sum, row) => sum + row, 0);
      // return {
      //   transform: `translate(${x}px, ${y}px)`,
      //   width: `${width}px`,
      //   height: `${height}px`,
      // };
      return {
        backgroundImage,
        backgroundSize: `${width}px auto`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundRepeat: 'no-repeat',
      };
    },
  },
  mounted() {
    // this.callbacks = this.client.createCallbacks({
    //   ['video:playing']: ({ timestamp, time }) => {
    //     this.state = 'play';
    //     const position = time + (Date.now() - timestamp) / 1000;
    //     const seekTarget = Math.ceil(position + 1);  // +1s extra buffer for fast play
    //     this.player.seekTo(seekTarget, true);
    //     setTimeout(() => this.player.playVideo(), (seekTarget - position) * 1000);
    //   },
    //   ['video:paused']: async ({ time }) => {
    //     this.state = 'paused';
    //     await this.player.pauseVideo();
    //     await this.player.seekTo(time, true);
    //   },
    // });
  },
  beforeDestroy() {
    this.client.resetCallbacks(this.callbacks);
  },
}
</script>

<style lang="scss" scoped>
.image-fragment {
  width: 100vw;
  height: 100vh;
}
</style>
