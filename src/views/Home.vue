<template>
  <div>
    <div class="home" :class="{ blur }" :style="background">
      <ImageFragment :client="client"/>
      <!-- <VideoFragment :client="client"/> -->
      <router-link to="config">Config</router-link>
      <p class="params">
        <div>title: {{ title }}</div>
        <div>text: {{ text }}</div>
        <div>url: {{ url }}</div>
      </p>
    </div>
    <router-view/>
  </div>
</template>

<script>
import ImageFragment from '@/components/ImageFragment'
import VideoFragment from '@/components/VideoFragment'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'home',
  components: { ImageFragment, VideoFragment },
  props: {
    client: Object,
  },
  data() {
    return {
      callbacks: null,
    };
  },
  computed: {
    blur() { return this.$route.name === 'config'; },
    ...mapState(['id', 'title', 'text', 'url']),
    ...mapGetters(['devices', 'findById', 'left', 'right']),
    device() { return this.findById(this.id); },
    background() {
      return {};
      // const { device } = this;
      // if (!this.device) {
      //   return;
      // }
      // const url = new URL(window.location).searchParams.get('text');
      // const backgroundImage = url
      //     ? `url(${decodeURIComponent(url)})`
      //     : 'url(https://gfx-bloggar.aftonbladet-cdn.se/wp-content/blogs.dir/428/files/2014/11/Skarmavbild-2014-11-28-kl.-11.05.36.png)';
      // // const backgroundImage = 'url(https://i.redditmedia.com/qH5nAx5HnNK92CnLXgZKfC09ONwSjaZejalUyUzTQTQ.jpg?w=650&s=7a848a073a47d29c993c5dba35f25fe2)';
      // // const backgroundImage = 'url(https://www.cloudberries.co.uk/wp-content/uploads/2018/01/shades-gradient-photoshop-1.jpg)';
      // const [min, max] = this.devices.reduce(([min, max], ({ x, y })) => [Math.min(min, x), Math.max(max, y)], [this.device.x, this.device.x]);
      // const fullWidth = (max - min + 1) * window.innerWidth;
      // // const fullHeight = this.config.size[1] * window.innerHeight;
      // const x = (min - device.x) * window.innerWidth;
      // const y = -device.y * window.innerHeight;
      // // const y = (fullHeight - fullWidth) / 2 - device.y * window.innerHeight;
      // return {
      //   backgroundImage,
      //   backgroundSize: `${fullWidth}px auto`,
      //   backgroundPosition: `${x}px ${y}px`,
      //   backgroundRepeat: 'no-repeat',
      // };
    },
  },
  mounted() {
    this.callbacks = this.client.createCallbacks({
      $join: peer => {
        if (peer === this.id) {
          return;
        }
        this.client.send('config:selection', this.$store.state.config.selection);
      },
      $left: peer => {
        this.$store.commit('deselect', peer.id);
      },
      // todo: show toast with confirm
      ['config:request']: () => this.$router.push('/config'),
    })
  },
  beforeDestroy() {
    this.client.resetCallbacks(this.callbacks);
  },
}
</script>

<style lang="scss" scoped>
.home {
  width: 100vw;
  height: 100vh;
}
.blur {
  filter: blur(5px);
  &::after {
    position: absolute;
    top: 0;
    left: 0;
    content: '';
    background: rgba(255, 255, 255, 0.5);
    width: 100vw;
    height: 100vh;
  }
}
a {
  position: absolute;
  top: 64px;
  left: 64px;
  z-index: 1000;
  background: #3388aa;
  color: white;
  padding: 8px 32px;
  border-radius: 32px;
  font-size: 22px;
  text-decoration: none;
}
</style>
