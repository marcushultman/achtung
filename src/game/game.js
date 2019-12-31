import Score from './score'
import Random from '../random';
import RangeMap from './range_map';
import Worm from './worm'
import Point from './point'
import CollisionUtil from './collision'
import Color from './color'

const LEFT = 0, RIGHT = 1;
const ACTION_TURN = 0,
      ACTION_TRANSFER = 1,
      EVENT_TRANSFER = 2,
      EVENT_DEATH = 3,
      ACTION_RESTART = 4;

const SPAWN_OFFSET_AMOUNT = 0.2; 

function mirror(side) {
  return 5 - side;
}

export default class Game {

  constructor(ctx,
              local_id,
              send_message,
              get_players,
              get_adjacent_device,
              get_offset,
              get_device_area,
              on_score_updated,
              on_game_over) {
    this.ctx = ctx;
    this.width = this.ctx.canvas.width = window.innerWidth;
    this.height = this.ctx.canvas.height = window.innerHeight;
    this.ctx.lineWidth = 5;

    this.local_id = local_id;

    this.send_message = send_message;
    this.get_players = get_players;
    this.get_adjacent_device = get_adjacent_device;
    this.get_offset = get_offset;
    this.get_device_area = get_device_area;
    this.on_score_updated = on_score_updated;
    this.on_game_over = on_game_over;
  }

  requestFrame() {
    requestAnimationFrame(t => this.main_loop(t));
  }

  start() {
    const seed = Date.now();
    this.send_message(0, { type: ACTION_RESTART, seed });
  }

  start_game(seed) {
    this.worms = new Map();
    this.worm_devices = new Map();
    this.score = new Score();

    const random = new Random(seed);

    this.players = this.get_players();
    const spawn_devices =
        new RangeMap([...new Set(this.players.values())].map(id => [this.get_device_area(id), id]));

    for (const [index, controller_id] of [...this.players.keys()].entries()) {
      const position = new Point(
          random.range(SPAWN_OFFSET_AMOUNT * this.width, (1 - SPAWN_OFFSET_AMOUNT) * this.width),
          random.range(SPAWN_OFFSET_AMOUNT * this.height, (1 - SPAWN_OFFSET_AMOUNT) * this.height));
      const direction = random.range(-Math.PI, Math.PI);

      this.worms.set(controller_id, new Worm(
          this.width,
          this.height,
          position,
          direction,
          Color.get(index)));

      const device_id = spawn_devices.get(random.range(0, spawn_devices.max));
      this.worm_devices.set(controller_id, device_id);
    }

    this.on_score_updated(this.score);

    this.elapsed_time = 0;
    this.max_fps = 30;
    this.game_over = false;
    this.game_time = performance.now();
    this.requestFrame();
  }

  main_loop(game_time) {
    if (game_time < this.game_time + (1000 / this.max_fps)) {
      this.requestFrame();
      return;
    }
    this.elapsed_time = game_time - this.game_time;
    this.game_time = game_time;

    this.update();
    this.draw();
    if (!this.game_over) {
      this.requestFrame();
    }
  }

  on_message(id, message) {
    switch (message.type) {
      case ACTION_TURN: {
        this.worms.get(message.controller_id).set_turning(message.turning);
        return;
      }
      case ACTION_TRANSFER: {
        const worm = this.worms.get(message.controller_id);
        const { x, y } = message.position;
        const position = new Point(x, y).add(this.get_offset(message.side));
        worm.start(position, message.direction, message.turning);
        this.send_message(0, {
          type: EVENT_TRANSFER,
          controller_id: message.controller_id,
          device_id: this.local_id
        });
        return;
      }
      case EVENT_TRANSFER: {
        this.worm_devices.set(message.controller_id, message.device_id);
        return;
      }
      case EVENT_DEATH: {
        this.worms.get(message.controller_id).kill();
        return;
      }
      case ACTION_RESTART: {
        this.start_game(message.seed);
        return;
      }
    }
  }

  turn_left(controller_id) {
    return this.turn(controller_id, -1);
  }
  turn_right(controller_id) {
    return this.turn(controller_id, 1);
  }
  stop_turn(controller_id) {
    return this.turn(controller_id, 0);
  }

  turn(controller_id, turning) {
    this.send_message(this.worm_devices.get(controller_id), {
      type: ACTION_TURN, controller_id, turning
    });
    return true;
  }

  // =====

  transfer(controller_id, worm, side) {
    const device_id = this.get_adjacent_device(side);
    if (device_id) {
      const { x, y } = worm.position;
      this.worm_devices.set(controller_id, device_id);
      this.send_message(device_id, {
        type: ACTION_TRANSFER,
        controller_id,
        position: { x, y },
        side: mirror(side),
        direction: worm.direction,
        turning: worm.turning
      });
      return true;
    } else {
      this.kill_worm(controller_id, worm);
      return false;
    }
  }

  kill_worm(controller_id, worm) {
    this.send_message(0, { type: EVENT_DEATH, controller_id });
  }

  // =====

  update() {
    for (const [controller_id, worm] of this.worms) {
      if (this.worm_devices.get(controller_id) !== this.local_id) {
        continue;
      }
      const updated =
          worm.update(this.elapsed_time, side => this.transfer(controller_id, worm, side));
      if (updated && this.check_collision(worm, controller_id)) {
        this.kill_worm(controller_id, worm);
      }
    }
    // update scores
    const num_worms_dead = [...this.worms.values()].filter(worm => worm.is_dead).length;
    for (const [controller_id, worm] of this.worms) {
      if (!worm.is_dead) {
        this.score.set(controller_id, num_worms_dead);
      }
    }
    this.on_score_updated(this.score);

    // check game over
    if (num_worms_dead >= this.players.size - 1) {
      this.game_over = true;
      this.on_game_over();
    }
  }

  check_collision(worm, controller_id) {
    for (let other of this.worms.values()) {
      let prev = other.tail[0];
      for (const point of other.create_collition_points(other === worm)) {
        if (!point.is_start) {
          const d = point.cp1 ?
            CollisionUtil.bezier_dist2(prev.position, point.cp1, point.cp2, point.position, worm.position) :
            CollisionUtil.line_dist2(prev.position, point.position, worm.position);
          if (d < 25) {
            return true;
          }
        }
        prev = point;
      }
    }
    return false;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const worm of this.worms.values()) {
      worm.draw(this.ctx);
    }
  }
}