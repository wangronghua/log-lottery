<script setup lang="ts">
import { ref, onMounted, onUnmounted} from 'vue'
import { useElementStyle, useElementPosition } from '@/hooks/useElement'
import confetti from 'canvas-confetti'
import { selectCard } from '@/utils'
import { IPersonConfig } from '@/types/storeType'
import { Scene, PerspectiveCamera, Object3D, Vector3 } from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three-css3d'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import * as TWEEN from '@tweenjs/tween.js'
import useStore from '@/store'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
import request from '@/api/request';
// import request, { AxiosResponse } from 'axios';
import { debug } from 'console'

const toast = useToast();
const router = useRouter()
const globalConfig = useStore().globalConfig

const { getCardColor: cardColor, getPatterColor: patternColor, getPatternList: patternList, getTextColor: textColor, getLuckyColor: luckyColor, getCardSize: cardSize } = storeToRefs(globalConfig)
const currentStatus = ref(0) // 0为初始状态， 1为抽奖准备状态，2为抽奖中状态，3为抽奖结束状态
const ballRotationY = ref(0)
const containerRef = ref<HTMLElement>()
// const LuckyViewRef= ref()
const canOperate = ref(true)
const cameraZ = ref(3000)

const lowzIndex=ref(false)
const scene = ref()
const camera = ref()
const renderer = ref()
const controls = ref()
const objects = ref<any[]>([])
const maxwidth = ref(0)
const maxheight = ref(0)
const coverbgobject = ref<any>()
const hideNickName = ref(false)

const targets = {
    grid: <any[]>[],
    helix: <any[]>[],
    table: <any[]>[],
    sphere: <any[]>[]
};
const notPrizeDrawList = ref<any[]>([])
const hasPrizeDrawList = ref<any[]>([])
const allPersonList = ref<any[]>([])
const maxLuckCount = 40
const luckyCount = ref(1)

const luckyTargets = ref<any[]>([])
const luckyCardList = ref<number[]>([])

const intervalTimer = ref<any>(null)
const prizes = ref<any[]>([])

function changeHideNickName(){
    hideNickName.value = !hideNickName.value;
    if(hideNickName.value){
        localStorage.setItem('hideNickName','1');
    }else{
        localStorage.setItem('hideNickName','0');
    }
}
// 填充数据，填满七行
async function initTableData() {
    var data = await getLoadData();//获取已抽奖和未抽奖用户
    if(data==null)return;
    notPrizeDrawList.value = data.notPrizeDraw
    hasPrizeDrawList.value = data.hasPrizeDraw

    
    for (let i = 0; i < notPrizeDrawList.value.length; i++) {
        allPersonList.value.push(notPrizeDrawList.value[i]);
    }
    for (let i = 0; i < hasPrizeDrawList.value.length; i++) {
        allPersonList.value.push(hasPrizeDrawList.value[i]);
    }

    
    const res = await request<any>({
            url:urlpre+'/system/prize/list',
            method: 'post',
            data:'pageSize=999&pageNum=1&orderByColumn=createTime&isAsc=desc&name=&type=',
            withCredentials: true
        });
    for(var i=0;i<res.rows.length;i++)
    {
        var row = res.rows[i];
        prizes.value.push({name:row.name,headPic:row.pictureUrl});
    }
}
var mocklist = [{"name":"LuckyStar✨","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/1.jpg"},
{"name":"DreamChaser","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/2.jpg"},
{"name":"weetiePie","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/3.jpg"},
{"name":"JoyfulMoment","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/4.jpg"},
{"name":"MysteryGuru","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/5.jpg"},
{"name":"NightSky","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/6.png"},
{"name":"BlissfulSoul","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/7.jpg"},
{"name":"AdventureTime","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/8.jpg"},
{"name":"EchoWave","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/9.jpg"},
{"name":"SilverLining","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/10.jpg"},
{"name":"GlamourGirl","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/11.jpg"},
{"name":"SilentThought","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/12.jpg"},
{"name":"WhisperingWind","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/13.jpg"},
{"name":"MorningSunrise","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/14.jpg"},
{"name":"SweetDreamer","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/15.jpg"},
{"name":"EchoesOfTime","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/16.jpg"},
{"name":"WhimsicalWorld","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/17.jpg"},
{"name":"ChasingRainbows","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/18.jpg"},
{"name":"StarGazer","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/19.jpg"},
{"name":"MidnightVibes","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/demopic/20.jpg"}];
const initItem = (item:any)=>{
    let element = document.createElement('div');
    element.className = 'element-card';

    let imgc = document.createElement('div');
    imgc.className = 'card-headpic-c';
    const headpic = document.createElement('img');
    headpic.className = 'card-headpic';
    headpic.src = item.headPic;
    imgc.appendChild(headpic);
    element.appendChild(imgc);

    // element.append("<div class='card-headpic-c'><img src='"+item.headPic+"' class='card-headpic'/></div>");

    const symbol = document.createElement('div');
    symbol.className = 'card-name';
    symbol.textContent = item.name;
    element.appendChild(symbol);
    
    const prizeName = document.createElement('div');
    prizeName.className = 'card-prize';
    prizeName.innerHTML = `${item.prizeName||''}`;
    element.appendChild(prizeName);

    element = useElementStyle(element, item, item.name, patternList.value, patternColor.value, cardColor.value, cardSize.value)
    const object = new CSS3DObject(element);
    object.position.x = Math.random() * 4000 - 2000;
    object.position.y = Math.random() * 4000 - 2000;
    object.position.z = Math.random() * 4000 - 2000;
    object.userData["uid"]= item.uid
    scene.value.add(object);

    objects.value.push(object);
};
const init = () => {
    hideNickName.value = localStorage.getItem('hideNickName')=='1';
    const felidView = 40;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const nearPlane = 1;
    const farPlane = 10000;
    const WebGLoutput = containerRef.value

    scene.value = new Scene();
    camera.value = new PerspectiveCamera(felidView, aspect, nearPlane, farPlane);
    camera.value.position.z = cameraZ.value
    renderer.value = new CSS3DRenderer()
    maxwidth.value = Math.floor(width);
    maxheight.value = Math.floor(height);
    
    var leftwidth = Math.floor(width*0.205);
    var leftinnerWidth = Math.floor((leftwidth-40)/3)-1;

    document.documentElement.style.setProperty('--renyuan-width', leftinnerWidth+'px');
    document.documentElement.style.setProperty('--headpic-width', Math.floor(width*0.036)+'px');
    document.documentElement.style.setProperty('--headpic-padding', Math.floor(width*0.004)+'px');

    renderer.value.setSize(maxwidth.value, maxheight.value)
    renderer.value.domElement.style.position = 'absolute';
    // 垂直居中
    // renderer.value.domElement.style.paddingTop = '50px'
    // renderer.value.domElement.style.top = '53%';
    // renderer.value.domElement.style.left = '48%';
    renderer.value.domElement.className="beforeDraw";

    renderer.value.domElement.style.transform = 'translate(-50%, -50%)';
    WebGLoutput!.appendChild(renderer.value.domElement);

    controls.value = new TrackballControls(camera.value, renderer.value.domElement);
    controls.value.rotateSpeed = 1;
    controls.value.enabled=false;
    controls.value.staticMoving = true;
    controls.value.noZoom = true; // 禁止缩放
    controls.value.noRotate = true; //https://www.wenjiangs.com/doc/rjvdcbep
    // controls.value.minZoom=5;
    // controls.value.screen={left:0,top:0,width:maxwidth.value,height:maxheight.value}
    controls.value.minDistance = 500;//动画区域的大小
    controls.value.maxDistance = 6000;
    controls.value.addEventListener('change', render);

    // const tableLen = allPersonList.value.length
    // for (let i = 0; i < tableLen; i++) {
    //     initItem(allPersonList.value[i])
    // }
    // if(allPersonList.value.length<20){
    //     for(let i=19-allPersonList.value.length;i>=0;i--){
    //         initItem(mocklist[i])
    //     }
    // }
    for(var i = 0;i<prizes.value.length;i++)
    {
        initItem(prizes.value[i])
    }

    
    var coverbg = document.createElement('div');
    coverbg.className = 'coverbg'
    coverbgobject.value = new CSS3DObject(coverbg);
    coverbgobject.value.position.x = 0;
    coverbgobject.value.position.y = 0;
    coverbgobject.value.position.z = 0;
    scene.value.add(coverbgobject.value);

    // createTableVertices();
    createSphereVertices();
    // createHelixVertices();

    //长方形排列
    function createTableVertices() {
    }

    //圆球排列
    function createSphereVertices() {
        let i = 0;
        const objLength = objects.value.length;
        const vector = new Vector3();

        //控制球大小
        let ballsize = 700
        for (; i < objLength; ++i) {
            let phi = Math.acos(-1 + (2 * i) / objLength);
            let theta = Math.sqrt(objLength * Math.PI) * phi;
            const object = new Object3D();

            object.position.x = ballsize * Math.cos(theta) * Math.sin(phi);
            object.position.y = ballsize * Math.sin(theta) * Math.sin(phi);
            object.position.z = -ballsize * Math.cos(phi);

            // rotation object 

            vector.copy(object.position).multiplyScalar(2);
            object.lookAt(vector);
            targets.sphere.push(object);
        }
    }
    window.addEventListener('resize', onWindowResize, false);
    enterLottery();
    render();
}
const processNickName = (name: string) => {
    if(name===null||name.length==0)return name;
    if(hideNickName.value){
        return Array.from(name).slice(0, 1).join('')+'*'
    }else{
        return name
    }
}
const transform = (targets: any[], duration: number) => {
    TWEEN.removeAll();
    if (intervalTimer.value) {
        clearInterval(intervalTimer.value);
        intervalTimer.value = null
        randomBallData('sphere')
    }

    return new Promise((resolve) => {
        const objLength = objects.value.length;
        for (let i = 0; i < objLength; ++i) {
            let object = objects.value[i];
            let target = targets[i];
            new TWEEN.Tween(object.position)
                .to({ x: target.position.x, y: target.position.y, z: target.position.z },
                    Math.random() * duration + duration)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();


            new TWEEN.Tween(object.rotation)
                .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start()
                .onComplete(() => {
                    if (luckyCardList.value.length) {
                        luckyCardList.value.forEach((cardIndex: any) => {
                            const item = objects.value[cardIndex]
                            useElementStyle(item.element, prizes.value[cardIndex],prizes.value[cardIndex].name, patternList.value, patternColor.value, cardColor.value, cardSize.value, 'sphere')
                        })
                    }
                    luckyTargets.value = [];
                    luckyCardList.value = [];

                    canOperate.value = true
                });
        }

        // 这个补间用来在位置与旋转补间同步执行，通过onUpdate在每次更新数据后渲染scene和camera
        new TWEEN.Tween({})
            .to({}, duration * 2)
            .onUpdate(render)
            .start()
            .onComplete(() => {
                canOperate.value = true
                resolve('')
            });
    })
}
function onWindowResize() {
    camera.value.aspect = window.innerWidth / window.innerHeight
    camera.value.updateProjectionMatrix();
    renderer.value.setSize(window.innerWidth, window.innerHeight);
    render();
}

