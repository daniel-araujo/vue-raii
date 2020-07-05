const { default: PQueue } = require('p-queue');

// Whether the Vue plugin has been installed.
let installed = false;

/*
 * First time setup.
 */
function raiiSetup() {
  this._raii = {
    // All registered resources, ordered by construction time.
    all: [],

    // Resources by id.
    byId: {},

    // Linear execution queue for constructors and destructors.
    execQueue: new PQueue({ concurrency: 1 })
  };

  this.$on('hook:destroyed', async () => {
    await this._raii.execQueue.onIdle();

    for (let i = this._raii.all.length - 1; i >= 0; i--) {
      let e = this._raii.all[i];

      if (e.destructor !== undefined) {
        this._raii.execQueue.add(() => e.destructor(e.resource));
      }
    }

    delete this._raii;
  });
}

/*
 * Retrieves resource by id. The resource must be explicitly registered with an
 * id to be accessible.
 */
async function raiiGetResource(id) {
  if (id in this._raii.byId && !this._raii.byId[id].toDestroy) {
    return Promise.resolve(this._raii.byId[id].resource)
      .then((resource) => {
        // For retrieval attempts made while it is being created.
        if (!this._raii.byId[id].toDestroy) {
          return resource;
        } else {
          throw new Error('Resource not found.');
        }
      });
  } else {
    throw new Error('Resource not found.');
  }
}

/*
 * Registers, creates and hooks resource into lifetime of component.
 */
function raiiCreateResource(options) {
  let entry = {
    resource: undefined,
    destructor: options.destructor,
    toDestroy: false
  };

  entry.resource = this._raii.execQueue.add(async () => {
    let resource = await options.constructor.call(this);

    // Now it can be added to the ordered list of constructed resources.
    this._raii.all.push(entry);

    return resource;
  });

  if (options.id !== undefined) {
    this._raii.byId[options.id] = entry;
  }

  return entry.resource;
}

/*
 * Destroys resource. If the resource does not exists, the method will do
 * nothing. If the resource is being constructed then it will be destroyed as
 * soon as it is ready.
 */
function raiiDestroyResource(id) {
  if (this._raii.byId[id]) {
    // This flag will allows us to prevent returning the resource if an attempt
    // to retrieve it was made while it was being constructed.
    this._raii.byId[id].toDestroy = true;
  }

  return this._raii.execQueue.add(async () => {
    let entry = this._raii.byId[id];

    if (entry === undefined) {
      // Does not exist.
      return;
    }

    try {
      if (entry.destructor) {
        await entry.destructor(entry.resource);
      }
    } finally {
      // Now purge from the list of resources.
      for (let i = 0; i < this._raii.all.length; i++) {
        let e = this._raii.all[i];

        if (e === entry) {
          this._raii.all.splice(i, 1);
        }
      }

      delete this._raii.byId[id];
    }
  });
}

exports.install = function (Vue) {
  if (installed) {
    // Already installed. There is nothing to do.
    return;
  }

  Vue.prototype.$raii = function (o, a) {
    if (!this._raii) {
      raiiSetup.call(this);
    }

    if (typeof o === 'string') {
      if (a === undefined) {
        return raiiGetResource.call(this, o);
      } else if (a === 'destroy') {
        return raiiDestroyResource.call(this, o);
      }
    } else {
      return raiiCreateResource.call(this, o);
    }
  };

  installed = true;
};
