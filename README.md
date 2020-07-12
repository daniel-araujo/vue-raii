# vue-raii

> Resource acquisition is initialization. -Bjarne Stroustrup

Why, yes, I'm bringing a C++ idiom to Vue.js. This Vue plugin allows you to bind
JavaScript resources to the lifetime of a component. Basically, if you:

- need to register a function somewhere and then have to deregister it.
- have an object where you have to call `open` to use it and then call `close`
  when you're done with it
- guarantee that a resource is destroyed before another

Then this plugin has you covered. It lets you define constructors and
destructors such that:

- Constructors run after each other in the order they were registered and
  destructors run in reverse order when the component is destroyed.
- When constructors return promises, destructors are only run after promises
  have fulfilled. This plugin was made with `async` in mind.
- Resources can be created at any point. You can create them in any method you
  like. Want to establish a connection to a socket? Call a method that creates
  the resource.
- Resources can also be destroyed at any point. Destructors for manually
  destroyed resources will not run again when the component gets destroyed.

Unit tests are run through versions 2.0 to 2.6 of Vue.js


## Examples

Run `npm run examples` to see fully functional examples locally on your browser.
There's a clock, an echo chamber and a dude that won't stop staring at your
mouse. Quite persuasive, if you ask me!

Here are just a few small examples:

Using `setInterval` and `clearInterval`:

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

Listening to native DOM events:

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

Sockets:

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
      // Reference resource. Promise fulfills when constructor finishes running.
      let socket = await this.$raii('socket');

      socket.send(this.message);
    }
  }
}
```


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
