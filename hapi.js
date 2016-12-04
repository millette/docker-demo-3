'use strict'

// core
const url = require('url')

// npm
const Hapi = require('hapi')

const redisHost = url.parse(process.env.REDIS_PORT || 'http://localhost:6379').hostname
const x = url.parse(process.env.COUCHDB_PORT || 'http://localhost:5984')
x.protocol = 'http'
const couchdbUrl = url.format(x)

console.log('COUCHDB:', couchdbUrl)
console.log('REDIS:', redisHost)

const server = new Hapi.Server({
  cache: [
    {
      engine: require('catbox-redis'),
      host: redisHost
    }
  ]
})

server.connection({ port: 8050 })

server.register(
  [
    {
      register: require('h2o2')
    },
    {
      register: require('hapi-couchdb-login'),
      options: {
        db: {
          url: couchdbUrl
        },
        cookie: {
          password: 'password-should-be-32-characters',
          secure: false
        }
      }
    }
  ],
  {
    routes: {
      prefix: '/user'
    }
  },
  (err) => {
    if (err) { throw err }

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {
        reply('Hello, world!')
      }
    })

    server.start((err) => {
      if (err) { throw err }
      console.log(`Server running at: ${server.info.uri}`)
      console.log('nada#1') // NOTHING DISPLAYED, BUT ALLOWS LAST LINE TO SHOW UP
      console.log('nada#2') // NOTHING DISPLAYED, BUT ALLOWS LAST LINE TO SHOW UP
    })
  }
)
