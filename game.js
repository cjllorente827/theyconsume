import {MoveTowardsPoint} from "./API.js";

const sprite_width = 64;
const sprite_height = 64;

const tile_width = 64;
const tile_height = 64;

const screen_width = 1600;
const screen_height = 900;

const enemy_speed = 0.25; // pixels per millisecond
const enemy_drift_factor = 0.8;

const player_speed = 1000 * 0.5; // pixels per millisecond

const center = {
    x: screen_width*0.5,
    y: screen_height*0.5,
};

class Arena extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('assets/tilesets');
        this.loadMapTiles();
        this.loadSprites();
    }

    create ()
    {

        const map_width = Math.floor(2*screen_width/tile_width);
        const map_height = Math.floor(2*screen_height/tile_height);
        this.map = this.make.tilemap({ 
            width: map_width, 
            height: map_height, 
            tileWidth: tile_width, tileHeight: tile_height 
        });

        const ground_tiles = this.map.addTilesetImage('ground_tiles', null, tile_width, tile_height);
        const rock_tiles = this.map.addTilesetImage('rock_tiles', null,  tile_width, tile_height);

        const ground_layer = this.map.createBlankLayer('ground_layer', ground_tiles);
        ground_layer.setPosition(-screen_width, -screen_height);
        ground_layer.fill(9);
        //layer.randomize(0, 0, map.width, map.height, [...Array(16).keys()]);

        this.boundary_layer = this.map.createBlankLayer('boundary_layer', rock_tiles);
        this.boundary_layer.setPosition(-screen_width, -screen_height);

        this.boundary_layer.fill(0, 0, 0, map_width, 1); // fill top row of map with rocks
        this.boundary_layer.fill(0, 0, 0, 1, map_height); // fill left column of map with rocks
        this.boundary_layer.fill(0, 0, map_height-1, map_width, map_height); // fill bottom row of map with rocks
        this.boundary_layer.fill(0, map_width-1, 0, map_width, map_height); // fill right column of map with rocks
        
        //this.map.setCollisionByExclusion([0], false);

        //this.physics.add.existing(this.boundary_layer);
        this.map.setCollision([0]);

        this.debug_graphics = this.add.graphics();
        //this.boundary_layer.renderDebug(this.debug_graphics);

        this.input.mouse.disableContextMenu();

        this.spawnPlayer();

        this.all_enemies = null;
        //this.spawnEnemies();
        
    }

    update(t, dt){

        this.handlePlayerInput(dt);

        this.AI(dt);
    }


    loadSprites(){
        
        this.load.spritesheet('basic', 'maw.png', { frameWidth: sprite_width, frameHeight: sprite_height});
        this.load.spritesheet('player', 'player.png', { frameWidth: sprite_width, frameHeight: sprite_height });
        // this.load.spritesheet('tank', 'enemy_tank.png', { frameWidth: sprite_width, frameHeight: sprite_height });
        // this.load.spritesheet('mage', 'enemy_mage.png', { frameWidth: sprite_width, frameHeight: sprite_height });
        // this.load.spritesheet('healer', 'enemy_healer.png', { frameWidth: sprite_width, frameHeight: sprite_height });
        
    }

    loadMapTiles(){
        this.load.image('ground_tiles', 'ground_tiles.png');
        this.load.image('rock_tiles', 'rock_tile.png');
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

        // give enemies my easy motion function
        for (let enemy of this.all_enemies.getChildren()){
            enemy.MoveTowardsPoint = MoveTowardsPoint;
        }

        // this.basic_pack = this.add.group({
        //     classType: Phaser.GameObjects.Sprite, 
        //     key: 'basic', 
        //     frame: 0, 
        //     repeat: 10, 
        //     setXY: { 
        //         x: 500, 
        //         y: 100, 
        //         stepX: 0, 
        //         stepY: 100
        //     } 
        // });

        // const tank_mage_pack = this.add.group([
        //     { 
        //         classType: Phaser.GameObjects.Sprite, 
        //         key: 'tank', frame: 0, repeat: 10, 
        //         setXY: { x: 100, y: 170, stepX: 70 } 
        //     },
        //     { classType: Phaser.GameObjects.Sprite, 
        //         key: 'mage', frame: 0, repeat: 10, 
        //         setXY: { x: 100, y: 170 + 70, stepX: 70 } 
        //     }
        // ]);

        

    }

    spawnPlayer(){
        this.player = this.add.sprite(0, 0, 'player');

        // give the player my easy motion function
        this.player.MoveTowardsPoint = MoveTowardsPoint;

        // have camera start to follow player
        this.cameras.main.startFollow(this.player, true);

        // turn physics on for the player
        this.physics.add.existing(this.player);

        // turn collision on between the player and boundaries
        this.physics.add.collider(
            this.player, 
            this.boundary_layer,
            //() => {console.log("Collision detected")}
        );
    }

    handlePlayerInput(dt){
        const pointer = this.input.activePointer;
        this.player.body.setVelocity(0);
        

        if (pointer.leftButtonDown()){
            pointer.updateWorldPoint(this.cameras.main);
            this.player.MoveTowardsPoint(pointer.worldX, pointer.worldY, dt, player_speed);
            // this.physics.moveTo(
            //     this.player, 
            //     pointer.worldX, pointer.worldY,
            //     player_speed
            // )
            
        }
    }

    AI (dt){

        if (this.all_enemies === null) return;

        for (let enemy of this.all_enemies.getChildren()){

            let distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (distance > sprite_width) {

                enemy.MoveTowardsPoint(this.player.x, this.player.y, dt, enemy_speed);
            }

            // add some random drift to enemy motion
            enemy.x += (2*Math.random() - 1) * enemy_speed * enemy_drift_factor ;
            enemy.y += (2*Math.random() - 1) * enemy_speed * enemy_drift_factor ;
        }
    }
}

var config = {
    type: Phaser.AUTO,
    width: screen_width,
    height: screen_height,
    parent: "container",
    pixelArt: true,
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
