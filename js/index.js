/*
    面向对象编写
 */

/* 先声明一些全局变量 */
var sw=20,  //一个方块的宽度
    sh=20,  //一个方块的高度
    tr=30, //行数
    td=30;  //列数

var snake = null, //蛇的实例
    food = null,  //食物的实例
    game = null;  //游戏的实例


/* 
 *   方块构造函数
 *   @param: (x,y)表示小方块的坐标；classname表示每个小方块的样式
 *   用途：创建蛇头、蛇身、小食物
*/
function Square(x,y,classname) {
    /**
     *   用户传入    实际坐标
     *   0,0          0,0
     *   0,1          0,20
     *   1,0          20,0
     *   1,1          20,20
     *   2,0          40,0
     *         ……
     */
    this.x = x * sw;
    this.y = y * sh;
    this.class = classname;

    //每一个小方块对应的DOM元素
    this.viewContent = document.createElement('div');
    //为该DOM元素添加样式 
    this.viewContent.className = this.class;  
    //获取#snakeWrap(蛇的父级)，作为方块的父级
    this.parent = document.getElementById('snakeWrap');
}
/* 创建方块DOM，并添加到页面里 */
Square.prototype.create = function() {   
    this.viewContent.style.position = 'absolute';
    this.viewContent.style.width = sw + 'px';
    this.viewContent.style.height = sh + 'px';
    this.viewContent.style.left = this.x + 'px';
    this.viewContent.style.top = this.y + 'px';

    // 作为#snakeWrap的子元素添加到页面中
    this.parent.appendChild(this.viewContent);
}
/* 移除方块(移动蛇、苹果) */
Square.prototype.remove = function() {
    this.parent.removeChild(this.viewContent);
}


/**
 * 蛇的构造函数(面向对象思想)
 */
function Snake() {
    this.head = null;  //存一下蛇头的信息
    this.tail = null;  //存一下蛇尾的信息

    // 存储蛇身上每一个方块的位置，
    this.pos = [];  //二维数组，从蛇头到蛇尾：[[5,0], [4,0], [3,0],……]

    // 存储蛇走的方向，用一个对象来表示
    this.directionNum = {
        left: {
            x: -1,
            y: 0,
            rotate: 180  //蛇头在不同的方向中应该进行旋转，要不始终是向右
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90
        }
    }
}
/* 初始化一条蛇 */
Snake.prototype.init = function() {
    // 创建蛇头
    var snakeHead = new Square(2,0,'snakeHead');
    // 蛇头(方块类实例)继承了原型的create方法，调用它将蛇头放到页面中
    snakeHead.create();
    // 存储蛇头信息
    this.head = snakeHead;
    // 把蛇头的位置存起来
    this.pos.push([2,0]);

    // 创建蛇身体1
    var snakeBody1 = new Square(1,0,'snakeBody');
    snakeBody1.create();
    this.pos.push([1,0]);

    // 创建蛇身体2
    var snakeBody2 = new Square(0,0,'snakeBody');
    snakeBody2.create();
    this.tail = snakeBody2;  //存储蛇尾
    this.pos.push([0,0]);

    // 形成链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1;

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    // 给蛇添加一条属性，用来表示蛇走的方向
    this.direction = this.directionNum.right;    //默认让蛇往右走
}
/* 获取蛇头下一个位置对应的元素，要根据元素做不同的事情 */
Snake.prototype.getNextPos = function() {
    var nextPos = [
        this.head.x/sw + this.direction.x,   //存储时使用用户坐标: (1,1)这种
        this.head.y/sh + this.direction.y   
    ];

    // 1、下个点是自己，代表撞到了自己，游戏结束
    var selfCollied = false;  //是否撞到了自己，默认不是
    this.pos.forEach(function(value) {
        if(value[0] == nextPos[0] && value[1] == nextPos[1]) {   //不能用value == nextPos，因为两个是数组，既要比较值，还要比较地址，这两个地址永远不相等
            // 如果数组中的两个值都相等，就说明下一个点在蛇身上能找到，代表撞到自己了
            selfCollied = true;
        }
    });
    if(selfCollied) {
        console.log("撞到自己了!");
        this.strategies.die.call(this);

        // return有两个作用，一个是阻止函数继续往下走；二是决定函数返回值是什么(如果什么都没有，返回undefined)。
        return;     
    }

    // 2、下个点是围墙，代表撞到了围墙，游戏结束
    if(nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td - 1 || nextPos[1] > tr - 1) {
        console.log("撞墙了!");
        this.strategies.die.call(this);

        return;
    }

    // 3、下个点是食物，吃
    if(food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
        console.log("吃");
        this.strategies.eat.call(this);

        return;
    }

    // 4、下个点什么都不是，走
    this.strategies.move.call(this);   //call()函数： 改变this指向，本来是指向this.strategies，现在改成指向Snake实例
}
/* 处理碰撞后要做的事 */
Snake.prototype.strategies = {
    move: function(format) {   //这个参数用于决定要不要删除最后一个方块(蛇尾)，当传了这个参数后表示吃
        // this是：谁调用的这个方法，this就指向谁。
        // 通过move.call()函数传入Snake实例对象，现在this指向已经改变

        // 创建新身体(在旧蛇头的位置)
        var newBody = new Square(this.head.x/sw, this.head.y/sh, 'snakeBody');
        // 更新链表的关系
        newBody.next = this.head.next;
        newBody.next.last = newBody;
        newBody.last = null;

        this.head.remove();  //把旧蛇头从原来的位置删除
        newBody.create();    //将新身体加入页面

        // 创建新蛇头(蛇头下一个要走到的点)
        var newHead = new Square(this.head.x/sw + this.direction.x,this.head.y/sh + this.direction.y,'snakeHead');
        // 更新链表的关系
        newHead.next = newBody;
        newHead.last = null;
        newBody.last = newHead;
        
        // 根据行进方向，旋转蛇头
        newHead.viewContent.style.transform = 'rotate(' + this.direction.rotate + 'deg)';

        newHead.create();   //将新蛇头加入页面

        // 蛇身上每一个方块的坐标也要更新
        this.pos.splice(0,0,[this.head.x/sw + this.direction.x,this.head.y/sh + this.direction.y]);   //对比移动前后，只是将新蛇头位置插入了数组第一位
        this.head = newHead;  //还要把蛇头的信息更新一遍

        if(!format) {  // 如果format的值为false，表示需要删除(除了吃之外的操作)
            this.tail.remove();
            this.tail = this.tail.last;

            this.pos.pop();
        }
    },
    eat: function() {
        //上面调用的时候已经把this指向改变，此处再次把改变后的this传入
        this.strategies.move.call(this, true);
        createFood();
        game.score++;
    },
    die: function() {
        game.over();
    }
}


