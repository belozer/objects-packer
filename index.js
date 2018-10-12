class Packer {
    /**
     * Ininialize store
     * @param {Object|String|undefined} store with packings
     */
    constructor(store = {}) {
        if(typeof store === 'string') store = JSON.parse(store);

        this._store = store;
        this._counter = 0;
    }

    /**
     * Mark object for feature packing
     * @param {Object} obj object for packing
     * @param {String} storeKey specific name for object
     */
    take(obj, storeKey) {
        if(typeof obj !== 'object' || obj === null) return obj;

        if(obj.__packId === undefined) {
            let id = storeKey || this._counter++;
            this._store[id] = Object.defineProperty(obj, '__packId', {
                value : id,
                writable : false
            });
        }

        return { __packId : obj.__packId };
    }

    /**
     * Packing store with replace object keys
     * @param {String|Number} key for pack specific tree
     */
    pack(key) {
        this._pack(key? this._store[key] : this._store);
    }

    _pack(obj) {
        if(!obj) { obj = this._store };

        if(typeof obj !== 'object' || !obj) return obj;

        for(const key in obj) {
            if(!obj.hasOwnProperty(key))  continue;

            if(obj[key].__packed) continue;

            if(this._store[key] !== obj[key] && obj[key].__packId) {
                obj[key] = Object.defineProperties({}, {
                    __packed :  { value : true, writable : false },
                    __packId : {
                        value : obj[key].__packId,
                        writable : false,
                        enumerable : true
                    }
                });
            }

            this._pack(obj[key]);
        }
    }

    /**
     * Unpacking specific tree or all store
     * @param {Object|String|undefined} key
     */
    unpack(key) {
        if(typeof key === 'object') key = key.__packId;
        return this._unpack(key? this._store[key] : this._store);
    }

    _unpack(obj) {
        if(!obj) { obj = this._store };

        if(typeof obj !== 'object' || !obj) return obj;

        for(const key in obj) {
            if(!obj.hasOwnProperty(key) || obj[key].__unpacked) continue;

            const packId = obj[key].__packId;

            if(packId) obj[key] = Object.defineProperty(this._store[packId], '__unpacked', {
                value : true, writable : false
            });

            this._unpack(obj[key]);
        }

        return obj;
    }

    toString() {
        this.pack();
        return JSON.stringify(this._store);
    }
}

module.exports = Packer;
