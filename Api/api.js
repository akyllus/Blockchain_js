const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const uuid = require('uuid');
const axios = require('axios');
const port = process.env.PORT || 3000;

const nodeAddress = uuid.v1().split("-").join("");

const Blockchain = require("../types/Blockchain");

const newcoin = new Blockchain();

let healthCheckCount = 0;   // Just to debug

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
    console.log(`/ Health check count : ${++healthCheckCount}`);
    res.send('Working!');
});

app.get("/blockchain", function(req, res){
    res.send(newcoin);
});

app.post("/transaction", function (req, res) {
    console.log(`Request received at transaction node..`);
    const newTransaction = req.body;
    if (!newTransaction.sender || !newTransaction.recipient || !newTransaction.transactionId || isNaN(newTransaction.amount)){
        return res.status(400).send("Invalid request");
    }
    const blockIndex = newcoin.addTransaction(newTransaction);
    console.log("Transaction added..");

    res.status(200).send(`Transaction will be added in block ${blockIndex}..`);
});

app.post("/transaction/broadcast", async function(req, res){
    console.log(`Request received at transaction/broadcast node..`);
    const { amount, sender, recipient } = req.body;
    if (!sender || !recipient || isNaN(amount)) {
        return res.status(400).send("Invalid request");
    }
    let newTransaction = newcoin.createNewTransaction(Number(amount), sender, recipient);
    newcoin.addTransaction(newTransaction);
    console.log("Transaction added..");
    const broadcastPromises = newcoin.networkNodes.map(nodeUrl => {
        return new Promise(async resolve => {
            try{
                const config = {
                    url: `${nodeUrl}/transaction`,
                    method: "POST",
                    data: newTransaction
                }
                await axios(config);
                console.log(`Transaction broadcasted to ${nodeUrl}..`);
            }
            catch(err){
                console.log(`Error broadcasting transaction to ${nodeUrl}..`);
            }
            return resolve();
        });
    });
    await Promise.all(broadcastPromises);
    res.status(200).send("Transaction created and broadcasted successfully..");
});

app.get("/mine", async function (req, res) {
    console.log("Received request at mine endpoint..");
    const lastBlock = newcoin.getLastBlock();
    const previousBlockHash = lastBlock.hash;

    const currentBlockData = {
        transactions: newcoin.pendingTransactions
    }

    const { nonce, hash } = newcoin.mineBlock(previousBlockHash, currentBlockData);
    const newBlock = newcoin.createNewBlock(nonce, previousBlockHash, hash);
    console.log("New block mined..");

    const broadcastPromises = newcoin.networkNodes.map(nodeUrl => {
        return new Promise(async resolve => {
            try {
                const config = {
                    url: `${nodeUrl}/add-new-block`,
                    method: "POST",
                    data: {newBlock }
                }
                await axios(config);
                console.log(`Block broadcasted to ${nodeUrl}..`);
            }
            catch (err) {
                console.log(`Error broadcasting block to ${nodeUrl}..`);
            }
            return resolve();
        });
    });
    await Promise.all(broadcastPromises);

    //Reward for mining
    try{
        const config = {
            url: `${newcoin.currentNodeUrl}/transaction/broadcast`,
            method: "POST",
            data: {
                amount: 12.5,
                sender: "REWARD_SERVER",
                recipient: nodeAddress
            }
        }
        await axios(config);
        console.log("Reward transaction created and broadcasted successfully..");
    }
    catch(err){
        console.log("Failed to create and broadcast reward transaction..");
    }

    res.status(200).json(newBlock);
});

app.post("/add-new-block", function(req, res) {
    console.log("Received request at add new block endpoint..");
    const {newBlock} = req.body;
    if(!newBlock){
        return res.status(400).send("Invalid request..");
    }
    //Verify the new block with our last block
    const lastBlock = newcoin.getLastBlock();
    const isValidHash = lastBlock.hash === newBlock.previousBlockHash;
    const isValidIndex = lastBlock.index + 1 === newBlock.index;

    if(isValidHash && isValidIndex){
        newcoin.chain.push(newBlock);
        console.log("Received block added to blockchain..");
        newcoin.pendingTransactions = [];
        return res.status(200).send("New Block received, verified and added to the chain..");
    }
    return res.status(500).send("New block rejected..");
});

