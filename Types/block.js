class Block{
    constructor(index, transactions, nonce, previousBlockHash, hash){
        this.index = index;
        this.nonce = nonce;
        this.previousBlockHash = previousBlockHash;
        this.hash = hash;
        this.timestamp = Date.now();
        this.transactions = transactions;
    }
}

module.exports = Block;