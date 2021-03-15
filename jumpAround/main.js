function Hero(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.checkCollision.up = false;
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2, 3], 8, true);
    this.animations.add('jump', [4]);
    this.animations.add('fall', [5]);
}
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;
Hero.prototype._getAnimationName = function () {
    let name = 'stop';
    if (this.body.velocity.y < 0)
        name = 'jump';
    else if (this.body.velocity.y >= 0 && !this.body.touching.down)
        name = 'fall';
    else if (this.body.velocity.x !== 0 && this.body.touching.down)
        name = 'run';
    return name;
};
Hero.prototype.update = function () {
    let animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
        this.animations.play(animationName);
    }
};
pState = {};
pState.preload = function() {
    this.game.load.image('background', 'assets/background.png');
    this.game.load.json('level1', 'json/level1.json');
    this.game.load.image('ground', 'assets/ground.png');
    this.game.load.image('grass:8x1', 'assets/grass_8x1.png');
    this.game.load.image('grass:6x1', 'assets/grass_6x1.png');
    this.game.load.image('grass:4x1', 'assets/grass_4x1.png');
    this.game.load.image('grass:2x1', 'assets/grass_2x1.png');
    this.game.load.image('grass:1x1', 'assets/grass_1x1.png');
    this.game.load.audio('bgm', ['assets/bgm.mp3', 'assets/src_assets_platformer_audio_bgm.ogg']);
    this.game.load.image('icon:coinIcon', 'assets/coinIcon.png');
    this.game.load.image('font:numbers', 'assets/numbers.png');
    this.game.load.audio('sfx:jump', 'assets/jump.wav');
    this.game.load.spritesheet('coin','assets/coin.png', 22, 22);
    this.game.load.audio('sfx:coin', 'assets/coin.wav');
    this.game.load.audio('sfx:kill', 'assets/kill.wav');
    this.game.load.spritesheet('hero', 'assets/heroSprite1.png', 30, 58);
}
pState._createHud = function(){
    const NUMBERS_STR = '0123456789X ';
    let coin_icon = this.game.make.image(0, 0, 'icon:coinIcon');
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);
    let coin_count = this.game.make.image(coin_icon.x+coin_icon.width, coin_icon.height/2, this.coinFont);
    coin_count.anchor.set(0, 0.5);
    this.floorFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);
    let floor_icon = this.game.make.image(600, 1, 'grass:1x1');
    floor_icon.scale.setTo(0.65, 0.75);
    let floor_count = this.game.make.image(floor_icon.x+floor_icon.width, 2, this.floorFont);

    this.hud = this.game.add.group();
    this.hud.add(coin_count);
    this.hud.add(coin_icon);
    this.hud.add(floor_icon);
    this.hud.add(floor_count);
    this.hud.position.set(10, 50);
};
pState._loadLevel = function (data) {
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    data.platforms.forEach(this._spawnPlatform, this);
    this._spawnCharacters({hero: data.hero});
    data.coins.forEach(this._spawnCoin, this);
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};
pState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(platform.x, platform.y, platform.image);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
};
pState._spawnCharacters = function (data) {
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};
pState.create = function() {
    this.bgtile = this.game.add.tileSprite(0, 0, this.world.width, this.game.cache.getImage('background').height, 'background');
    this._createHud();
    this._loadLevel(this.game.cache.getJSON('level1'));
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin'),
        kill: this.game.add.audio('sfx:kill')
    };
    this.bgm = this.game.add.audio('bgm');
    this.bgm.loopFull();
    this.cameraYMin = 1000000;
    this.platformYMin = 1000000;
}
pState.createPlatforms = function (){
    this.game.platforms = this.game.add.group();
    this.game.platforms.enableBody = true;
}
pState.init = function () {
    this.game.renderer.renderSession.roundPixels = true;
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.SPACEBAR
    });
    this.keys.up.onDown.add(function () {
        var jumpFlag = this.hero.jump();
        if (jumpFlag)
            this.sfx.jump.play();
    }, this);
    this.coinsPickedUp = 0;
    this.floorsTravelled = 0;
};
Hero.prototype.jump = function () {
    const JUMP_SPEED = 650;
    if(this.body.touching.down)
        this.body.velocity.y = -JUMP_SPEED;
    return this.body.touching.down;
};
pState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
};
pState.update = function () {
    // this.bgtile.tilePosition.y -= 1;
    this.coinFont.text = `x${this.coinsPickedUp}`;
    this.floorFont.text = `x${this.floorsTravelled}`;
    this.bgtile.y = this.camera.y;
    this.hud.position.y = this.camera.y + 10;
    this.world.setBounds( 0, -this.hero.yChange, this.world.width, this.game.height + this.hero.yChange );
    this.cameraYMin = Math.min( this.cameraYMin, this.hero.y - this.game.height + 105 );
    this.camera.y = this.cameraYMin;
    this._handleCollisions();
    this._handleInput();
    this.platforms.forEachAlive( function( elem ) {
      this.platformYMin = Math.min( this.platformYMin, elem.y );
      if( elem.y > this.camera.y + this.game.height && elem.x!=0) {
        console.log(elem.image);
        elem.kill();
        var plat = this.platforms.getFirstDead();
        plat.reset( Math.max(2, this.rnd.integerInRange( 2, this.world.width - 50 )-40), this.platformYMin - 130);
        plat.body.immovable = true;
        this.floorsTravelled++;
        }
    }, this );
    this._heroAlive();
};
pState._heroAlive = function() {
    if(this.hero.y>this.cameraYMin+this.game.height && this.hero.alive){
        this.sfx.kill.play();
        this.game.state.restart(true);
    }
};
pState._handleInput = function () {
    const SPEED = 500;
    if (this.keys.left.isDown) {
        this.hero.body.velocity.x = -1*SPEED;
    }
    else if (this.keys.right.isDown) { 
        this.hero.body.velocity.x = SPEED;
    }
    else {
        this.hero.body.velocity.x = 0;
    }
    if (this.hero.body.velocity.x < 0) {
        this.hero.scale.x = -1;
    }
    else if (this.hero.body.velocity.x > 0) {
        this.hero.scale.x = 1;
    }
};
pState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true);
    sprite.animations.play('rotate');
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};
pState._onHeroVsCoin = function (hero, coin) {
    this.sfx.coin.play();
    coin.kill();
    this.coinsPickedUp++;
};
pState.shutdown = function () {
    this.bgm.stop();
};
window.onload = function() {
    let game = new Phaser.Game(720, 720, Phaser.AUTO, 'game')
    game.state.add('play', pState);
    game.state.start('play');
}