const { createStore, action } = require("easy-peasy");

const store = createStore({
  offers: {
    offerList: [],
    addOffer: action((state, payload) => {
      state.offerList.push(payload);
    }),
  },
  requests: {
    requestList: [],
    addRequest: action((state, payload) => {
      state.requestList.push(payload);
    }),
  },

  
  connection: {
    connected: null,
    setConnected: action((state, payload) => {
      state.connected = payload;
    }),
  },
});

export default store;
