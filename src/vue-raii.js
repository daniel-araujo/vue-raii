const { default: PQueue } = require('p-queue');

// Whether the Vue plugin has been installed.
let installed = false;

/*
 * First time setup.
 */
function raiiSetup() {
  this._raii = {
    // All registered resources.
    all: [],

    // Resources by id.
    byId: {},

    constructionQueue: new PQueue({ concurrency: 1 })
  };

  this.$on('hook:destroyed', async () => {
    await this._raii.constructionQueue.onIdle();

    for (let i = this._raii.all.length - 1; i >= 0; i--) {
      let e = this._raii.all[i];

      if (e.destructor !== undefined) {
        await e.destructor(e.resource);
      }
    }

    delete this._raii;
  });
}

/*
 * Retrieves resource by id. The resource must be explicitly registered with an
 * id to be accessible.
 */
function raiiGetResource(id) {
  if (id in this._raii.byId) {
    return this._raii.byId[id];
  } else {
    throw new Error('Resource not found.');
  }
}

/*
 * Registers, creates and hooks resource into lifetime of component.
 */
function raiiHookResource(options) {
  let promise = this._raii.constructionQueue.add(async () => {
    let resource = await options.constructor.call(this);

    this._raii.all.push({
      resource,
      destructor: options.destructor
    });

    if (options.id !== undefined) {
      // Now that we have the resource we can replace the promise.
      this._raii.byId[options.id] = resource;
    }

    return resource;
  });

  if (options.id !== undefined) {
    // When retrieving resource it will wait for constructor to finish.
    this._raii.byId[options.id] = promise;
  }

  return promise;
}

exports.install = function (Vue) {
  if (installed) {
    // Already installed. There is nothing to do.
    return;
  }

  Vue.prototype.$raii = function (o) {
    if (!this._raii) {
      raiiSetup.call(this);
    }

    if (typeof o === 'string') {
      return raiiGetResource.call(this, o);
    } else {
      return raiiHookResource.call(this, o);
    }
  };

  installed = true;
};
