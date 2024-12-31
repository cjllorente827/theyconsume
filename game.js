import {MoveTowardsPoint} from "./API.js";

const sprite_width = 64;
const sprite_height = 64;

const building_width = 2*sprite_width;
const building_height = 2*sprite_height;

const tile_width = 64;
const tile_height = 64;

const screen_width = 1600;
const screen_height = 900;

const UNLEASH_HORRORS = 1;
const DT = 16.66666667 / 1000;
const DX = 64;

// Experimentally determined Courant value, above which Phaser collision detection 
// reliably fails
const MAX_COURANT_FOR_ARCADE = 0.159999999999999;

const COURANT_SPEED = MAX_COURANT_FOR_ARCADE * DX / DT; // pixels per second
console.log(COURANT_SPEED);
const enemy_speed = (COURANT_SPEED * UNLEASH_HORRORS ?? 250); // pixels per second
const enemy_drift_factor = 0;

const player_speed = 500; // pixels per second

const center = {
    x: screen_width*0.5,
    y: screen_height*0.5,
};

class Arena extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('assets');
        this.loadMap();
        this.loadSprites();

    }

    create ()
    {
        this.createMap();
        

        // this.debug_graphics = this.add.graphics();
        // this.layer.renderDebug(this.debug_graphics);

        this.input.mouse.disableContextMenu();

        this.spawnPlayer();

        this.all_enemies = null;
        //this.spawnEnemies();
        this.UnleashTheHorrors();
        
    }

    update(t, dt){

        this.handlePlayerInput(dt);

        this.AI(dt);
    }


    loadSprites(){
        
        this.load.spritesheet('basic', 'tilesets/maw.png', { frameWidth: sprite_width, frameHeight: sprite_height});
        this.load.spritesheet('player', 'tilesets/player.png', { frameWidth: sprite_width, frameHeight: sprite_height });
        this.load.spritesheet('skeleton', 'tilesets/skeleton.png', { frameWidth: sprite_width, frameHeight: sprite_height });
        this.load.spritesheet('enemy_spawn', 'tilesets/enemy_spawn.png', { frameWidth: building_width, frameHeight: building_height });
        
    }

    loadMap(){
        this.load.image('ground_tiles', 'tilesets/ground_tiles.png');
        this.load.tilemapTiledJSON('map', 'maps/square_fort.json');
    }

    createMap(){
        // const map_width = Math.floor(2*screen_width/tile_width);
        // const map_height = Math.floor(2*screen_height/tile_height);
        this.map = this.make.tilemap({ 
            key: 'map',
            tileWidth: tile_width, tileHeight: tile_height
        });

        this.tileset = this.map.addTilesetImage('ground_tiles');
        this.layer = this.map.createLayer('layer1', this.tileset);
        this.layer.setPosition(-screen_width, -screen_height);

        this.map.setCollision([5]);

        // const ground_tiles = this.map.addTilesetImage('ground_tiles', null, tile_width, tile_height);
        // const rock_tiles = this.map.addTilesetImage('rock_tiles', null,  tile_width, tile_height);

        // const ground_layer = this.map.createBlankLayer('ground_layer', ground_tiles);
        // ground_layer.setPosition(-screen_width, -screen_height);
        // ground_layer.fill(9);
        // //layer.randomize(0, 0, map.width, map.height, [...Array(16).keys()]);

        // this.boundary_layer = this.map.createBlankLayer('boundary_layer', rock_tiles);
        // this.boundary_layer.setPosition(-screen_width, -screen_height);

        // this.boundary_layer.fill(0, 0, 0, map_width, 1); // fill top row of map with rocks
        // this.boundary_layer.fill(0, 0, 0, 1, map_height); // fill left column of map with rocks
        // this.boundary_layer.fill(0, 0, map_height-1, map_width, map_height); // fill bottom row of map with rocks
        // this.boundary_layer.fill(0, map_width-1, 0, map_width, map_height); // fill right column of map with rocks
    }

    UnleashTheHorrors(){

        this.all_enemies = this.add.group();
        

        // Spawn a huge amount of enemies in a circle around the player
        let R = 1000;
        let N = 250;
        let TOOPIE = 2 * Math.PI;
        for (let i=0; i < N; i++){

            let theta = TOOPIE * i/N;
            let x0 = this.player.x;
            let y0 = this.player.y;

            let [x, y] = [
                R*Math.cos(theta) + x0, 
                R*Math.sin(theta) + y0
            ];

            let new_enemy = this.add.sprite(x, y, 'basic');
            this.physics.add.existing(new_enemy);
            this.all_enemies.add (new_enemy);
            
        }

        this.physics.add.collider(
            this.all_enemies, 
            this.layer
        );

        this.physics.add.collider(
            this.all_enemies, 
            this.all_enemies
        );

    }

    spawnEnemies(){


        const basic1 = this.add.sprite(100, 100, 'basic');
        const basic2 = this.add.sprite(screen_width-100, 100, 'basic');
        const basic3 = this.add.sprite(100, screen_height-100, 'basic');
        const basic4 = this.add.sprite(screen_width-100, screen_height-100, 'basic');

        this.all_enemies = this.add.group();
        this.all_enemies.add(basic1);
        this.all_enemies.add(basic2);
        this.all_enemies.add(basic3);
        this.all_enemies.add(basic4);

        for (let enemy of this.all_enemies.getChildren()){
            this.physics.add.existing(enemy);
            
        }

        this.physics.add.collider(
            this.all_enemies, 
            this.layer
        );

        this.physics.add.collider(
            this.all_enemies, 
            this.all_enemies
        );

        this.enemy_spawn = this.add.sprite(500, 500, 'enemy_spawn');
        this.enemy_spawn.setScale(2, 2);
        this.physics.add.existing(this.enemy_spawn);
        this.enemy_spawn.body.setImmovable();

        this.physics.add.collider(
            this.player, 
            this.enemy_spawn
        );

        this.physics.add.collider(
            this.all_enemies, 
            this.enemy_spawn
        );

    }

    spawnPlayer(){
        this.player = this.add.sprite(400, 400, 'player');
        this.physics.add.existing(this.player);

        this.minion = this.add.sprite(500, 400, 'skeleton');
        this.physics.add.existing(this.minion);
        

        // have camera start to follow player
        this.cameras.main.startFollow(this.player, true);

        // turn collision on between the player and boundaries
        this.physics.add.collider(
            this.player, 
            this.layer,
            //() => {console.log("Collision detected")}
        );
    }

    handlePlayerInput(dt){
        const pointer = this.input.activePointer;
        this.player.body.setVelocity(0);
        
        if (pointer.leftButtonDown()){
            pointer.updateWorldPoint(this.cameras.main);
            this.physics.moveTo(this.player, pointer.worldX, pointer.worldY, player_speed )
            
        }
    }

    AI (dt){

        if (this.all_enemies === null) return;

        for (let enemy of this.all_enemies.getChildren()){

            // let distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            let dx = sprite_width;
            this.print_once(`Enemy Courant Number: ${enemy_speed * dt / 1000 / dx}` ); //C = u dt / dx,  dx is 64 pixels, dt is a number in milliseconds

            // Trying to create a rqandomized drift effect with sprites.
            // Collision box follows sprite even though syncBounds is false
            // body.setOffset might work, but not clear what units it uses
            // sprite.setOrigin seems to be 0 to 1 relative to sprite size
            let off_x = Math.random()*enemy_drift_factor;
            let off_y = Math.random()*enemy_drift_factor;
            //enemy.setOrigin(off_x, off_y);
            //enemy.body.setOffset(-off_x, -off_y);
            this.physics.moveTo(enemy, this.player.x, this.player.y, enemy_speed )
            
        }
    }


    print_once(message){
        if(this.has_printed){
            return;
        }

        console.log(message);
        this.has_printed = true;
    }
}

var config = {
    type: Phaser.AUTO,
    width: screen_width,
    height: screen_height,
    parent: "container",
    scene: Arena,
    backgroundColor: "#000",
    physics:{
        default: "arcade",
        arcade: {
            debug: true
        }
    }
};

var game = new Phaser.Game(config);
