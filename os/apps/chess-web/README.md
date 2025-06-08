# chess-web

A minimal web interface around the PrimeOS chess engine.

## Overview

This module exposes a small HTTP service using Express. It wraps the existing
`chess` application and provides a REST API along with static assets so the game
can be played in the browser.

## Setup

```bash
npm install
npm run build
npm start
```

The server listens on port `3000` by default. Open
`http://localhost:3000` in your browser to play.
