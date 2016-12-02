'use strict'

const url = require('url')
const redis = require('redis')

const obj = {}

if (process.env.REDIS_PORT) {
  const u = url.parse(process.env.REDIS_PORT)
  obj.host = u.hostname
  obj.post = u.port
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
