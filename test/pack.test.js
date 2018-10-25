const assert = require('chai').assert;
const Packer = require('../index.js');

describe('Packer Pack', function() {
    let input, output, packer;

    beforeEach(() => {
        packer = new Packer();
    });

    describe('#pack()', () => {
        it('should return obj', () => {
            assert.typeOf(packer.pack(), 'object');
        });

        it('should don\'t modify base data obj', () => {
            genInput = () => ({ a : [{ number : 1 }, { number : 2 }] });

            input = genInput();

            packer.take(input);
            packer.take(input.a);
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

        it('should correctly unpack prinitives', () => {
            const data = [true, false, null, 0, 1, 'test'];

            packer = new Packer();
            packer.take(data);

            unpacker = getUnpacker(packer);

            assert.deepEqual(unpacker.give(0), data);
        });

        it('should correctly unpack after deep take', () => {
            const data = { a : { b : { c : 1 } } };

            packer = new Packer();
            packer.take(data);
            packer.take(data.a.b);

            unpacker = getUnpacker(packer);

            let g0 = unpacker.give(0),
                g1 = unpacker.give(1);

            assert.deepEqual(g0, data);
            assert.equal(g1, g0.a.b);
            assert.equal(g1.c, 1);
        });

        it('should save links between objects', () => {
            const input = { a : [{ id : 1 }, { id : 2 }] };
            input.b = input.a;

            packer.take(input, 'data');
            packer.take(input.a);
            packer.take(input.b[0]);

            unpacker = getUnpacker(packer);

            const data = unpacker.give('data'),
                a = unpacker.give(1),
                b0 = unpacker.give(2);

            assert.deepEqual(data, input);
            assert.equal(data.a, data.b);
            assert.equal(a, data.a);
            assert.equal(b0, data.a[0]);
        });

        it('take should work after unpacking', () => {
            packer.take({}, 'data');
            unpacker = getUnpacker(packer);

            const pos = unpacker.take(unpacker.give('data'));

            assert.typeOf(pos, 'number');
        });
    });
});


function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function getUnpacker(packer) {
    return new Packer(clone(packer.pack()));
}
