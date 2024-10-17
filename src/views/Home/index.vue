<script setup lang="ts">
import { ref, onMounted, onUnmounted, } from 'vue'
import PrizeList from './PrizeList.vue'
import { useElementStyle, useElementPosition } from '@/hooks/useElement'
import StarsBackground from '@/components/StarsBackground/index.vue'
import confetti from 'canvas-confetti'
import { filterData, selectCard } from '@/utils'
import { rgba } from '@/utils/color'
import { IPersonConfig } from '@/types/storeType'
// import * as THREE from 'three'
import { Scene, PerspectiveCamera, Object3D, Vector3 } from 'three'
// import {
//     CSS3DRenderer, CSS3DObject
// } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { CSS3DRenderer, CSS3DObject } from 'three-css3d'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
// import TrackballControls from 'three-trackballcontrols';
// import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as TWEEN from '@tweenjs/tween.js'
import useStore from '@/store'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

const toast = useToast();
const router = useRouter()
const personConfig = useStore().personConfig
const globalConfig = useStore().globalConfig

const { getTopTitle: topTitle, getCardColor: cardColor, getPatterColor: patternColor, getPatternList: patternList, getTextColor: textColor, getLuckyColor: luckyColor, getCardSize: cardSize } = storeToRefs(globalConfig)
const currentStatus = ref(0) // 0为初始状态， 1为抽奖准备状态，2为抽奖中状态，3为抽奖结束状态
const ballRotationY = ref(0)
const containerRef = ref<HTMLElement>()
// const LuckyViewRef= ref()
const canOperate = ref(true)
const cameraZ = ref(3000)

const scene = ref()
const camera = ref()
const renderer = ref()
const controls = ref()
const objects = ref<any[]>([])

