import Random from '../random';
import Point from './point'

const TOP = 1, LEFT = 2, RIGHT = 3, BOTTOM = 4;
const cross = (a, b) => a.x * b.y - a.y * b.x;

const SKIP_PROB = 0;
// const SKIP_PROB = 0.0025;

export default class Worm {
  constructor (width, height, position, direction, name, color) {
    this.width = width;
    this.height = height;
    this.random = new Random();

    this.name = name;
    this.color = color;
    this.speed = 0.1;
    this.is_dead = false;

    this.tail = [];
    this.skip = 0;

    this.start(position, direction, 0);
  }

  start(position, direction, turning) {
    this.position = position;
    this.direction = direction;
    this.turning = turning;
    this.add_tail_point(true);
  }

  set_turning(turning) {
    this.add_tail_point();
    this.turning = turning;
  }

  kill() {
    this.add_tail_point();
    this.is_dead = true;
  }

  head() {
    return this.tail[this.tail.length - 1];
  }

  add_tail_point(is_start) {
    if (this.skip > 0) {
      return null;
    }
    const point = this.create_tail_point(
      this.position, this.direction, is_start)
    this.tail.push(point);
    return point;
  }

  create_tail_point(position, direction, is_start) {
    const point = {position, direction, is_start};
    if (!is_start) {
      this.calculate_control_points(this.head(), point);
    }
    return point;
  }

  create_collition_points(exclude_head) {
    const tail = [...this.tail, this.create_tail_point(this.position, this.direction)];
    return tail.slice(0, exclude_head ? -2 : undefined);
  }

  calculate_control_points(prev, point) {
    const diff = point.direction - prev.direction;
    if (diff === 0) {
      return;
    }
    const s_ = prev.direction + Math.PI / 2;
    const u_ = point.direction + Math.PI / 2;
    const s = new Point(Math.cos(s_), Math.sin(s_));
    const u = new Point(Math.cos(u_), Math.sin(u_));
    const r = cross(point.position.sub(prev.position), u) / cross(s, u);
    const d = r * Math.tan(diff / Math.PI);
    point.cp1 = prev.position.add(new Point(
      d * Math.cos(prev.direction),
      d * Math.sin(prev.direction)));
    point.cp2 = point.position.sub(new Point(
      d * Math.cos(point.direction),
      d * Math.sin(point.direction)));
  }

  update(elapsed_time, make_transition) {
    if (this.is_dead) {
      return false;
    }
    if (this.skip <= 0 && this.random.next() < SKIP_PROB) {
      this.add_tail_point();
      this.skip = 250;
    } else if (this.skip > 0) {
      this.skip -= elapsed_time;
      this.skip < 0 && this.add_tail_point(true);
    }
    const speed = elapsed_time * this.speed;
    const velocity = new Point(
      speed * Math.cos(this.direction),
      speed * Math.sin(this.direction));
    this.position = this.position.add(velocity);
    this.direction += 0.04 * speed * this.turning;
    const diff = Math.abs(this.head().direction - this.direction);
    if (diff > Math.PI / 2) {
      this.add_tail_point();
    }
    if (this.position.x < 0) {
      return !this.transfer(make_transition, LEFT);
    } else if (this.position.x > this.width) {
      return !this.transfer(make_transition, RIGHT);
    } else if (this.position.y < 0) {
      return !this.transfer(make_transition, TOP);
    } else if (this.position.y > this.height) {
      return !this.transfer(make_transition, BOTTOM);
    }
    return true;
  }

  transfer(make_transition, side) {
    this.add_tail_point();
    return make_transition(side);
  }

  draw(ctx) {
    if (!this.tail.length) {
      return;
    }
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    for (const point of this.tail) {
      this.draw_segment(ctx, point);
    }
    this.draw_segment(ctx, this.create_tail_point(
      this.position, this.direction), true);
    ctx.stroke();
  }

  draw_segment(ctx, point) {
    if (point.cp1) {
      ctx.bezierCurveTo(
        point.cp1.x, point.cp1.y,
        point.cp2.x, point.cp2.y,
        point.position.x, point.position.y);
    } else if (!point.is_start) {
      ctx.lineTo(point.position.x, point.position.y);
    } else {
      ctx.moveTo(point.position.x, point.position.y);
    }
  }
}
