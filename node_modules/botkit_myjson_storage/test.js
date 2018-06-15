/*
Derived from the original BotKit repo.
This file currently test botkit_myjson_storage.
*/

var test = require('unit.js');

testObj0 = {id: 'TEST0', foo: 'bar0'};
testObj1 = {id: 'TEST1', foo: 'bar1'};

var remote_storage = require('./index')({ bin_id: '1gurm6' });

var testStorageMethod = function(storageMethod) {
    storageMethod.save(testObj0, function(err) {
        test.assert(!err);
        storageMethod.save(testObj1, function(err) {
            test.assert(!err);
            storageMethod.get(testObj0.id, function(err, data) {
                test.assert(!err);
                test.assert(data.foo === testObj0.foo);
            });
            storageMethod.get('shouldnt-be-here', function(err, data) {
                test.assert(err.displayName === 'NotFound');
                test.assert(!data);
            });
            storageMethod.all(function(err, data) {
                test.assert(!err);
                test.assert(
                    data[0].foo === testObj0.foo && data[1].foo === testObj1.foo ||
                    data[0].foo === testObj1.foo && data[1].foo === testObj0.foo
                );
            });
            if (storageMethod.deleteAll) { storageMethod.deleteAll() };
        });
    });
};

console.log('If no asserts failed then the test has passed!');

remote_storage.items.deleteAll();
testStorageMethod(remote_storage.items);