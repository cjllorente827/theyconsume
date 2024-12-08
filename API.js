export function MoveTowardsPoint(x, y, dt, speed=-1){

    if (speed > 0){
        this.speed = speed;
    }

    let path_vector = new Phaser.Math.Vector2(
        x - this.x, 
        y - this.y
    );

    let unit = path_vector.normalize();

    let vel_x = this.speed * unit.x;
    let vel_y = this.speed * unit.y;

    this.x += vel_x * dt;
    this.y += vel_y * dt;

    

}