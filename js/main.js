//全局变量定义
var canvas_width = 1000; //画布宽
var canvas_height = 600; //画布高
var canvas;   //绘图画布
var canvasContext = null;
var canvasBuffer;  //实现双缓冲的中间画布
var canvasBufferContext = null;
var row_number;
var col_number;
var is_wall = [];
var currnt_x;
var currnt_y;
var cell_width = 4;
var usr_width = 1000;
var usr_height = 600;
var is_live = [];
var is_liveBuffer = [];
var density = 0.67;
var usr_density = 0.67;
var interval = 10;
var usr_interval = 10;

//Bool状态
var is_start = false;
var is_continue = false;
var is_paused;
var is_sizechanged = true;

var gameLoop;

//游戏主结构
$(window).load(function(){
	//添加事件监视，按钮响应
	addEvent();
})
function Start(){
	gameLoop = setInterval(GameLoop, 1000/interval);
}
function GameLoop(){
	if(!is_start)
		return;
	if(is_paused)
		return;
	Draw();
	Update();
}

//游戏函数
function addEvent(){
	//开始按钮 包括游戏初始化
	$("#start").click(function(){
		is_start = true;
		is_paused = false;
		density = usr_density;
		interval = usr_interval;
		$("#start").text("重新开始");
		$("#pause").text("暂停");
		$("#continue").text("进行模拟");
		is_continue = false;

		if(is_sizechanged){
			canvas_width = usr_width;
			canvas_height = usr_height;
			$("#current_size").remove();
			$('body').append("<div id='current_size'>当前画布宽高：" + canvas_width + ',' + canvas_height 
							+ "刷新帧数:" + interval + "fps,生成细胞密度:" + density 
							+ "  重新开始后画布宽高将改为:" + usr_width + "," + usr_height
							+ "刷新帧数:" + usr_interval + "fps,生成细胞密度:" + usr_density + "</div>");
			window.clearInterval(gameLoop);
			Initialize();
		}
		else{
			Initialize_cell();
		}
		
	});

	$("#pause").click(function(){
		if(!is_paused && is_start){
			$("#pause").text("继续");
			is_paused = true;
		}
		else{
			$("#pause").text("暂停");
			is_paused = false;
		}
	});

	$("#continue").click(function(){
		if(is_start && !is_continue){
			is_continue = true;
			$("#continue").text("重新模拟");
			Start();
		}
		else{
			window.clearInterval(gameLoop);
			Initialize_cell();
			Start();
		}
	});


	$("#ready_len").click(function(){
		if(is_start){
			if(document.getElementById("canvas_width").value.length == 0 || 
				document.getElementById("canvas_height").value.height == 0)
				return;

			usr_width = eval(document.getElementById("canvas_width")).value;
			usr_height = eval(document.getElementById("canvas_height")).value;

			if(isNaN(usr_width) || isNaN(usr_height)){
				alert("长宽必须为数字");
				return;
			}

			if(usr_width <= 0 || usr_height <= 0){
				alert("长度必须大于0");
				return;
			}
			
			if(usr_width === canvas_width && usr_height === canvas_height){
				is_sizechanged = false;
			}
			else{
				$("#current_size").remove();
				$('body').append("<div id='current_size'>当前画布宽高：" + canvas_width + ',' + canvas_height 
							+ "刷新帧数:" + interval + "fps,生成细胞密度:" + density 
							+ "  重新开始后画布宽高将改为:" + usr_width + "," + usr_height
							+ "刷新帧数:" + usr_interval + "fps,生成细胞密度:" + usr_density + "</div>");
				is_sizechanged = true;
			}
		}
	});

	$("#canvas")[0].addEventListener("click", function(evt){
		if(is_continue){
			alert("已经开始，无法再添加墙壁细胞");
			return;
		}
		var mousePos = getMousePos(canvas, evt);
		currnt_x = Math.floor(mousePos.x / cell_width) + 2;
		currnt_y = Math.floor(mousePos.y / cell_width) + 2;
		is_wall[currnt_y][currnt_x] = 1;
		is_liveBuffer[currnt_y][currnt_x] = 0;
		is_live[currnt_y][currnt_x] = 0;
		canvasContext.fillStyle = "rgb(255, 0, 0)";
		canvasContext.fillRect(cell_width * (currnt_x - 2), cell_width * (currnt_y - 2), cell_width, cell_width);

	});

	$("#ready_den").click(function(){
		if(is_start){
			if(document.getElementById("density").value.length == 0)
				return;
			usr_density = eval(document.getElementById("density")).value;

			if(isNaN(usr_density)){
				alert("密度必须为数值");
				return;
			}

			if(usr_density > 1 || usr_density < 0){
				alert("密度范围为0~1");
				return;
			}
			$("#current_size").remove();
			$('body').append("<div id='current_size'>当前画布宽高：" + canvas_width + ',' + canvas_height 
							+ "刷新帧数:" + interval + "fps,生成细胞密度:" + density 
							+ "  重新开始后画布宽高将改为:" + usr_width + "," + usr_height
							+ "刷新帧数:" + usr_interval + "fps,生成细胞密度:" + usr_density + "</div>");
		}
	});

	$("#ready_fre").click(function(){
		if(is_start){
			if(document.getElementById("frequence").value.length == 0)
				return;
			usr_interval = eval(document.getElementById("frequence")).value;
			if(isNaN(usr_interval)){
				alert("刷新频率必须为数字");
				return;
			}
			if(usr_interval <= 0){
				alert("刷新频率取值不对");
				return;
			}
			$("#current_size").remove();
			$('body').append("<div id='current_size'>当前画布宽高：" + canvas_width + ',' + canvas_height 
							+ "刷新帧数:" + interval + "fps,生成细胞密度:" + density 
							+ "  重新开始后画布宽高将改为:" + usr_width + "," + usr_height
							+ "刷新帧数:" + usr_interval + "fps,生成细胞密度:" + usr_density + "</div>");
		}
	});
}


