'use strict'

// core
const url = require('url')

// npm
const got = require('got')

const obj = {
  protocol: 'http',
  hostname: 'localhost',
  port: 5984
}

if (process.env.COUCHDB_PORT) {
  const u = url.parse(process.env.COUCHDB_PORT)
  obj.hostname = u.hostname
  obj.port = u.port
}

got(url.format(obj))
  .then((x) => {
    console.log(x.body)
  })
  .catch((err) => {
    console.error('ERR:', err)
  })
