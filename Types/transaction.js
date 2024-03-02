const uuid = require('uuid');
class Transaction {
    constructor(amount, sender, recipient){
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.transactionId = uuid.v1().split("-").join("");
    }
}

module.exports = Transaction;