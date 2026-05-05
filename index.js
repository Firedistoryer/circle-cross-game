import express from 'express';

const APP = express();
const Port = 3000;

let dask = [];//棋盤
let Size = 0;//棋盤大小
let who = "";//輪到誰
let winner = null;//誰贏？
let loser = null;//輸的
let history = [];//歷史記錄

//判斷包:check跟Draw
function check(player,x,y,size,dask){
    let X = true;
    let Y = true;
    //掃描直行(X固定)
    for(let i=0;i<size;i++){
        if(dask[x][i] !== player) X = false;
    }
    //掃描橫列(y固定)
    for(let j=0;j<size;j++){
        if(dask[j][y] !== player) Y = false;
    }
    if(X) return true;
    if(Y) return true;

    //掃描左上到右下(\)
    if(x==y){
        let slash_left = true;
        for(let i=0; i<size; i++){
            if(dask[i][i] !== player) slash_left = false;
        }
        if(slash_left) return true;
    }

    //掃描右上到左下(/) 有趣，無論棋盤大小多大，右斜線的數字永遠是size-1
    if(x + y === size - 1){
        let slash_right = true;
        for(let i =0;i<size;i++){
            if(dask[i][size-1-i] !== player) slash_right = false;
        }
        if(slash_right) return true;
    }
    return false;
}

function Draw(size,dask){
    for(let i=0;i<size;i++){
        for(let j=0;j<size;j++){
            if(dask[i][j] == "") return false;//代表還抓地到空位，沒滿
        }
    }
    return true;//滿了(悲)
}

//new:設定棋盤大小
APP.get('/new/:size',(req, res) => {
    const size = parseInt(req.params.size);
    //非數字或<1報錯
    if (isNaN(size) || size <= 0) {
        return res.json(["Error"]);
    }
    //開始重製桌面
    Size = size;
    winner = null;
    loser = null;
    dask = [];

    //照棋盤大小塞進去空格
    for (let i = 0; i < size; i++) {
        let row = [];
        for (let j = 0; j < size; j++) {
            row.push(""); 
        }
        dask.push(row);
    }

    who = Math.random() < 0.5 ? "o" : "x";
    res.json([who]);
});

//action:玩家的作動
APP.get('/action/:x/:y', (req, res) => {
    const x = parseInt(req.params.x);
    const y = parseInt(req.params.y);
    const player = req.query.who ? req.query.who.toLowerCase() : "";//確認玩家輸入以及小寫轉換
    
    //輸家視角觸發
    if(winner !== null && player == loser){
        loser = null;
        return res.json(["Lose"]);
    }

    //不合法全都幹去ERROR
    if(isNaN(x) || isNaN(y) || x<0 || x>=Size || y<0 || y>=Size || player !== who || dask[x][y] !== "" || winner !== null || (player !== "o" && player !== "x")){
        return res.json(["Error"]);
    }

    //下棋
    dask[x][y] = player;
    //輪換
    who = (player == "o") ? "x" : "o";

    //如果符合任一方獲勝條件
    if(check(player,x,y,Size,dask)){
        winner = player;
        loser = (player == "o") ? "x" : "o";
        //紀錄歷史
        history.push({"size":Size,"status":JSON.parse(JSON.stringify(dask)),"winner":winner});
        return res.json(["Victory"]);
    }

    //如果平手
    if(Draw(Size,dask)){
        winner = "draw";
        history.push({"size":Size,"status":JSON.parse(JSON.stringify(dask)),"winner":null});
        return res.json(["No Winner"]);
    }

    //沒觸發上述條件，遊戲繼續
    return res.json(dask);
});

//now:看看現在的狀況
APP.get('/now', (req, res) => {
    res.json({"size": Size,"status": dask,"winner": winner});
});

//rec:歷史紀錄啊歷史紀錄
APP.get('/rec',(req,res) => {
    res.json(history);
});

APP.listen(Port, () => {
  console.log(`ONLINE`);
});