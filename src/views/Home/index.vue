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

const targets = {
    grid: <any[]>[],
    helix: <any[]>[],
    table: <any[]>[],
    sphere: <any[]>[]
};
const notPrizeDrawList = ref<any[]>([])
const hasPrizeDrawList = ref<any[]>([])
const allPersonList = ref<any[]>([])
const luckyCount = ref(50)

const luckyTargets = ref<any[]>([])
const luckyCardList = ref<number[]>([])

const intervalTimer = ref<any>(null)

// 填充数据，填满七行
async function initTableData() {
    var data = await getLoadData();//获取已抽奖和未抽奖用户
    notPrizeDrawList.value = data.notPrizeDraw
    hasPrizeDrawList.value = data.hasPrizeDraw

    
    for (let i = 0; i < notPrizeDrawList.value.length; i++) {
        allPersonList.value.push(notPrizeDrawList.value[i]);
    }
    for (let i = 0; i < hasPrizeDrawList.value.length; i++) {
        allPersonList.value.push(hasPrizeDrawList.value[i]);
    }
}
const init = () => {
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
    controls.value.staticMoving = true;
    controls.value.noZoom = true; // 禁止缩放
    controls.value.minDistance = 500;//动画区域的大小
    controls.value.maxDistance = 6000;
    controls.value.addEventListener('change', render);

    const tableLen = allPersonList.value.length
    for (let i = 0; i < tableLen; i++) {
        let element = document.createElement('div');
        element.className = 'element-card';

        let imgc = document.createElement('div');
        imgc.className = 'card-headpic-c';
        const headpic = document.createElement('img');
        headpic.className = 'card-headpic';
        headpic.src = allPersonList.value[i].headPic;
        imgc.appendChild(headpic);
        element.appendChild(imgc);

        // element.append("<div class='card-headpic-c'><img src='"+allPersonList.value[i].headPic+"' class='card-headpic'/></div>");

        const symbol = document.createElement('div');
        symbol.className = 'card-name';
        symbol.textContent = allPersonList.value[i].name;
        element.appendChild(symbol);
        
        const prizeName = document.createElement('div');
        prizeName.className = 'card-prize';
        prizeName.innerHTML = `${allPersonList.value[i].prizeName||''}`;
        element.appendChild(prizeName);

        element = useElementStyle(element, allPersonList.value[i], i, patternList.value, patternColor.value, cardColor.value, cardSize.value)
        const object = new CSS3DObject(element);
        object.position.x = Math.random() * 4000 - 2000;
        object.position.y = Math.random() * 4000 - 2000;
        object.position.z = Math.random() * 4000 - 2000;
        object.userData["uid"]= allPersonList.value[i].uid
        scene.value.add(object);

        objects.value.push(object);
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
                            useElementStyle(item.element, {} as any, i, patternList.value, patternColor.value, cardColor.value, cardSize.value, 'sphere')
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
    if (luckyCount.value <= 0) {
        toast.open({
            message: '抽奖抽完了',
            type: 'warning',
            position: 'top-right',
            duration: 10000
        })

        return
    }
    toast.open({
        message: `现在抽取${luckyCount.value}人`,
        type:'default',
        position: 'top-right',
        duration: 8000
    })
    currentStatus.value = 2
    rollBall(10, 3000)
}

const stopLottery = async () => {
    if (!canOperate.value) {
        return
    }
    lowzIndex.value=true;
    currentStatus.value=100;
    clearInterval(intervalTimer.value)
    intervalTimer.value = null
    canOperate.value = false

    var uidlist = [];
    for (let i = 0; i < luckyCount.value; i++) {
        if (notPrizeDrawList.value.length > 0) {
            const randomIndex = Math.round(Math.random() * (notPrizeDrawList.value.length - 1))
            luckyTargets.value.push(notPrizeDrawList.value[randomIndex])
            uidlist.push(notPrizeDrawList.value[randomIndex].uid);
            notPrizeDrawList.value.splice(randomIndex, 1)
        }else{
            break
        }
    }

    //todo：调抽奖接口 uidlist

    rollBall(0, 1)


    
    let maxrowcount = 5;//最多5行
    let maxcolumncount = 10;//最多10列

    let columncount = 10;//如果都没匹配默认10列
    let rowcount = Math.ceil(luckyTargets.value.length / columncount)
   
    for(var i=maxrowcount;i>=1;i--){
        var tempcolcount = Math.ceil(luckyTargets.value.length/i);
        if(tempcolcount<=maxcolumncount){
            columncount = tempcolcount;
            rowcount = i;
        }
        if(tempcolcount>=i+1){
            break;
        }
    }

    let maxcwidth = Math.floor(maxwidth.value/(columncount*1.2-0.2));
    let maxcheight = Math.floor(maxheight.value/(rowcount*1.1-0.1));

    let cwidth = 0;
    let cheight = 0;

    if(maxcwidth*20/14<maxcheight){
        cwidth = maxcwidth;
        cheight = maxcwidth*20/14;
    }else{
        cheight = maxcheight;
        cwidth = maxcheight*14/20;
    }    

    let colspace = cwidth*0.2
    let rowspace = cheight*0.1

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
        let cardIndex = selectCard(luckyCardList.value, allPersonList.value.length)
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
                item.element = useElementStyle(item.element, person, cardIndex, patternList.value, patternColor.value, luckyColor.value, { width: cwidth, height: cheight}, 'lucky')
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
    }) 
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
                objects.value[cardRandomIndexArr[i]].element = useElementStyle(objects.value[cardRandomIndexArr[i]].element, allPersonList.value[personRandomIndexArr[i]], cardRandomIndexArr[i], patternList.value, patternColor.value, cardColor.value, { width: cardSize.value.width, height: cardSize.value.height }, mod)
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
const urlpre='https://mpg.zhenyansong.com/ystest';
const getLoadData = async ()=>{
    // const request = new Request();
    const res = await request({
      url: urlpre+'/system/activity/prizedraw/'+router.currentRoute.value.query.activityId,
      method: 'GET',
    });

    return res;
    // return {"notPrizeDraw":[{"uid": "3","name": "姓名3","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "4","name": "姓名4","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "5","name": "姓名5","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "6","name": "姓名6","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "7","name": "姓名7","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "8","name": "姓名8","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "9","name": "姓名9","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "10","name": "姓名10","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "11","name": "姓名11","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "12","name": "姓名12","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "13","name": "姓名13","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "14","name": "姓名14","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "15","name": "姓名15","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "16","name": "姓名16","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "17","name": "姓名17","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "18","name": "姓名18","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "19","name": "姓名19","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "20","name": "姓名20","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "21","name": "姓名21","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "22","name": "姓名22","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "23","name": "姓名23","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "24","name": "姓名24","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "25","name": "姓名25","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "26","name": "姓名26","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "27","name": "姓名27","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "28","name": "姓名28","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "29","name": "姓名29","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "30","name": "姓名30","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "31","name": "姓名31","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "32","name": "姓名32","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "33","name": "姓名33","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "34","name": "姓名34","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "35","name": "姓名35","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "36","name": "姓名36","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "37","name": "姓名37","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "38","name": "姓名38","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "39","name": "姓名39","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "40","name": "姓名40","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "41","name": "姓名41","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "42","name": "姓名42","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "43","name": "姓名43","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "44","name": "姓名44","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "45","name": "姓名45","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "46","name": "姓名46","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "47","name": "姓名47","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "48","name": "姓名48","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "49","name": "姓名49","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "50","name": "姓名50","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "51","name": "姓名51","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "52","name": "姓名52","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "53","name": "姓名53","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "54","name": "姓名54","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "55","name": "姓名55","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "56","name": "姓名56","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "57","name": "姓名57","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "58","name": "姓名58","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "59","name": "姓名59","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "60","name": "姓名60","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "61","name": "姓名61","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "62","name": "姓名62","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "63","name": "姓名63","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "64","name": "姓名64","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "65","name": "姓名65","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "66","name": "姓名66","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "67","name": "姓名67","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "68","name": "姓名68","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "69","name": "姓名69","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "70","name": "姓名70","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "71","name": "姓名71","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "72","name": "姓名72","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "73","name": "姓名73","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "74","name": "姓名74","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "75","name": "姓名75","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "76","name": "姓名76","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "77","name": "姓名77","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "78","name": "姓名78","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "79","name": "姓名79","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "80","name": "姓名80","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "81","name": "姓名81","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "82","name": "姓名82","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "83","name": "姓名83","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "84","name": "姓名84","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "85","name": "姓名85","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "86","name": "姓名86","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "87","name": "姓名87","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "88","name": "姓名88","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "89","name": "姓名89","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "90","name": "姓名90","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "91","name": "姓名91","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "92","name": "姓名92","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "93","name": "姓名93","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "94","name": "姓名94","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "95","name": "姓名95","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "96","name": "姓名96","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "97","name": "姓名97","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "98","name": "姓名98","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "99","name": "姓名99","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "100","name": "姓名100","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "101","name": "姓名101","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "102","name": "姓名102","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "103","name": "姓名103","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "104","name": "姓名104","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "105","name": "姓名105","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "106","name": "姓名106","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "107","name": "姓名107","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "108","name": "姓名108","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "109","name": "姓名109","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "110","name": "姓名110","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "111","name": "姓名111","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "112","name": "姓名112","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "113","name": "姓名113","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "114","name": "姓名114","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "115","name": "姓名115","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "116","name": "姓名116","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "117","name": "姓名117","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "118","name": "姓名118","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "119","name": "姓名119","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "120","name": "姓名120","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "121","name": "姓名121","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "122","name": "姓名122","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "123","name": "姓名123","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "124","name": "姓名124","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"},{"uid": "125","name": "姓名125","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"}],
    // "hasPrizeDraw": [{"uid": "1","name": "姓名1","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是"},{"uid": "2","name": "姓名2","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg","prizeName":"我是奖品名称我是奖品名要把名称显示全"}
    // ]}
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
                        {{ item.name }}
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
                            {{ item.name }}
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
                单次抽<input class="luckyCount" v-model="luckyCount"></input> 
                人</div>

        </div>
    </div>
</template>

<style scoped lang="scss">

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
    }
}
.renyuanright{
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