//获取鼠标相对于canvas画布的位置
function getMousePos(canvas, evt){ 
    var rect = canvas.getBoundingClientRect(); 
    return{ 
     	x: evt.clientX - rect.left * (canvas.width / rect.width),
     	y: evt.clientY - rect.top * (canvas.height / rect.height)
   	}
 }
//游戏初始化
function Initialize(){

	row_number = Math.floor(canvas_height / cell_width);
	col_number = Math.floor(canvas_width / cell_width);

	is_live = new Array(row_number + 4);
	is_liveBuffer = new Array(row_number + 4);
	is_wall = new Array(row_number + 4);

	var width = document.body.clientwidth;
	canvas = document.getElementById('canvas');
	canvasBuffer = document.createElement('canvas');
	canvas.width = canvas_width;
	canvas.height = canvas_height;
	canvasBuffer.width = canvas.width;
	canvasBuffer.height = canvas.height;
	canvasBufferContext = canvasBuffer.getContext('2d');

	if(canvas){
		canvasContext = canvas.getContext('2d');
	}



	for(var i = 2; i < row_number + 2; i++){
		is_live[i] = new Array(col_number + 4);
		is_liveBuffer[i] = new Array(col_number + 4);
		is_wall[i] = new Array(col_number + 4);
		for(var j = 2; j < col_number + 2; j++){
			is_wall[i][j] = 0;
		}
	}

	Initialize_cell();
	canvasContext.fillStyle = "rgb(0,0,0)";
	canvasContext.fillRect(0,0,canvas_width,canvas_height);

	is_live[0] = new Array(col_number + 4);
	is_live[1] = new Array(col_number + 4);
	is_live[row_number + 2] = new Array(col_number + 4);
	is_live[row_number + 3] = new Array(col_number + 4);
	is_liveBuffer[0] = new Array(col_number + 4);
	is_liveBuffer[1] = new Array(col_number + 4);
	is_liveBuffer[row_number + 2] = new Array(col_number + 4); 
	is_liveBuffer[row_number + 3] = new Array(col_number + 4); 


	for(var i = 0; i < col_number + 4; i++){
		is_live[0][i] = 0;
		is_live[1][i] = 0;
		is_live[row_number + 2][i] = 0;
		is_live[row_number + 3][i] = 0;
	}
	for(var i = 0; i < row_number + 4; i++){
		is_live[i][0] = 0;
		is_live[i][1] = 0;
		is_live[i][col_number + 2] = 0; 
		is_live[i][col_number + 3] = 0; 
	}


}

function Initialize_cell(){
	for(var i = 2; i < row_number + 2; i++){
		for(var j = 2; j < col_number + 2; j++){
			var temp = Math.floor(1000 * density);
			var ran = Math.floor(Math.random() * 1000);
			if(ran < temp && is_wall[i][j] === 0)
				is_live[i][j] = 1;
			else
				is_live[i][j] = 0;
			is_liveBuffer[i][j] = is_live[i][j];
		}
	}

}
//更新画布
function Update(){
	for(var i = 2; i < row_number + 2; i++){
		for(var j = 2; j < col_number + 2; j++){
			if(is_wall[i][j] == 0){
				changeState(i, j);
			}
		}
	}

	for(var i = 2; i < row_number + 2; i++){
		for(var j = 2; j < col_number + 2; j++){
			is_live[i][j] = is_liveBuffer[i][j];
		}
	}
}

//判断是否改变状态
function changeState(i, j){
	var lived_cell = 0;

	lived_cell = is_live[i][j-2]+is_live[i][j-1]+is_live[i][j+1]
				+is_live[i][j+2]+is_live[i-2][j]+is_live[i-1][j]+
				is_live[i+1][j]+is_live[i+2][j];

	if(lived_cell === 3){
		is_liveBuffer[i][j] = 1;
	}
	else if(lived_cell === 2){
		return;
	}
	else{
		is_liveBuffer[i][j] = 0;
	}

}

//画图函数
function Draw(){
	canvasBufferContext.clearRect(0,0,canvasBuffer.width,canvasBuffer.height);
	canvasContext.clearRect(0,0,canvas.width,canvas.height);
	for(var i = 2; i < row_number + 2; i++){
		for(var j = 2; j < col_number + 2; j++){
			canvasBufferContext.save();
			if(is_live[i][j] == 1){
				canvasBufferContext.fillStyle = "rgb(255, 255, 255)";
			}
			else{
				if(is_wall[i][j] == 1){
					canvasBufferContext.fillStyle = "rgb(255, 0, 0)";
				}
				else{
					canvasBufferContext.fillStyle = "rgb(0, 0, 0)";
				}
			}
			canvasBufferContext.fillRect(cell_width * (j - 2), cell_width * (i - 2), cell_width, cell_width);
			canvasBufferContext.restore();
		}
	}
	canvasContext.drawImage(canvasBuffer,0,0);
}