/**
* [animation update all tween && controls]
*/
function animation() {
    TWEEN.update();
    controls.value.update();
    // 设置自动旋转
    // 设置相机位置
    requestAnimationFrame(animation);
}

// // 旋转的动画
function rollBall(rotateY: number, duration: number) {
    // return;
    TWEEN.removeAll();

    return new Promise((resolve) => {
        scene.value.rotation.y = 0;
        ballRotationY.value = Math.PI * rotateY * 1000
        const rotateObj = new TWEEN.Tween(scene.value.rotation);
        rotateObj
            .to(
                {
                    // x: Math.PI * rotateX * 1000,
                    x: 0,
                    y: ballRotationY.value,
                    // z: Math.PI * rotateZ * 1000
                    z: 0
                },
                duration * 1000
            )
            .onUpdate(render)
            .start()
            .onStop(() => {
                resolve('')
            })
            .onComplete(() => {
                resolve('')
            })
    })
}
function render() {
    renderer.value.render(scene.value, camera.value);
}
const enterLottery = async () => {
    if (!canOperate.value) {
        return
    }
    if (!intervalTimer.value) {
        randomBallData()
    }
    canOperate.value = false
    
    if(coverbgobject.value.element.parentElement!=null){
        coverbgobject.value.element.parentElement.parentElement.className="beforeDraw"
    }

    await transform(targets.sphere, 1000)
    lowzIndex.value=false;
    // coverbgRef.value.style.visibility="hidden";
    currentStatus.value = 1
    rollBall(0.1, 2000)
}

// 开始抽奖
const startLottery = () => {
    if (!canOperate.value) {
        return
    }
    luckyCount.value = Math.min(luckyCount.value,notPrizeDrawList.value.length) // 48   36  30   25  24  21  20  18  15  12  10 ...
    // 自定义抽奖个数

    // 验证是否已抽完全部奖项
    if (notPrizeDrawList.value.length <= 0) {
        toast.open({
            message: '剩余待抽奖人数为0，请先添加参与人员',
            type: 'warning',
            position: 'top-right',
            duration: 1500
        })

        return
    }
    toast.open({
        message: `现在抽取${luckyCount.value}人`,
        type:'default',
        position: 'top-right',
        duration: 1500
    })
    currentStatus.value =100
    setTimeout(function(){
        currentStatus.value = 2
    },2000);
    rollBall(5, 3000)
}
const changeLuckyCount = (event:any)=>{
    if(luckyCount.value > maxLuckCount){
        luckyCount.value = maxLuckCount;
        
        toast.open({
            message: `单次抽奖人数不能超过${maxLuckCount}人`,
            type: 'warning',
            position: 'top-right',
            duration: 1500
        })
    }else if(luckyCount.value<1){
        luckyCount.value = 1;
        
        toast.open({
            message: '单次抽奖人数不能少于1人',
            type: 'warning',
            position: 'top-right',
            duration: 1500
        })
    }
};
const stopLottery = async () => {
    if (!canOperate.value) {
        return
    }
    canOperate.value = false
    luckyTargets.value = [];

    var oldNotPrizeDrawList = notPrizeDrawList.value.slice()
    var uidlist = [];
    var data = <any>[];
    for (let i = 0; i < luckyCount.value; i++) {
        if (notPrizeDrawList.value.length > 0) {
            const randomIndex = Math.round(Math.random() * (notPrizeDrawList.value.length - 1))
            luckyTargets.value.push(notPrizeDrawList.value[randomIndex])
            uidlist.push(notPrizeDrawList.value[randomIndex].uid);
            data.push(notPrizeDrawList.value[randomIndex]);
            notPrizeDrawList.value.splice(randomIndex, 1)
        }else{
            break
        }
    }

    if(uidlist.length==0){
        canOperate.value = true;
        continueLottery();
        return;
    }
    
    if(isTest()){
        for(var i=0;i<uidlist.length;i++){
            data[i].prizeName="奖品"+i;
        }
    }else{
        //修改luckyTargets里的奖品名
        const res = await request<any>({
            url:urlpre+'/system/activity/prizedraw',
            method: 'post',
            data:{
                activityId:router.currentRoute.value.query.activityId,
                userIds:uidlist
            },
            withCredentials: true
        });
        if(res==null){
            notPrizeDrawList.value = oldNotPrizeDrawList;
            canOperate.value = true;
            continueLottery();
            return;
        }
        if(res.code==500){
            notPrizeDrawList.value = oldNotPrizeDrawList;
            toast.open({
                message: res.msg,
                type: 'warning',
                position: 'top-right',
                duration: 1500
            })
            
            canOperate.value = true;
            continueLottery();
            return;
        }
        data = res.data;
    }

    if(data.length==0){
        toast.open({
            message: '抽奖失败，请重新抽奖',
            type: 'warning',
            position: 'top-right',
            duration: 1500
        })
        
        canOperate.value = true;
        continueLottery();
        return;
    }


    lowzIndex.value=true;
    currentStatus.value=100;
    clearInterval(intervalTimer.value)
    intervalTimer.value = null


    for(var i=0;i<data.length;i++){
        hasPrizeDrawList.value.unshift(data[i]);
        for(var j=0;j<luckyTargets.value.length;j++){
            if(luckyTargets.value[j].uid==data[i].uid){
                luckyTargets.value[j].prizeName=data[i].prizeName;
                break;
            }
        }
    }

    rollBall(0, 1)


    
    let maxrowcount = 5;//最多5行
    let maxcolumncount = 13;//最多10列

    let columncount = 10;//如果都没匹配默认10列
    let rowcount = Math.ceil(luckyTargets.value.length / columncount)
   
    let cwidth = 0;
    let cheight = 0;
    
    let tcwidth = 0;
    let tcheight = 0;

    //场景宽度
    var scenewidth = coverbgobject.value.element.parentElement.getBoundingClientRect().width;
    //场景比例
    var scenerate = maxwidth.value/scenewidth;

    for(var i=maxrowcount;i>=1;i--){
        var tempcolcount = Math.ceil(luckyTargets.value.length/i);
        if(tempcolcount<=maxcolumncount){

            
            let maxcwidth = Math.floor(maxwidth.value*scenerate/(1.4955*(tempcolcount*1.1-0.1)));
            let maxcheight = Math.floor((maxheight.value*0.94-112)*scenerate/(1.4955*(i*1.05-0.05)));

            
            if(maxcwidth*20/14<maxcheight){
                tcwidth = maxcwidth;
                tcheight = maxcwidth*20/14;
            }else{
                tcheight = maxcheight;
                tcwidth = maxcheight*14/20;
            }    

            if(tcwidth>cwidth){
                columncount = tempcolcount;
                rowcount = i;
                cwidth=tcwidth;
                cheight=tcheight
            }
        }
    }

    let colspace = cwidth*0.1
    let rowspace = cheight*0.05

    if(luckyTargets.value.length>0){
        coverbgobject.value.element.parentElement.parentElement.className="afterDraw"
    
        new TWEEN.Tween(coverbgobject.value.position)
                .to({
                    x: 0,
                    y: 0,
                    z: 800
                }, 2200)
                .easing(TWEEN.Easing.Exponential.InOut)
                .onStart(() => {
                })
                .onComplete(() => {
                
                })
                .start()
        new TWEEN.Tween(coverbgobject.value.rotation)
            .to({
                x: 0,
                y: 0,
                z: 0
            }, 900)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start()
            .onComplete(() => {
            })

        luckyTargets.value.forEach((person: IPersonConfig, index: number) => {
            if(person.prizeName){
                let cardIndex = selectCard(luckyCardList.value, prizes.value.length)
                luckyCardList.value.push(cardIndex)
                let item = objects.value[cardIndex]
                const { xTable, yTable } = useElementPosition(item,columncount,rowcount,colspace,rowspace, { width: cwidth , height: cheight  }, index)
                new TWEEN.Tween(item.position)
                    .to({
                        x: xTable,
                        y: yTable,
                        z: 1000
                    }, 1200)
                    .easing(TWEEN.Easing.Exponential.InOut)
                    .onStart(() => {
                        item.element = useElementStyle(item.element, person, processNickName(person.name), patternList.value, patternColor.value, luckyColor.value, { width: cwidth, height: cheight}, 'lucky')
                    })
                    .start()
                    .onComplete(() => {
                        canOperate.value = true
                        
                        currentStatus.value = 3
                    })
                new TWEEN.Tween(item.rotation)
                    .to({
                        x: 0,
                        y: 0,
                        z: 0
                    }, 900)
                    .easing(TWEEN.Easing.Exponential.InOut)
                    .start()
                    .onComplete(() => {
                        // coverbgRef.value.style.visibility="visible";
                        confettiFire()
                        // resetCamera()
                    })
            }
        }) 
    }else{
        canOperate.value = true
        currentStatus.value = 3
    }
}
// 继续
const continueLottery = async () => {
    if (!canOperate.value) {
        return
    }
    currentStatus.value=100;
    await enterLottery()
}
const quitLottery = () => {
    enterLottery()
    currentStatus.value = 0
}
// 庆祝动画
const confettiFire = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    (function frame() {
        // launch a few confetti from the left edge
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            gravity:10
        });
        // and launch a few from the right edge
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            gravity:10
        });

        // keep going until we are out of time
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
    centerFire(0.25, {
        spread: 26,
        startVelocity: 55,
        gravity:10
    });
    centerFire(0.2, {
        spread: 60,
        gravity:10
    });
    centerFire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        gravity:10
    });
    centerFire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        gravity:10
    });
    centerFire(0.1, {
        spread: 120,
        startVelocity: 45,
        gravity:10
    });
}
const centerFire = (particleRatio: number, opts: any) => {
    const count = 200
    confetti({
        origin: { y: 0.7 },
        ...opts,
        particleCount: Math.floor(count * particleRatio)
    });
}

