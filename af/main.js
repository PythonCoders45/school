const baldiSprites = {
    front: new Image(),
    back:  new Image(), 
    left:  new Image(), 
    right: new Image()  
};

function getBillboardSprite(object, player) {
    // 1. Vector from object to player
    const dx = player.x - object.x;
    const dy = player.y - object.y;

    // 2. Angle from object to player (in degrees)
    let angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);

    // 3. Difference between object's facing direction and angle to player
    let relativeAngle = angleToPlayer - object.facingAngle;

    // Normalize angle between -180 and 180 degrees
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    // 4. Select sprite based on relative angle sector
    if (relativeAngle >= -45 && relativeAngle <= 45) {
        return baldiSprites.front;  // Object is facing the player
    } else if (relativeAngle > 45 && relativeAngle < 135) {
        return baldiSprites.right;  // Showing left side profile
    } else if (relativeAngle < -45 && relativeAngle > -135) {
        return baldiSprites.left;   // Showing right side profile
    } else {
        return baldiSprites.back;   // Showing back
    }
}
