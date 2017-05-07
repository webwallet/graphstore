'use strict'

class Transaction {
  constructor(session) {
    this.transaction = session.beginTransaction()
  }
  async run(query = '', params) {
    return this.transaction.run(query, params)
  }
  async commit() {
    return this.transaction.commit()
  }
  async rollback() {
    return this.transaction.callback()
  }
}

module.exports = Transaction
