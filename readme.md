# Docker demo

On veut rouler une application node qui utilise deux services:

* Redis
* CouchDB

Nous utiliserons les outils suivants:

* Debian (testé sur)
* docker (avec docker-machine et virtualbox)
* NodeJS
* yarn (au lieu de npm)

Procédons par étapes.

# Cloner le projet
Sur github: <https://github.com/millette/docker-demo-3>

```
git clone https://github.com/millette/docker-demo-3.git
cd docker-demo-3
yarn # installer les modules JavaScript nécessaires
```

## Yarn?
Si vous n'avez pas déjà yarn, utilisez npm pour l'installer:
```
npm install --global yarn
```

## npm?
Si vous n'avez pas npm, soit vous n'avez pas NodeJS, soit c'est une
vieille version.

## NodeJS?
Je recommande le gestionnaire de version n pour NodeJS et pour installer
n j'utilise <https://github.com/mklement0/n-install>:

```
curl -L https://git.io/n-install | bash
```

J'utilise encore la version 4 de NodeJS. Pour installer et sélectionner
cette version:

```
n 4.6.2
```

Ceci installera en même temps npm, que vous utiliserez pour installer yarn,
bien sûr.

# Installer Redis localement
Dans Debian, la version jessie-backports de Redis est 3.2.5
tandis que la version jessie (Stable) est 2.8.17. On va préférer
la version plus récente.

Sans changer de répertoire (pour les opérations suivantes), exécutez:

```
sudo aptitude install -t jessie-backports redis-server
redis-cli monitor # CTRL-C pour quitter
```

Ça devrait normalement afficher ```OK``` sur une ligne. Quitter
le Redis monitor avec CTRL-C.

# Un premier test
À ce point-ci, vous êtes dans le répertoire docker-demo-3/ créé en
clonant le projet et le serveur Redis est démarré. Lancez le script
avec ```yarn start``` pour obtenir le résultat suivant:

```
yarn start v0.17.6
$ node redis
Reply: OK
Reply: 0
Reply: 0
2 replies:
    0: hashtest 1
    1: hashtest 2
Done in 0.70s.
```

Vous pouvez ouvrir une autre console et lancer ```redis-cli monitor```
d'un côté et ```yarn start``` dans la première console. Le monitor
devrait afficher cette fois:

```
OK
1480631054.994864 [0 127.0.0.1:46351] "info"
1480631055.004388 [0 127.0.0.1:46351] "set" "string key" "string val"
1480631055.004609 [0 127.0.0.1:46351] "hset" "hash key" "hashtest 1" "some value"
1480631055.004780 [0 127.0.0.1:46351] "hset" "hash key" "hashtest 2" "some other value"
1480631055.004862 [0 127.0.0.1:46351] "hkeys" "hash key"
```

# Docker
Jusqu'ici nous avons procéder localement, sans utiliser Docker.
Nous voici enfin à l'étape attendue.

## Docker-machine
docker-machine permet de gérer des machines docker (si si).

Suivez les instructions pour l'installer sur
<https://docs.docker.com/machine/install-machine/>.

Pour installer le binaire, au minimum:

```
curl -L https://github.com/docker/machine/releases/download/v0.8.2/docker-machine-`uname -s`-`uname -m` >/usr/local/bin/docker-machine
chmod +x /usr/local/bin/docker-machine
```

## VirtualBox
Si vous n'avez pas déjà installé virtualbox:

```
sudo aptitude install -t jessie-backports virtualbox
```

Ensuite, suivez les instructions pour créer votre première machine sur
<https://docs.docker.com/machine/get-started/>

Au minimum:

```
docker-machine create --driver virtualbox default
```

Il faut aussi sélectionner la machine:

```
eval $(docker-machine env)
```

Nous sommes maintenant prêt pour construire une nouvelle image docker
pour notre application:

```
yarn make-docker
```

C'est l'équivalent de la commande suivante, telle que spécifiée
dans les scripts du fichier package.json:

```
docker build -t my-nodejs-app .
```

## Fermer redis local
Fermons le service local redis que nous n'utiliserons plus et vérifions
qu'il est bien fermé:

```
sudo service redis stop
redis-cli monitor
```

La connection à redis devrait être refusée:

```
Could not connect to Redis at 127.0.0.1:6379: Connection refused
Could not connect to Redis at 127.0.0.1:6379: Connection refused
```

Nous pouvons maintenant lancer un container avec notre image:

```
docker run --name some-app --link some-redis:redis my-nodejs-app
```

Ah, mais il nous manque quelque chose parce qu'on obtient cette erreur:

```
FATA[0000] Error response from daemon: Could not get container for some-redis
```

Nous avons fermé notre redis local, il faut maintenant le démarrer
dans un container et relancer un container avec notre image:

```
docker run --name some-redis -d redis:3.2.5-alpine
docker run --name some-app --link some-redis:redis my-nodejs-app
```

On devrait finalement obtenir:

```
npm info it worked if it ends with ok
npm info using npm@2.15.11
npm info using node@v4.6.2
npm info prestart docker-demo-3@0.0.1
npm info start docker-demo-3@0.0.1

> docker-demo-3@0.0.1 start /usr/src/app
> node redis.js

Reply: OK
Reply: 1
Reply: 1
2 replies:
    0: hashtest 1
    1: hashtest 2
npm info poststart docker-demo-3@0.0.1
npm info ok
```

