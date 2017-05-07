'use strict'

const neo4j = require('neo4j-driver').v1

let options = {
  // trust: 'TRUST_ALL_CERTIFICATES',
  // encrypted: 'ENCRYPTION_ON'
}

class Connection {
  static async open({ scheme = 'bolt', host = 'localhost', auth = {} } = {}) {
    let url = `${scheme}://${host}`
    let {username = 'neo4j', password = 'neo4j'} = auth
    let authentication = neo4j.auth.basic(username, password)
    return neo4j.driver(url, authentication, options)
  }
}

module.exports = Connection
