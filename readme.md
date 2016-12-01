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
$ node server.js
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

