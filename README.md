# NodeSQL - A Simple User Interface for demonstrating SQL Injection
NodeSQL is an experimental web based GUI and back-end API that interfaces with [SQLMap](https://github.com/sqlmapproject/sqlmap) for database exploitation and exploration. Build the image and it should _just work_ regardless of your operating system.

It also features:

- an asynchronous API supporting database, table, column and data extraction through SQLMap
- an easy to use front-end for traversing a vulnerable database
- full support for HTTP GET/POST with both form and cookie inputs

NodeSQL was built with security awareness for non-technical people in mind. It comprises only a small subset of SQLMap's extensive feature set, so for meaningful security testing it's probably best to stick with the original SQLMap CLI. PR's are always welcome, and I've left a few notes in the bottom of this file of things to think about. 

## Demo
![gif image](./images/dvwa_gif.gif)

## Building NodeSQL 
We provide two methods for building NodeSQL. The simplest of the two is to build a local docker image. Though if you want to run the application from source, that's supported too.

### building from docker

```
# clone this repository
git clone <this repository>

# building the docker image
docker build . -t nodesql

# run the front-end and API from your container
docker run --rm --name injection --net mynet -p 3000:3000 -it nodesql:latest
```

### building from source

```
# clone this repository
git clone <this repository>

# install node dependencies
cd app && npm install

#run the web interface and api
node index.js
```

Point your browser to _http://localhost:3000_ to access the web interface. 

> Note: The API looks for SQLMap in the `bin/` directory from this repository. You may override that by setting the environment variable inside the Dockerfile.

## Building the experimental lab
The quickest way to demonstrate this tool is to set up a vulnerable docker image like [Damn Vulnerable Web App](http://www.dvwa.co.uk).
```
docker pull vulnerables/web-dvwa
docker run --rm -d --name dvwa --net mynet -p 80:80 vulnerables/web-dvwa
```

Or if you've ever gone through Troy Hunt's [hack-yourself-first website](http://hack-yourself-first.com) examples, there's a few vulnerable endpoints in there too! 
![hyf-demo](./images/hyf_gif.gif)

#### Important
It is your responsibility to ensure you have consent for assessing websites using this tool. Please don't point this at systems for which you do not have approval. Better yet, go grab yourself a vulnerable web app to test with. Examples that I've tested so far are [CrackMe Bank](http://crackme.trustwave.com/), [DVWA](http://www.dvwa.co.uk), [Wackopicko](https://github.com/adamdoupe/WackoPicko) and [Mutillidae](https://github.com/adamdoupe/WackoPicko).

## Future work
- Extend the sqlmapapi to include data fetching
- Refactor the injection models to use the sqlmapapi, rather than subprocesses
- Use websockets to inform clients of updated SQLMap output 
- Modify the front-end to use React
