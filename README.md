# vue-raii

> Resource acquisition is initialization.

What a mouthful. Anyway, this Vue plugin allows you to bind JavaScript resources
to the lifetime of a component. Not sure what this means? You've probably done
this manually without realizing. Check out the examples below.


## Examples

We've all used `setInterval` at some point. You register a function to be called
at regular intervals. You must never forget to call `clearInterval` otherwise
the function will never stop getting called. This is particularly troublesome
when navigating through pages in your app. With this plugin you can be rest
assure that clearInterval will be called once the component is removed from the
DOM.

```js
{
  data() {
    this.$raii(
      {
        constructor: () => setInterval(this.updateTime, 1000),
        destructor: (resource) => clearInterval(resource),
      });

    return {
      time: new Date()
    };
  },

  methods: {
    updateTime() {
      this.time = new Date();
    }
  }
}
```

You can also identify resources to access them later. In this example, a socket
connection is established for as long as the component is in the DOM.
Additionally, the socket can only be used after it has fully initialized.

```js
{
  data() {
    this.$raii({
      id: 'socket',
      // Constructor. Can return a promise.
      constructor: () => new Promise((resolve, reject) => {
        let socket = new WebSocket('ws://localhost:8080');

        socket.addEventListener('open', () => resolve(socket));
        socket.addEventListener('error', reject);
      }),
      // Destructor. It is only called if promise resolves successfully.
      destructor: (socket) => socket.close()
    });

    return {
      message: '',
    };
  }

  methods: {
    async sendMessage() {
      let socket = await this.$raii('socket');

      socket.send(this.message);
    }
  }
}
```

This project comes with a bunch of examples. Run `npm run examples` to see them.


## Install

```
npm install vue-raii
```


## Usage

Require the `vue-raii` module and pass it to `Vue.use`.

```js
const VueRaii = require('vue-raii')

Vue.use(VueRaii)
```

You will then have access to the `$raii` method in every Vue component.


## Contributing

The easiest way to contribute is by starring this project on GitHub!

https://github.com/daniel-araujo/vue-raii

If you've found a bug, would like to suggest a feature or need help, feel free
to open issues on GitHub:

https://github.com/daniel-araujo/vue-raii/issues