//register a node and broadcast it to the network
app.post("/register-and-broadcast-node", async function(req, res){
    console.log(`Received request for register and broadcast node..`);
    const newNodeUrl = req.body.url;
    if(!newNodeUrl){
        return res.status(400).send("url is mandatory");
    }
    if (!newcoin.networkNodes.includes(newNodeUrl) && newcoin.currentNodeUrl !== newNodeUrl){
        //Register the URL into current node
        newcoin.networkNodes.push(newNodeUrl);
        console.log(`Registered ${newNodeUrl} ..`);
    }

    //Broadcast the URL to other nodes
    const broadcastPromises = newcoin.networkNodes.map(nodeUrl => {
        return new Promise(async resolve => {
            try{
                const config = {
                    url: `${nodeUrl}/register-node`,
                    method: "POST",
                    data: {
                        url: newNodeUrl
                    }
                }
                await axios(config);
                console.log(`Broadcasted ${newNodeUrl} to node ${nodeUrl}..`);
            }
            catch(err){
                console.log(`Error while broadcasting ${newNodeUrl} to node ${nodeUrl}..`, err.message);
            }
            return resolve();
        });
    });

    await Promise.all(broadcastPromises);
    //Broadcast done. Now need to register the existing nodes to the new node using bulk endpoint
    const config = {
        url: `${newNodeUrl}/register-nodes-bulk`,
        method: "POST",
        data: {
            urls: [...newcoin.networkNodes, newcoin.currentNodeUrl]
        }
    }
    try{
        await axios(config);
        console.log(`Bulk registered nodes in the new node ${newNodeUrl}..`);
    }
    catch(err){
        console.log(`Error during bulk registration of nodes to the new node ${newNodeUrl}..`, err.message);
    }
    res.status(200).send("Register and broadcast completed...");
});

//just register a node to the network without broadcasting it
app.post("/register-node", function(req, res){
    console.log("Received request for node registration..");
    const newNodeUrl = req.body.url;
    if (!newNodeUrl) {
        return res.status(400).send("url is mandatory");
    }
    if (!newcoin.networkNodes.includes(newNodeUrl) && newcoin.currentNodeUrl !== newNodeUrl) {
        //Register the URL into current node
        newcoin.networkNodes.push(newNodeUrl);
        console.log(`Registered ${newNodeUrl} ..`);
    }
    res.status(200).send(`${newNodeUrl} registered..`);
});

app.post("/register-nodes-bulk", function (req, res) {
    console.log("Received request for bulk registration..");
    let newNodes = req.body.urls;
    if(typeof newNodes === "string"){
        try{
            newNodes = JSON.parse(newNodes);
        }
        catch(err){}
    }

    if (!newNodes || !Array.isArray(newNodes)) {
        return res.status(400).send("urls is mandatory parameter and should be an array..");
    }

    newNodes.forEach(newNodeUrl => {
        if (!newcoin.networkNodes.includes(newNodeUrl) && newcoin.currentNodeUrl !== newNodeUrl) {
            //Register the URL into current node
            newcoin.networkNodes.push(newNodeUrl);
            console.log(`Registered ${newNodeUrl} ..`);
        }
    });

    res.status(200).send(`Bulk registrations successful..`);
});

app.get("/consensus", async function(req, res){
    console.log("Received request at the consensus endpoint..");
    const consensusPromises = newcoin.networkNodes.map(nodeUrl => {
        return new Promise(async resolve => {
            try {
                const config = {
                    url: `${nodeUrl}/blockchain`,
                    method: "GET"
                }
                let response = await axios(config);
                console.log(`Fetched blockchain from ${nodeUrl}..`);
                return resolve(response.data);
            }
            catch (err) {
                console.log(`Error while fetching blockchain from ${nodeUrl}`, err.message);
            }
            return resolve({});
        });
    });

    const blockchains = await Promise.all(consensusPromises);
    const currentChainLength = newcoin.chain.length;
    let maxChainLength = currentChainLength, newLongestChain = null, newPendingTransactions = null;
    blockchains.forEach(blockchain => {
        if(blockchain?.chain?.length > maxChainLength){
            maxChainLength = blockchain.chain.length;
            newLongestChain = blockchain.chain;
            newPendingTransactions = blockchain.pendingTransactions;
        }
    });
    if(newLongestChain && newcoin.isBlockchainValid(newLongestChain)){
        newcoin.chain = newLongestChain;
        newcoin.pendingTransactions = newPendingTransactions;
        console.log("Current chain has been replaced with the longest chain in the network..");
        return res.status(200).send("Current chain has been replaced with the longest chain in the network..");
    }
    console.log("Current chain has not been replaced..");
    return res.status(200).send("Current chain has not been replaced..");
});

app.get("/block/:blockHash", function(req, res){
  const { blockHash } = req.params;
  console.log(`Request received at /block/:blockHash endpoint with block hash ${blockHash}`);
  const block = newcoin.getBlockByBlockHash(blockHash);
  if(block){
    return res.status(200).send(block);
  }
  return res.status(404).send("Block not found with the given hash..");
});

app.get("/transaction/:transactionId", function(req, res){
  const { transactionId } = req.params;
  const transaction = newcoin.getTransactionById(transactionId);
  if(transaction){
    return res.status(200).send(transaction);
  }
  return res.status(404).send("Transaction not found with the given transactionId..");
});

app.get("/address/:address", function(req, res){
  const {address} = req.params;
  if(!address){
    return res.status(400).send("Please pass a valid address..");
  }
  const allTransactions = newcoin.getTransactionsByAddress(address);
  return res.status(200).send(allTransactions);
});

app.get("/block-explorer", function(req, res){
  res.sendFile("views/block-explorer.html", { root: "/Users/devcula/Workspace/blockchain/" });
});

app.get("/validate-chain", function(req, res){
    //Just for testing purposes
    res.status(200).send(newcoin.isBlockchainValid(newcoin.chain));
});

app.listen(port, () => {
    console.log(`Node ${nodeAddress} listening on port ${port}...`);
});