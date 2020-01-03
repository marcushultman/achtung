<template>
  <div class="game">
    <canvas ref="canvas"
        class="canvas" :class="{ playing, was_playing, hide_overlay }"
        @click="setHideOverlay(false)"></canvas>

    <div class="grid" v-show="!hide_overlay">
      <div v-for="{ align, max_size, flip } of gamepad_groups" :key="align"
          class="game-pad-group" :class="[align, { outline: !playing && !controller_lock }]"
          @click.self="maybeAddPlayer($event, align, max_size)">
        <div v-for="{ player_id, align, offset, color } in playersForSide(align)" :key="player_id"
            class="game-pad" :class="{ flip }" :style="gamePadStyle(align, offset, color.value)"
            @click="maybeRemovePlayer(player_id)">
          <span class="icon icon-left-nav" id="left"
              @touchstart.stop="playing && game.turn_left(player_id)"
              @mousedown.stop="playing && game.turn_left(player_id)"
              @touchend.stop="playing && game.stop_turn(player_id)"
              @mouseup.stop="playing && game.stop_turn(player_id)"
              @contextmenu.prevent>➡</span>
              <!-- ➤ -->
          <span class="icon icon-right-nav" id="right"
              @touchstart.stop="playing && game.turn_right(player_id)"
              @mousedown.stop="playing && game.turn_right(player_id)"
              @touchend.stop="playing && game.stop_turn(player_id)"
              @mouseup.stop="playing && game.stop_turn(player_id)"
              @contextmenu.prevent>➡</span>
        </div>
      </div>

      <transition name="fade">
        <div class="overlay" :class="{ was_playing }" v-if="!playing && !hide_overlay">
          <h1>Achtung, die Kurve!</h1>
          <div class="menu">
            <div class="button">
              <div class="vr"></div>
              <router-link :to="{ name: 'config' }">Devices</router-link>
              <div class="vr"></div>
            </div>
            <div class="button" v-if="controller_lock">
              <div class="vr"></div>
              <button @click="controller_lock = false">Edit players</button>
              <div class="vr"></div>
            </div>
            <div class="button">
              <div class="vr"></div>
              <button @click="requestFullscreen">Fullscreen</button>
              <div class="vr"></div>
            </div>
            <div class="button" v-if="start_allowed && !score">
              <div class="vr"></div>
              <button @click="startAll">Start game</button>
              <div class="vr"></div>
            </div>
            <div class="button" v-if="score">
              <div class="vr"></div>
              <button @click="setHideOverlay(true)">Show gameboard</button>
              <div class="vr"></div>
            </div>
            <div class="button" v-if="start_allowed && score">
              <div class="vr"></div>
              <button @click="startAll">Next round</button>
              <div class="vr"></div>
            </div>
          </div>

          <div v-if="!start_allowed" class="player-controller-hint">
            Place controllers anywhere on the side of all devices.
          </div>

          <div v-if="score" class="scoreboard">
            <h3>===&nbsp;&nbsp;Score&nbsp;&nbsp;===</h3>
            <ol>
              <li v-for="({ points, worm }, i) of player_scores" :key="i">
                <div class="item">
                  <span class="color-indicator" :style="{ background: worm.color }"></span>
                  <span class="name">
                    {{ worm.name }}
                    <template v-if="worm == winner">*</template>
                  </span>
                  <span class="points">{{ points }}</span>
                </div>
              </li>
            </ol>
          </div>

        </div>
      </transition>
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
      sessionId: '1234',
      game: null,
      score: null,
      winner: null,
      playerSequenceNumber: 0,
      playing: false,
      was_playing: false,
      controller_lock: false,
      hide_overlay: false,
    };
  },
  computed: {
    ...mapState(['id']),
    ...mapGetters(['findById', 'findByPosition', 'getPlayersForDevice']),
    device() { return this.findById(this.id); },
    gamepad_groups() {
      if (!this.device) {
        return [];
      }
      const { x, y } = this.device;
      return [
        [x, y - 1, 'top', 2, true],
        [x - 1, y, 'left', 3, false],
        [x + 1, y, 'right', 3, true],
        [x, y + 1, 'bottom', 2, false],
      ]
          .filter(([x, y]) => !this.findByPosition(x, y))
          .map(([, , align, max_size, flip]) => ({ max_size, align, flip }));
    },
    local_players() { return this.getPlayersForDevice(this.id); },
    start_allowed() { return this.game && Object.keys(this.$store.state.achtung.players).length > 1; },
    canvas_style() { return { opacity: (this.playing || this.hide_overlay) ? 1.0 : 0.15 }; },
    player_scores() {
      return this.score.map(([player_id, points]) => {
        const worm = this.game.worms.get(player_id);
        return { points, worm };
      });
    },
    playersForSide() {
      return (align) => {
        const players = this.local_players.filter(player => player.align === align);
        if (!players.length) {
          return [];
        }
        players.sort((lhs, rhs) => lhs.offset - rhs.offset);
        const is_vertical = align === 'left' || align === 'right'
        const maxOffset = is_vertical ? window.innerHeight : window.innerWidth;
        const points = [{ offset: -100 }, ...players, { offset: maxOffset - 20 }];
        const adjustOffset = (a, b, c) => {
          return Math.max(a.offset + 160, Math.min(b.offset, c.offset - 160));
        };
        for (let i = 0; i < players.length; ++i) {
          players[i].offset = adjustOffset(...points.slice(i, i + 3));
        }
        return players;
      }
    },
    gamePadStyle() {
      const axis = (align) => /^top|bottom$/.test(align) ? 'X' : 'Y';
      return (align, offset, backgroundColor) => ({ transform: `translate${axis(align)}(${offset}px)`, backgroundColor });
    },
  },
  mounted() {
    this.callbacks = this.client.createCallbacks({
      $join: () => this.resetScore(),
      $left: () => this.resetScore(),
      ['config:open']: () => this.$router.push({ name: 'config' }),
      ['achtung:overlay']: ({ hide_overlay }) => {
        this.hide_overlay = hide_overlay;
        this.was_playing = false;
      },
      ['achtung:reset']: () => this.resetScore(),
      ['achtung:start']: ({ seed }) => this.start(seed),
      ['achtung:message']: message => this.onMessage(message),
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
    // all
    resetAllScore() {
      this.client.send('achtung:reset');
      this.resetScore();
    },
    startAll() {
      const seed = Date.now();
      this.client.send('achtung:start', { seed });
      this.start(seed);
    },
    setHideOverlay(hide_overlay) {
      if (hide_overlay !== this.hide_overlay) {
        this.client.send('achtung:overlay', { hide_overlay });
        this.hide_overlay = hide_overlay;
        this.was_playing = false;
      }
    },

    // local
    resetScore() {
      this.score = null;
      this.game.resetScore();
    },
    start(seed) {
      if (this.game) {
        this.playing = true;
        this.controller_lock = true;
        this.game.start(seed);
      }
    },

    // player management
    maybeAddPlayer(e, align, max_size) {
      if (this.playing || this.controller_lock || this.playersForSide(align).length == max_size) {
        return;
      }
      const player_id = `${this.id}#${++this.playerSequenceNumber}`;
      const device_id = this.id;
      const is_vertical = align === 'left' || align === 'right'
      const offset = (is_vertical ? e.clientY : e.clientX) - 80;
      this.resetAllScore();
      this.$store.dispatch('addPlayer', { player_id, device_id, align, offset }); 
    },
    maybeRemovePlayer(player_id) {
      if (this.playing || this.controller_lock) {
        return;
      }
      this.resetAllScore();
      this.$store.dispatch('removePlayer', player_id); 
    },

    // game events
    onMessage({ sender, receiver, payload }) {
      if (this.game && (receiver === 0 || receiver === this.id)) {
        this.game.on_message(sender, payload);
      }
    },
    onGameOver(winner) {
      this.winner = winner;
      this.playing = false;
      this.was_playing = true;
    },

    // create game
    maybeCreateGame() {
      if (this.game) {
        return;
      }
      this.game = new Game(
          this.$refs.canvas.getContext('2d'),
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
          () => {
            const { players } = this.$store.state.achtung;
            // return new Map(Object.keys(players)
            //     .filter(player_id => this.findById(players[player_id].device_id))
            //     .map(player_id => [player_id, players[player_id]]));
            return new Map(Object.entries(players)
                .filter(entry => this.findById(entry[1].device_id)));
          },
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
          (winner) => this.onGameOver(winner));
      // dev: keyboard support
      window.addEventListener('keydown', (e) => {
        if (this.playing && !e.repeat) {
          if (e.keyCode === 39) {
            this.game.turn_right(this.local_players[0].player_id);
          } else if (e.keyCode === 37) {
            this.game.turn_left(this.local_players[0].player_id);
          }
        }
      });
      window.addEventListener('keyup', (e) => {
        if (this.playing && (e.keyCode === 39 || e.keyCode === 37)) {
          this.game.stop_turn(this.local_players[0].player_id);
        }
      });
    },

    // other
    requestFullscreen() {
      // const docEl = document.documentElement;
      // const requestFullscreen = docEl.requestFullscreen
      //     || docEl.mozRequestFullScreen
      //     || docEl.webkitRequestFullScreen
      //     || docEl.msRequestFullscreen;
      document.body.requestFullscreen();
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
  outline: none;
  border-radius: 32px;
  font-size: 22px;
  text-decoration: none;
}

.game > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
canvas, .grid {
  width: 100vw;
  height: 100vh;
}
.canvas {
  opacity: 0.15;
  transition: opacity 0.25s;
  &.playing, &.hide_overlay {
    transition: opacity 0.25s;
    opacity: 1.0;
  }
  &.was_playing {
    transition-delay: 1s;
    transition: opacity 1s;
  }
}

.score {
  position: absolute;
  top: 0;
  left: 120px;
}

.grid {
  display: grid;
  grid-template-columns: 76px 1fr 76px;
  grid-template-rows: 76px 1fr 76px;
}

@keyframes pulse {
  0% { background-color: #000; }
  50% { background-color: #333; }
  100% { background-color: #000; }
}

.game-pad-group {
  &.outline { animation: 2s infinite pulse; }
  &.top, &.bottom { grid-column: 1 / 4; }
  &.left, &.right { grid-row: 1 / 4; }
  &.top { grid-row: 1; }
  &.bottom { grid-row: 3; }
  &.left { grid-column: 1; }
  &.right { grid-column: 3; }
}
.game-pad {
  position: absolute;
  opacity: 0.8;
  display: flex;
  background: rgba(255, 255, 255, 0.2);
  .top & { border-radius: 0 0 38px 38px; }
  .left & { border-radius: 0 38px 38px 0; }
  .right & { border-radius: 38px 0 0 38px; }
  .bottom & { border-radius: 38px 38px 0 0; }
  &.flip { flex-direction: row-reverse; }
  .left &, .right & { flex-direction: column; }
  .left &.flip, .right &.flip { flex-direction: column-reverse; }
  & .icon {
    width: 76px;
    height: 76px;
    line-height: 76px;
    font-size: 42px;
    text-align: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 76px;
  }
  .bottom & .icon-left-nav, .top & .icon-right-nav { transform: rotate(0deg); }
  .left & .icon-right-nav, .right & .icon-left-nav { transform: rotate(90deg); }
  .top & .icon-right-nav, .bottom & .icon-left-nav { transform: rotate(180deg); }
  .left & .icon-left-nav, .right & .icon-right-nav { transform: rotate(270deg); }
}

.fade-enter-active {
  transition: opacity 1s;
  &.was_playing {
    transition-delay: 1s;
  }
}
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.overlay {
  overflow-x: hidden;
  grid-area: 2 / 2;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 4px;
  & .row {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}

.menu {
  margin: 0 16px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  & .button {
    display: flex;
    align-items: stretch;
    margin: 4px 0;
    & .vr {
      height: 42px;
      border-left: 1px solid #fff;
      align-self: stretch;
    }
    & :not(.vr) {
      flex: 1;
    }
    & a, & button {
      padding: 0;
      background: none;
      color: inherit;
      font-family: inherit;
      font-size: 22px;
      border: none;
      text-decoration: none;
      outline: none;
      cursor: pointer;
    }
  }
}
.player-controller-hint {
  margin: 12px 8px;
}
.scoreboard {
  margin: 16px 0;
  & h3 { margin: 0; }
  & ol { margin: 0; }
  & .item {
    display: flex;
    align-items: center;
    text-align: initial;
    font-size: 18px;
    & .color-indicator {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      margin: 4px 12px 4px 4px;
    }
    & .name { flex: 1; }
  }
  & button {
    padding: 8px 32px;
    background: none;
    color: inherit;
    font-family: inherit;
    font-size: 22px;
    border: none;
    outline: none;
    cursor: pointer;
  }
}
</style>
