// Lemmings: little walkers that live on top of the sand simulation.
//
// Lemmings are not cells. They are entities that read and write the cell
// grid of a `Universe`: they stand on anything solid, get buried by falling
// sand, drown in water, burn in fire and lava, dissolve in acid, and dig,
// bash, mine and build by removing or adding cells.

use rand::{Rng, SeedableRng};
use rand_xoshiro::SplitMix64;
use species::Species;
use wasm_bindgen::prelude::*;
use {Cell, Universe, Wind, EMPTY_CELL};

/// Height of a lemming in cells, feet included.
pub const LEM_H: i32 = 8;

const WALK_EVERY: i32 = 3;
const FLOAT_EVERY: i32 = 3;
const CLIMB_EVERY: i32 = 4;
const BUILD_EVERY: i32 = 16;
const BASH_EVERY: i32 = 4;
const MINE_EVERY: i32 = 6;
const DIG_EVERY: i32 = 5;

const STEP_UP: i32 = 3;
const FALL_DEATH: i32 = 48;
const FLOAT_OPEN: i32 = 12;
const BRICKS: i32 = 12;
const FUSE: i32 = 300;
const BLAST_RADIUS: i32 = 9;
const BURIED_FRAMES: i32 = 45;
const HATCH_DELAY: i32 = 90;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LemState {
    Walking = 0,
    Falling = 1,
    Floating = 2,
    Climbing = 3,
    Blocking = 4,
    Building = 5,
    Shrugging = 6,
    Bashing = 7,
    Mining = 8,
    Digging = 9,
    Exiting = 10,
    Splatting = 11,
    Drowning = 12,
    Burning = 13,
    Dissolving = 14,
    Dead = 15,
    Saved = 16,
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Skill {
    Climber = 0,
    Floater = 1,
    Bomber = 2,
    Blocker = 3,
    Builder = 4,
    Basher = 5,
    Miner = 6,
    Digger = 7,
}

#[derive(Clone, Copy, Debug)]
struct Lemming {
    x: i32,
    y: i32,
    dir: i32,
    state: LemState,
    timer: i32,
    fall: i32,
    bricks: i32,
    fuse: i32,
    steps: i32,
    stuck: i32,
    climber: bool,
    floater: bool,
}

impl Lemming {
    fn set_state(&mut self, state: LemState) {
        self.state = state;
        self.timer = 0;
        if state == LemState::Falling {
            self.fall = 0;
        }
    }

    fn is_active(&self) -> bool {
        match self.state {
            LemState::Exiting
            | LemState::Splatting
            | LemState::Drowning
            | LemState::Burning
            | LemState::Dissolving
            | LemState::Dead
            | LemState::Saved => false,
            _ => true,
        }
    }

    fn is_gone(&self) -> bool {
        self.state == LemState::Dead || self.state == LemState::Saved
    }

    // States from which a lemming can be given a new job.
    fn can_work(&self) -> bool {
        match self.state {
            LemState::Walking
            | LemState::Shrugging
            | LemState::Building
            | LemState::Bashing
            | LemState::Mining
            | LemState::Digging => true,
            _ => false,
        }
    }
}

fn is_solid(s: Species) -> bool {
    match s {
        Species::Empty
        | Species::Water
        | Species::Oil
        | Species::Acid
        | Species::Lava
        | Species::Gas
        | Species::Fire
        | Species::Mite => false,
        _ => true,
    }
}

// Steel can't be dug, bashed, mined or blown up.
fn is_steel(s: Species) -> bool {
    s == Species::Wall || s == Species::Cloner
}

fn species_at(u: &Universe, x: i32, y: i32) -> Species {
    if x < 0 || x >= u.width || y < 0 {
        return Species::Wall;
    }
    if y >= u.height {
        return Species::Empty;
    }
    u.get_cell(x, y).species
}

fn solid_at(u: &Universe, x: i32, y: i32) -> bool {
    is_solid(species_at(u, x, y))
}

fn in_bounds(u: &Universe, x: i32, y: i32) -> bool {
    x >= 0 && x < u.width && y >= 0 && y < u.height
}

// Removes a solid, non-steel cell. Returns true if anything was removed.
fn dig_cell(u: &mut Universe, x: i32, y: i32) -> bool {
    if !in_bounds(u, x, y) {
        return false;
    }
    let s = species_at(u, x, y);
    if is_solid(s) && !is_steel(s) {
        let i = u.get_index(x, y);
        u.cells[i] = EMPTY_CELL;
        return true;
    }
    false
}

fn set_cell(u: &mut Universe, x: i32, y: i32, species: Species, ra: u8) {
    if !in_bounds(u, x, y) {
        return;
    }
    let i = u.get_index(x, y);
    u.cells[i] = Cell {
        species,
        ra,
        rb: 0,
        clock: u.generation,
    };
}

#[wasm_bindgen]
pub struct Lemmings {
    lems: Vec<Lemming>,
    entrance_x: i32,
    entrance_y: i32,
    exit_x: i32,
    exit_y: i32,
    start_dir: i32,
    total: u32,
    released: u32,
    saved: u32,
    dead: u32,
    release_rate: i32,
    min_release_rate: i32,
    release_timer: i32,
    skills: [u32; 8],
    frame: u32,
    nuking: bool,
    rng: SplitMix64,
}

#[wasm_bindgen]
impl Lemmings {
    pub fn new() -> Lemmings {
        Lemmings {
            lems: Vec::new(),
            entrance_x: 0,
            entrance_y: 0,
            exit_x: 0,
            exit_y: 0,
            start_dir: 1,
            total: 0,
            released: 0,
            saved: 0,
            dead: 0,
            release_rate: 50,
            min_release_rate: 1,
            release_timer: HATCH_DELAY,
            skills: [0; 8],
            frame: 0,
            nuking: false,
            rng: SeedableRng::seed_from_u64(0x1e33_1295),
        }
    }

    /// Resets all lemmings and configures a level.
    pub fn setup(
        &mut self,
        entrance_x: i32,
        entrance_y: i32,
        exit_x: i32,
        exit_y: i32,
        start_dir: i32,
        total: u32,
        release_rate: i32,
    ) {
        *self = Lemmings::new();
        self.entrance_x = entrance_x;
        self.entrance_y = entrance_y;
        self.exit_x = exit_x;
        self.exit_y = exit_y;
        self.start_dir = if start_dir < 0 { -1 } else { 1 };
        self.total = total;
        self.release_rate = release_rate.max(1).min(99);
        self.min_release_rate = self.release_rate;
    }

    pub fn set_skill_count(&mut self, skill: Skill, count: u32) {
        self.skills[skill as usize] = count;
    }

    pub fn skill_count(&self, skill: Skill) -> u32 {
        self.skills[skill as usize]
    }

    pub fn set_release_rate(&mut self, rate: i32) {
        self.release_rate = rate.max(self.min_release_rate).min(99);
    }

    pub fn release_rate(&self) -> i32 {
        self.release_rate
    }

    pub fn min_release_rate(&self) -> i32 {
        self.min_release_rate
    }

    pub fn total(&self) -> u32 {
        self.total
    }

    pub fn released(&self) -> u32 {
        self.released
    }

    pub fn saved(&self) -> u32 {
        self.saved
    }

    pub fn dead(&self) -> u32 {
        self.dead
    }

    /// Lemmings currently in the level, including ones playing a death or
    /// exit animation.
    pub fn out(&self) -> u32 {
        self.released - self.saved - self.dead
    }

    pub fn frame(&self) -> u32 {
        self.frame
    }

    pub fn nuking(&self) -> bool {
        self.nuking
    }

    /// True once every lemming has been released (or the level was nuked)
    /// and none are left.
    pub fn done(&self) -> bool {
        (self.released == self.total || self.nuking) && self.out() == 0
    }

    pub fn nuke(&mut self) {
        self.nuking = true;
    }

    /// Flattened render data, 8 values per visible lemming:
    /// x, y, dir, state, timer, fuse seconds (0 = none), flags, index.
    /// flags: 1 = climber, 2 = floater.
    pub fn data(&self) -> Vec<i32> {
        let mut out = Vec::with_capacity(self.lems.len() * 8);
        for (i, l) in self.lems.iter().enumerate() {
            if l.is_gone() {
                continue;
            }
            let fuse = if l.fuse > 0 && l.is_active() { (l.fuse + 59) / 60 } else { 0 };
            let flags = (l.climber as i32) | ((l.floater as i32) << 1);
            out.extend_from_slice(&[l.x, l.y, l.dir, l.state as i32, l.timer, fuse, flags, i as i32]);
        }
        out
    }

    /// Index of the active lemming closest to (x, y), or -1.
    pub fn lemming_at(&self, x: f32, y: f32) -> i32 {
        match self.candidates(x, y).first() {
            Some(&i) => i as i32,
            None => -1,
        }
    }

    /// Gives `skill` to the closest lemming at (x, y) that can take it.
    /// Returns the lemming's index, or -1 if nobody took it.
    pub fn assign(&mut self, x: f32, y: f32, skill: Skill) -> i32 {
        if self.skills[skill as usize] == 0 {
            return -1;
        }
        for i in self.candidates(x, y) {
            let l = &mut self.lems[i];
            let applied = match skill {
                Skill::Climber if !l.climber => {
                    l.climber = true;
                    true
                }
                Skill::Floater if !l.floater => {
                    l.floater = true;
                    true
                }
                Skill::Bomber if l.fuse == 0 => {
                    l.fuse = FUSE;
                    true
                }
                Skill::Blocker if l.can_work() => {
                    l.set_state(LemState::Blocking);
                    true
                }
                Skill::Builder if l.can_work() => {
                    l.set_state(LemState::Building);
                    l.bricks = BRICKS;
                    true
                }
                Skill::Basher if l.can_work() && l.state != LemState::Bashing => {
                    l.set_state(LemState::Bashing);
                    true
                }
                Skill::Miner if l.can_work() && l.state != LemState::Mining => {
                    l.set_state(LemState::Mining);
                    l.steps = 0;
                    true
                }
                Skill::Digger if l.can_work() && l.state != LemState::Digging => {
                    l.set_state(LemState::Digging);
                    true
                }
                _ => false,
            };
            if applied {
                self.skills[skill as usize] -= 1;
                return i as i32;
            }
        }
        -1
    }

    /// Advances all lemmings by one frame. Call once after each
    /// `Universe::tick`.
    pub fn tick(&mut self, u: &mut Universe) {
        self.frame += 1;
        self.release();

        if self.nuking {
            if let Some(l) = self
                .lems
                .iter_mut()
                .find(|l| l.is_active() && l.fuse == 0)
            {
                l.fuse = 1 + 60 * 3;
            }
        }

        let blockers: Vec<(usize, i32, i32)> = self
            .lems
            .iter()
            .enumerate()
            .filter(|(_, l)| l.state == LemState::Blocking)
            .map(|(i, l)| (i, l.x, l.y))
            .collect();

        for i in 0..self.lems.len() {
            let mut l = self.lems[i];
            if l.is_gone() {
                continue;
            }
            self.update(&mut l, i, u, &blockers);
            self.lems[i] = l;
        }
    }
}

// Private game logic.
impl Lemmings {
    fn release(&mut self) {
        if self.nuking || self.released >= self.total {
            return;
        }
        self.release_timer -= 1;
        if self.release_timer > 0 {
            return;
        }
        let interval = ((99 - self.release_rate) as f32 / 2.0 + 4.0) * 3.5;
        self.release_timer = interval as i32;
        self.released += 1;
        self.lems.push(Lemming {
            x: self.entrance_x,
            y: self.entrance_y,
            dir: self.start_dir,
            state: LemState::Falling,
            timer: 0,
            fall: 0,
            bricks: 0,
            fuse: 0,
            steps: 0,
            stuck: 0,
            climber: false,
            floater: false,
        });
    }

    fn candidates(&self, x: f32, y: f32) -> Vec<usize> {
        let mut found: Vec<(f32, usize)> = self
            .lems
            .iter()
            .enumerate()
            .filter(|(_, l)| l.is_active())
            .filter(|(_, l)| {
                let lx = l.x as f32;
                let ly = l.y as f32;
                (x - lx).abs() <= 4.5 && y >= ly - LEM_H as f32 - 2.5 && y <= ly + 3.0
            })
            .map(|(i, l)| {
                let dx = x - l.x as f32;
                let dy = y - (l.y - LEM_H / 2) as f32;
                (dx * dx + dy * dy, i)
            })
            .collect();
        found.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
        found.into_iter().map(|(_, i)| i).collect()
    }

    fn die(&mut self, l: &mut Lemming) {
        l.set_state(LemState::Dead);
        self.dead += 1;
    }

    fn update(&mut self, l: &mut Lemming, index: usize, u: &mut Universe, blockers: &[(usize, i32, i32)]) {
        if !l.is_active() {
            self.animate_exit_or_death(l);
            return;
        }

        if l.fuse > 0 {
            l.fuse -= 1;
            if l.fuse == 0 {
                self.explode(u, l.x, l.y - LEM_H / 2);
                self.die(l);
                return;
            }
        }

        if l.y >= u.height + LEM_H {
            self.die(l);
            return;
        }

        if let Some(death) = hazard(u, l) {
            l.set_state(death);
            return;
        }

        if self.buried(u, l) {
            l.set_state(LemState::Splatting);
            return;
        }

        if self.at_exit(l) {
            l.set_state(LemState::Exiting);
            return;
        }

        l.timer += 1;
        match l.state {
            LemState::Walking => walk(u, l, index, blockers),
            LemState::Falling => fall(u, l),
            LemState::Floating => float(u, l),
            LemState::Climbing => climb(u, l),
            LemState::Blocking => {
                if !solid_at(u, l.x, l.y + 1) {
                    l.set_state(LemState::Falling);
                }
            }
            LemState::Building => build(u, l),
            LemState::Shrugging => {
                if !solid_at(u, l.x, l.y + 1) {
                    l.set_state(LemState::Falling);
                } else if l.timer >= 20 {
                    l.set_state(LemState::Walking);
                }
            }
            LemState::Bashing => bash(u, l),
            LemState::Mining => mine(u, l),
            LemState::Digging => dig(u, l),
            _ => {}
        }
    }

    fn animate_exit_or_death(&mut self, l: &mut Lemming) {
        l.timer += 1;
        let length = match l.state {
            LemState::Exiting => 24,
            LemState::Splatting => 24,
            LemState::Drowning => 40,
            LemState::Burning => 40,
            LemState::Dissolving => 30,
            _ => 0,
        };
        if l.timer < length {
            return;
        }
        if l.state == LemState::Exiting {
            l.set_state(LemState::Saved);
            self.saved += 1;
        } else {
            self.die(l);
        }
    }

    fn at_exit(&self, l: &Lemming) -> bool {
        match l.state {
            LemState::Blocking | LemState::Climbing => false,
            _ => (l.x - self.exit_x).abs() <= 2 && (l.y - self.exit_y).abs() <= 3,
        }
    }

    // Sand (or anything else) that piles onto a lemming pushes it up. If
    // there's no room above, it eventually gets crushed.
    fn buried(&mut self, u: &Universe, l: &mut Lemming) -> bool {
        match l.state {
            LemState::Digging | LemState::Bashing | LemState::Mining | LemState::Climbing => {
                l.stuck = 0;
                return false;
            }
            _ => {}
        }
        if !solid_at(u, l.x, l.y) {
            l.stuck = 0;
            return false;
        }
        if !solid_at(u, l.x, l.y - LEM_H) {
            l.y -= 1;
            l.stuck = 0;
            return false;
        }
        l.stuck += 1;
        l.stuck > BURIED_FRAMES
    }

    fn explode(&mut self, u: &mut Universe, cx: i32, cy: i32) {
        let r = BLAST_RADIUS;
        let crumble = (r + 3) * (r + 3);
        for dx in -(r + 3)..=(r + 3) {
            for dy in -(r + 3)..=(r + 3) {
                let x = cx + dx;
                let y = cy + dy;
                if !in_bounds(u, x, y) {
                    continue;
                }
                let d2 = dx * dx + dy * dy;
                let s = species_at(u, x, y);
                if d2 <= r * r {
                    if !is_steel(s) {
                        let i = u.get_index(x, y);
                        u.cells[i] = EMPTY_CELL;
                        u.burns[i] = Wind {
                            dx: 0,
                            dy: 0,
                            pressure: 80,
                            density: 60,
                        };
                    }
                } else if d2 <= crumble
                    && (s == Species::Dirt || s == Species::Stone)
                    && self.rng.gen_range(0..10) < 4
                {
                    let ra = u.get_cell(x, y).ra;
                    set_cell(u, x, y, Species::Sand, ra);
                }
            }
        }
        for _ in 0..14 {
            let dx = self.rng.gen_range(-r..=r);
            let dy = self.rng.gen_range(-r..=r);
            if dx * dx + dy * dy <= r * r && species_at(u, cx + dx, cy + dy) == Species::Empty {
                let ra = self.rng.gen_range(110..170);
                set_cell(u, cx + dx, cy + dy, Species::Fire, ra);
            }
        }
    }
}

fn hazard(u: &Universe, l: &Lemming) -> Option<LemState> {
    let probes = [
        (0, 0),
        (0, -3),
        (0, -(LEM_H - 2)),
        (-1, -3),
        (1, -3),
    ];
    for &(dx, dy) in probes.iter() {
        match species_at(u, l.x + dx, l.y + dy) {
            Species::Fire | Species::Lava => return Some(LemState::Burning),
            Species::Acid => return Some(LemState::Dissolving),
            _ => {}
        }
    }
    match species_at(u, l.x, l.y - (LEM_H - 3)) {
        Species::Water | Species::Oil => Some(LemState::Drowning),
        _ => None,
    }
}

// Room for a lemming's legs and body. Anything lower than this is a wall,
// so lemmings step up onto a ledge instead of crawling under it.
fn fits(u: &Universe, x: i32, y: i32) -> bool {
    (0..4).all(|k| !solid_at(u, x, y - k))
}

// Walks down gentle slopes instead of falling a cell or two at a time.
fn settle(u: &Universe, l: &mut Lemming) {
    if solid_at(u, l.x, l.y + 1) {
        return;
    }
    for d in 1..=STEP_UP {
        if solid_at(u, l.x, l.y + 1 + d) {
            l.y += d;
            return;
        }
    }
}

fn walk(u: &Universe, l: &mut Lemming, index: usize, blockers: &[(usize, i32, i32)]) {
    if !solid_at(u, l.x, l.y + 1) {
        l.set_state(LemState::Falling);
        return;
    }
    if l.timer % WALK_EVERY != 0 {
        return;
    }
    let nx = l.x + l.dir;
    for &(bi, bx, by) in blockers {
        if bi != index
            && (by - l.y).abs() < LEM_H
            && (nx - bx).abs() <= 3
            && (bx - l.x).signum() == l.dir
        {
            l.dir = -l.dir;
            return;
        }
    }
    match (0..=STEP_UP).find(|&up| fits(u, nx, l.y - up)) {
        Some(up) => {
            l.x = nx;
            l.y -= up;
            settle(u, l);
        }
        None => {
            if l.climber {
                l.set_state(LemState::Climbing);
            } else {
                l.dir = -l.dir;
            }
        }
    }
}

fn fall(u: &Universe, l: &mut Lemming) {
    if solid_at(u, l.x, l.y + 1) {
        if l.fall > FALL_DEATH {
            l.set_state(LemState::Splatting);
        } else {
            l.set_state(LemState::Walking);
        }
        return;
    }
    l.y += 1;
    l.fall += 1;
    if l.floater && l.fall > FLOAT_OPEN {
        l.set_state(LemState::Floating);
    }
}

fn float(u: &Universe, l: &mut Lemming) {
    if solid_at(u, l.x, l.y + 1) {
        l.set_state(LemState::Walking);
        return;
    }
    if l.timer % FLOAT_EVERY == 0 {
        l.y += 1;
    }
}

fn climb(u: &Universe, l: &mut Lemming) {
    if l.timer % CLIMB_EVERY != 0 {
        return;
    }
    if solid_at(u, l.x, l.y - LEM_H) {
        // Bumped into an overhang: let go.
        l.dir = -l.dir;
        l.set_state(LemState::Falling);
        return;
    }
    l.y -= 1;
    if !solid_at(u, l.x + l.dir, l.y) {
        // Over the top.
        l.x += l.dir;
        l.set_state(LemState::Walking);
    }
}

fn build(u: &mut Universe, l: &mut Lemming) {
    if !solid_at(u, l.x, l.y + 1) {
        l.set_state(LemState::Falling);
        return;
    }
    if l.timer % BUILD_EVERY != 0 {
        return;
    }
    for k in 0..6 {
        let x = l.x + l.dir * k;
        if !solid_at(u, x, l.y) {
            set_cell(u, x, l.y, Species::Wood, 150 + (k * 8) as u8);
        }
    }
    l.bricks -= 1;
    let nx = l.x + l.dir * 2;
    let ny = l.y - 1;
    if solid_at(u, nx, ny) || solid_at(u, l.x + l.dir, ny) || solid_at(u, nx, ny - (LEM_H - 1)) {
        l.dir = -l.dir;
        l.set_state(LemState::Walking);
        return;
    }
    l.x = nx;
    l.y = ny;
    if l.bricks <= 0 {
        l.set_state(LemState::Shrugging);
    }
}

fn bash(u: &mut Universe, l: &mut Lemming) {
    if !solid_at(u, l.x, l.y + 1) {
        l.set_state(LemState::Falling);
        return;
    }
    if l.timer % BASH_EVERY != 0 {
        return;
    }
    let mut anything = false;
    for c in 1..=8 {
        for r in 0..LEM_H {
            let s = species_at(u, l.x + l.dir * c, l.y - r);
            if is_solid(s) && !is_steel(s) {
                anything = true;
            }
        }
    }
    if !anything {
        l.set_state(LemState::Walking);
        return;
    }
    for c in 1..=3 {
        for r in 0..LEM_H {
            if is_steel(species_at(u, l.x + l.dir * c, l.y - r)) {
                l.dir = -l.dir;
                l.set_state(LemState::Walking);
                return;
            }
        }
    }
    for c in 1..=3 {
        for r in 0..=LEM_H {
            dig_cell(u, l.x + l.dir * c, l.y - r);
        }
    }
    l.x += l.dir;
    settle(u, l);
}

fn mine(u: &mut Universe, l: &mut Lemming) {
    if l.timer % MINE_EVERY != 0 {
        return;
    }
    let down = if l.steps % 2 == 0 { 1 } else { 0 };
    let nx = l.x + l.dir;
    let ny = l.y + down;
    for c in 0..3 {
        for r in 0..LEM_H {
            if is_steel(species_at(u, nx + l.dir * c, ny - r)) {
                l.dir = -l.dir;
                l.set_state(LemState::Walking);
                return;
            }
        }
    }
    for c in 0..3 {
        for r in 0..LEM_H {
            dig_cell(u, nx + l.dir * c, ny - r);
        }
    }
    l.x = nx;
    l.y = ny;
    l.steps += 1;
    if !solid_at(u, l.x, l.y + 1) {
        l.set_state(LemState::Falling);
    }
}

fn dig(u: &mut Universe, l: &mut Lemming) {
    if l.timer % DIG_EVERY != 0 {
        return;
    }
    let row = l.y + 1;
    if (-1..=1).any(|c| is_steel(species_at(u, l.x + c, row))) {
        l.set_state(LemState::Walking);
        return;
    }
    let diggable = (-2..=2).any(|c| {
        let s = species_at(u, l.x + c, row);
        is_solid(s) && !is_steel(s)
    });
    if !diggable {
        l.set_state(LemState::Falling);
        return;
    }
    for c in -2..=2 {
        dig_cell(u, l.x + c, row);
        // Clear out anything that poured into the hole.
        for r in 0..LEM_H {
            dig_cell(u, l.x + c, l.y - r);
        }
    }
    l.y += 1;
}

#[cfg(test)]
mod tests {
    use super::*;

    fn world() -> Universe {
        let mut u = Universe::new(120, 120);
        u.calm_winds();
        u
    }

    fn run(u: &mut Universe, game: &mut Lemmings, frames: u32) {
        for _ in 0..frames {
            u.tick();
            game.tick(u);
        }
    }

    fn first(game: &Lemmings) -> Lemming {
        game.lems[0]
    }

    #[test]
    fn walks_falls_and_turns_at_walls() {
        let mut u = world();
        u.fill_rect(0, 100, 120, 20, Species::Wall);
        u.fill_rect(80, 60, 5, 40, Species::Wall);
        let mut game = Lemmings::new();
        game.setup(20, 70, 0, 0, 1, 1, 50);
        run(&mut u, &mut game, 120);
        let l = first(&game);
        assert_eq!(l.y, 99, "lands on the floor");
        run(&mut u, &mut game, 400);
        let l = first(&game);
        assert!(l.x < 80, "never walks through the wall");
        assert_eq!(game.dead(), 0);
    }

    #[test]
    fn long_fall_splats_and_floater_survives() {
        for &floater in [false, true].iter() {
            let mut u = world();
            u.fill_rect(0, 110, 120, 10, Species::Wall);
            let mut game = Lemmings::new();
            game.setup(60, 2, 0, 0, 1, 1, 50);
            run(&mut u, &mut game, HATCH_DELAY as u32 + 1);
            if floater {
                game.set_skill_count(Skill::Floater, 1);
                assert!(game.assign(60.0, 0.0, Skill::Floater) >= 0);
            }
            run(&mut u, &mut game, 600);
            assert_eq!(game.dead(), if floater { 0 } else { 1 });
        }
    }

    #[test]
    fn digger_digs_through_dirt() {
        let mut u = world();
        u.fill_rect(0, 110, 120, 10, Species::Wall);
        u.fill_rect(0, 60, 120, 20, Species::Dirt);
        let mut game = Lemmings::new();
        game.setup(60, 50, 0, 0, 1, 1, 50);
        game.set_skill_count(Skill::Digger, 1);
        run(&mut u, &mut game, HATCH_DELAY as u32 + 20);
        let l = first(&game);
        assert_eq!(l.y, 59);
        assert!(game.assign(l.x as f32, 55.0, Skill::Digger) >= 0);
        run(&mut u, &mut game, 400);
        let l = first(&game);
        assert_eq!(l.y, 109, "dug through and landed on the floor");
        assert_eq!(game.dead(), 0);
    }

    #[test]
    fn builder_bridges_a_gap() {
        let mut u = world();
        u.fill_rect(0, 100, 40, 20, Species::Wall);
        u.fill_rect(64, 90, 56, 30, Species::Wall);
        let mut game = Lemmings::new();
        game.setup(10, 90, 100, 89, 1, 1, 50);
        game.set_skill_count(Skill::Builder, 1);
        run(&mut u, &mut game, HATCH_DELAY as u32 + 10);
        // Wait until it nears the edge.
        while first(&game).x < 36 {
            run(&mut u, &mut game, 1);
        }
        let l = first(&game);
        assert!(game.assign(l.x as f32, l.y as f32 - 4.0, Skill::Builder) >= 0);
        run(&mut u, &mut game, 1200);
        assert_eq!(game.saved(), 1);
    }

    #[test]
    fn basher_tunnels_and_stops_at_steel() {
        let mut u = world();
        u.fill_rect(0, 100, 120, 20, Species::Wall);
        u.fill_rect(50, 60, 20, 40, Species::Dirt);
        u.fill_rect(100, 60, 4, 40, Species::Wall);
        let mut game = Lemmings::new();
        game.setup(20, 90, 0, 0, 1, 1, 50);
        game.set_skill_count(Skill::Basher, 1);
        run(&mut u, &mut game, HATCH_DELAY as u32 + 10);
        while game.lems[0].x < 48 {
            run(&mut u, &mut game, 1);
        }
        let l = first(&game);
        assert!(game.assign(l.x as f32, l.y as f32 - 3.0, Skill::Basher) >= 0);
        run(&mut u, &mut game, 300);
        let l = first(&game);
        assert!(l.x > 70 || l.dir == -1, "bashed through the dirt");
        assert_eq!(species_at(&u, 60, 95), Species::Empty);
        assert_eq!(species_at(&u, 60, 70), Species::Dirt);
    }

    #[test]
    fn bomber_blows_a_hole() {
        let mut u = world();
        u.fill_rect(0, 100, 120, 20, Species::Dirt);
        let mut game = Lemmings::new();
        game.setup(60, 90, 0, 0, 1, 1, 50);
        game.set_skill_count(Skill::Bomber, 1);
        run(&mut u, &mut game, HATCH_DELAY as u32 + 10);
        let l = first(&game);
        assert!(game.assign(l.x as f32, l.y as f32 - 3.0, Skill::Bomber) >= 0);
        run(&mut u, &mut game, FUSE as u32 + 2);
        assert_eq!(game.dead(), 1);
        let l = first(&game);
        assert_eq!(species_at(&u, l.x, l.y + 1), Species::Empty);
        assert_eq!(species_at(&u, l.x + 4, l.y + 3), Species::Empty);
    }

    #[test]
    fn lemmings_drown_in_deep_water() {
        let mut u = world();
        u.fill_rect(0, 100, 120, 20, Species::Wall);
        u.fill_rect(0, 85, 120, 15, Species::Water);
        let mut game = Lemmings::new();
        game.setup(60, 40, 0, 0, 1, 1, 50);
        run(&mut u, &mut game, 300);
        assert_eq!(game.dead(), 1);
    }

    #[test]
    fn blocker_turns_others_around() {
        let mut u = world();
        u.fill_rect(0, 100, 120, 20, Species::Wall);
        let mut game = Lemmings::new();
        game.setup(20, 90, 0, 0, 1, 2, 99);
        game.set_skill_count(Skill::Blocker, 1);
        run(&mut u, &mut game, HATCH_DELAY as u32 + 15);
        let l = first(&game);
        assert!(game.assign(l.x as f32, 95.0, Skill::Blocker) >= 0);
        run(&mut u, &mut game, 600);
        assert!(game.lems[1].x < game.lems[0].x);
    }
}