// 随机替换数据
const randomBallData = (mod: 'default' | 'lucky' | 'sphere' = 'default') => {
    return;
    if(intervalTimer.value!=null){
        clearInterval(intervalTimer.value)
    }

    // 两秒执行一次
    intervalTimer.value = setInterval(() => {
        // 产生随机数数组
        const indexLength = 4
        const cardRandomIndexArr: number[] = []
        const personRandomIndexArr: number[] = []
        for (let i = 0; i < indexLength; i++) {
            cardRandomIndexArr.push(Math.round(Math.random() * (allPersonList.value.length - 1)))
            personRandomIndexArr.push(Math.round(Math.random() * (allPersonList.value.length - 1)))
        }
        for (let i = 0; i < cardRandomIndexArr.length; i++) {
            if(objects.value.length>cardRandomIndexArr[i]){
                
                // var temp = objects.value[cardRandomIndexArr[i]].element;
                // objects.value[cardRandomIndexArr[i]].element=objects.value[personRandomIndexArr[i]].element;
                // objects.value[personRandomIndexArr[i]].element = temp;

                objects.value[cardRandomIndexArr[i]].element = useElementStyle(objects.value[cardRandomIndexArr[i]].element, allPersonList.value[personRandomIndexArr[i]], processNickName(allPersonList.value[personRandomIndexArr[i]].name), patternList.value, patternColor.value, cardColor.value, { width: cardSize.value.width, height: cardSize.value.height }, mod)
            }
        }
    }, 200)
}
// 监听键盘
const listenKeyboard = () => {
    window.addEventListener('keydown', (e: any) => {
        if ((e.keyCode !== 32 || e.keyCode !== 27) && !canOperate.value) {
            return
        }
        if (e.keyCode === 27 && currentStatus.value === 3) {
            quitLottery()
        }
        if (e.keyCode !== 32) {
            return
        }
        switch (currentStatus.value) {
            case 0:
                enterLottery()
                break;
            case 1:
                startLottery()
                break;
            case 2:
                stopLottery()
                break;
            case 3:
                continueLottery()
                break;
            default:
                break;
        }
    })
}
onMounted(async () => {    
    await initTableData();
    init();
    animation();
    containerRef.value!.style.color = `${textColor}`
    randomBallData()
    listenKeyboard()
});
onUnmounted(() => {
    clearInterval(intervalTimer.value)
    intervalTimer.value = null
    window.removeEventListener('keydown', listenKeyboard)
})
const urlpre=location.origin+'/ystest';
const isTest = ()=>{
    return router.currentRoute.value.query.activityId=="0";
};
const getLoadData = async ()=>{
    // const request = new Request();
    // const res = await request({
    //   url: urlpre+'/system/activity/prizedraw/'+router.currentRoute.value.query.activityId,
    //   method: 'GET',
    // });
    // return res;
    if(isTest()){
        return {"notPrizeDraw":[{"uid":"196758","name":"Object，","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/10/23/199995c4a85d4cdea3ca8aae100fdf71tmp_79691fc02cdb0e182bc8bbb73995d9ac.jpg"},{"uid":"1310","name":"钰烯Queenie\uD83D\uDD25","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/22/4d4d639aba7f47b58294d61f587b8446tmp_f2d30d57752dac12b1baf8fc72242982.jpg"},{"uid":"113590","name":"Sangel S","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/12/38bad41bfc9e4d09acb45650f83aa561tmp_5a82709e8d433a7f7182514a91b4d86d.jpg"},{"uid":"39573","name":"LYDD","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/09/0e81014e000f4dd7bdabdc3db9edaf3btmp_5d44a12fcd3de2eb351127e8c4a07dc1.jpg"},{"uid":"118371","name":"方","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/10/0b4209f64e074104a038c3a4182dfd72tmp_6bb1821e5b4f232383f39cb0b82557f4.jpg"},{"uid":"15424","name":"茱迪（姜鲜丽）杭州媛颂高级主任","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/02/57e3c39a30154961a9c2f3f023226b54tmp_6e805702fb33fd966659c9594fc4c6b4.jpg"},{"uid":"13505","name":"盼盼","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/14/0422ac45379b4009b9c70e74ede78cbdtmp_8930c7c2adf168eb54885fc60ba394ac.jpg"},{"uid":"42673","name":"23","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/07/cdc068318dc340ac8e9fe9be696b264etmp_899eeecbfa108e92bfa40155962c6a1a.jpg"},{"uid":"6128","name":"李子桐\uD83D\uDC96 （金凤）","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/15/bf15c635a3b04ebfbd0b29780a6d439btmp_9900ab5f1a09ac68d16194b1d98875cf1596db0d8c9290c3.jpg"},{"uid":"34459","name":"人生无常","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/05/24b2b5cc8e29448abe4e9c9470eaaf71tmp_637dcc0e90258273b06f8603096b3aff.jpg"},{"uid":"15369","name":"沙琳 \uD83C\uDF31","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/27/tmp_03d34a0e0f0f2b752aa55100309e59fb_20230727111654A629.jpg"},{"uid":"8571","name":"林","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/06/04/tmp_ed4f3990647a106c0114f31e765ebfff_20230604102645A510.jpg"},{"uid":"34609","name":"潘","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/08/6e162156bdb3411a9c2eff0984ac631btmp_0e436efc84a6fa417e882940b59cd54251e6e264bdcd561b.jpg"},{"uid":"58295","name":"feifei✨","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/06/92d9e43e9d38405893eb0dcf8a713813tmp_d02cb0ca151fc22f8301bf59982533b9.jpg"},{"uid":"2261","name":"木瑾","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/035d63ea91ad4113a80ad1e8c6dae42dtmp_c27d11a03a7bc895952be206a0e76658b734aba8618492b4.jpg"},{"uid":"58405","name":"茶茶","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/25/865b20ec5ec84b1dace913370f22748etmp_7110623be4bc8a1f6fc365df1e69c1c6.jpg"},{"uid":"155035","name":"哼哼哈哈","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/06/12/e813456d0406425f807a59a174cc7f10tmp_375004cbd7928195fefea669fe5d7f87.jpg"},{"uid":"43113","name":"Circles ᯤ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/15/6a4c4891b6a94a2886f8c6f05e08e17ctmp_81af8f5cb84cec0a289ec1b30254af2d.jpg"},{"uid":"32387","name":"张浩雷","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/29/cde5ba42aea14ad6afb8a76744fcfe5etmp_c84d4f1b99a6bd2092716aa8646352cc.jpg"},{"uid":"4217","name":"力","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/15/0844a65f4b5b4c7089fd992031752fc2tmp_6ca2b6cb4d020f26809e1f2de2beb633.jpg"},{"uid":"148027","name":"陈芹","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/07/71ede92e958d43de8adfe78dd54e4a06tmp_5ba492db2a6752853877905db33827db49e4e9c4d97dc7af.jpg"},{"uid":"17773","name":"ʚ涵涵涵ɞ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/07/6fc66d916e23440caad9700aeb126b03tmp_b946c7fdf0d7e215786d481846deb447.jpg"},{"uid":"22150","name":"Whisper\uD83D\uDC7F","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/06/13725e033ba546a6bfca4cfb9f7ada89tmp_0d34dee4fd1d87a08b42cfc2a2168664.jpg"},{"uid":"26220","name":"\uD83E\uDD81","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/06/165dc0e16f5f43ffb964697de78914a3tmp_96df82f0e7eae4dea6e44d50ec1f5f59.jpg"},{"uid":"13434","name":"华哥","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/20/tmp_e25129f9afbf4960928139d57418112b_20230720124500A201.jpg"},{"uid":"121213","name":"哆啦A梦kk","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/15/eb562d76a70b463d8c0322c8843420a1tmp_bfb20ebdf47b2ae653ef4ef5a60c5b4d.jpg"},{"uid":"124483","name":"SS","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/20/a08f79f8baa2484fb704a5cccab1001btmp_9b14ab57127fb35f1759f74f132ffa3c.jpg"},{"uid":"109290","name":"\uD83D\uDC7C","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/31/80d3d4d6e82a4a3285cbf882359ec553tmp_2fd3132ca57cea7f0accae4628eda5a2.jpg"},{"uid":"10161","name":"沐沐","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/08/8d6a256f47d046f9b3005a238a07e821tmp_9cb743523a351e5f04adf4938a234d4f.jpg"},{"uid":"1223","name":"娃子''''","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/30/5f0493d026a844d3b4e1342fd61235b4tmp_32cb577b31161df8b82434c87a876d40.jpg"},{"uid":"104471","name":"Ternura\uD83C\uDF88","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/06/a441aca7c08f4a9392ea3f71d336a059tmp_8a1959669d37d6ab53a8187a29bef82e.jpg"},{"uid":"127682","name":"紫光-阳焱","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/25/2f3081dba67c4be3afc5613040063598tmp_78595052b68b8990458d848fccee3482.jpg"},{"uid":"12595","name":"吴珊","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/31/4808926ec1e3427280ba55858acf2dcftmp_5abd75f0b5dfa519167facf4825c66698ef92fb95880a90e.jpg"},{"uid":"130968","name":"葛一婷","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/29/78e9e12aa9624d378328380dd6510a4etmp_a7ad7ff8716b3a66213622da8fbd9007.jpg"},{"uid":"49199","name":"杰^_^欣","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/12/ce4b1e458d2c4cdea4e0f3ec3d93fc44tmp_73804ae7ad99679e7672dfb6dc651072.jpg"},{"uid":"2919","name":"晓赟","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/18/a53351e23d13415b82d14083a9dbdf24tmp_7c7def60cdb29d252e511213ee644381.jpg"},{"uid":"59870","name":"Alex","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/16/91ee8a647ad4406fa3720ccd47b6aea0tmp_5af0d9da978874c3145191bda16a3535.jpg"},{"uid":"126467","name":"蚊子","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/23/cda848313e20488489b0465e320dc53ctmp_ff035d7e34ec1dc0f7b6edbb9d4090f6.jpg"},{"uid":"62864","name":"余","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/08/7b1a8d7cf4f64a7f96d98fe3247e61c1tmp_7deca15807d5a9b59901089c19e91990af9290abad3586be.jpg"},{"uid":"9460","name":"小灵\uD83C\uDF6D","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/06/10/tmp_58dbf5c5d1d0536619b51113ab0537be_20230610124358A194.jpg"},{"uid":"3092","name":"\uD83D\uDC44\uD83D\uDC44\uD83D\uDC44\uD83D\uDE1C\uD83D\uDC95✨","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/06/e494517b4c444115b620ab4d7b0d8f75tmp_daddb17c64a39537680532673c483779.jpg"},{"uid":"13370","name":"KK","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/20/tmp_266ac97e634bf37ee7026857bb7a8452d58d6b27afcf6809_20230720063338A077.jpg"},{"uid":"132010","name":"hhxc","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/9d9d91b5be4447a8b5cc21ff4af15a92tmp_6eac997d2ee6b92032fe7fc789d6d892.jpg"},{"uid":"37219","name":"Clementine Xu","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/09/3764bc9273c34fd29125d417e99dd62ctmp_3abc9dd4fe078e7ca5a97a9f5b4a0d7d.jpg"},{"uid":"32172","name":"仙仙","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/09/d151617c1c1d4bafa3a3364537a1429btmp_874e353f76c2167981c3cf96c61af33c824a81dc2186ea3b.jpg"},{"uid":"14484","name":"\uD83C\uDF42","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/14/aa5fc9cecca94017b00a6a425fc64eb7tmp_0d0e8aefe85401aa4eddab107f74fc4c.jpg"},{"uid":"987","name":"四月天","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/19/tmp_20d7134a95b091c5b3338fc8635410a1_20230719120827A656.jpg"},{"uid":"128498","name":"恩恩","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/26/9be6e8b4af564f3bbbe16f2d044ba28etmp_9d86ba5381330bc07e23e5b68ccb43694d1b9a749c8d7065.jpg"},{"uid":"56125","name":"韩小洋","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/15/ed7008173a2e47778adcfbb65196dfe8tmp_13df96893998f5b27462290da3cd99a4.jpg"},{"uid":"4282","name":"ᥫᩣ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/22/fb9da549ec1a422bbdd1e3e9e3fa0cf1tmp_1291edaf180181aed13e9d1b6aea863a.jpg"},{"uid":"131697","name":"H y、","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/b23546058d604a5c9564e33aefab8f58tmp_b1e97a38a5ae3a3326b4c65b93954e5a.jpg"},{"uid":"2094","name":"萍","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/09/9741ce6b8f2f41eeaf15fb03244f5fb0tmp_3dcac122c1e173e914d838368d9b7113.jpg"},{"uid":"1660","name":"聚泉","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/21/tmp_fec9a8357d3d1851a04e7b3e027ab33d_20230721154040A888.jpg"},{"uid":"112319","name":"\uD83C\uDF3A\uD83C\uDF3A\uD83C\uDF3Aヤ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/02/85f7fe5cad664589b17926563f699658tmp_0174a8788b64c98c30530bd678c2ceff.jpg"},{"uid":"18760","name":"Lucy","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/13/73694057c33e49efaeae02dec95ae44etmp_d6bfbc728447c6b5eff5f24028dbc88a.jpg"},{"uid":"131742","name":"RAHOYER","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/b13c95e0d8454223b2b61bf74e475596tmp_661a44ff7a8162b757e0e6315b144600.jpg"},{"uid":"89445","name":"\uD83C\uDF80ゞ寶ˋ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/25/612c43322ac44a1f80ac9e6e700ce47ctmp_d535f68622eb987afa675b155a163e22.jpg"},{"uid":"86250","name":"Ajun","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/24/a7e9dd91e216485489c4bae6865acabftmp_26cdd07cdd14dcdb0fe1c3cedfdf22c8.jpg"},{"uid":"84570","name":"Suntan","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/23/07569cc940c14805ad7c5d5cd0473310tmp_0f3bb069b0b0232d97a68c85aca31d0a.jpg"},{"uid":"5953","name":"祝莹莹","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/25/4a0f58035c084aa996c1bf6a9c08b17btmp_b175156e44508067204f94ec8afa054db6565545751ab0f0.jpg"},{"uid":"23964","name":"风铃","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/24/d80ac0f80ca64ed5bb74e43a96dbce97tmp_87841f63978d6dbe5cfcb122e71fbc94.jpg"},{"uid":"21187","name":"崔刚","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/11/28/feaedcf68e514d39a4652e270122ab72tmp_13bbf37193a9f9f5ff99370440f09501.jpg"},{"uid":"32753","name":"小慧","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/08/e90c0e5a33a440eaa0908f07247c1d40tmp_b5ee04090ca1c6c97b0e7feb7e7265ef.jpg"},{"uid":"17006","name":"钱女士","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/31/tmp_c8517aae0980a790125536ee730d1f98_20230731103506A289.jpg"},{"uid":"31408","name":"王","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/07/41dedc7034f443eeace09d7d3ed23839tmp_809ebb5fd2c02ce611fb9ab8d57aaecc.jpg"},{"uid":"55787","name":"小爱Sieren\uD83D\uDD4A","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/15/a8c6df0e9b6b4cddbc07b1e8dc9c5f05tmp_5532864fd60ec1f7a54f443a562316b7.jpg"},{"uid":"104548","name":"余兴未尽","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/11/30/a2fc23a4cafa444b8504039b04347052tmp_704c578394104957db7e4181fdd38bfcfed4abb53cb99dae.jpg"},{"uid":"124154","name":"曾小妞","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/19/1b7029a52a6c445189e5a18bea6c9ff6tmp_38efb7b623995fc906f22ee07cb3c5a7.jpg"},{"uid":"112699","name":"格格","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/31/42f9e5a1ec7845b78b4150ead2cbf9bctmp_14849fa7a9946a95eef521ac073ac7d9.jpg"},{"uid":"36514","name":"\uD83C\uDF40锐R..","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/27/7744162db7fe48f29b8b5d18ca990781tmp_a016b3d1ae3eef84aebf3eac0c2ff5c6fb2324b173fc172e.jpg"},{"uid":"132677","name":"Apple\uD83C\uDF4E 666","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/31/37a2b12b158d438a84244ab540366b87tmp_9b658900ea1cc5dcc78ef20046cadede.jpg"},{"uid":"54144","name":"体会","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/19/673f3e1ab1104612b14e123be39fdf3atmp_bf48b9e51d088ebe41d4d773d2cfc50bc77addd36fbf684c.jpg"},{"uid":"13238","name":"Ali","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/19/tmp_692b4d5259de6603ab2321ca39e2bbbef7e453a433c334d3_20230719133930A753.jpg"},{"uid":"15085","name":"薄荷茶","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/26/tmp_c52605b242647d26d871ab153d6efdcba5c51ccb472c1178_20230726113550A090.jpg"},{"uid":"132073","name":"爱娜","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/16963980be0e4485ab385b907f5b1b0btmp_1c368d04807e799a4569d5ea09760ba3.jpg"},{"uid":"15817","name":"\uD83D\uDC93巫彦霖","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/19/8edc8fc264cd41998ea9749977cc48ddtmp_618ac78d18f23a1271bc7cb46ff5f479.jpg"},{"uid":"62646","name":"秋兰","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/05/95ec70e8f4d34320ace30b67533bc63dtmp_0ec78e59b652ef2c51b3073ac14e8010e105a09206049a85.jpg"},{"uid":"145769","name":"魅力艾西西","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/06/a90b886465dd4316a482eea929c21742tmp_8be7bd474bdf13567c6429dc59985c33.jpg"},{"uid":"57337","name":"Y","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/15/3ee321e6bc3e4c1cae8412e6fb4396bftmp_425bc95d3731101bb12c8d59c638b0ee62c6d5e201d85829.jpg"},{"uid":"8010","name":"Iris--高妍值","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/11/11/129b517290b643f792ad2b2ea5dcd054tmp_0027f4a51a751a53c7ff855b71b8ceb8.jpg"},{"uid":"111676","name":"\uD83D\uDD06百宝屋","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/31/a8d5f345962a48de8cf22bf4463f5dectmp_1eb273964dffdd9d8ae6a400f17328f5.jpg"},{"uid":"42128","name":"Tu.peach","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/10/a939ea8fcc454caaae19c5b31d8a3815tmp_1917e438cc3463ac3c424e79752661b9.jpg"},{"uid":"55665","name":"\uD83C\uDF40斯斯\uD83C\uDF43","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/15/1d2b282c39dc4b3296dce434866e1fdatmp_d66a5b38150d0df61b96819898df5316.jpg"},{"uid":"128607","name":"爱笑的豆豆","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/26/9da2268675714712891ebd4c9242d42ctmp_86d3a4b0cca411a3e2fb61eb3216d746.jpg"},{"uid":"52217","name":"盟盟细雨","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/14/0447151e02b446e9b04c71480ef8f80ftmp_10bbc20d291b03287a447af96044b83f.jpg"},{"uid":"12327","name":"ZwSeven","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/16/tmp_f1b3f9bc2dd1f4daa2ebee8f13976779_20230716194025A629.jpg"},{"uid":"14400","name":"何玉玲","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/24/tmp_af12a688baa19b499bc58b8fe1d942d0_20230724105105A449.jpg"},{"uid":"12839","name":"Echo","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/19/512ce9296dd14e5ebd05f13816f2bd1ctmp_aeaa39af0300fefc0c74bfe7cc321807.jpg"},{"uid":"22341","name":"姜姜","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/04/tmp_265b3a7f8ee551fcdcb05b51cd022e55bc536a8a9cb9739c_20230804145009A192.jpg"},{"uid":"42214","name":"ʚYyɞ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/11/12/54eb696ba4044a148bbee1a8d874881ctmp_3d54436dd049aea36b0df198235beb5e.jpg"},{"uid":"460","name":"Elaine","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/31/2a72d382d1504b52a521f7ce0cd9056dtmp_95a6fc57e79f10083745c6d85864c74c.jpg"},{"uid":"80613","name":"sally(MZ crystal)","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/22/1011d75880de4827a581241cb5fa62f1tmp_01c64d3245fcef40668bd30141d33379c661d849fe02ccd9.jpg"},{"uid":"12269","name":"d@珍&嗎","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/16/tmp_34e404c066867eb093ed125747ff12fcfcf1e9f3743c4ec4_20230716170202A487.jpg"},{"uid":"4977","name":"王萍","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/26/9e12516d33064b55b4c1d23da5f6eda9tmp_7f81b6ea3294e8df811304d72ae23be1e0c4bd163d612eb1.jpg"},{"uid":"131838","name":"\uD83D\uDC18","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/ce9e8bcdcb774c408cc7b6895db80e0etmp_50d3aa93d38933569cf01afb74af00ed.jpg"},{"uid":"22799","name":"何雲同学","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/13/10e2f0a3a27545739a3901bed4a092b3tmp_619b20a9902ba93c8616880f9ac93a49.jpg"},{"uid":"80094","name":"兰妹\uD83D\uDC9E","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/16/be2f2d53bdbc4ca086e9ead198f2f82ctmp_4be0426760dceebdc713ddd9203f3f28976ebbdeebbe46d3.jpg"},{"uid":"148527","name":"陈珑娟","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/07/5aa01357a5434074b58f2870155158f0tmp_9d22b7d4ab7c11a6262825ab623bab56af9f677ddf848bd2.jpg"},{"uid":"85730","name":"叶 仙美","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/23/29a61cc0cb0d4d85817836f259e07885tmp_c8a1d6715ad6612329e7dc839f8247f3.jpg"},{"uid":"130050","name":"RR曾炜桂","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/08/ad951bfb79144502b2c25b5365eb1c0btmp_4ad6f2eca23f43fd7a26b19697d82991.jpg"},{"uid":"115607","name":"12-day.","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/11/aee5d4eada5e45bb8731d27dfc2b2a2ctmp_818330c1f725573c3fed72808dde52d9.jpg"},{"uid":"128542","name":"张 娜娜。","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/26/ba35a0c7d9124f90a0fae74b7597711etmp_0e1ca2bcfe918671186a356e5e886667.jpg"},{"uid":"56326","name":"Monica","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/15/c31d8043fa0c48599377636d982bca90tmp_78e8d45437765dff3844d2f392037066.jpg"},{"uid":"40690","name":"熙熙\uD83C\uDF40\uD83C\uDF40\uD83D\uDC51","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/01/24/849fed8d3e414176b50e06a47a0d1aa5tmp_51c52bf4475d21420ef635ca4dc231cf.jpg"},{"uid":"13332","name":"E^^宇宁","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/01/df11780de059421ca4b95030f9c6d7eatmp_15de7845d9fb557bb5bbd5ae4804b05b.jpg"},{"uid":"115160","name":"薇薇","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/15/964573c80f0e45c7a7d123374a164871tmp_f55cb20e7bbb6097a1e04148e65b160abf77908f57e56c28.jpg"},{"uid":"41467","name":"Vivienne","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/10/0fa1b6bf01d54408876c6502fd4b4d50tmp_d9a9c6dc5ec0da5b25fa45a0c9cbcc62d46e11d59761f38c.jpg"},{"uid":"51665","name":"宁次","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/13/e2ba043aac5e4cd8a665fa3aed29d2a6tmp_379cbad0e3231505c78ee11e67fe57d7.jpg"},{"uid":"18340","name":"zz","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/02/tmp_bd0682b0d9769053ab1b7cea42fec240_20230802102342A005.jpg"},{"uid":"92024","name":"肆月","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/26/9fdfca46bcd04028a428c8fb37482450tmp_0f98ecfe02e693315a8c490697c2c483ad68d618edc1754a.jpg"},{"uid":"130463","name":"图图吖\uD83C\uDF53","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/28/2057f2b0d73c4f8c895e17ce1e6937dftmp_25e3e6f06b9065345d895a1ad81ca39b884e11e9a8a072c8.jpg"},{"uid":"99890","name":"蓓","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/28/2176b616b26e4bd89c7cce30c7e824ebtmp_8604164aef12ab7ab86e10a8f592995f.jpg"},{"uid":"1731","name":"Tina","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/12/0d211a3308e247f081d4be3ce65a7076tmp_06c55a3843b3228f87421bd132cad54935dd4ec9c9b06061.jpg"},{"uid":"22806","name":"cuncun","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/04/tmp_93583b894484e9ddfb8c772f5e01e4ed_20230804172538A646.jpg"},{"uid":"29141","name":"可可","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/08/3c570110aa5042c3820818606c5b84ebtmp_1e2958c79fc311320fe87d39d3306108.jpg"},{"uid":"44913","name":"ృ༊·惢愛ོꦿృ༊\uD83D\uDC7F","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/11/ebb61b7648aa499fa1305428f593389btmp_c2c9f88a6521c33efbae71811a3480c0598ee7ce1f0b5313.jpg"},{"uid":"16556","name":"宁静致远","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/13/ffa89a3d37524d539fdece44bd344672tmp_2e17846ebf5f2c2150ef6116bf626642cbb54d2c0a6592cf.jpg"},{"uid":"5745","name":"暖阳","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/20/14d858dafa8543a5910b4104b865a6dftmp_2914ce5fa6c02b637cae15f0e5920425713dda155ed8f369.jpg"},{"uid":"72409","name":"...","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/27/cc961275ba034818a738cb3979f54e6btmp_248d04e460b5698b1efe398ec064ec6d.jpg"},{"uid":"140670","name":"五月","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/29/96456ae745c44168a0138d40516f89e3tmp_c5a2ed3d1ecca32709f01f0916871fd6.jpg"},{"uid":"3814","name":"欢","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/06/11/tmp_5a3131881ba2b5ea11c93b00e1c61e98eb612264d40799b4_20230611165637A495.jpg"},{"uid":"12452","name":"\uD83E\uDD0D","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/17/tmp_3da6b93d5a26914d323fb71eb16019aa_20230717113449A921.jpg"},{"uid":"117233","name":"天蝎容\uD83D\uDC33","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/07/7b7b0aa0f4a24c3781b150bfe9207adetmp_9e16ac4583c866f2bb9e64c8c192a440.jpg"},{"uid":"123346","name":"丽君（王俐雅）米青","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/18/50e44bf64df1490387d68b1b7ee84ccatmp_b16db6d09b3f02bea0aebeabf9427693.jpg"},{"uid":"15857","name":"魏娇","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/28/tmp_2851f70c795185cd2003d57be21e652b_20230728165943A692.jpg"},{"uid":"11784","name":"\uD83E\uDDF8ྀི  Anonymity","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/01/22/d1857cc7b7264382816b2f8a33367f73tmp_6a4f391019610cc01fb51dbff8d9373630616bb8c014cd20.jpg"},{"uid":"97523","name":"照桥圣佳","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/26/e3f38de8544e4c67a597bba064b214eftmp_a916c9d647b58a465e63c949e2c28e26.jpg"},{"uid":"26715","name":"何金励","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/06/9f72817f17e2477b9f080fd13ce6f09atmp_0c9f20cc689fd7f342400c908df2eb0edc2e89276ec14ccf.jpg"},{"uid":"55813","name":"时之名","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/15/2d2180056c1b4bb89980b33e1d772f82tmp_137c37d8ba734efe45596dc5e9cd6f09.jpg"},{"uid":"102917","name":"阿狸狸 Kelly","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/29/142655a1e3fe4037a3f73c3c397b8833tmp_5de92ab5603efe7b910d3fe388308369.jpg"},{"uid":"18815","name":"Sandy","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/02/tmp_b7c814f91e52b81e93820d625212536ee07776e3140d6adb_20230802150442A060.jpg"},{"uid":"125145","name":"易","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/21/48b6201699c84f1b8aa4e29c1cb72247tmp_341747e01fb36b90b192916d7ef3f844.jpg"},{"uid":"6036","name":"Lisa\uD83C\uDF4A","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/07/ba7470df27db4eba8000315e84f392e8tmp_2ca4f04e10596c7c7a9028428f48a61c.jpg"},{"uid":"13821","name":"solo lu","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/21/tmp_5b001de65aab11ac0f49f86989fccc47_20230721180650A066.jpg"},{"uid":"18143","name":"赵丹","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/01/tmp_6f4b591e83c531623a35388c1fe25443_20230801162428A515.jpg"},{"uid":"30938","name":"李亚婷","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/01/30/d70b700127b64d9caf8432fcdf7701eetmp_6483241bfab859cbd71d958b08ea0ae2.jpg"},{"uid":"45674","name":"曾曾","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/11/8577206947374be3a6f7c656eed2453btmp_d3f046fc4bc6d499bdffbb339fb1c0a4.jpg"},{"uid":"45989","name":"垚钱树","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/11/0b39f6a27c294db4b16c52b2eea82b2atmp_56df14150ac8ef76dd1f5ff49bf60e5b.jpg"},{"uid":"28002","name":"\uD83C\uDF08ིྀ臭屁果专用饲养员\uD83C\uDF08ིྀ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/06/b22a259a5ea647f3ae0c018475c28d57tmp_5f5fd8a58cab5425d9a274e85aba4e5e.jpg"},{"uid":"8667","name":"阿咧","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/06/04/tmp_c7fc078e23c4b35802dab0c7339b9076_20230604154122A762.jpg"},{"uid":"109548","name":"顺其自然","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/31/7a09808e24ba4b6596998e311a081661tmp_b44878d455f24059bad38c9a74aa7367.jpg"},{"uid":"69903","name":"\uD83C\uDF52 利群","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/08/15d98a5539a24f82a4c19720381c7ca5tmp_d3f6402d262b2e2867beef0efef37628.jpg"},{"uid":"30790","name":"嬌糖布丁丁","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/10/8fd67363e8d3481ea3f50efd7f22cdfdtmp_74cdc1a951dfe72b0feecf02fb025624.jpg"},{"uid":"12398","name":"静待花开","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/17/tmp_265cfcd4143305c22ba326493cbc8c0f_20230717104033A794.jpg"},{"uid":"24687","name":".","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/05/tmp_ff866635e638e3cbfbd81bd454eaf8af_20230805160531A784.jpg"},{"uid":"36630","name":"米粒","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/02/29/183473bb4a7148739c7b479c5ccb34eatmp_b6486c0e6e04fb49a3d06016a8366b2f.jpg"},{"uid":"26998","name":"May","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/24/dafb9b29c1c24a3f970ce66e1961be6etmp_566fb854ec974aaa7cc9fae9eb8a01b7.jpg"},{"uid":"126362","name":"michelle郑","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/23/e9bbcb6c26964bd59ed793c2ff60edb7tmp_f468a2baa0125a35d1c66ff6c05d354b.jpg"},{"uid":"118176","name":"易丫丫","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/08/478c485dce27439e9503c7383e6a836ftmp_3c8c2cd36a5df18eb54e949d897ce483.jpg"},{"uid":"4391","name":"Pi","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/04/tmp_05d7490562e0b22520d849f45f58a34b_20230804123920A932.jpg"},{"uid":"47827","name":"11","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/11/15fe6e8a83da4df4a43a073abbd75359tmp_a2bd76f5a20b70d84b05a70c98371bb7.jpg"},{"uid":"100084","name":"叽咕","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/16/55eb30abc1224c35974c0c686576c5betmp_6f9b1977e68d2ba37b15678265cbb4c8.jpg"},{"uid":"126258","name":"Nina","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/23/b8a1b0a6875a42ea867790cd3dd5ad05tmp_4670fb56910e55161be36d381107a29a.jpg"},{"uid":"36007","name":"\uD83D\uDC2D \uD83D\uDC39 \uD83D\uDC31","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/09/ba2a0807ab764e278f8ea9cc3ec4282dtmp_cf48af6395e3c64ae2ef3abacba41d0dae834971d8a11972.jpg"},{"uid":"43857","name":"葡萄大魔王\uD83C\uDF47","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/16/d2af23146baa4bc6a196e3f2f9b3957atmp_e58f2b224e49f144751c3100ed004dab.jpg"},{"uid":"102325","name":"红","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/02/8041890fe19e403199cb3a5fa59ae53btmp_27dec6182df858771ee624d29dd80a0d.jpg"},{"uid":"99231","name":"顺子羊","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/26/75bc0f9f383b490684155edb926ba361tmp_34c1c50003061a33a1463067af51be0e.jpg"},{"uid":"1011","name":"戴翔娣","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/01/03/7388822bd3974785971bd9623a9fd7d6tmp_eaa5c5e7062664546e2c385e51790f86.jpg"},{"uid":"1253","name":"卢文君","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/28/f5af2b3ceb1641b78b65b91942c5d73btmp_aa95dfe91289ea2fb01ca6fcc97275d141d15877f4319635.jpg"},{"uid":"132411","name":"Eric.zhou","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/31/625fa6ddb8b14f1388fb4080e28ee1adtmp_4a446cf48d79ea40bcc0008dd4f4849a.jpg"},{"uid":"125454","name":"烟雨行舟王疆","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/22/4bb0c31bdd4a4ec985aa7144ebca82c9tmp_cfe8536edaead196e4483c8ca08c90756aac6fb671ae1ab0.jpg"},{"uid":"68369","name":"YE.Y","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/18/b73df7cc4f504a11ba91474a15a3d3a7tmp_85fefad64f63aecfbbae0ba35f89327b.jpg"},{"uid":"16236","name":"一一","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/02/28/bd507a50acea459286eeb568ede6f935tmp_06bc5e00ab6f1bd361d090cdef884cc5673a24db754bd14f.jpg"},{"uid":"8635","name":"李玥燃","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/04/92deb446562b4725a941a53d0ea48cbatmp_f0d35243d2d6ca0b28257745ce364fd9b94542afaae32ffe.jpg"},{"uid":"27480","name":"\uD83E\uDD93木子音\uD83E\uDD88","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/02/26/8264006d749c4bf3927b125200027c3ctmp_fe3b423f450e0b54e230c3633e060720.jpg"},{"uid":"24450","name":"Aimee（虫子）","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/05/tmp_535d8fbfca6401e02f0030e85d52bb3c_20230805144330A067.jpg"},{"uid":"5718","name":"Ruby_曦文®","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/17/52f43b8aab4b4b61af1ff3a77be1f72btmp_f0195dabf31a0d955c381b4bd60fb9aca66f2ebd5394e813.jpg"},{"uid":"16179","name":"S/arae","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/29/tmp_b9bc6ba6ac01595f1959d7057f8d555f_20230729152836A448.jpg"},{"uid":"138522","name":"珈珈","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/12/13/30822c317a3a4bbea5ba67e41d720e7atmp_4ebe6a9a47b08b636507fd05da37e7941fa5109e9b212f5c.jpg"},{"uid":"129716","name":"娜娜MiKi.BB\uD83D\uDC9D","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/27/7f75819475ad4f76b5a0563e242d3a1ftmp_56108855a8381ac4cbaded231f16409c.jpg"},{"uid":"8455","name":"YS_NAMUDA","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/06/03/tmp_b7c72912c909b9303fe20d5f45cdbade_20230603154813A229.jpg"},{"uid":"145046","name":"Carol ","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/02/d101e251df3b41eebfdd1bbb6e9fd6f9tmp_bb068bfad09c94408c959d1ca2fe6d1d.jpg"},{"uid":"113429","name":"亦然","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/25/05e05e2a703c4c3d8f8150224387786dtmp_9966fdad00f70335da6cc7a4b0fbede5.jpg"},{"uid":"121142","name":"\uD83D\uDC1B","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/15/103edf90175b4109800980b2c0378cd5tmp_901ab58d85d45562186d5723b029c472.jpg"},{"uid":"9646","name":"Vunyain","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/06/12/tmp_12008961e67b56848d18055d0bef63be_20230612131339A037.jpg"},{"uid":"24381","name":"NAN\uD83D\uDC97NAN","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/09/bad8fca8f33443148d5412336d959770tmp_61c700893e0807053c998b5145cd2228.jpg"},{"uid":"23850","name":"馨儿","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/06/563bc5ab8a6e4c4d9db8f475d156a10ftmp_0f95754819e2f410e069fbacf2202e0781de4a548ccd7d05.jpg"},{"uid":"18200","name":"珍惜现在","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/01/tmp_9aa4fc15c8307ad36d9e0e024966469f18c61f4c992bf433_20230801172338A111.jpg"},{"uid":"125402","name":"Ji基仔","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/22/dec2d59f6d5b4b0c8501a0af5fb54f2btmp_7e5d66364a405bc2d61b81878a17681c.jpg"},{"uid":"127974","name":"胖子","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/25/f884696212004414aa4ce1fa81585088tmp_125f83a44d59c0767610ca99d36494f5308b28511e7f1bc1.jpg"},{"uid":"117181","name":"茧","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/07/51f32b34f4be4f93a1a1a649a99b185ctmp_ea72b9582c87c09b44477c335d051695.jpg"},{"uid":"33019","name":"AAAAAA邢敏-15196138801","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/23/045ecdb69e2c408aaa5a9dd246919408tmp_6b06cd1bc7b63a62e42aaa46adee3f1f1896dea37fc68e98.jpg"},{"uid":"13066","name":"姜守美","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/18/tmp_e71e1fd8ba04e5de9cd02f7214420ed9_20230718163211A342.jpg"}],"hasPrizeDraw":[{"uid":"14810","name":"飞飞","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/25/tmp_76e0319ec4ca5036cd349ff52a43f581_20230725120003A401.jpg","prizeName":"钻石童龄线单次"},{"uid":"116265","name":"ccccnq","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/01/28/c28e27adb1de44d68d85fdb8f2b7937atmp_9eab1f7025a6c77df6c832e07605fcf4.jpg","prizeName":"新天后单次（不含额头）"},{"uid":"142964","name":"宋家大小姐","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/01/24/719e6dff1afe4ef08395ca0f00ae7bd5tmp_1f97205d576d56a7676ad011025261cd.jpg","prizeName":"钻石童龄线单次"},{"uid":"119341","name":"晓红","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/12/94bcb4a200074a5ba592bd35a37a92a0tmp_7213c53ed619d346c92645c7e70c92437a6b292fd9b9822c.jpg","prizeName":"钻石童龄线单次"},{"uid":"66161","name":"小v","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/25/616f66053d2d42489f265ba1fd2c1fd7tmp_0e275d33ef76b36db198866cd579a71ceaa059fcf38ecd4d.jpg","prizeName":"钻石童龄线单次"},{"uid":"3017","name":"三颗钻","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/13/d48b26799e6244fdbba598ddcefd3ffatmp_e52e258cfab2cddd0cb0dd5c9726956d.jpg","prizeName":"钻石童龄线单次"},{"uid":"18110","name":"钰然·醉香丝","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/08/01/tmp_8852c64fab5293ffa610b19d5e46f352_20230801155847A427.jpg","prizeName":"测试奖品"},{"uid":"55488","name":"Vincy-茜","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/20/67f580c91a1b4b719d4a5e601189ca63tmp_d0fe1be84171452300675cbfb94067f0.jpg","prizeName":"新天后单次（不含额头）"},{"uid":"52023","name":"cici","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/18/e8a3f6ee65d0442fb646989d57afc2b8tmp_c264ec8725267f2e290cf9728f4b8331.jpg","prizeName":"钻石童龄线单次"},{"uid":"115828","name":"A-西安卓雅-胡鑫","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/09/27/6739c13915974e0ca23fa071753fbc7etmp_133f5de23692b2c65596e789fb651d92.jpg","prizeName":"钻石童龄线单次"},{"uid":"104952","name":"Abby～\uD83C\uDF77","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/17/e5a164b397584383b7332db3fd0d3047tmp_7a4d5d7a144ba27ca8e5f1df047d0f2aeeae37381e027a48.jpg","prizeName":"测试产品3"},{"uid":"101924","name":"沧海一粟","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/4b1c6d90ca1545d5882e671d43b68efctmp_ee6615d77a8150fa9199cd4aede8c20205781bf261c21a7f.jpg","prizeName":"钻石童龄线单次"},{"uid":"151357","name":"孙伟","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2024/03/09/03dc739b25bc49488d5da2e478497655tmp_9dfdfa941c04587226136770ef58a6cc8b01b2f1e08c6510.jpg","prizeName":"钻石童龄线单次"},{"uid":"15311","name":"谢佳玲","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/26/tmp_82537cf3bff80cb9c7aa5c0948e17193_20230726214542A508.jpg","prizeName":"新天后单次（不含额头）"},{"uid":"55197","name":"爱羽彤","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/30/da70833b0dab4e97b1c72bfc01202db1tmp_96190adfb8d866bfaddc304ad472f47929f8380ac4364686.jpg","prizeName":"钻石童龄线单次"},{"uid":"129439","name":"Carey金侃蕊","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/27/7e31116dea154931815b3575063faf00tmp_3d069c099110411f2bbaffa49b6899bb.jpg","prizeName":"新天后单次（不含额头）"},{"uid":"14940","name":"小鸟","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/25/tmp_e6b9012cdd4e22d418db95e37b27e99bad126a700e07867f_20230725154117A709.jpg","prizeName":"新天后单次（不含额头）"},{"uid":"78204","name":"椰叶\uD83D\uDC8B","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/21/939abcd6296b49e9ab0ebcccdd964fdctmp_766c7370e696102f67c7dc9df20db9c6.jpg","prizeName":"钻石童龄线单次"},{"uid":"130648","name":"李俊","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/10/29/89be8bafffb94a45a4263d0e8a042731tmp_d9dc5d359576d0356d43965c80dc3b68.jpg","prizeName":"钻石童龄线单次"},{"uid":"58509","name":"biubiu","headPic":"https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/2023/08/16/16519c271abb488a9437b1f37ecb042etmp_a24fdb333beb600dd418dee826a47c53.jpg","prizeName":"新天后单次（不含额头）"},{"uid":"12277","name":"知止而乐\uD83C\uDF37","headPic":"https://mpg.zhenyansong.com/ys/profile/upload/2023/07/16/tmp_031a10f2d578d529e0a204fd2c34e360_20230716171739A500.jpg","prizeName":"新天后单次（不含额头）"}]}
    }else{
        const res = await request<any>({
                url:urlpre+'/system/activity/prizedraw/'+router.currentRoute.value.query.activityId,
                method: 'get',
                withCredentials: true
            });
            if(res==null)return null;
        return res.data;
    }
}

