const assert = require('chai').assert;
const Packer = require('../index.js');

describe('Packer Runtime', function() {
    let input, output, packer;

    let genInput = () => {
        return {
            deep : { test : { id : 100 } },
        };
    }

    beforeEach(() => {
        input = genInput();
        packer = new Packer();
    });

    describe('#take()', () => {
        it('should return number of store position', () => {
            const pos = packer.take(input);

            assert.typeOf(pos, 'number');
        });

        it('should return equal pos on second taking the same object', () => {
            const pos1 = packer.take(input);
            const pos2 = packer.take(input);

            assert.equal(pos1, pos2);
        });
    });

    describe('#give()', () => {
        it('should return object by name', () => {
            packer.take(input, 'data');
            assert.deepEqual(packer.give('data'), genInput());
        });

        it('should return object by pos', () => {
            const pos = packer.take(input, 'data');
            assert.deepEqual(packer.give(pos), input);
        });

        it('should return null if the give limit is over', () => {
            let pos = packer.take(input);

            assert.typeOf(packer.give(pos), 'object');
            assert.typeOf(packer.give(pos), 'null');
        });

    });
});
