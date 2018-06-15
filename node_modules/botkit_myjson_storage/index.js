const request = require('request-promise');

module.exports = function(config) {

    if (!config.bin_id) {
      console.error('Please make sure to specify your bin_id!');
    }

    const API_ENDPOINT = config.endpoint || 'https://api.myjson.com';
    const BIN_ID = config.bin_id;
    
    const getItems = () => {
      return new Promise((resolve, reject) => {
        request
          .get(`${API_ENDPOINT}/bins/${BIN_ID}`)
          .then(result => resolve(JSON.parse(result)));
      });
    };
  
    const addItem = (existingItems, newItem) => {
      newItems = existingItems;
      if (newItem) {
        newItems.push(newItem); 
      }
      return new Promise((resolve, reject) => {
         request({
             method: 'PUT',
             uri: `${API_ENDPOINT}/bins/${BIN_ID}`,
             json: newItems,
         }).then(result => resolve(result));
      });
    };
  
    const removeItem = (existingItems, itemToDelete) => {
      return existingItems.filter(item => {
        return item.id != itemToDelete.id;
      });
    }

    const storage = {
        items: {
            get: function(id, cb) {
                getItems()
                  .then(items => cb(null, items.find(item => item.id === id)))
                  .catch(error => { return {displayName: error}})
            },
            save: function(newItem, cb) {
                getItems()
                  .then((existingItems) => {
                    addItem(
                      existingItems,
                      newItem
                    ).then(results => cb(null, results))
                    .catch(error => { return {displayName: error}})
                  })
                  .catch(error => { return {displayName: error}})
            },
            delete: function(itemToRemove, cb) {
                getItems()
                  .then((existingItems) => {
                    addItem(removeItem(existingItems, itemToRemove)) // lol gross what have i done
                      .then(results => cb(null, results))
                      .catch(error => { return {displayName: error}})
                  })
                  .catch(error => { return {displayName: error}})
            },
            all: function(cb) {
                getItems()
                  .then(results => cb(null, results))
                  .catch(error => { return {displayName: error}})
            },
            deleteAll: function() {
              request({
                method: 'PUT',
                uri: `${API_ENDPOINT}/bins/${BIN_ID}`,
                json: [],
              })
            }
        }
    };

    return storage;
};