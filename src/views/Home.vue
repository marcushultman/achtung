<template>
  <div>
    <div class="home" :class="{ blur }" :style="background">
      <VideoFragment :client="client"/>
      <router-link to="config">Config</router-link>
    </div>
    <router-view/>
  </div>
</template>

<script>
import VideoFragment from '@/components/VideoFragment'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'home',
  components: { VideoFragment },
  props: {
    client: Object,
  },
  computed: {
    blur() { return this.$route.name === 'config'; },
    ...mapState(['id']),
    ...mapGetters(['findById', 'left', 'right']),
    selection() { return this.$store.state.config.selection; },
    item() { return this.findById(this.id); },
    background() {
      return {};
      // const { item } = this;
      // if (!item) {
      //   return;
      // }
      // const url = new URL(window.location).searchParams.get('text');
      // const backgroundImage = url
      //     ? `url(${decodeURIComponent(url)})`
      //     : 'url(https://gfx-bloggar.aftonbladet-cdn.se/wp-content/blogs.dir/428/files/2014/11/Skarmavbild-2014-11-28-kl.-11.05.36.png)';
      // // const backgroundImage = 'url(https://i.redditmedia.com/qH5nAx5HnNK92CnLXgZKfC09ONwSjaZejalUyUzTQTQ.jpg?w=650&s=7a848a073a47d29c993c5dba35f25fe2)';
      // // const backgroundImage = 'url(https://www.cloudberries.co.uk/wp-content/uploads/2018/01/shades-gradient-photoshop-1.jpg)';
      // const [min, max] = this.$store.state.config.selection.reduce(([min, max], item) => [Math.min(min, item.x), Math.max(max, item.x)], [item.x, item.x]);
      // const fullWidth = (max - min + 1) * window.innerWidth;
      // // const fullHeight = this.config.size[1] * window.innerHeight;
      // const x = (min - item.x) * window.innerWidth;
      // const y = -item.y * window.innerHeight;
      // // const y = (fullHeight - fullWidth) / 2 - item.y * window.innerHeight;
      // return {
      //   backgroundImage,
      //   backgroundSize: `${fullWidth}px auto`,
      //   backgroundPosition: `${x}px ${y}px`,
      //   backgroundRepeat: 'no-repeat',
      // };
    },
  },
  mounted() {
    // todo: show toast with confirm
    this.client.on('config:request', () => this.$router.push('/config'));
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
  z-index: 1;
  background: #3388aa;
  color: white;
  padding: 8px 32px;
  border-radius: 32px;
  font-size: 22px;
  text-decoration: none;
}
</style>
