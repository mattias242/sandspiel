<meta charset="utf-8"/>

# sandspiel

"Imagine the cool phenomenon when the wind blows the falling leaves. This game simulates the phenomenon with powder (dots)!" -DAN-BALL

![](Screenshot.png)

This is a [falling sand](https://en.wikipedia.org/wiki/Falling-sand_game) game built in rust (via wasm), webgl, and some JS glueing things together.

You can [play online](https://sandspiel.club) or read [a longer post on the project](https://maxbittker.com/making-sandspiel)

The goal was to produce an cellular automata environment that's interesting to play with and supports the sharing and forking of fun creations with other players.
Ultimately, I want the platform to support editing and uploading of your own elements via a programmable cellular automata API.

### 🛠️ Build:

```
# build the wasm once:
cd crate && wasm-pack build && cd ..;
npm install;
npm run start;

# then in a separate terminal:
cargo watch -s 'wasm-pack build'
```

### 🐹 Lemmings

[`/lemmings`](https://sandspiel.club/lemmings) is a Lemmings-style puzzle game built on the same simulation. Lemmings walk on anything solid, get buried by falling sand, drown in water and burn in lava, and the classic skills (climber, floater, bomber, blocker, builder, basher, miner, digger) dig into and build onto the cell grid. Builders lay wood, so bridges can burn.

- `crate/src/lemmings.rs`: lemming behaviour, run once per `Universe::tick`
- `js/lemmings/levels.js`: the levels, each painted into a `Universe`
- `js/lemmings/index.js`, `sprites.js`: the game UI and pixel-art lemmings

Every level is checked headlessly with a scripted solution (and checked to be unsolvable without skills):

```
npm run verify-lemmings
```

The Rust behaviour tests run natively: `cd crate && cargo test --target x86_64-unknown-linux-gnu` (use your host's target triple).

a successor to my previous efforts in [javascript](https://github.com/MaxBittker/dust) and [lua](https://github.com/MaxBittker/sand-toy)

Fluid simulation code adopted from
https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
