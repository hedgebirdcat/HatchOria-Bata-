/* =========================
   画面遷移処理
========================= */
const homeScreen = document.getElementById("home-screen");
const storyAdventureScreen = document.getElementById("story-adventure-screen");
const gameScreen = document.getElementById("game-screen");

const adventureMenu = document.querySelector(".adventure");
const homeBtn = document.getElementById("home-btn");
const adventureChoice = document.querySelector(".adventure-choice");
const backBtn = document.getElementById("back-btn");

// HOME ➔ ストーリー＆冒険
adventureMenu.addEventListener("click", () => {
    homeScreen.style.display = "none";
    storyAdventureScreen.style.display = "block";
});

// ストーリー＆冒険 ➔ HOME
homeBtn.addEventListener("click", () => {
    storyAdventureScreen.style.display = "none";
    homeScreen.style.display = "block";
});

// 冒険ボタン ➔ クイズゲーム画面起動
adventureChoice.addEventListener("click", () => {
    storyAdventureScreen.style.display = "none";
    gameScreen.style.display = "block";
    processNext(); 
});

// ゲーム画面 ➔ HOMEへ帰還（データ同期）
backBtn.addEventListener("click", () => {
    document.body.classList.remove("bonus-active");
    gameScreen.style.display = "none";
    homeScreen.style.display = "block";
    updateDisplay(); 
});


/* =========================
   育成グラフィック設定
========================= */
const eggImage = "https://full-coral-srculvc9or.edgeone.app/IMG_0154.png";


/* =========================
   クイズ問題データ
========================= */
const quizData = [
    {q:"apple",a:["りんご","リンゴ","林檎"]},
    {q:"sun",a:["太陽","たいよう"]},
    {q:"water",a:["水","みず"]},
    {q:"book",a:["本","ほん"]},
    {q:"cat",a:["猫","ねこ","ネコ"]},
    {q:"sky",a:["空","そら"]},
    {q:"school",a:["学校","がっこう"]},
    {q:"teacher",a:["先生","せんせい"]},
    {q:"music",a:["音楽","おんがく","ミュージック"]},
    {q:"soccer",a:["サッカー"]},
    {q:"hospital",a:["病院","びょういん"]},
    {q:"movie",a:["映画","えいが","ムービー"]},
    {q:"train",a:["電車","でんしゃ","トレイン"]},
    {q:"camera",a:["カメラ"]},
    {q:"computer",a:["コンピューター","パソコン"]},
    {q:"family",a:["家族","かぞく","ファミリー"]}
];


/* =========================
   ゲーム管理データコア
========================= */
let lv = 1;
let xp = 0;
let goal = 50;
let combo = 0;
let currentQuiz = {};
let isWaiting = false;
let isBonusStage = false;
let activePriority = 0;
let judgeTimeout = null;

const PRIORITY = {
    LEVEL: 1,
    COMBO: 2,
    EVOLUTION: 3
};


/* =========================
   画面表示・ステータス同期処理
========================= */
function updateDisplay(){
    // --- 1. ホーム画面パーツ更新 ---
    document.getElementById("home-lv-num").innerText = "Lv." + lv;
    document.getElementById("xp-fill-home").style.width = (xp / goal * 100) + "%";
    document.getElementById("home-xp-text").innerText = `${xp} / ${goal} XP`;
    document.getElementById("egg-area").innerHTML = `<img src="${eggImage}" alt="egg">`;

    // --- 2. クイズゲーム（冒険）画面パーツ更新 ---
    document.getElementById("game-lv-num").innerText = "Lv." + lv;
    document.getElementById("game-xp-fill").style.width = (xp / goal * 100) + "%";
    document.getElementById("game-xp-text").innerText = xp + "/" + goal;
    document.getElementById("combo-display").innerText = `🔥×${combo} COMBO!`;
    document.getElementById("char-display").innerHTML = `<img src="${eggImage}" alt="character">`;
}


/* =========================
   メッセージ通知システム
========================= */
function showMessage(text, priority){
    if(priority < activePriority) return;
    activePriority = priority;

    const msg = document.getElementById("priority-message");
    msg.innerText = text;
    msg.classList.remove("show");
    void msg.offsetWidth;
    msg.classList.add("show");
    msg.style.opacity = "1";
}

function clearMessage(){
    activePriority = 0;
    const msg = document.getElementById("priority-message");
    msg.classList.remove("show");
    msg.style.opacity = "0";
}


/* =========================
   演出エフェクト処理群
========================= */
function playLevelUpEffect(){
    const overlay = document.getElementById("levelup-overlay");
    overlay.style.display = "block";

    for(let i=0; i<45; i++){
        const s = document.createElement("div");
        s.className = "sparkle";
        s.style.left = Math.random()*100 + "%";
        s.style.bottom = "-20px";
        overlay.appendChild(s);

        setTimeout(() => { s.remove(); }, 2000);
    }

    setTimeout(() => { overlay.style.display = "none"; }, 2000);
}

function showBonusLogo(){
    const logo = document.getElementById("bonus-start-logo");
    logo.classList.remove("show");
    void logo.offsetWidth;
    logo.classList.add("show");
}

