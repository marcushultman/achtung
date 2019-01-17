<template>
  <div class="home" :style="background">
    <Configuration v-if="id" ref="config" :id="id"
        :width="width" :height="height"
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
import client from '../network/client';
import Configuration from '@/components/Configuration.vue'

export default {
  name: 'home',
  components: {
    Configuration
  },
  data() {
    return {
      width: 0,
      height: 0,
      id: null,
      config: null,
      peers: []
    };
  },
  computed: {
    configItem() {
      if (!this.config) {
        return;
      }
      return Object.values(this.config.items).find(item => item.id === client.id) || null;
    },
    background() {
      const item = this.configItem;
      if (!item) {
        return;
      }
      if (this.$refs.config.tracing) {
        return;
      }
      // const backgroundImage = 'url(https://gfx-bloggar.aftonbladet-cdn.se/wp-content/blogs.dir/428/files/2014/11/Skarmavbild-2014-11-28-kl.-11.05.36.png)';
      // const backgroundImage = 'url(https://i.redditmedia.com/qH5nAx5HnNK92CnLXgZKfC09ONwSjaZejalUyUzTQTQ.jpg?w=650&s=7a848a073a47d29c993c5dba35f25fe2)';
      // const backgroundImage = 'url(https://www.cloudberries.co.uk/wp-content/uploads/2018/01/shades-gradient-photoshop-1.jpg)';
      const backgroundImage = `url(${decodeURIComponent(new URL(window.location).searchParams.get('text'))})`;

      const fullWidth = this.config.size[0] * this.width;
      const fullHeight = this.config.size[1] * this.height;
      const position = {
        x: -item.x * this.width,
        y: (fullHeight - fullWidth) / 2 - item.y * this.height
      };
      return {
        backgroundImage,
        backgroundSize: `${fullWidth}px auto`,
        backgroundPosition: `${position.x}px ${position.y}px`,
        backgroundRepeat: 'no-repeat',
      };
    },
  },
  mounted() {
    const handle = this.clientHandle = client.createHandle();
    client.onConnected(handle, id => this.id = id);
    client.onPeerJoin(handle, peer => this.onPeerJoin(peer));
    client.onPeerLeft(handle, peer => this.onPeerLeft(peer));
    client.on(handle, 'config', ({ event, payload }) => {
      this.$refs.config.onEvent(event, payload);
    });

    this.updateSizes();
    window.onresize = () => this.updateSizes();
  },
  beforeDestroy() {
    client.releaseHandle(this.clientHandle);
  },
  methods: {
    send(type, payload) {
      client.send(type, payload);
    },
    updateSizes() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
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

<style lang="scss">
.home {
  width: 100vw;
  height: 100vh;
  display: flex;
}
.debug {
  position: absolute;
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
