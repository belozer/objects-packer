function isPrimitive(arg) {
    const type = typeof arg;
    return arg === null || (type !== 'object' && type != 'function');
}

function isDefined(v) {
    return v !== undefined;
}

class Packer {
    /**
     * Ininialize store
     * @param {String|undefined} store with packs
     */
    constructor(data = {}, options = {}) {
        if(typeof data == 'string') data = JSON.parse(data);

        this._namedIds = data.namedIds || {};
        this._store = data.store || {};
        this._objInfo = new Map();

        this._counter = 0;

        this._options = Object.assign({
            prefix : '…'
        }, options);

        this._reKey = new RegExp(`^${this._options.prefix}([0-9]*)$`);
    }

    /**
     * Mark object for feature packing
     * @param {Object} obj object for packing
     * @param {String} id specific name for object
     */
    take(obj, id) {
        const node = this._take(obj);
        this._namedIds[id] = node.__packId;
        this._store[node.__packId] = node;
        return node.__packId;
    }

    _take(obj) {
        if(isPrimitive(obj) || obj.__taked) return obj;

        const id = this._counter++;
        Object.defineProperties(obj, {
            __packId : {
                value : id,
                writable : false,
            },
            __packParents : {
                value : new Set(),
            },
            __taked : {
                value : true,
                writable : false
            }
        });

        // TODO. Try move to _pack
        for(const key in obj) {
            if(!obj.hasOwnProperty(key) || isPrimitive(obj[key])) continue;

            this._take(obj[key]).__packParents.add(id + '.' + key)
            if(obj[key].__packParents.size > 1) {
                this._store[obj[key].__packId] = obj[key];
            }
        }

        return obj;
    }

    _exportKey(obj) {
        return this._options.prefix + obj.__packId;
    }

    /**
     * Packing store with replace object keys
     * @param {String|Number} key for pack specific tree
     */
    pack(key) {
        // if(!key) key = 'root'
        this._pack(key? this._store[key] : this._store);
    }

    // TODO: Maybe need use another store for save packs...
    // Current behavior is mutates global data
    _pack(obj) {
        if(isPrimitive(obj) || obj.__packed) return obj;

        Object.defineProperties(obj, {
            __packed :  {
                value : true,
                writable : false
            }
        });

        for(const key in obj) {
            if(!obj.hasOwnProperty(key)
                || isPrimitive(obj[key])
            ) continue;

            this._pack(obj[key]);

            if(this._store[key] != obj[key] && obj[key].__packParents.size > 1) {
                obj[key] = this._exportKey(obj[key]);
            }
        }
    }

    /**
     * Unpacking specific tree or all store
     * @param {String|undefined} key
     */
    unpack(key) {
        if(isDefined(this._namedIds[key])) key = this._namedIds[key];

        return this._unpack(this._store[key] || this._store);
    }

    _unpack(obj) {
        if(isPrimitive(obj) || obj.__unpacked) return obj;

        Object.defineProperty(obj, '__unpacked', {
            value : true,
            writable : false,
        });

        for(const key in obj) {
            if(!obj.hasOwnProperty(key)) continue;
            this._unpack(obj[key]);

            if(obj[key] === this._store[key]) continue;

            const matches = this._reKey.exec(obj[key]);
            if(matches) obj[key] = this._store[matches[1]]
        }

        return obj;
    }

    toString() {
        this.pack();
        return JSON.stringify({
            namedIds : this._namedIds,
            store : this._store
        });
    }
}

module.exports = Packer;
