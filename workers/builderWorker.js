// this works
import hunJson from './hundredK.json' assert {type: 'json'};

// this does not work?? no errors -- just no data -- also no console output
//import hunJson from './hundredK.json' with {type: 'json'};

// this does not work?? no errors -- just no data -- also no console output
//const hunJson = await (await fetch(new URL("./hundredK.json", import.meta.url))).json()

/**
 * Post a message to the main thread
 * @param {*} messageId 
 * @param {*} error 
 * @param {*} result 
 */
function postIt(messageId, error, result) {
   if (error) {
      console.error('Worker caught an error:', error);
      self.postMessage({ msgID: messageId, error: { message: error.message }, result: null });
   }
   else {
      self.postMessage({ msgID: messageId, error: null, result: result });
   }
}

/*
 * onMessage handler
 */
self.addEventListener('message', (event) => {
   const data = event.data;
   const { id, payload } = data;
   const { action, value } = payload;
   switch (action) {
      case 'BUILD':
         buildDataSet(value).then((data) => { 
            postIt(id, null, data);
         }).catch((_e) => {
            postIt(id, "error building - " + value, null);
         });
         break;
      default:
         console.error('oppps: workerIDB got - ', action);
         break;
   }
});

/**
 * build a dataSet from json data
 * @param {number} size 
 * @returns 
 */
function buildDataSet (size) {
   return new Promise((resolve, _reject) => {
      // neasure the construction
      const loadStart = performance.now();
      //@ts-ignore ? why not default
      const donnerMap = new Map(hunJson);
      
      console.log(`time to Load ${donnerMap.size} json records - ${(performance.now() - loadStart).toFixed(2)} ms `);
      console.log(donnerMap.get(0))
      const map = new Map();
      const showStart = performance.now();
      for (let index = 0; index < size; index++) {
         const user = donnerMap.get(index).value;
         user.id = index;
         map.set(index, user);
      }
      console.log(`time to Build ${size} records - ${(performance.now() - showStart).toFixed(2)} ms `);
      resolve(JSON.stringify([...map.entries()]));
   });
};