</script>

<template>
    <div class="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 left-1/2">
        <h2 class="pt-12 m-0 mb-12 font-mono tracking-wide text-center leading-12 header-title"
            :style="{ fontSize: '45px', color: textColor }"></h2>
    </div>
    <div id="container" ref="containerRef" class="3dContainer">
        <div class="lefttitle title">参与人员({{allPersonList.length}})</div>
        <div class="righttitle title">中奖名单({{hasPrizeDrawList.length}})</div>

        <div class="renyuanparent renyuanparentleft" :class="{'renyuantop':!lowzIndex}">
            <div class="renyuan renyuanleft">
                <div class="renyuanitem" v-for="item in allPersonList" :key="item.uid">
                    <div class="headpic-c">
                        <img :src="item.headPic" class="headpic"></img>
                    </div>
                    <div class="name">
                        {{ processNickName(item.name) }}
                    </div>
                </div>
            </div>
        </div>

        
        <div class="renyuanparent renyuanparentright" :class="{'renyuantop':!lowzIndex}">
            <div class="renyuan renyuanright">
                <div class="renyuanitem" v-for="item in hasPrizeDrawList" :key="item.uid">
                    <div class="headpic-c">
                        <img :src="item.headPic" class="headpic"></img>
                    </div>
                    <div style="flex:1">
                        <div class="name">
                            {{ processNickName(item.name) }}
                        </div>
                        <div class="prize">
                            {{ item.prizeName }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="menu">

            <div style="margin-left: 25.7%;color: rgba(255,255,255,0.8);font-size: 22px;font-weight: 400;display:flex;align-items:center;">剩余待抽奖{{notPrizeDrawList.length}}人</div>

            <div class="start">
                <button v-if="currentStatus == 1" class="btn-start" @click="startLottery">开始
                    <div id="container-stars">
                        <div id="stars"></div>
                    </div>
                </button>
                <button v-if="currentStatus == 2" class="btn-start" @click="stopLottery">停止抽奖
                    <div id="container-stars">
                        <div id="stars"></div>
                    </div>
                </button>
                <button v-if="currentStatus == 3" class="btn-start" @click="continueLottery">继续
                    <div id="container-stars">
                        <div id="stars"></div>
                    </div>
                </button>
            </div>
            
            <div style="margin-left: 8%;color: rgba(255,255,255,0.8);font-size: 22px;font-weight: 400;display:flex;align-items:center;">
                单次抽<input class="luckyCount" v-model="luckyCount" @input="changeLuckyCount"></input> 
                人</div>

            <div style="margin-left: 8%;color: rgba(255,255,255,0.8);font-size: 22px;font-weight: 400;display:flex;align-items:center;">
                隐私保护
                <div style="margin-left: 10px;" @click="changeHideNickName">
                    <div v-if="hideNickName" class="hideNickName" style="border: 1px solid #FFFFFF;background: #FF2100;display:flex;"><div style="flex:1"></div>开<div class="circle" style="margin-right:3px;margin-left: 8px;"></div></div>
                    <div v-else class="hideNickName" style="background: #BCBCBC;"><div class="circle" style="margin-left:3px;margin-right: 8px;"></div>关</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.hideNickName{
    width: 70px;
    border-radius: 55px;
    font-size: 16px;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    height: 30px;
    cursor:pointer;
    .circle{
        width: 25px;
        height: 25px;
        background: #FFFFFF;
        border-radius: 25px;
    }
}
.renyuantop{
    z-index: 10; 
}

.renyuanparent{
    height:61%;
    position:absolute;
    top:26%;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
}
.renyuanparentleft{
    width:20.5%;
    left:3.2%;
}
.renyuanparentright{
    width:23%;
    left:73.2%;
}
.renyuan {
    padding:20px;
    display:flex;
    flex-wrap: wrap;

    .headpic-c{
        overflow:hidden;
        width:var(--headpic-width);
        margin:auto;
        //border: 2px solid;
        position: relative; 
        padding: var(--headpic-padding);
        display: flex;

        .headpic{
            width:var(--headpic-width); 
            height:auto;
            aspect-ratio:1;
            object-fit: cover;
            border-radius:50%; 
        }
    }
    .headpic-c::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url(../../assets/images/headbg.png);
        background-size: cover; /* 让背景图充满容器 */
        background-position: center;
        z-index: -1; /* 将背景图置于图片后面 */
        border-radius: 50%; /* 背景图的边缘也保持圆形 */
    }
}
.renyuanleft{
    .renyuanitem{
        width:var(--renyuan-width);
        padding:10px 1px 10px 0px;
    }
    .name{
        font-weight: 400;
        font-size: 22px;
        color: #333333;
        line-height: 30px;
        text-align: center;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
.renyuanright{
    flex-flow:column;
    .renyuanitem{
        display: flex;
        flex:1;
        flex-direction:row;
        padding:3px 0px;
        margin-bottom: 20px;
        .headpic-c{
            width:var(--headpic-width);
            margin-right: 3%;
        }
        .name{
            font-weight: 400;
            font-size: 20px;
            color: rgba(0,0,0,0.5);
            line-height: 28px;
            text-align: left;
            padding:4px 0px;
        }
        .prize{
            font-weight: 500;
            font-size: 22px;
            color: #333333;
            line-height: 30px;
            text-align: left;

            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}

#menu {
    position: absolute;
    z-index: 100;
    width: 100%;
    height: 56px;
    bottom: 3%;
    text-align: center;
    margin: 0 auto;
    font-size: 32px;
    display: flex;
}

.header-title {
    -webkit-animation: tracking-in-expand-fwd 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) both;
    animation: tracking-in-expand-fwd 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) both;
}
.title{
    position:absolute;
    top:16.5%;
    width:15%;
    font-weight: 500;
    font-size: 22px;
    color: #F7F7F7;
    height: 10%;
    letter-spacing: 1px;
    text-shadow: 0px 3px 4px #FF0000;
    -webkit-text-stroke: 1px #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
}
.lefttitle{
    left:6%;
}
.righttitle{
    right:7.2%;
}
.start {
    // 居中
    display: flex;
    justify-content: center;
    margin-left:6%;
    width:15%;
}

.btn-start {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 280px;
    overflow: hidden;
    height: 56px;
    transition: 0.5s;
    animation: gradient_301 5s ease infinite;

    
    border-radius: 35px;
    border: 4px solid transparent;

    background-image: linear-gradient( 90deg, #FFE8E0 0%, #FFF7EA 44%, #FFDCD0 100%),linear-gradient(180deg, rgba(255, 152, 44, 1), rgba(255, 36, 36, 1));
    background-origin: border-box;
    background-clip: content-box, border-box;
    -webkit-animation: pulsate-fwd 1.2s ease-in-out infinite both;
    animation: pulsate-fwd 1.2s ease-in-out infinite both;
    padding:1px;

    font-size: 30px;
    font-weight: 500;
    color: #FF2100;
    line-height: 42px;
}

.luckyCount,.luckyCount:focus,.luckyCount:active {
    outline:none;
    color: rgba(255,255,255,0.8);
    font-size: 22px;
    font-weight: 400;
    text-align: center;
    width:33px;
    border-width:0 0 1px;
    border-bottom:1px solid rgba(255,255,255,0.8);
    padding:0px 5px;
    margin:0px 5px;
    background-color:transparent
}
strong {
    z-index: 2;
    font-family: 'Avalors Personal Use';
    font-size: 12px;
    letter-spacing: 5px;
    color: #FFFFFF;
    text-shadow: 0 0 4px white;
}


.btn-start:hover #container-stars {
    z-index: 1;
}

.btn-start:hover {
    transform: scale(1.1)
}

.btn-start:active {
    border: double 4px #FE53BB;
    background-origin: border-box;
    background-clip: content-box, border-box;
    animation: none;
}


@keyframes animStar {
    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(-135rem);
    }
}

