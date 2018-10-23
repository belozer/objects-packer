function isPrimitive(arg) {
    const type = typeof arg;
    return arg === null || (type !== 'object' && type != 'function');
}

function isDefined(v) {
    return v !== undefined;
}

class PackerNode {
    constructor(obj, packer, isPacked = false) {
        Object.defineProperty(obj, '__packerNode', { value : this });
        this.pos = null;

        this._obj = obj;
        this._id = packer.newId();
        this._packer = packer;

        this._links = new Set();

        this._isPacked = isPacked;
        this._isWalked = false;
    }


    get id() {
        return this._id;
    }

    /**
     * Returns clone of raw object if present
     */
    get obj() {
        return this._packed || this._obj;
    }

    get packed() {
        if(!this._packed) this._packed = Array.isArray(this._obj)?
            this._obj.slice() : Object.assign({}, this._obj);

        return this._packed;
    }

    get childs() {
        return this._childs || (this._childs = new Map());
    }

    get parents() {
        return this._parents || (this._parents = new Map());
    }

    addParent(node, propName) {
        let stored = this.parents.get(node) || [];
        this.parents.set(node, stored.concat([propName]));
        this._links.add(node.id + '.' + propName);

        node.addChild(this);
    }

    addChild(node) {
        this.childs.set(node);
    }

    pack() {
        if(this._isPacked) return;
        this._isPacked = true;

        for(const [child] of this.childs) child.pack();

        if(this._links.size > 1) {
            this._packer.take(this._obj, null, this._links.size);
        }

        for(const [node, props] of this.parents) {
            for(const prop of props) {
                if(this.pos) {
                    node.packed[prop] = this._packer._options.prefix + this.pos;
                    continue;
                }

                node.packed[prop] = this.obj;
            }
        }
    }

    unpack() {
        if(!this._isPacked) return;
        this._isPacked = false;

        this.walk();
        for(const [child] of this.childs) child.unpack();

        for(const key in this._obj) {
            if(!this._obj.hasOwnProperty(key)) continue;

            const pos = this._packer.extractPos(this._obj[key]);
            if(pos !== null) this._obj[key] = this._packer.give(pos);
        }
    }

    walk() {
        if(this._isWalked) return;
        this._isWalked = true;

        const obj = this._obj;
        for(let key in obj) {
            if(!obj.hasOwnProperty(key) || isPrimitive(obj[key])) continue;

            const node = PackerNode.getNode(obj[key], this._packer);

            node.addParent(this, key);
            node.walk();
        }
    }

    static getNode(obj, packer, isPacked) {
        return obj.__packerNode || new this(obj, packer, isPacked);
    }
}

class Packer {
    /**
     * Ininialize store
     * @param {String|undefined} store with packs
     */
    constructor(pack = {}) {
        this._names = pack.names || {};
        this._store = pack.store || [];
        this._storeStocks = pack.storeStocks || [];

        this._options = Object.assign({
            prefix : '…'
        }, pack.options);

        this._counter = 0;

        this._reKey = new RegExp(`^${this._options.prefix}([0-9]+)$`);

        if(this._store.length) {
            this._store = this._store.map((obj, i) => {
                const node = PackerNode.getNode(obj, this, true);
                node.pos = i;
                return node;
            });
        }
    }

    newId() {
        return ++this._counter;
    }

    extractPos(str) {
        const res = this._reKey.exec(str);
        return res? parseInt(res[1]) : null;
    }

    /**
     * Mark object for feature packing
     * @param {Object} obj object for packing
     * @param {String} name specific name for object
     */
    take(obj, objName, linkCount = 1) {
        const node = PackerNode.getNode(obj, this);

        let pos = node.pos;
        if(pos === null) {
            pos = this._store.push(node) - 1;
            this._storeStocks[pos] = 0;
            node.pos = pos;
        }

        this._storeStocks[pos] += linkCount;

        if(objName) this._names[objName] = pos;

        return node.pos;
    }

    /**
     * @param {Number|String} pos Name of position or position index
     * @returns {?Object}
     */
    give(pos) {
        pos = typeof pos === 'string'? this._names[pos] : pos;

        const node = this._store[pos];
        if(!node) return null;

        if(node._isPacked) node.unpack();
        if(--this._storeStocks < 1) delete this._store[pos];
        return node.obj;
    }

    /**
     * Packing store with replace object keys
     * @returns {Object} pack
     */
    pack() {
        const len = this._store.length;

        for(let i = 0; i < len; i++) {
            this._store[i].walk();
        }
        for(let i = 0; i < len; i++) {
            this._store[i].pack();
        }

        return {
            options : this._options,
            names : this._names,
            storeStocks : this._storeStocks,
            store : this._store.map(node => node.obj)
        };
    }
}

module.exports = Packer;
