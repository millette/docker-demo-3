'use strict'

// core
const url = require('url')

// npm
const Hapi = require('hapi')
const got = require('got')

// self
const pkg = require('./package.json')
console.log('pkg:', pkg)

const redisHost = url.parse(process.env.REDIS_PORT || 'http://localhost:6379').hostname
const x = url.parse(process.env.COUCHDB_PORT || 'http://localhost:5984')
x.protocol = 'http'
x.pathname = '/'
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
    console.log('auth:', `${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}`)
    got.put(url.resolve(couchdbUrl, 'mwaha'), { auth: `${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}` })
      .then((x) => x.body)
      .then(console.log)
      .catch((e) => {
        console.error('ERR:', e)
        got.put(url.resolve(couchdbUrl, 'mwaha2'), { auth: `${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}` })
          .then((x) => x.body)
          .then(console.log)
          .catch(console.error)
      })

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {
        reply('Hello, world!')
      }
    })

    server.route({
      method: 'GET',
      path: '/dbsrv',
      handler: {
        proxy: {
          passThrough: true,
          uri: couchdbUrl
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/db',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, 'mwaha')
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/script/{more}',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_utils/script') + '/{more}'
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/dialog/{more}',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_utils/dialog') + '/{more}'
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/image/{more}',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_utils/image') + '/{more}'
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/style/{more}',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_utils/style') + '/{more}'
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/futon',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_utils/')
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/_sidebar.html',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_utils/_sidebar.html')
        }
      }
    })


    server.route({
      method: '*',
      path: '/_session',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_session')
        }
      }
    })


    server.route({
      method: 'GET',
      path: '/{more}',
      handler: {
        proxy: {
          passThrough: true,
          uri: couchdbUrl + '{more}'
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/{more}/',
      handler: {
        proxy: {
          passThrough: true,
          uri: couchdbUrl + '{more}/'
        }
      }
    })

/*
    server.route({
      method: 'GET',
      path: '/_all_dbs',
      handler: {
        proxy: {
          passThrough: true,
          uri: url.resolve(couchdbUrl, '_all_dbs')
        }
      }
    })
*/

    server.start((err) => {
      let cnt = 3
      if (err) { throw err }
      console.log(`Server running at: ${server.info.uri}`)
      const i = setInterval(() => {
        console.log('nada', cnt) // NOTHING DISPLAYED, BUT ALLOWS LAST LINE TO SHOW UP
        if (!cnt--) {
          clearInterval(i)
        }
      }, 5000)
    })
  }
)