@keyframes animStarRotate {
    from {
        transform: rotate(360deg);
    }

    to {
        transform: rotate(0);
    }
}

@keyframes gradient_301 {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

@keyframes pulse_3011 {
    0% {
        transform: scale(0.75);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
        transform: scale(0.75);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
}

.btn-end {
    -webkit-animation: pulsate-fwd 0.9s ease-in-out infinite both;
    animation: pulsate-fwd 0.9s ease-in-out infinite both;
    cursor: pointer;
}

.btn-end {
    --glow-color: rgb(217, 176, 255);
    --glow-spread-color: rgba(191, 123, 255, 0.781);
    --enhanced-glow-color: rgb(231, 206, 255);
    --btn-color: rgb(100, 61, 136);
    border: .25em solid var(--glow-color);
    //padding: 1em 3em;
    color: var(--glow-color);
    font-size: 15px;
    font-weight: bold;
    background-color: var(--btn-color);
    border-radius: 1em;
    outline: none;
    box-shadow: 0 0 1em .25em var(--glow-color),
        0 0 4em 1em var(--glow-spread-color),
        inset 0 0 .75em .25em var(--glow-color);
    text-shadow: 0 0 .5em var(--glow-color);
    position: relative;
    transition: all 0.3s;
    -webkit-animation: swing-in-top-fwd 0.5s cubic-bezier(0.175, 0.885, 0.320, 1.275) both;
    animation: swing-in-top-fwd 0.5s cubic-bezier(0.175, 0.885, 0.320, 1.275) both;
}

.btn-end::after {
    pointer-events: none;
    content: "";
    position: absolute;
    top: 120%;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: var(--glow-spread-color);
    filter: blur(2em);
    opacity: .7;
    transform: perspective(1.5em) rotateX(35deg) scale(1, .6);
}

.btn-end:hover {
    color: var(--btn-color);
    background-color: var(--glow-color);
    box-shadow: 0 0 1em .25em var(--glow-color),
        0 0 4em 2em var(--glow-spread-color),
        inset 0 0 .75em .25em var(--glow-color);
}

.btn-end:active {
    box-shadow: 0 0 0.6em .25em var(--glow-color),
        0 0 2.5em 2em var(--glow-spread-color),
        inset 0 0 .5em .25em var(--glow-color);
}

// 按钮动画
@-webkit-keyframes pulsate-fwd {
    0% {
        -webkit-transform: scale(1);
        transform: scale(1);
    }

    50% {
        -webkit-transform: scale(1.1);
        transform: scale(1.1);
    }

    100% {
        -webkit-transform: scale(1);
        transform: scale(1);
    }
}

@keyframes pulsate-fwd {
    0% {
        -webkit-transform: scale(1);
        transform: scale(1);
    }

    50% {
        -webkit-transform: scale(1.2);
        transform: scale(1.2);
    }

    100% {
        -webkit-transform: scale(1);
        transform: scale(1);
    }
}

@-webkit-keyframes tracking-in-expand-fwd {
    0% {
        letter-spacing: -0.5em;
        -webkit-transform: translateZ(-700px);
        transform: translateZ(-700px);
        opacity: 0;
    }

    40% {
        opacity: 0.6;
    }

    100% {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        opacity: 1;
    }
}

@keyframes tracking-in-expand-fwd {
    0% {
        letter-spacing: -0.5em;
        -webkit-transform: translateZ(-700px);
        transform: translateZ(-700px);
        opacity: 0;
    }

    40% {
        opacity: 0.6;
    }

    100% {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        opacity: 1;
    }
}
</style>
