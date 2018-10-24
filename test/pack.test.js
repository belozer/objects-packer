const assert = require('chai').assert;
const Packer = require('../index.js');

describe('Packer Pack', function() {
    let input, output, packer;

    let genInput = () => {
        const data = {
            z1 : false,
            z2 : true,
            z3 : null,
            z5 : 0,
            z6 : 12423532,
            deep : {
                test : { id : 100 }
            },
            a : [{ number : 1 }, { number : 2 }],
        };

        data.b = data.a;

        return data;
    }

    beforeEach(() => {
        input = genInput();
        packer = new Packer();
    });

    describe('#pack()', () => {
        it('should return obj', () => {
            assert.typeOf(packer.pack(), 'object');
        });

        it('should don\'t modify base data obj', () => {
            packer.take(input);
            packer.pack();

            assert.deepEqual(input, genInput());
        });

        it('should not pack tree if child nodes not taked', () => {
            let data = { a : { b : { c : 100 } } };
            packer.take(data);
            let pack = packer.pack();

            assert.equal(pack.store.length, 1);
            assert.deepEqual(pack.store[0], data);
        });

        it('should pack tree if child nodes taked', () => {
            let data = { a : { b : { c : 100 } } };
            packer.take(data);
            packer.take(data.a.b);
            let pack = packer.pack();

            assert.equal(pack.store.length, 2);
            assert.notDeepEqual(pack.store[0], data);
            assert.deepEqual(pack.store[1], { c : 100 });
        });
    });

    describe('#give()', () => {
        let unpacker;
        beforeEach(() => {
            const input = genInput();
            packer.take(input, 'data');
            packer.take(input.a);
            packer.take(input.b[0]);
            unpacker = new Packer(clone(packer.pack()));
        });

        it('should save links between objects', () => {
            const data = unpacker.give('data'),
                a = unpacker.give(1),
                b0 = unpacker.give(2);

            assert.deepEqual(data, genInput());
            assert.equal(data.a, data.b);
            assert.equal(a, data.a);
            assert.equal(b0, data.a[0]);
        });

        it('take should work after unpacking', () => {
            const pos = unpacker.take(unpacker.give('data'));

            assert.typeOf(pos, 'number');
        });
    });
});


function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
