<template>
  <div>
    <p>In this page you can send messages to a server that responds back with
    the same contents. This is basically an echo chamber. A websocket connection
    is established when this component is mounted and it will be closed when the
    component is removed. Check the console.</p>

    Message:
    <form v-on:submit="sendMessage">
      <input v-model="message">
      <button>send</button>
    </form>

    <br>

    Replies:
    <div class="messages">
      <div v-for="reply in replies">{{ reply }}</div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    this.$raii({
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

    return {
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