snake = new Snake();


// 创建食物
function createFood(params) {
    // 食物小方块的随机坐标
    var x = null;
    var y = null;

    var include = true;  //循环跳出的条件，true表示食物的坐标在蛇身上
    while(include) {
        /* 从0~29的随机整数 */
        x = Math.round(Math.random()*(td - 1));     //生成0-1的随机小数乘以29，再四舍五入
        y = Math.round(Math.random()*(tr - 1));    

        snake.pos.some(function(value) {
            if(x != value[0] && y != value[1]) {
                include = false;
            }else{   //只要食物位置和任意一个蛇方块位置重了，立即跳出Pos的遍历，继续while循环
                include = true;
                return true;
            }
        });
    }

    // 生成食物
    food = new Square(x,y,'food');
    food.pos = [x, y];  //存储食物的位置，用于跟蛇头要走的下一个点作对比

    var foodDom = document.querySelector('.food');
    if(foodDom) {  //如果有苹果，改变位置(被吃了)
        foodDom.style.left = x * sw + 'px';
        foodDom.style.top = y * sh + 'px';
    }else{   //如果页面中没有苹果，创建(初始化)
        food.create();
    }
}


// 创建游戏逻辑
function Game() {    
    this.timer = null; //定时器
    this.score = 0;  //得分
}   
Game.prototype.init = function() {
    snake.init();
    // snake.getNextPos();
    createFood();

    document.onkeydown = function(ev) {
        if(ev.which == 37 && snake.direction != snake.directionNum.right) {  // 用户按下左方向键，并且蛇的方向不往右边走
            snake.direction = snake.directionNum.left;
        }else if(ev.which == 38 && snake.direction != snake.directionNum.down) {  //上
            snake.direction = snake.directionNum.up;
        }else if(ev.which == 39 && snake.direction != snake.directionNum.left) {  //右
            snake.direction = snake.directionNum.right;
        }else if(ev.which == 40 && snake.direction != snake.directionNum.up) {  //下
            snake.direction = snake.directionNum.down;
        }
    }

    this.start();
}
Game.prototype.start = function() {   //开始游戏
    this.timer = setInterval(() => {
        snake.getNextPos();   //让蛇持续移动
    }, 200);
}
Game.prototype.pause = function() {  //暂停游戏
    clearInterval(this.timer);
}
Game.prototype.over = function() {   //结束游戏
    clearInterval(this.timer);  //清除定时器，让蛇停止移动
    alert("你的得分为：" + this.score);

    // 游戏回到最初始的状态
    var snakeWrap = document.getElementById('snakeWrap');
    snakeWrap.innerHTML = '';  //清空父级页面
    snake = new Snake();  //重置蛇
    game = new Game();  //重置游戏

    var startBtnWrap = document.querySelector('.startBtn');
    startBtnWrap.style.display = 'block';
}


// 开启游戏
game = new Game();
var startBtn = document.querySelector('.startBtn button');
startBtn.onclick = function() {
    // 去除遮罩层
    startBtn.parentNode.style.display = 'none';
    // 游戏初始化
    game.init();
}

// 暂停游戏
var snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button');
snakeWrap.onclick = function() {
    game.pause();

    pauseBtn.parentNode.style.display = 'block';   //遮罩层在父级，通过父级显示表示暂停
}
pauseBtn.onclick = function() {
    game.start();

    pauseBtn.parentNode.style.display = 'none';
}