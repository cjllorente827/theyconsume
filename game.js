import {MoveTowardsPoint} from "./API.js";

const sprite_width = 64;
const sprite_height = 64;

const screen_width = 1600;
const screen_height = 900;

const enemy_speed = 0.25; // pixels per millisecond
const enemy_drift_factor = 0.8;

const player_speed = 0.3;

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

        // Load a blank map with a 32 x 32 px tile size. This is the base tile size. This means that
        // tiles in the map will be placed on a 32 x 32 px grid.
        const map = this.make.tilemap({ width: screen_width, height: screen_height, tileWidth: 64, tileHeight: 64 });

        // You can also change the base tile size of map like this:
        // map.setBaseTileSize(32, 32);

        // Load a 32 x 64 px tileset. This tileset was designed to allow tiles to overlap vertically, so
        // placing them on a 32 x 32 grid is exactly what we want.
        const tiles = map.addTilesetImage('ground_tiles', null, 64, 64);

        // Create a layer filled with random trees
        const layer = map.createBlankLayer('layer1', tiles);


        layer.randomize(0, 0, map.width, map.height, [...Array(16).keys()]);

        this.input.mouse.disableContextMenu();

        this.spawnPlayer();
        this.spawnEnemies();
        
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
    }

    spawnEnemies(){


        this.basic1 = this.add.sprite(100, 100, 'basic');
        this.basic2 = this.add.sprite(screen_width-100, 100, 'basic');
        this.basic3 = this.add.sprite(100, screen_height-100, 'basic');
        this.basic4 = this.add.sprite(screen_width-100, screen_height-100, 'basic');

        this.basic_pack = this.add.group();
        this.basic_pack.add(this.basic1);
        this.basic_pack.add(this.basic2);
        this.basic_pack.add(this.basic3);
        this.basic_pack.add(this.basic4);

        // give enemies my easy motion function
        for (let enemy of this.basic_pack.getChildren()){
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
        this.player = this.add.sprite(center.x, center.y, 'player');

        // give the player my easy motion function
        this.player.MoveTowardsPoint = MoveTowardsPoint;

        // have camera start to follow player
        this.cameras.main.startFollow(this.player, true);
    }

    handlePlayerInput(dt){
        const pointer = this.input.activePointer;

        if (pointer.leftButtonDown()){
            pointer.updateWorldPoint(this.cameras.main);
            this.player.MoveTowardsPoint(pointer.worldX, pointer.worldY, dt, player_speed);
            console.log(pointer.worldX, pointer.worldY);
            
        }
    }

    AI (dt){

        for (let enemy of this.basic_pack.getChildren()){

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
    backgroundColor: "#333"
};

var game = new Phaser.Game(config);
