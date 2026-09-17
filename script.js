"use strict";

/*
=========================================================
 LEGENDS OF BARANGAY
 ORIGINAL BROWSER MOBA
=========================================================
*/

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const miniCanvas =
    document.getElementById("miniCanvas");

const mini =
    miniCanvas.getContext("2d");


/* =========================
   RESOLUTION
========================= */

let W = 0;
let H = 0;

function resize() {

    W =
        canvas.width =
        window.innerWidth *
        Math.min(
            window.devicePixelRatio,
            2
        );

    H =
        canvas.height =
        window.innerHeight *
        Math.min(
            window.devicePixelRatio,
            2
        );

    canvas.style.width =
        window.innerWidth + "px";

    canvas.style.height =
        window.innerHeight + "px";

    miniCanvas.width = 300;
    miniCanvas.height = 300;

}

window.addEventListener(
    "resize",
    resize
);

resize();


/* =========================
   GAME CONSTANTS
========================= */

const MAP_W = 4200;
const MAP_H = 4200;

const BLUE = 0;
const RED = 1;

let running = false;

let lastTime = performance.now();

let gameTime = 0;

let blueKills = 0;
let redKills = 0;


/* =========================
   CAMERA
========================= */

const camera = {

    x: MAP_W / 2,

    y: MAP_H / 2,

    shake: 0

};


/* =========================
   INPUT
========================= */

const keys = {};

let mouse = {

    x: 0,
    y: 0,

    down: false

};


window.addEventListener(
    "keydown",
    e => {

        keys[e.code] = true;

        if (
            e.code === "Space"
        )
            basicAttack();

        if (
            e.code === "KeyQ"
        )
            useSkill(0);

        if (
            e.code === "KeyW"
        )
            useSkill(1);

        if (
            e.code === "KeyE"
        )
            useSkill(2);

        if (
            e.code === "KeyR"
        )
            useSkill(3);

    }
);


window.addEventListener(
    "keyup",
    e => {

        keys[e.code] = false;

    }
);


canvas.addEventListener(
    "mousemove",
    e => {

        mouse.x =
            e.clientX;

        mouse.y =
            e.clientY;

    }
);


canvas.addEventListener(
    "mousedown",
    e => {

        if (
            e.button === 0
        ) {

            mouse.down = true;

            basicAttack();

        }

    }
);


window.addEventListener(
    "mouseup",
    e => {

        if (
            e.button === 0
        )
            mouse.down = false;

    }
);


/* =========================
   UTILITY
========================= */

function distance(
    a,
    b
) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function random(
    min,
    max
) {

    return (
        Math.random() *
        (max - min)
    ) + min;

}


function angleTo(
    a,
    b
) {

    return Math.atan2(
        b.y - a.y,
        b.x - a.x
    );

}


/* =========================
   PARTICLES
========================= */

const particles = [];


function particle(
    x,
    y,
    color,
    size = 5,
    life = .6
) {

    particles.push({

        x,
        y,

        vx: random(-100,100),

        vy: random(-100,100),

        size,

        life,

        maxLife: life,

        color

    });

}


function burst(
    x,
    y,
    color,
    amount = 15
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        particle(
            x,
            y,
            color,
            random(2,7),
            random(.3,.8)
        );

    }

}


/* =========================
   DAMAGE NUMBERS
========================= */

const numbers = [];


function damageNumber(
    x,
    y,
    amount,
    color = "#fff"
) {

    numbers.push({

        x,
        y,

        amount:
            Math.round(amount),

        life: 1,

        color

    });

}


/* =========================
   PLAYER
========================= */

const player = {

    x: 700,

    y: MAP_H / 2,

    radius: 32,

    speed: 380,

    hp: 1000,

    maxHp: 1000,

    mana: 500,

    maxMana: 500,

    level: 1,

    xp: 0,

    gold: 500,

    attackDamage: 100,

    attackRange: 230,

    attackCooldown: 0,

    dead: false,

    respawn: 0,

    kills: 0,

    deaths: 0,

    skills: [

        {
            cooldown: 0,
            max: 4
        },

        {
            cooldown: 0,
            max: 7
        },

        {
            cooldown: 0,
            max: 9
        },

        {
            cooldown: 0,
            max: 35
        }

    ]

};


/* =========================
   UNITS
========================= */

const units = [];


/*
Create a minion
*/

function createMinion(
    team,
    x,
    y,
    type
) {

    units.push({

        kind: "minion",

        team,

        x,
        y,

        radius:
            type === "tank"
                ? 22
                : 16,

        hp:
            type === "tank"
                ? 700
                : 350,

        maxHp:
            type === "tank"
                ? 700
                : 350,

        damage:
            type === "tank"
                ? 55
                : 35,

        speed:
            type === "tank"
                ? 65
                : 85,

        range:
            type === "ranged"
                ? 230
                : 75,

        type,

        attackCooldown:
            random(.2,1),

        lane: "mid"

    });

}