const targets = {
    grid: <any[]>[],
    helix: <any[]>[],
    table: <any[]>[],
    sphere: <any[]>[]
};
const notPrizeDrawList = ref<any[]>([])
const hasPrizeDrawList = ref<any[]>([])
const allPersonList = ref<any[]>([])
const luckyCount = ref(4)

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
    renderer.value.setSize(width, height * 0.9)
    renderer.value.domElement.style.position = 'absolute';
    // 垂直居中
    // renderer.value.domElement.style.paddingTop = '50px'
    renderer.value.domElement.style.top = '50%';
    renderer.value.domElement.style.left = '50%';
    renderer.value.domElement.style.transform = 'translate(-50%, -50%)';
    WebGLoutput!.appendChild(renderer.value.domElement);

    controls.value = new TrackballControls(camera.value, renderer.value.domElement);
    controls.value.rotateSpeed = 1;
    controls.value.staticMoving = true;
    controls.value.minDistance = 500;
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

    createTableVertices();
    createSphereVertices();
    createHelixVertices();

    //长方形排列
    function createTableVertices() {
    }

    //圆球排列
    function createSphereVertices() {
        let i = 0;
        const objLength = objects.value.length;
        const vector = new Vector3();

        for (; i < objLength; ++i) {
            let phi = Math.acos(-1 + (2 * i) / objLength);
            let theta = Math.sqrt(objLength * Math.PI) * phi;
            const object = new Object3D();

            object.position.x = 800 * Math.cos(theta) * Math.sin(phi);
            object.position.y = 800 * Math.sin(theta) * Math.sin(phi);
            object.position.z = -800 * Math.cos(phi);

            // rotation object 

            vector.copy(object.position).multiplyScalar(2);
            object.lookAt(vector);
            targets.sphere.push(object);
        }
    }
    function createHelixVertices() {
        let i = 0;
        const vector = new Vector3();
        const objLength = objects.value.length;
        for (; i < objLength; ++i) {
            let phi = i * 0.213 + Math.PI;

            const object = new Object3D();

            object.position.x = 800 * Math.sin(phi);
            object.position.y = -(i * 8) + 450;
            object.position.z = 800 * Math.cos(phi + Math.PI);

            object.scale.set(1.1, 1.1, 1.1);

            vector.x = object.position.x * 2;
            vector.y = object.position.y;
            vector.z = object.position.z * 2;

            object.lookAt(vector);

            targets.helix.push(object);
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
// 将视野转回正面
function resetCamera() {
    new TWEEN.Tween(camera.value.position)
        .to(
            {
                x: 0,
                y: 0,
                z: 3000
            },
            1000
        )
        .onUpdate(render)
        .start()
        .onComplete(() => {
            new TWEEN.Tween(camera.value.rotation)
                .to(
                    {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    1000
                )
                .onUpdate(render)
                .start()
                .onComplete(() => {
                    canOperate.value = true
                    // camera.value.lookAt(scene.value.position)
                    camera.value.position.y = 0
                    camera.value.position.x = 0
                    camera.value.position.z = 3000
                    camera.value.rotation.x = 0
                    camera.value.rotation.y = 0
                    camera.value.rotation.z = -0
                    controls.value.reset()
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
    // if (patternList.value.length) {
    //     for(let i=0;i<patternList.value.length;i++){//objects.value
    //         if(i<rowCount.value*7){
    //             objects.value[patternList.value[i]-1].element.style.backgroundColor = rgba(cardColor.value, Math.random() * 0.5 + 0.25)
    //         }
    //     }
    // }
    canOperate.value = false
    await transform(targets.sphere, 1000)
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

    let maxcwidth = Math.floor(2030/(columncount*1.5-0.5));
    let maxcheight = Math.floor(1240/(rowcount*1.3-0.3));

    let cwidth = 0;
    let cheight = 0;

    if(maxcwidth*20/14<maxcheight){
        cwidth = maxcwidth;
        cheight = maxcwidth*20/14;
    }else{
        cheight = maxcheight;
        cwidth = maxcheight*14/20;
    }    

    let colspace = cwidth*0.5
    let rowspace = cheight*0.3

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

const getLoadData = async ()=>{
    return {"notPrizeDraw":[{"uid": "1","name": "姓名1","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "2","name": "姓名2","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "3","name": "姓名3","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "4","name": "姓名4","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "5","name": "姓名5","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "6","name": "姓名6","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "7","name": "姓名7","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "8","name": "姓名8","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "9","name": "姓名9","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "10","name": "姓名10","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "11","name": "姓名11","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "12","name": "姓名12","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "13","name": "姓名13","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "14","name": "姓名14","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "15","name": "姓名15","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "16","name": "姓名16","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "17","name": "姓名17","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "18","name": "姓名18","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "19","name": "姓名19","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "20","name": "姓名20","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "21","name": "姓名21","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "22","name": "姓名22","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "23","name": "姓名23","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "24","name": "姓名24","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "25","name": "姓名25","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "26","name": "姓名26","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "27","name": "姓名27","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "28","name": "姓名28","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "29","name": "姓名29","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "30","name": "姓名30","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "31","name": "姓名31","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "32","name": "姓名32","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "33","name": "姓名33","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "34","name": "姓名34","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "35","name": "姓名35","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "36","name": "姓名36","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "37","name": "姓名37","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "38","name": "姓名38","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "39","name": "姓名39","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "40","name": "姓名40","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "41","name": "姓名41","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "42","name": "姓名42","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "43","name": "姓名43","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "44","name": "姓名44","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "45","name": "姓名45","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "46","name": "姓名46","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "47","name": "姓名47","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "48","name": "姓名48","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "49","name": "姓名49","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "50","name": "姓名50","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "51","name": "姓名51","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "52","name": "姓名52","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "53","name": "姓名53","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "54","name": "姓名54","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "55","name": "姓名55","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "56","name": "姓名56","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "57","name": "姓名57","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "58","name": "姓名58","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "59","name": "姓名59","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "60","name": "姓名60","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "61","name": "姓名61","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "62","name": "姓名62","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "63","name": "姓名63","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "64","name": "姓名64","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "65","name": "姓名65","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "66","name": "姓名66","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "67","name": "姓名67","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "68","name": "姓名68","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "69","name": "姓名69","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "70","name": "姓名70","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "71","name": "姓名71","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "72","name": "姓名72","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "73","name": "姓名73","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "74","name": "姓名74","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "75","name": "姓名75","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "76","name": "姓名76","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "77","name": "姓名77","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "78","name": "姓名78","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "79","name": "姓名79","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "80","name": "姓名80","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "81","name": "姓名81","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "82","name": "姓名82","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "83","name": "姓名83","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "84","name": "姓名84","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "85","name": "姓名85","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "86","name": "姓名86","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "87","name": "姓名87","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "88","name": "姓名88","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "89","name": "姓名89","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "90","name": "姓名90","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "91","name": "姓名91","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "92","name": "姓名92","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "93","name": "姓名93","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "94","name": "姓名94","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "95","name": "姓名95","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "96","name": "姓名96","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "97","name": "姓名97","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "98","name": "姓名98","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "99","name": "姓名99","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "100","name": "姓名100","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "101","name": "姓名101","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "102","name": "姓名102","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "103","name": "姓名103","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "104","name": "姓名104","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "105","name": "姓名105","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "106","name": "姓名106","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "107","name": "姓名107","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "108","name": "姓名108","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "109","name": "姓名109","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "110","name": "姓名110","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "111","name": "姓名111","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "112","name": "姓名112","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "113","name": "姓名113","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "114","name": "姓名114","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "115","name": "姓名115","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "116","name": "姓名116","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "117","name": "姓名117","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "118","name": "姓名118","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "119","name": "姓名119","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "120","name": "姓名120","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "121","name": "姓名121","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "122","name": "姓名122","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "123","name": "姓名123","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "124","name": "姓名124","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"},{"uid": "125","name": "姓名125","headPic": "https://mpg.zhenyansong.com/ystest/img/profile.jpg"}],"hasPrizeDraw": []}
}
</script>

<template>
    <div class="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 left-1/2">
        <h2 class="pt-12 m-0 mb-12 font-mono tracking-wide text-center leading-12 header-title"
            :style="{ fontSize: '45px', color: textColor }">周年大放纵 媛分双倍送</h2>
    </div>
    <div id="container" ref="containerRef" class="3dContainer">

        <!-- 选中菜单结构 start-->
        <div id="menu">

            <div class="start" v-if="currentStatus == 1">
                <button class="btn-start" @click="startLottery"><strong>开始</strong>
                    <div id="container-stars">
                        <div id="stars"></div>
                    </div>

                    <div id="glow">
                        <div class="circle"></div>
                        <div class="circle"></div>
                    </div>
                </button>
            </div>

            <button class="btn-end btn glass btn-lg" @click="stopLottery" v-if="currentStatus == 2">抽取幸运儿</button>

            <div v-if="currentStatus == 3" class="flex justify-center gap-6 enStop">
                <div class="start">
                    <button class="btn-start" @click="continueLottery"><strong>继续！</strong>
                        <div id="container-stars">
                            <div id="stars"></div>
                        </div>

                        <div id="glow">
                            <div class="circle"></div>
                            <div class="circle"></div>
                        </div>
                    </button>
                </div>
            </div>
            <!--   <button id="table" @click="transform(targets.table, 2000)">TABLE</button> -->
            <!--  <button id="helix" @click="transform(targets.helix, 2000)">HELIX</button> -->

        </div>
        <!-- end -->
    </div>
    <StarsBackground></StarsBackground>

    <!-- <LuckyView :luckyPersonList="luckyTargets"  ref="LuckyViewRef"></LuckyView> -->
    <!-- <PlayMusic class="absolute right-0 bottom-1/2"></PlayMusic> -->
    <PrizeList class="absolute left-0 top-32"></PrizeList>
</template>

<style scoped lang="scss">
#menu {
    position: absolute;
    z-index: 100;
    width: 100%;
    bottom: 50px;
    text-align: center;
    margin: 0 auto;
    font-size: 32px;
}

.header-title {
    -webkit-animation: tracking-in-expand-fwd 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) both;
    animation: tracking-in-expand-fwd 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) both;
}

.start {
    // 居中
    display: flex;
    justify-content: center;
}

.btn-start {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 13rem;
    overflow: hidden;
    height: 3rem;
    background-size: 300% 300%;
    backdrop-filter: blur(1rem);
    border-radius: 5rem;
    transition: 0.5s;
    animation: gradient_301 5s ease infinite;
    border: double 4px transparent;
    background-image: linear-gradient(#212121, #212121), linear-gradient(137.48deg, #ffdb3b 10%, #FE53BB 45%, #8F51EA 67%, #0044ff 87%);
    background-origin: border-box;
    background-clip: content-box, border-box;
    -webkit-animation: pulsate-fwd 1.2s ease-in-out infinite both;
    animation: pulsate-fwd 1.2s ease-in-out infinite both;
}

.btn-cancel {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 13rem;
    overflow: hidden;
    height: 3rem;
    background-size: 300% 300%;
    backdrop-filter: blur(1rem);
    border-radius: 5rem;
    transition: 0.5s;
    animation: gradient_301 5s ease infinite;
    border: double 4px transparent;
    background-image: linear-gradient(#212121, #212121), linear-gradient(137.48deg, #ffdb3b 10%, #FE53BB 45%, #8F51EA 67%, #0044ff 87%);
    background-origin: border-box;
    background-clip: content-box, border-box;
}

#container-stars {
    position: absolute;
    z-index: -1;
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition: 0.5s;
    backdrop-filter: blur(1rem);
    border-radius: 5rem;
}

strong {
    z-index: 2;
    font-family: 'Avalors Personal Use';
    font-size: 12px;
    letter-spacing: 5px;
    color: #FFFFFF;
    text-shadow: 0 0 4px white;
}

#glow {
    position: absolute;
    display: flex;
    width: 12rem;
}

.circle {
    width: 100%;
    height: 30px;
    filter: blur(2rem);
    animation: pulse_3011 4s infinite;
    z-index: -1;
}

.circle:nth-of-type(1) {
    background: rgba(254, 83, 186, 0.636);
}

.circle:nth-of-type(2) {
    background: rgba(142, 81, 234, 0.704);
}

.btn-start:hover #container-stars {
    z-index: 1;
    background-color: #212121;
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

.btn-start:active .circle {
    background: #FE53BB;
}

#stars {
    position: relative;
    background: transparent;
    width: 200rem;
    height: 200rem;
}

#stars::after {
    content: "";
    position: absolute;
    top: -10rem;
    left: -100rem;
    width: 100%;
    height: 100%;
    animation: animStarRotate 90s linear infinite;
}

#stars::after {
    background-image: radial-gradient(#ffffff 1px, transparent 1%);
    background-size: 50px 50px;
}

#stars::before {
    content: "";
    position: absolute;
    top: 0;
    left: -50%;
    width: 170%;
    height: 500%;
    animation: animStar 60s linear infinite;
}

#stars::before {
    background-image: radial-gradient(#ffffff 1px, transparent 1%);
    background-size: 50px 50px;
    opacity: 0.5;
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
    padding: 1em 3em;
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
