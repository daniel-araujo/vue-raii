const assert = require('assert');

const Vue = require('vue');
const VueRaii = require('..');
const sinon = require('sinon');

Vue.use(VueRaii);

it('calls constructor on the spot', async () => {
  let constructed = await new Promise((resolve, reject) => {
    new Vue({
      data() {
        let constructed = false;

        this.$raii({
          constructor() { constructed = true },
          destructor(resource) {}
        });

        resolve(constructed);

        return {};
      }
    });
  });

  assert.equal(constructed, true);
});

it('awaits constructor promise', async () => {
  let spy = sinon.spy();

  await new Promise((resolve, reject) => {
    new Vue({
      data() {
        this.$raii({
          constructor: () => new Promise(
            (resolve) => setTimeout(
              () => { spy(1); resolve(); },
              10
            )
          ),
          destructor(resource) {}
        });

        this.$raii({
          constructor: () => { spy(2); resolve(); },
          destructor(resource) {}
        });

        return {};
      }
    });
  });

  assert.equal(spy.getCall(0).firstArg, 1);
  assert.equal(spy.getCall(1).firstArg, 2);
});

it('destructor receives resource as first argument', async () => {
  let arg = await new Promise((resolve, reject) => {
    let vue = new Vue({
      data() {
        this.$raii({
          constructor: () => 1,
          destructor: (resource) => resolve(resource)
        });

        return {};
      }
    });

    vue.$destroy();
  });

  assert.equal(arg, 1);
});

it('calls destructor after component is destroyed', async () => {
  let beforeDestroySpy = sinon.spy();
  let destructorSpy = sinon.spy();

  await new Promise((resolve, reject) => {
    let vue = new Vue({
      data() {
        this.$raii({
          constructor() {},
          destructor() { destructorSpy(); resolve(); }
        });

        return {};
      }
    });

    beforeDestroySpy();
    vue.$destroy();
  });

  assert(destructorSpy.getCall(0).calledAfter(beforeDestroySpy.getCall(0)));
});

it('calls destructor in opposite order of construction', async () => {
  let spy = sinon.spy();

  await new Promise((resolve, reject) => {
    let vue = new Vue({
      data() {
        this.$raii({
          constructor() {},
          destructor() { spy(1); resolve(); }
        });

        this.$raii({
          constructor() {},
          destructor() { spy(2); }
        });

        return {};
      }
    });

    vue.$destroy();
  });

  assert(spy.getCall(0).calledWith(2));
  assert(spy.getCall(1).calledWith(1));
});

it('awaits destructor promise', async () => {
  let spy = sinon.spy();

  await new Promise((resolve, reject) => {
    let vue = new Vue({
      data() {
        this.$raii({
          constructor() {},
          destructor() { spy(1); resolve(); }
        });

        this.$raii({
          constructor() {},
          destructor: () => new Promise(
            (resolve) => setTimeout(
              () => { spy(2); resolve(); },
              10
            )
          )
        });

        return {};
      }
    });

    vue.$destroy();
  });

  assert(spy.getCall(0).calledWith(2));
  assert(spy.getCall(1).calledWith(1));
});