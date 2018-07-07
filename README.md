# Consortium

## WARNING

This app straightup `child_process.exec/spawn`'s stuff on your machine.

DO NOT EXPOSE IT PUBLICLY.

## What

Basic process manager to make developing a graph of services locally easier.

![A screenshot of consortium, making this alt-text pretty damn pointless](/Screenshot.PNG?raw=true)

## Usage

Install
```
npm i
```

Run it:
```
npm run build

npm start

```

Develop it:
```
// In the first terminal
npm start

// In the second terminal
npm run watch
```
Client assets will rebuild when changed

The server will need a restart after changes.
