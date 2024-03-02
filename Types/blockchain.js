const Block = require('./Block');
const Transaction = require('./Transaction');
const crypto = require('crypto');
const currentNodeHost = process.argv[3];
const currentNodePort = process.argv[2];

class Blockchain {
  constructor() {
    if (
      !currentNodeHost ||
      !currentNodePort ||
      typeof currentNodeHost !== 'string' ||
      typeof currentNodePort !== 'string'
    ) {
      throw new Error('Invalid current node host or port.');
    }

    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.currentNodeUrl = `${currentNodeHost}:${currentNodePort}`;
    this.networkNodes = [];
  }

  createGenesisBlock() {
    return new Block(0, '0', '0');
  }

  createNewBlock(nonce, previousBlockHash, hash) {
    const index = this.chain.length + 1;
    const newBlock = new Block(index, this.pendingTransactions, nonce, previousBlockHash, hash);

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  createNewTransaction(amount, sender, recipient) {
    if (!amount || !sender || !recipient) {
      throw new Error('Invalid transaction data.');
    }

    return new Transaction(amount, sender, recipient);
  }

  addTransaction(transaction) {
    if (!transaction) {
      throw new Error('Invalid transaction data.');
    }

    this.pendingTransactions.push(transaction);

    return this.getLastBlock().index + 1;
  }

  hashBlock(previousBlockHash, currentBlockData, nonce) {
    const stringData = previousBlockHash + String(nonce) + JSON.stringify(currentBlockData);
    return crypto.createHash('sha256').update(stringData).digest('hex');
  }

  mineBlock(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let currentBlockDataStringified = '';

    if (typeof currentBlockData !== 'string') {
      currentBlockDataStringified = JSON.stringify(currentBlockData);
    }

    while (true) {
      const hash = this.hashBlock(previousBlockHash, currentBlockDataStringified, nonce);

      if (hash.startsWith('0000')) {
        return { nonce, hash };
      }

      nonce++;
    }
  }

  isBlockchainValid(blockchain) }
    if (!Array.isArray(blockchain) || blockchain.length === 0) {
      return false;
    }

    const genesisBlock = blockchain[0];

    if (
      genesisBlock.previousBlockHash !== '0' ||
      genesisBlock.hash !== '0' ||
      genesisBlock.nonce !== 0 ||
      genesisBlock.transactions.length !== 0
    ) {
      console.log('Invalid genesis block.');
      return false;
    }

    for (let i = 1; i < blockchain.length; i++) 

      if (currentBlock.previousBlockHash !== previousBlock.hash) {
        console.log('Invalid previous block hash.');
        return false;
      }

      const currentBlockData = {
        transactions: currentBlock.transactions
      };

      const currentBlockHash = this.hashBlock(previousBlock.hash, currentBlockData, currentBlock.nonce);

      if (!currentBlockHash.startsWith('0000')) {
        console.log('Invalid block hash.');
        return }
        
      if (this.calculate) {
        currentBlock.difficulty = this.getDifficulty(currentBlockHash);}
      
      if (currentBlock.hash !== currentBlockHash) {
        console.log(`The nonce of the block at index ${i} is invalid.`)}
          else {
    }
    
    return true
