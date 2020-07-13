<template>
  <div>
    <p>Sometimes you need to listen to native DOM events. Unfortunately Vue.js
    does not automatically deregister such event handlers. Fortunately, you can
    overcome that problem with this plugin.</p>

    <div class="face">
      <div ref="leftEye" class="face__eye"><div class="face__eye__pupil" :style="leftPupilStyle"></div></div>
      <div ref="rightEye" class="face__eye"><div class="face__eye__pupil" :style="rightPupilStyle"></div></div>
      <div class="face__mouth"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    this.$raii({
      constructor: () => {
        document.addEventListener('mousemove', this.onMousemove);
      },
      destructor: () => {
        document.removeEventListener('mousemove', this.onMousemove);
      }
    });

    return {
      mouse: {
        x: 0,
        y: 0
      }
    };
  },

  methods: {
    onMousemove(e) {
      this.mouse.x = e.pageX;
      this.mouse.y = e.pageY;
    },

    radtodeg(rad) {
      return rad * (180 / Math.PI);
    },

    direction(center) {
      return this.radtodeg(Math.atan2(this.mouse.x - center.x, this.mouse.y - center.y) + Math.PI) * -1;
    },

    pupilStyle(center) {
      let angle = this.direction(center);

      return {
        transform: `rotate(${angle}deg)`
      };
    }
  },

  computed: {
    leftPupilStyle() {
      if (!this.$refs.leftEye) {
        // Refs are not reactive.
        this.mouse.x;
        return;
      }

      return this.pupilStyle({
        x: this.$refs.leftEye.offsetLeft + this.$refs.leftEye.clientWidth / 2,
        y: this.$refs.leftEye.offsetTop + this.$refs.leftEye.clientHeight / 2,
      });
    },

    rightPupilStyle() {
      if (!this.$refs.rightEye) {
        // Refs are not reactive.
        this.mouse.x;
        return;
      }

      return this.pupilStyle({
        x: this.$refs.rightEye.offsetLeft + this.$refs.rightEye.clientWidth / 2,
        y: this.$refs.rightEye.offsetTop + this.$refs.rightEye.clientHeight / 2,
      });
    },
  }
}
</script>

<style>
.face {
  margin: auto;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #ccc;
  overflow: hidden;
  text-align: center;
  padding: 40px;
  box-sizing: border-box;
}

.face__eye {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  height: 40px;
  width: 40px;
  background: white;
  border: 1px solid #ccc;
  margin: 5px;
}

.face__eye__pupil {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 20px;
  background-color: black;
  transform-origin: 0 20px;
}

.face__mouth {
  width: 100px;
  height: 2px;
  background-color: black;
  margin: auto;
  margin-top: 20px;
}
</style>