function showBonusXP(){
    const splash = document.getElementById("xp-splash");
    splash.classList.remove("show");
    void splash.offsetWidth;
    splash.classList.add("show");
}

function playFireworks(){
    const layer = document.getElementById("firework-layer");
    const colors = ["#ff5252", "#ffd700", "#00e5ff", "#e040fb", "#ffffff", "#ff9800"];

    for(let w=0; w<3; w++){
        setTimeout(() => {
            const x = [50, 25, 75][w];
            const y = [40, 30, 35][w];

            for(let i=0; i<55; i++){
                const p = document.createElement("div");
                const size = Math.random()*6 + 4;

                p.style.position = "absolute";
                p.style.width = size + "px"; p.style.height = size + "px";
                p.style.borderRadius = "50%";
                p.style.left = x + "%"; p.style.top = y + "%";
                p.style.background = colors[Math.floor(Math.random()*colors.length)];

                layer.appendChild(p);

                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random()*500 + 120;

                p.animate([
                    { transform: "translate(0,0) scale(1.4)", opacity: 1 },
                    { transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)`, opacity: 0 }
                ],{
                    duration: 2400 + Math.random()*800,
                    easing: "cubic-bezier(0.1,0.5,0.3,1)"
                });

                setTimeout(() => { p.remove(); }, 3200);
            }
        }, w*600);
    }
}


/* =========================
   クイズ判定・処理コア
========================= */
function processCheck(){
    if(isWaiting) return;

    const val = document.getElementById("ans-input").value.trim();
    if(!val) return;

    const overlay = document.getElementById("judge-overlay");
    const mark = document.getElementById("judge-mark");

    if(currentQuiz.a.includes(val)){
        mark.innerText = "○";
        mark.style.color = "red";
        combo++;

        const comboBonus = Math.floor(combo/5)*5;
        let gainedXP = 10 + comboBonus;

        if(combo % 5 === 0){
            showMessage(`🔥 ${combo} COMBO!\n次回からXP +${comboBonus}`, PRIORITY.COMBO);
        }

        if(isBonusStage){
            gainedXP += 40;
            showBonusXP();
            playFireworks();
        }

        xp += gainedXP;

        const comboDiv = document.getElementById("combo-display");
        comboDiv.classList.remove("bump");
        void comboDiv.offsetWidth;
        comboDiv.classList.add("bump");

        while(xp >= goal){
            xp -= goal;
            lv++;
            goal += 10;
            playLevelUpEffect();
            showMessage("LEVEL UP!", PRIORITY.LEVEL);

            if(lv === 5 || lv === 10){
                showMessage("進化した！", PRIORITY.EVOLUTION);
            }
        }
    } 
    else {
        mark.innerText = "×";
        mark.style.color = "blue";

        if(combo >= 5){
            showMessage("COMBO RESET!\nXP BONUS LOST", PRIORITY.COMBO);
        }
        combo = 0;
    }

    overlay.style.display = "block";
    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");

    judgeTimeout = setTimeout(() => {
        overlay.classList.remove("show");
        overlay.style.display = "none";
    }, 1000);

    isWaiting = true;
    document.getElementById("check-btn").style.display = "none";
    document.getElementById("next-btn").style.display = "inline-block";

    updateDisplay();
}

function processNext(){
    clearTimeout(judgeTimeout);
    document.getElementById("judge-overlay").style.display = "none";
    clearMessage();

    isBonusStage = Math.random() < 0.1;

    if(isBonusStage){
        document.body.classList.add("bonus-active");
        showBonusLogo();
    } else {
        document.body.classList.remove("bonus-active");
    }

    currentQuiz = quizData[Math.floor(Math.random() * quizData.length)];

    document.getElementById("q-display").innerText = 
        (isBonusStage ? "★BONUS★ " : "") + currentQuiz.q + " の意味は？";

    document.getElementById("ans-input").value = "";
    document.getElementById("ans-input").focus();

    document.getElementById("check-btn").style.display = "inline-block";
    document.getElementById("next-btn").style.display = "none";

    isWaiting = false;
    updateDisplay();
}


/* =========================
   イベントリスナー登録
========================= */
document.getElementById("check-btn").addEventListener("click", processCheck);
document.getElementById("next-btn").addEventListener("click", processNext);

/* =========================
   アプリケーション初期設定
========================= */
window.onload = () => {
    updateDisplay();
};


/* =========================
   入力キーボード & タップイベント保護
========================= */
function handleAction(){
    if(gameScreen.style.display !== "block") return;

    clearMessage();
    if(isWaiting){
        processNext();
    } else {
        processCheck();
    }
}

// Enterキーイベント
window.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
        handleAction();
    }
});

// タップ（クリック）で進むイベント
document.body.addEventListener("click", (e) => {
    const tag = e.target.tagName;
    if(
        tag === "BUTTON" || 
        tag === "INPUT" || 
        e.target.closest(".diamond") || 
        e.target.closest(".choice-diamond")
    ){
        return;
    }
    handleAction();
});
