<template>
  <div>
    <p>In this page you get to join an echo chamber! A websocket connection is
    established when you press the Join button. The connection is closed when
    you either press the Leave button or when the component is removed from the
    DOM, whichever happens first. Check the console.</p>

    <template v-if="joined">
      <button @click="leave" :disabled="loading">Leave</button><br>
      <br>

      Message:
      <form v-on:submit.prevent="sendMessage">
        <input v-model="message">
        <button>send</button>
      </form>

      <br>

      Replies:
      <div class="messages">
        <div v-for="reply in replies">{{ reply }}</div>
      </div>

    </template>
    <template v-else>

      <button @click="join" :disabled="loading">JOIN!</button><br>
      <br>
      <template v-if="loading">Joining, please wait...</template>

    </template>
  </div>
</template>

<script>
export default {
  data() {
    return {
      joined: false,
      loading: false,
      replies: [],
      message: '',
    };
  },

  methods: {
    async sendMessage() {
      if (this.message === '') {
        return;
      }

      let socket = await this.$raii('socket');

      socket.send(this.message);

      this.message = '';
    },

    async join() {
      this.loading = true;
      try {
        await this.$raii({
          id: 'socket',

          constructor: () => new Promise((resolve, reject) => {
            console.log('establishing connection to socket');

            let socket = new WebSocket('wss://echo.websocket.org');

            socket.addEventListener('open', () => {
              console.log('opened socket');
              resolve(socket);
            });
            socket.addEventListener('error', reject);
            socket.addEventListener('message', (e) => {
              this.replies.push(e.data);
            });
          }),

          destructor: (socket) => {
            console.log('closed socket');

            socket.close();
          }
        });
        this.joined = true;
      } finally {
        this.loading = false;
      }
    },

    async leave() {
      this.loading = true;
      try {
        await this.$raii('socket', 'destroy');
        this.joined = false;
      } finally {
        this.loading = false;
      }
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
