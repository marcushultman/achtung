<template>
  <div class="game">
    <canvas id="canvas" :style="canvasStyle"></canvas>
    <!-- <h2 class="score" :style="{ color: 'red' }">
      {{ score }}
    </h2> -->
    <div v-for="{ offset, size, align } of gamepadAreas" class="game-pads" :class="align">
      <div class="game-pad" v-for="player_id in localPlayers.slice(offset, offset + size)">
        <div>
          <span class="icon icon-left-nav" id="left"
              @touchstart="game.turn_left(player_id)"
              @mousedown="game.turn_left(player_id)"
              @touchend="game.stop_turn(player_id)"
              @mouseup="game.stop_turn(player_id)"
              @contextmenu.prevent>➤</span>
          <span class="icon icon-right-nav" id="right"
              @touchstart="game.turn_right(player_id)"
              @mousedown="game.turn_right(player_id)"
              @touchend="game.stop_turn(player_id)"
              @mouseup="game.stop_turn(player_id)"
              @contextmenu.prevent>➤</span>
        </div>
      </div>
    </div>

    <div class="buttons" v-show="!playing">
      <router-link to="config" class="config-button">Config</router-link>
      <button v-if="localPlayers.length < maxPlayers" class="config-button" @click="addPlayer">Add player</button>
      <button v-if="localPlayers.length" class="config-button" @click="removePlayer">Remove player</button>
      <button v-if="canStart" class="config-button" @click="start">Start</button>
      <div v-if="score">
        <h3>==&nbsp;Last score&nbsp;==</h3>
        <ol>
          <li v-for="(points, player_id) of sortedScore">
            {{ game.worms.get(player_id).color }}: {{ points }}
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Game from '@/game/game';
import Point from '@/game/point';

const TOP = 1, LEFT = 2, RIGHT = 3, BOTTOM = 4;

