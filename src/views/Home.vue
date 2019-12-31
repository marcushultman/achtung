<template>
  <div class="home">
    <Achtung :client="client" :class="{ blur }"/>
    <router-view/>
  </div>
</template>

<script>
import ImageFragment from '@/components/ImageFragment'
import VideoFragment from '@/components/VideoFragment'
import Achtung from '@/views/Achtung'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'home',
  components: { Achtung, ImageFragment, VideoFragment },
  props: {
    client: Object,
  },
  computed: {
    blur() { return this.$route.name === 'config'; },
  },
}
</script>

<style>
html, body {
  background: #333;
}
</style>

<style lang="scss" scoped>
.home {
  width: 100vw;
  height: 100vh;
  background: black;
  color: white;
  font-family: "Times New Roman", Times, serif;
}
.blur {
  filter: blur(5px);
  &::after {
    position: absolute;
    top: 0px;
    left: 0px;
    content: '';
    background: rgba(255, 255, 255, 0.2);
    width: 100vw;
    height: 100vh;
  }
}
</style>
