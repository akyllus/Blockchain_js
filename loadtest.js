// kubectl autoscale deployment blockchain-deployment --cpu-percent=50 --min=1 --max=10

const axios = require('axios');

const MAX_HITS = 100000;
const MAX_CONCURRENT_HITS = 1000;

const apiConfig = {
    url: "http://localhost:30001/blockchain",
    timeout: 5000
}

async function hitApi(hitCount){
    try{
        const startTime = Date.now();
        await axios(apiConfig);
        console.log(`API success.. Hit count ${hitCount}, Latency - ${Date.now() - startTime}ms`);
    }
    catch(err){
        console.log(`API Failure.. Hit count ${hitCount}`, err);
    }
}

async function runLoadTest(){
    let hitCount = 1;
    while(hitCount <= MAX_HITS){
        const promises = [];
        for(let i = 0; i < MAX_CONCURRENT_HITS;){
            promises.push(hitApi(hitCount));
            i++;
            hitCount++;
        }
        await Promise.all(promises);
    }
}

runLoadTest();