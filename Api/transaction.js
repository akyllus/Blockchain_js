const { body, validationResult } = require('express-validator');

app.post("/transaction", [
  body('sender').notEmpty().withMessage('Sender is required'),
  body('recipient').notEmpty().withMessage('Recipient is required'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('amount').isInt({ gt: -1 }).withMessage('Amount must be a positive integer'),
], function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(errors.array());
  }

  // existing code for adding a transaction
});