'use strict'

// core
const url = require('url')

// npm
const redis = require('redis')
const got = require('got')

const obj = {}

if (process.env.REDIS_PORT) {
  const u = url.parse(process.env.REDIS_PORT)
  obj.host = u.hostname
  obj.port = u.port
}

const client = redis.createClient(obj)

client.on('error', (err) => console.log('Error ' + err))

client.set('string key', 'string val', redis.print)
client.hset('hash key', 'hashtest 1', 'some value', redis.print)
client.hset(['hash key', 'hashtest 2', 'some other value'], redis.print)
client.hkeys('hash key', (err, replies) => {
  console.log(`${replies.length} replies:`)
  replies.forEach((reply, i) => console.log(`    ${i}: ${reply}`))
  client.quit()
})

const obj2 = {
  protocol: 'http',
  hostname: 'localhost',
  port: 5984
}

if (process.env.COUCHDB_PORT) {
  const u2 = url.parse(process.env.COUCHDB_PORT)
  obj2.hostname = u2.hostname
  obj2.port = u2.port
}

got(url.format(obj2))
  .then((x) => {
    console.log(x.body)
  })
  .catch((err) => {
    console.error('ERR:', err)
  })
