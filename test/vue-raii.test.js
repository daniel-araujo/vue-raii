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

  let vue = new Vue();

  await new Promise((resolve, reject) => {
    vue.$raii({
      constructor: () => new Promise(
        (resolve) => setTimeout(
          () => { spy(1); resolve(); },
          10
        )
      )
    });

    vue.$raii({
      constructor: () => { spy(2); resolve(); }
    });
  });

  assert.equal(spy.getCall(0).firstArg, 1);
  assert.equal(spy.getCall(1).firstArg, 2);
});

it('destructor receives resource as first argument', async () => {
  let vue = new Vue();

  let arg = await new Promise((resolve, reject) => {
    vue.$raii({
      constructor: () => 1,
      destructor: (resource) => resolve(resource)
    });

    vue.$destroy();
  });

  assert.equal(arg, 1);
});

it('calls destructor after component is destroyed', async () => {
  let beforeDestroySpy = sinon.spy();
  let destructorSpy = sinon.spy();

  let vue = new Vue();

  await new Promise((resolve, reject) => {
    vue.$raii({
      constructor() {},
      destructor() { destructorSpy(); resolve(); }
    });

    beforeDestroySpy();
    vue.$destroy();
  });

  assert(destructorSpy.getCall(0).calledAfter(beforeDestroySpy.getCall(0)));
});

it('calls destructor in opposite order of construction', async () => {
  let spy = sinon.spy();

  let vue = new Vue();

  await new Promise((resolve, reject) => {
    vue.$raii({
      constructor() {},
      destructor() { spy(1); resolve(); }
    });

    vue.$raii({
      constructor() {},
      destructor() { spy(2); }
    });

    vue.$destroy();
  });

  assert(spy.getCall(0).calledWith(2));
  assert(spy.getCall(1).calledWith(1));
});

it('awaits destructor promise', async () => {
  let spy = sinon.spy();

  let vue = new Vue();

  await new Promise((resolve, reject) => {
    vue.$raii({
      constructor() {},
      destructor() { spy(1); resolve(); }
    });

    vue.$raii({
      constructor() {},
      destructor: () => new Promise(
        (resolve) => setTimeout(
          () => { spy(2); resolve(); },
          10
        )
      )
    });

    vue.$destroy();
  });

  assert(spy.getCall(0).calledWith(2));
  assert(spy.getCall(1).calledWith(1));
});

it('retrieves resource by id', async () => {
  let vue = new Vue();

  vue.$raii({
    id: 'resourceid1',
    constructor: () => 1
  });

  vue.$raii({
    id: 'resourceid2',
    constructor: () => 2
  });

  assert.equal(await vue.$raii('resourceid1'), 1);
  assert.equal(await vue.$raii('resourceid2'), 2);
});

it('waits for constructor to finish before retrieving resource', async () => {
  let vue = new Vue();

  vue.$raii({
    id: 'resourceid',
    constructor: () => new Promise(
      (resolve) => setTimeout(
        () => { resolve(1); },
        10
      )
    )
  });

  assert.equal(await vue.$raii('resourceid'), 1);
});

it('retrieved resource is a reference and not a copy', async () => {
  let vue = new Vue();

  vue.$raii({
    id: 'resourceid',
    constructor: () => ({
      existingField: 1,
    })
  });

  let resource = await vue.$raii('resourceid');
  resource.newField = 2;

  assert.deepEqual(await vue.$raii('resourceid'), {
    existingField: 1,
    newField: 2
  });
});

it('registration returns promise that resolves to resource', async () => {
  let vue = new Vue();

  let returnValue = vue.$raii({
    constructor: () => 1
  });

  assert(returnValue instanceof Promise);
  assert.equal(await returnValue, 1);
});

it('destructor is optional', async () => {
  let vue = new Vue();

  await vue.$raii({
    constructor: () => 1,
  });

  vue.$destroy();
});

it('throwing an error inside a constructor will not prevent remaining constructor from running', async () => {
  let vue = new Vue();

  await new Promise((resolve) => {
    process.once('unhandledRejection', error => {
      if (error.message === 'thrown in a constructor') {
        // Ignored.
      } else {
        throw error;
      }
    });

    vue.$raii({
      constructor() { throw new Error('thrown in a constructor') },
    });

    vue.$raii({
      constructor() { resolve(); },
    });

    vue.$destroy();
  });
});

it('throwing an error inside a destructor will not prevent remaining destructors from running', async () => {
  let vue = new Vue();

  await new Promise((resolve) => {
    process.once('unhandledRejection', error => {
      if (error.message === 'thrown in a destructor') {
        // Ignored.
      } else {
        throw error;
      }
    });

    vue.$raii({
      constructor() {},
      destructor() { resolve(); },
    });

    vue.$raii({
      constructor() {},
      destructor() { throw new Error('thrown in a destructor') },
    });

    vue.$destroy();
  });
});

it('resource is no longer accessible after being destroyed', async () => {
  let vue = new Vue();

  await vue.$raii({
    id: 'asd',
    constructor: () => 1
  });

  await vue.$raii('asd', 'destroy');

  await assert.rejects(
    async () => vue.$raii('asd'),
    {
      name: 'Error',
      message: 'Resource not found.'
    }
  );
});

it('resource is not accessible while being destroyed', async () => {
  let vue = new Vue();

  await vue.$raii({
    id: 'asd',
    constructor: () => 1,
    destructor: () => new Promise((resolve) => setTimeout(resolve, 10))
  });

  let promise = vue.$raii('asd', 'destroy');

  await assert.rejects(
    async () => vue.$raii('asd'),
    {
      name: 'Error',
      message: 'Resource not found.'
    }
  );

  await promise;
});

it('resource will not exist when being accessed while it was being created and then getting destroyed', async () => {
  let vue = new Vue();

  await new Promise((resolve) => {
    vue.$raii({
      id: 'asd',
      constructor: () => {
        resolve();
        return new Promise((resolve) => setTimeout((resolve), 10))
      },
      destructor: () => new Promise((resolve) => setTimeout((resolve), 10)),
    });
  });

  let getPromise = vue.$raii('asd');

  let destroyPromise = vue.$raii('asd', 'destroy');

  await assert.rejects(
    async () => getPromise,
    {
      name: 'Error',
      message: 'Resource not found.'
    }
  );

  await destroyPromise;
});

it('resource will not be accessible after being destroyed while it was being created', async () => {
  let spy = sinon.spy();

  let vue = new Vue();

  await new Promise((resolve) => {
    vue.$raii({
      id: 'asd',
      constructor: () => {
        resolve();
        return new Promise((resolve) => setTimeout((resolve), 10))
      },
      destructor: () => {
        spy('destructor');
        return new Promise((resolve) => setTimeout((resolve), 10))
      },
    });
  });

  let promise = vue.$raii('asd', 'destroy');

  await assert.rejects(
    async () => vue.$raii('asd'),
    {
      name: 'Error',
      message: 'Resource not found.'
    }
  );

  await promise;
});
