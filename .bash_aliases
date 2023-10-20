alias npm='docker run -u 1000 --name webgl-npm --rm -it -v "$(pwd)":/app -w /app node:18.18.2 npm'
alias node='docker run -u 1000 --name webgl-node --rm -it -v "$(pwd)":/app -w /app node:18.18.2 node'
