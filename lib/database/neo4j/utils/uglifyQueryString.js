'use strict'

function uglifyQueryString(string, options) {
  return string.replace(/\n/g, ' ').trim()
}

module.exports = uglifyQueryString