export default {
  name: 'Achtung',
  props: {
    client: Object,
  },
  data() {
    return {
      callbacks: null,
      game: null,
      score: null,
      playing: false,
    };
  },
  computed: {
    ...mapState(['id']),
    ...mapGetters(['findById', 'findByPosition', 'getPlayersForDevice']),
    device() { return this.findById(this.id); },
    gamepadAreas() {
      if (!this.device) {
        return [];
      }
      const { x, y } = this.device;
      const sides = [
        [x, y - 1, 3, 'top'],
        [x - 1, y, 4, 'left'],
        [x + 1, y, 4, 'right'],
        [x, y + 1, 3, 'bottom'],
      ]
      .filter(([x, y]) => !this.findByPosition(x, y))
      .map(area => area.slice(2));
      const areas = [];
      let offset = 0;
      for (const [size, align] of sides) {
        areas.push({ offset, size, align });
        offset += size;
      }
      return areas;
    },
    maxPlayers() { return this.gamepadAreas.reduce((sum, area) => sum + area.size, 0); },
    localPlayers() { return this.getPlayersForDevice(this.id); },
    canStart() { return this.game && Object.keys(this.$store.state.achtung.players).length >=2; },
    canvasStyle() { return { opacity: this.playing ? 1.0 : 0.15 }; },
    sortedScore() {
      const result = Object.entries(score.result);
      result.sort();
      return result;
    },
  },
  mounted() {
    this.callbacks = this.client.createCallbacks({
      $join: peer => {
        if (peer === this.id) {
          return;
        }
        // now what?
      },
      $left: peer => {
        this.$store.commit('deselect', peer.id);
      },
      // todo: show toast with confirm
      ['config:request']: () => this.$router.push('/config'),
      // achtung
      ['achtung:start']: () => this.start(),
      ['achtung:message']: ({ sender, receiver, payload }) => {
        if (receiver === 0 || receiver === this.id) {
          this.game.on_message(sender, payload);
        }
      },
    });
    this.maybeCreateGame();
  },
  beforeDestroy() {
    this.client.resetCallbacks(this.callbacks);
    delete this.game;
  },
  watch: {
    id() { this.maybeCreateGame(); },
  },
  methods: {
    addPlayer() {
      const player_id = `${this.id}#${this.localPlayers.length}`;
      this.$store.dispatch('addPlayer', { device_id: this.id, player_id }); 
    },
    removePlayer() {
      const player_id = this.localPlayers[this.localPlayers.length - 1];
      this.$store.dispatch('removePlayer', player_id); 
    },
    maybeCreateGame() {
      if (!this.id || this.game) {
        return;
      }
      this.game = new Game(
          document.getElementById('canvas').getContext('2d'),
          this.id,
          // send_message,
          (receiver, payload) => {
            if (receiver === this.id || receiver === 0) {
              this.game.on_message(this.id, payload);
            }
            if (receiver !== this.id) {
              this.client.send('achtung:message', { sender: this.id, receiver, payload });
            }
          },
          // get_players,
          () => new Map(Object.entries(this.$store.state.achtung.players)),
          // get_adjacent_player
          (side) => {
            const { x, y } = this.device;
            let peer = null;
            switch (side) {
              case TOP:
                peer = this.findByPosition(x, y - 1);
                break;
              case LEFT:
                peer = this.findByPosition(x - 1, y);
                break;
              case RIGHT:
                peer = this.findByPosition(x + 1, y);
                break;
              case BOTTOM:
                peer = this.findByPosition(x, y + 1);
                break;
            }
            return peer ? peer.id : null;
          },
          // get_offset
          (side) => {
            const { x, y } = this.device;
            switch (side) {
              case TOP:
                return new Point(0, -this.findByPosition(x, y - 1).deviceHeight);
              case LEFT:
                return new Point(-this.findByPosition(x - 1, y).deviceWidth, 0);
              case RIGHT:
                return new Point(this.device.deviceWidth, 0);
              case BOTTOM:
                return new Point(0, this.device.deviceHeight);
            }
          },
          // get_device_area
          (id) => {
            const device = this.findById(id);
            return device ? device.deviceWidth * device.deviceHeight : 0;
          },
          // on_score_updated
          (score) => this.score = score,
          // on_game_over
          () => this.onGameOver());
      // dev: keyboard support
      window.addEventListener('keydown', (e) => {
        if (this.game && !e.repeat) {
          if (e.keyCode === 39) {
            this.game.turn_right(this.localPlayers[0]);
          } else if (e.keyCode === 37) {
            this.game.turn_left(this.localPlayers[0]);
          }
        }
      });
      window.addEventListener('keyup', (e) => {
        if (this.game && (e.keyCode === 39 || e.keyCode === 37)) {
          this.game.stop_turn(this.localPlayers[0]);
        }
      });
    },
    start() {
      this.playing = true;
      this.game.start();
    },
    onGameOver() {
      this.playing = false;
    }
  }
}
</script>

<style lang="scss" scoped>
.config-button {
  background: #3388aa;
  color: white;
  font-family: inherit;
  padding: 8px 32px;
  border: none;
  border-radius: 32px;
  font-size: 22px;
  text-decoration: none;
}

.buttons {
  position: absolute;
  top: 64px;
  left: 64px;
}

div {
  color: white;
}

.game {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.score {
  position: absolute;
  top: 0;
  left: 120px;
}

.game-pads {
  position: absolute;
  // 
  display: flex;
  justify-content: space-around;
  &.top, &.bottom {
    width: 100%;
  }
  &.left, &.right {
    top: 10vh;
    height: 80vh;
    flex-direction: column;
  }
  &.top { top: 0; }
  &.bottom { bottom: 0; }
  &.left { left: 0; }
  &.right { right: 0; }
}

.game-pad {
  position: relative;
  opacity: 0.25;
}
.game-pad > * {
  display: table;
  margin: 0 auto;
  background: rgba(255,255,255,0.1);
  border-radius: 25px 25px 0 0;
}
.game-pad .icon {
  float: left;
  width: 50px;
  height: 50px;
  margin: 6px 12px 4px 12px;
  font-size: 24px;
  line-height: 50px;
  text-align: center;
  background-color: rgba(255,255,255,.6);
  border-radius: 25px;
}.game-pad .icon:first-child {
  /*margin-left: 0;*/
}
.icon-left-nav {
  transform: rotate(180deg);
}

.pid {
  position: absolute;
  top: -20px;
  left: 16px;
  font-size: 12px;
}

</style>
