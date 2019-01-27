<template>
  <div :style="background">
    <Configuration v-if="id" ref="config" :id="id"
        @send="payload => send('config', payload)"
        @finish="setConfig"/>

    <div class="debug">
      <template v-if="config">
        <div v-for="(item, key) in config.items" :key="key"
            :style="{ left: `${4 + 46 * item.x}px`, top: `${4 + 46 * item.y}px` }">
          {{ item.id.substring(0, 1) }}
        </div>
      </template>
      <p v-for="p in peers" :key="p.id">{{p.id}}</p>
    </div>
  </div>
</template>

<script>
import Client from '../network/client';
import Configuration from '@/components/Configuration.vue'

export default {
  name: 'config',
  components: {
    Configuration
  },
  data() {
    return {
      id: null,
      config: null,
      peers: []
    };
  },
  computed: {
    background() {
      if (!this.id || !this.config || this.$refs.config.tracing) {
        return;
      }
      const item = Object.values(this.config.items).find(item => item.id === this.id);
      if (!item) {
        return;
      }
      const url = new URL(window.location).searchParams.get('text');
      const backgroundImage = url
          ? `url(${decodeURIComponent(url)})`
          : 'url(https://gfx-bloggar.aftonbladet-cdn.se/wp-content/blogs.dir/428/files/2014/11/Skarmavbild-2014-11-28-kl.-11.05.36.png)';
      // const backgroundImage = 'url(https://i.redditmedia.com/qH5nAx5HnNK92CnLXgZKfC09ONwSjaZejalUyUzTQTQ.jpg?w=650&s=7a848a073a47d29c993c5dba35f25fe2)';
      // const backgroundImage = 'url(https://www.cloudberries.co.uk/wp-content/uploads/2018/01/shades-gradient-photoshop-1.jpg)';

      const fullWidth = this.config.size[0] * window.innerWidth;
      // const fullHeight = this.config.size[1] * window.innerHeight;
      const x = -item.x * window.innerWidth;
      const y = -item.y * window.innerHeight;
      // const y = (fullHeight - fullWidth) / 2 - item.y * window.innerHeight;
      return {
        backgroundImage,
        backgroundSize: `${fullWidth}px auto`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundRepeat: 'no-repeat',
      };
    },
  },
  mounted() {
    this.client = new Client();
    this.client.onConnected(id => this.id = id);
    this.client.onPeerJoin(peer => this.onPeerJoin(peer));
    this.client.onPeerLeft(peer => this.onPeerLeft(peer));
    this.client.on('config', ({ event, payload }) => {
      this.$refs.config.onEvent(event, payload);
    });
  },
  beforeDestroy() {
    this.client.disconnect();
  },
  methods: {
    send(type, payload) {
      this.client.send(type, payload);
    },
    onPeerJoin(peer) {
      this.peers.push(peer);
      this.$refs.config.reset();
    },
    onPeerLeft(peer) {
      const index = this.peers.indexOf(peer);
      if (index >= 0) {
        this.peers.splice(index, 1);
        this.$refs.config.reset();
      }
    },
    setConfig(config) {
      this.config = config;
    }
  }
}
</script>

<style lang="scss" scoped>
.debug {
  position: absolute;
  top: 0;
  & div {
    position: absolute;
    width: 42px;
    height: 42px;
    line-height: 42px;
    text-align: center;
    background: #8c8;
  }
}
</style>