/*
Enemy hero
*/

const enemyHero = {

    kind: "hero",

    team: RED,

    x: MAP_W - 700,

    y: MAP_H / 2,

    radius: 34,

    hp: 1100,

    maxHp: 1100,

    damage: 115,

    speed: 230,

    range: 250,

    attackCooldown: 0,

    dead: false,

    respawn: 0

};


/* =========================
   TOWERS
========================= */

const towers = [];


function createTower(
    team,
    x,
    y
) {

    towers.push({

        team,

        x,
        y,

        radius: 52,

        hp: 2500,

        maxHp: 2500,

        range: 550,

        attackCooldown: 0

    });

}


function createBase(
    team,
    x,
    y
) {

    towers.push({

        team,

        x,
        y,

        radius: 100,

        hp: 6000,

        maxHp: 6000,

        range: 600,

        attackCooldown: 0,

        base: true

    });

}


/* =========================
   JUNGLE
========================= */

const jungle = [];


function createJungle() {

    for (
        let i = 0;
        i < 14;
        i++
    ) {

        const side =
            i % 2 === 0
                ? 1
                : -1;

        jungle.push({

            x:
                MAP_W / 2 +
                random(400,1300) *
                side,

            y:
                random(
                    500,
                    MAP_H - 500
                ),

            r:
                random(35,65),

            hp: 900,

            maxHp: 900,

            alive: true,

            respawn: 0

        });

    }

}


/* =========================
   MAP
========================= */

function drawMap() {

    /*
    Grass
    */

    ctx.fillStyle =
        "#17382b";

    ctx.fillRect(
        0,
        0,
        MAP_W,
        MAP_H
    );


    /*
    Subtle grass grid
    */

    ctx.globalAlpha = .1;

    ctx.strokeStyle =
        "#79b38b";

    ctx.lineWidth = 2;

    for (
        let x = 0;
        x < MAP_W;
        x += 120
    ) {

        ctx.beginPath();

        ctx.moveTo(x,0);

        ctx.lineTo(x,MAP_H);

        ctx.stroke();

    }


    for (
        let y = 0;
        y < MAP_H;
        y += 120
    ) {

        ctx.beginPath();

        ctx.moveTo(0,y);

        ctx.lineTo(MAP_W,y);

        ctx.stroke();

    }

    ctx.globalAlpha = 1;


    /*
    River
    */

    ctx.fillStyle =
        "#123d52";

    ctx.beginPath();

    ctx.moveTo(
        MAP_W / 2 - 280,
        0
    );

    ctx.bezierCurveTo(
        MAP_W / 2 + 200,
        900,
        MAP_W / 2 - 300,
        1500,
        MAP_W / 2 + 220,
        2100
    );

    ctx.bezierCurveTo(
        MAP_W / 2 + 400,
        2800,
        MAP_W / 2 - 100,
        3500,
        MAP_W / 2 + 200,
        MAP_H
    );

    ctx.lineTo(
        MAP_W / 2 + 500,
        MAP_H
    );

    ctx.bezierCurveTo(
        MAP_W / 2 + 400,
        3500,
        MAP_W / 2 + 650,
        2800,
        MAP_W / 2 + 480,
        2100
    );

    ctx.bezierCurveTo(
        MAP_W / 2 + 100,
        1400,
        MAP_W / 2 + 600,
        700,
        MAP_W / 2 + 100,
        0
    );

    ctx.closePath();

    ctx.fill();


    /*
    Lanes
    */

    drawLane(
        700,
        MAP_H / 2,
        MAP_W - 700,
        MAP_H / 2
    );


    drawLane(
        700,
        700,
        MAP_W - 700,
        MAP_H - 700
    );


    drawLane(
        700,
        MAP_H - 700,
        MAP_W - 700,
        700
    );


    /*
    Base circles
    */

    drawBaseArea(
        500,
        MAP_H / 2,
        "#1e91bd"
    );


    drawBaseArea(
        MAP_W - 500,
        MAP_H / 2,
        "#c43f57"
    );

}


function drawLane(
    x1,
    y1,
    x2,
    y2
) {

    ctx.lineCap =
        "round";

    ctx.lineWidth =
        170;

    ctx.strokeStyle =
        "#354d3e";

    ctx.beginPath();

    ctx.moveTo(
        x1,
        y1
    );

    ctx.lineTo(
        x2,
        y2
    );

    ctx.stroke();


    ctx.lineWidth =
        130;

    ctx.strokeStyle =
        "#425946";

    ctx.stroke();

}