## Du ménage
Pour afficher les container qu'on vient de créer et leurs statuts:

```
docker ps -a|head -n1
docker ps -a|grep some-
```

Les containers ID seront différents (et les temps sous CREATED et STATUS)
mais autrement la sortie devrait donner:

```
CONTAINER ID  IMAGE               COMMAND                CREATED          STATUS                     PORTS      NAMES
acac3e729095  my-nodejs-app       "npm start"            17 minutes ago   Exited (0) 3 minutes ago              some-app
1b0211961488  redis:3.2.5-alpine  "docker-entrypoint.s   17 minutes ago   Up 3 minutes               6379/tcp   some-redis
```

Pour manipuler un container (stopper, effacer, etc.)
il faut connaitre son ID. Dans cet exemple, nous pouvons effacer
le container de notre application (qui a terminé) avec

```
docker rm acac3e729095
```

On peut maintenant relancer notre application:
```
docker run --name some-app --link some-redis:redis my-nodejs-app
```

Elle devrait terminer comme la première fois. Et si on énumère
les containers:

```
docker ps -a|grep some-
```

Notez que l'ID du container de l'application est différent
tandis que le container de redis n'a pas changé.

```
4a62198dd85f  my-nodejs-app       "npm start"            18 minutes ago   Exited (0) About a minute ago         some-app
1b0211961488  redis:3.2.5-alpine  "docker-entrypoint.s   17 minutes ago   Up 3 minutes               6379/tcp   some-redis
```

Effaçons à nouveau le container de l'application:

```
docker rm 4a6
```

Pas besoin de spécifier l'ID complet, un préfixe unique suffit.

Si un autre container avait un ID commençant par 4a6 cependant,
on obtiendrait une erreur du genre:

```
Error response from daemon: Multiple IDs found with provided prefix: 4a65b01324bd811236843f71a55c0004c77eb93531056a0b568a2c6fd59f6c09
FATA[0000] Error: failed to remove one or more containers
```

## Notre application
L'application NodeJS implémentée dans le fichier redis.js
fait le minimum pour démontrer le fonctionnement.

Il commence avec ces lignes:

```
const url = require('url')
const redis = require('redis')

const obj = {}

if (process.env.REDIS_PORT) {
  const u = url.parse(process.env.REDIS_PORT)
  obj.host = u.hostname
  obj.port = u.port
}

const client = redis.createClient(obj)
```

Quand on démarre l'application localement (sans docker), la variable
d'environnement REDIS_PORT n'est pas définie.

Dans docker, REDIS_PORT contient le nécessaire pour déterminer
l'hôte et le port de Redis.

Enfin, le client est créé avec ```redis.createClient(obj)```,
donc pour l'application locale, ```obj``` est vide et les valeurs
par défaut sont utilisées. Autrement, on utilise l'hôte et le port
de la variable d'environnement.

## Et CouchDB?
On procède comme avec redis, mais en utilisant l'image couchdb:

```
docker run --name some-couchdb -d couchdb:1.6.1
docker build -t my-nodejs-app2 .
docker run --name some-app2 --link some-couchdb:couchdb my-nodejs-app2
```

Ce qui devrait donner comme résultat:

```
npm info it worked if it ends with ok
npm info using npm@2.15.11
npm info using node@v4.6.2
npm info prestart docker-demo-3@0.0.3
npm info start docker-demo-3@0.0.3

> docker-demo-3@0.0.3 start /usr/src/app
> node couchdb

OBJ: { hostname: '172.17.0.3', port: '5984', protocol: 'http' }
U: http://172.17.0.3:5984
{"couchdb":"Welcome","uuid":"365e953683bb6da1acb99027531f3ede","version":"1.6.1","vendor":{"name":"The Apache Software Foundation","version":"1.6.1"}}

npm info poststart docker-demo-3@0.0.3
npm info ok
```

## Tous ensemble maintenant
Nous allons linker à nos deux services:

```
docker build -t my-nodejs-app3 .
docker run --name some-app3 --link some-couchdb:couchdb --link some-redis:redis my-nodejs-app3
```

# Docker compose
docker-compose permet de gérer un ensemble de containers.

Suivez les instructions pour l'installer sur
<https://docs.docker.com/compose/install/>.

Pour installer le binaire, au minimum:

```
curl -L "https://github.com/docker/compose/releases/download/1.9.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

Un fichier yaml sert à configurer un ensemble de containers. Par défaut
il se nomme docker-compose.yml (ou docker-compose.yaml si vous préférez).

Dans notre cheminement, nous utiliserons d'abord la version 1 du format
et nommerrons notre fichier docker-compose-v1.yml que nous lancerons:

```
docker-compose -f docker-compose-v1.yml up
```

Ce fichier de configuration et l'usage de docker-compose est équivalent
de notre commande précédente:

```
docker run --name some-app3 --link some-couchdb:couchdb --link some-redis:redis my-nodejs-app3
```

Ainsi, le résultat devrait être à peu près le même.

# Avec hapi
(*à venir*)

Serveur web de base

# hyper.sh
(*à venir*)

Hébergement de containers docker

