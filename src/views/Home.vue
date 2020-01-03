<template>
  <div class="home">
    <Achtung v-if="id && device" :client="client" :class="{ blur }"/>
    <DeviceForm v-else-if="id" :client="client" :class="{ blur }"/>
    <div class="joining" v-else>
      <span>Joining session...</span>
    </div>
    <router-view/>
  </div>
</template>

<script>
import Achtung from '@/views/Achtung'
import DeviceForm from '@/views/DeviceForm'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'home',
  components: { Achtung, DeviceForm },
  props: {
    client: Object,
  },
  computed: {
    blur() { return this.$route.name === 'config'; },
    ...mapState(['id']),
    ...mapGetters(['findById']),
    device() { return this.findById(this.id); },
  },
}
</script>

<style lang="scss" scoped>
.home {
  width: 100vw;
  height: 100vh;
  background: black;
  color: white;
  font-family: "Times New Roman", Times, serif;
  display: flex;
}
.joining {
  flex: 1;
  align-self: center;
  font-size: 20px;
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