function drawBaseArea(
    x,
    y,
    color
) {

    const g =
        ctx.createRadialGradient(
            x,
            y,
            10,
            x,
            y,
            500
        );

    g.addColorStop(
        0,
        color + "66"
    );

    g.addColorStop(
        1,
        color + "00"
    );

    ctx.fillStyle = g;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        500,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================
   DECORATION
========================= */

function drawTrees() {

    /*
    deterministic-ish tree grid
    */

    for (
        let x = 100;
        x < MAP_W;
        x += 180
    ) {

        for (
            let y = 100;
            y < MAP_H;
            y += 180
        ) {

            const dx =
                Math.abs(
                    x -
                    MAP_W / 2
                );

            const dy =
                Math.abs(
                    y -
                    MAP_H / 2
                );

            if (
                dx < 500 ||
                dy < 350
            )
                continue;


            if (
                (
                    x * 17 +
                    y * 13
                ) % 7
                >
                2
            )
                continue;


            drawTree(
                x,
                y
            );

        }

    }

}


function drawTree(
    x,
    y
) {

    ctx.fillStyle =
        "#4b3323";

    ctx.fillRect(
        x - 7,
        y,
        14,
        45
    );


    const g =
        ctx.createRadialGradient(
            x - 8,
            y - 20,
            5,
            x,
            y,
            60
        );

    g.addColorStop(
        0,
        "#3c9a5c"
    );

    g.addColorStop(
        1,
        "#0c3723"
    );

    ctx.fillStyle = g;

    ctx.beginPath();

    ctx.arc(
        x,
        y - 25,
        43,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.globalAlpha = .2;

    ctx.fillStyle =
        "#b5ffd0";

    ctx.beginPath();

    ctx.arc(
        x - 12,
        y - 38,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;

}


/* =========================
   CREATE WORLD
========================= */

function createWorld() {

    createBase(
        BLUE,
        500,
        MAP_H / 2
    );

    createBase(
        RED,
        MAP_W - 500,
        MAP_H / 2
    );


    /*
    towers
    */

    const positions = [
        [BLUE,1100,MAP_H/2],
        [BLUE,1800,MAP_H/2],

        [RED,3100,MAP_H/2],
        [RED,2400,MAP_H/2],

        [BLUE,1150,1150],
        [RED,3050,3050],

        [BLUE,1150,3050],
        [RED,3050,1150]
    ];


    positions.forEach(
        p =>
            createTower(
                p[0],
                p[1],
                p[2]
            )
    );


    createJungle();


    /*
    initial waves
    */

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        createMinion(
            BLUE,
            650 + i * 50,
            MAP_H / 2 +
            random(-35,35),
            i === 2
                ? "tank"
                : "melee"
        );

        createMinion(
            RED,
            MAP_W - 650 -
            i * 50,
            MAP_H / 2 +
            random(-35,35),
            i === 2
                ? "tank"
                : "melee"
        );

    }

}


/* =========================
   SPAWN WAVES
========================= */

let waveTimer = 8;


function spawnWave() {

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        createMinion(
            BLUE,
            650 + i * 48,
            MAP_H / 2 +
            random(-35,35),
            i === 2
                ? "tank"
                : i === 4
                    ? "ranged"
                    : "melee"
        );


        createMinion(
            RED,
            MAP_W - 650 -
            i * 48,
            MAP_H / 2 +
            random(-35,35),
            i === 2
                ? "tank"
                : i === 4
                    ? "ranged"
                    : "melee"
        );

    }

}


/* =========================
   START
========================= */

document.getElementById(
    "startGame"
).onclick =
    start;


function start() {

    document.getElementById(
        "menu"
    ).style.display =
        "none";


    document.getElementById(
        "game"
    ).style.display =
        "block";


    running = true;

    lastTime =
        performance.now();

    requestAnimationFrame(
        loop
    );

}


/* =========================
   PLAYER MOVEMENT
========================= */

function updatePlayer(
    dt
) {

    if (
        player.dead
    )
        return;


    let dx = 0;
    let dy = 0;


    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    )
        dy -= 1;


    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    )
        dy += 1;


    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    )
        dx -= 1;


    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    )
        dx += 1;


    const len =
        Math.hypot(
            dx,
            dy
        );


    if (
        len
    ) {

        dx /= len;

        dy /= len;

        player.x +=
            dx *
            player.speed *
            dt;

        player.y +=
            dy *
            player.speed *
            dt;

    }


    player.x =
        clamp(
            player.x,
            100,
            MAP_W - 100
        );


    player.y =
        clamp(
            player.y,
            100,
            MAP_H - 100
        );


    /*
    automatic attack
    */

    player.attackCooldown -=
        dt;


    if (
        mouse.down
    )
        basicAttack();


    /*
    mana regeneration
    */

    player.mana =
        clamp(
            player.mana +
            15 * dt,
            0,
            player.maxMana
        );

}


/* =========================
   BASIC ATTACK
========================= */

