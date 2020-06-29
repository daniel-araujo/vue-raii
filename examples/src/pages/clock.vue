<template>
  <div>
    <p>Here we have a setInterval call bound to this component. When you move to
    another page, clearInterval will be called automatically. Open the console
    and see for yourself.</p>

    <div class="clock">
      <div class="clock__hour" :style="hourStyle"></div>
      <div class="clock__minute" :style="minuteStyle"></div>
      <div class="clock__second" :style="secondStyle"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    this.$raii({
      constructor: () => {
        console.log('called constructor.');
        return setInterval(this.updateTime, 1000)
      },
      destructor: (resource) => {
        console.log('called destructor.');
        clearInterval(resource);
      }
    });

    return {
      time: new Date()
    };
  },

  methods: {
    updateTime() {
      this.time = new Date();
    }
  },

  computed: {
    hourStyle() {
      let deg = this.time.getHours() * 15 - 90;
      return {
        transform: `rotate(${deg}deg)`
      };
    },

    minuteStyle() {
      let deg = this.time.getMinutes() * 6 - 90;
      return {
        transform: `rotate(${deg}deg)`
      };
    },

    secondStyle() {
      let deg = this.time.getSeconds() * 6 - 90;
      return {
        transform: `rotate(${deg}deg)`
      };
    }
  }
}
</script>

<style>
.clock {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: #ffffff;
  border: 5px solid #ccc;
  position: relative;
  overflow: hidden;
}

.clock__hour,
.clock__minute,
.clock__second {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 50%;
  height: 4px;
  background-color: black;
  transform-origin: center left;
}

.clock__hour {
  width: 20%;
  height: 4px;
}

.clock__minute {
  width: 40%;
  height: 2px;
}

.clock__second {
  background-color: red;
  width: 50%;
  height: 1px;
}
</style>
