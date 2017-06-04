'use strict'

const Session = require('./session')

let types = new Set(['begin', 'read', 'write'])

class Transaction {
  constructor(driver, type) {
    this.session = new Session(driver)
    let transactionMethod = (types.has(type) ? type : 'begin') + 'Transaction'
    this.transaction = this.session[transactionMethod].bind(this.session)
    this.type = transactionMethod
  }
  async run(query = '', params) {
    if (this.type === 'beginTransaction') {
      this.transaction = this.transaction()
      return this.transaction.run(query, params)
    } else {
      return this.transaction(transaction => {
        this.transaction = transaction
        return this.transaction.run(query, params)
      })
    }
  }
  async commit() {
    return this.transaction.commit()
  }
  async rollback() {
    return this.transaction.rollback()
  }
}

module.exports = Transaction