function basicAttack() {

    if (
        !running ||
        player.dead ||
        player.attackCooldown > 0
    )
        return;


    player.attackCooldown =
        .55;


    /*
    Target nearest enemy
    */

    const target =
        findEnemyTarget(
            player.attackRange
        );


    if (!target)
        return;


    dealDamage(
        target,
        player.attackDamage
    );


    createProjectile(
        player,
        target,
        "#ffe18a",
        player.attackDamage
    );

}


/* =========================
   FIND TARGET
========================= */

function findEnemyTarget(
    range
) {

    let target = null;

    let best =
        Infinity;


    /*
    Enemy hero
    */

    if (
        !enemyHero.dead
    ) {

        const d =
            distance(
                player,
                enemyHero
            );

        if (
            d < range &&
            d < best
        ) {

            best = d;

            target = enemyHero;

        }

    }


    /*
    units
    */

    for (
        const u of units
    ) {

        if (
            u.team === BLUE
        )
            continue;

        const d =
            distance(
                player,
                u
            );

        if (
            d < range &&
            d < best
        ) {

            best = d;

            target = u;

        }

    }


    return target;

}


/* =========================
   PROJECTILES
========================= */

const projectiles = [];


function createProjectile(
    from,
    to,
    color,
    damage
) {

    projectiles.push({

        x: from.x,

        y: from.y,

        target: to,

        speed: 900,

        color,

        damage,

        life: 1.5

    });

}


function updateProjectiles(
    dt
) {

    for (
        let i =
            projectiles.length - 1;

        i >= 0;

        i--
    ) {

        const p =
            projectiles[i];


        if (
            !p.target ||
            p.target.dead
        ) {

            projectiles.splice(
                i,
                1
            );

            continue;

        }


        const angle =
            angleTo(
                p,
                p.target
            );


        p.x +=
            Math.cos(angle) *
            p.speed *
            dt;


        p.y +=
            Math.sin(angle) *
            p.speed *
            dt;


        p.life -= dt;


        if (
            distance(
                p,
                p.target
            ) <
            p.target.radius + 10
        ) {

            dealDamage(
                p.target,
                p.damage
            );


            burst(
                p.x,
                p.y,
                p.color,
                8
            );


            projectiles.splice(
                i,
                1
            );

        }

    }

}


/* =========================
   SKILLS
========================= */

function useSkill(
    index
) {

    if (
        player.dead
    )
        return;


    const skill =
        player.skills[index];


    if (
        skill.cooldown > 0
    )
        return;


    /*
    mana
    */

    const costs = [
        60,
        90,
        100,
        200
    ];


    if (
        player.mana <
        costs[index]
    )
        return;


    player.mana -=
        costs[index];


    skill.cooldown =
        skill.max;


    /*
    Q — lightning
    */

    if (
        index === 0
    ) {

        const target =
            findEnemyTarget(
                650
            );


        if (!target)
            return;


        dealDamage(
            target,
            260 +
            player.level * 35
        );


        burst(
            target.x,
            target.y,
            "#70ddff",
            30
        );


        camera.shake =
            12;

    }


    /*
    W — fire explosion
    */

    if (
        index === 1
    ) {

        const target =
            findEnemyTarget(
                500
            );


        if (!target)
            return;


        for (
            const u of units
        ) {

            if (
                u.team === RED &&
                distance(
                    target,
                    u
                ) < 220
            ) {

                dealDamage(
                    u,
                    220 +
                    player.level * 25
                );

            }

        }


        if (
            !enemyHero.dead &&
            distance(
                target,
                enemyHero
            ) < 220
        ) {

            dealDamage(
                enemyHero,
                300 +
                player.level * 30
            );

        }


        explosion(
            target.x,
            target.y,
            "#ff773d"
        );


        camera.shake =
            18;

    }


    /*
    E — shield/heal
    */

    if (
        index === 2
    ) {

        player.hp =
            Math.min(
                player.maxHp,
                player.hp +
                320 +
                player.level * 50
            );


        burst(
            player.x,
            player.y,
            "#5affbd",
            30
        );

    }


    /*
    R — ultimate meteor
    */

    if (
        index === 3
    ) {

        const target =
            findEnemyTarget(
                900
            );


        if (!target)
            return;


        setTimeout(
            () => {

                explosion(
                    target.x,
                    target.y,
                    "#d47cff",
                    300
                );


                for (
                    const u of units
                ) {

                    if (
                        u.team === RED &&
                        distance(
                            target,
                            u
                        ) <
                        300
                    ) {

                        dealDamage(
                            u,
                            650 +
                            player.level * 80
                        );

                    }

                }


                if (
                    !enemyHero.dead &&
                    distance(
                        target,
                        enemyHero
                    ) <
                    300
                ) {

                    dealDamage(
                        enemyHero
