# vue-raii

> Resource acquisition is initialization.

What a mouthful. Anyway, this Vue plugin allows you to bind JavaScript resources
to the lifetime of a component.

Not sure what this means?

Ever had to register a function somewhere and then had to deregister it once the
component was no longer in use? That is a form of resource management. With this
plugin you will be able to define such relationships in a very straightforward
way. Check out the examples below.


## Examples

When using `setInterval`, you eventually have to call `clearInterval`. With this
plugin you can be rest assured that `clearInterval` will be called when the
component is removed from the DOM.

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

Have to listen to DOM events? Just add the event in the constructor and remove
it in the destructor. It's that simple.

```js
{
  data() {
    this.$raii(
      {
        constructor: () => document.addEventListener('mousemove', this.updatePosition),
        destructor: () => document.removeEventListener('mousemove', this.updatePosition),
      });

    return {
      position: {
        x: 0,
        y: 0
      }
    };
  },

  methods: {
    updatePosition(e) {
      this.position.x = e.pageX;
      this.position.y = e.pageY;
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
      // Allows you to get a reference to the resource later on.
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
  },

  methods: {
    async sendMessage() {
      let socket = await this.$raii('socket');

      socket.send(this.message);
    }
  }
}
```

Run `npm run examples` to see complete examples in action.


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
