const Blockchain = require("../types/Blockchain");

let bitcoin = new Blockchain();

// Create a new block with a previous hash of '54211211' and a nonce of '123456'
bitcoin.createNewBlock(54211211, "AJSHH123H137813N", "HH32UIT379DUA");

// Add three new transactions to the pending transactions array
bitcoin.createNewTransaction("5000", "Ritik", "Harsh");
bitcoin.createNewTransaction("500", "Ritik", "Harsh");
bitcoin.createNewTransaction("200", "Ritik", "Harsh");

// Create a new block with a previous hash of '878515454' and a nonce of '123456'
bitcoin.createNewBlock(878515454, "1UUH2JEWY78U23ASSD", "IUOIYGUVJB32312JAS");

// Add a new transaction to the pending transactions array
bitcoin.createNewTransaction("500", "Abhishek", "Shantanu");

// Print the updated blockchain
console.log(bitcoin);

// Calculate the hash of the last block in the chain
let previousHash = bitcoin.chain[bitcoin.chain.length - 1].hash;

// Calculate the hash of the new block to be mined
let newBlockHash = bitcoin.hashBlock(previousHash, bitcoin.pendingTransactions, 123456);
console.log(newBlockHash);

// Mine the new block
let minedBlock = bitcoin.mineBlock(newBlockHash);
console.log(minedBlock);