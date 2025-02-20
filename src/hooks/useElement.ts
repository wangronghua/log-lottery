import { rgba } from '@/utils/color'
import { IPersonConfig } from '@/types/storeType'

export const useElementStyle = (element: any, person: IPersonConfig, index: number, patternList: number[], patternColor: string, cardColor: string, cardSize: { width: number, height: number }, mod: 'default' | 'lucky'|'sphere' = 'default') => {
    let rate = cardSize.width/140
    let textSize = 14 * rate*1.5;
    // if (patternList.includes(index+1)&&mod=='default') {
    //     element.style.backgroundColor = rgba(patternColor, Math.random() * 0.2 + 0.8)
    // }
    // else if(mod=='sphere'||mod=='default') {
    //     element.style.backgroundColor = rgba(cardColor, Math.random() * 0.5 + 0.25)
    // }
    // else if(mod=='lucky'){
    //     element.style.backgroundColor = rgba(cardColor, 0.8)
    // }
    // element.style.border = `1px solid ${rgba(cardColor, 0.25)}`
    element.style.boxShadow = `0 0 12px ${rgba(cardColor, 0.5)}`
    element.style.borderRadius = `${rate*15}px`
    element.style.width = `${cardSize.width}px`;
    element.style.height = `${cardSize.height}px`;
    if(patternList.includes(index+1)&&mod=='default'){
        element.className = 'pattern-element-card'
    }
    else {
        element.className = 'element-card'
    }
    // 等比放大
    element.addEventListener('mouseenter', (ev: MouseEvent) => {
        // const target = ev.target as HTMLElement
        // target.style.border = `1px solid ${rgba(cardColor, 0.75)}`
        // target.style.boxShadow = `0 0 12px ${rgba(cardColor, 0.75)}`
    })
    element.addEventListener('mouseleave', (ev: MouseEvent) => {
        // const target = ev.target as HTMLElement
        // target.style.border = `1px solid ${rgba(cardColor, 0.25)}`
        // target.style.boxShadow = `0 0 12px ${rgba(cardColor, 0.5)}`
    })
    // element.children[0].style.fontSize = textSize * 0.5 + 'px';
    // if (person.uid) {
    //     element.children[0].textContent = person.uid;
    // }

    // element.children[1].style.fontSize = textSize + 'px'
    // element.children[1].style.lineHeight = textSize * 3 + 'px'
    // element.children[1].style.textShadow = `0 0 12px ${rgba(cardColor, 0.95)}`
    // if (person.name) {
    //     element.children[1].textContent = person.name
    // }

    if(person.name && person.name.length<=3){
        element.children[0].style.fontSize = textSize * 1.5 + 'px';
    }else{
        element.children[0].style.fontSize = textSize * 1 + 'px';
    }
    if (person.name) {
        element.children[0].textContent = processName(person.name);
    }

    element.children[1].style.fontSize = textSize * 1 + 'px'
    if (person.department) {
        // element.children[2].innerHTML = `${person.department ? person.department : ''}`
        element.children[1].textContent = person.department
    }

    element.children[2].style.fontSize = textSize * 1 + 'px'
    if (person.phone) {
        element.children[2].textContent = processPhone(person.phone);
    }

    return element
}
export const processName = (name:string) => {
    if(name){
        if(name.length > 2){
            return name.substr(0,1)+'*'.repeat(name.length-2)+name.substr(name.length-1,1);
        } else if(name.length === 2){
            return '*' + name.substr(1,1);
        } else {
            return name;
        }
    }
    return '';
}
export const processPhone = (phone:string) => {
    return `${phone.toString().substr(0,3)}****${phone.toString().substr(7)}`;
}

// export const useElementPosition=(element:any,count:number,cardSize:{width:number,height:number},windowSize:{width:number,height:number},cardIndex:number)=>{
//     const centerPosition={
//         x:0,
//         y:windowSize.height/2-cardSize.height/2
//     }
//   const index =cardIndex%5
//     if(index==0){
//         element.position.x=centerPosition.x
//         element.position.y=centerPosition.y-Math.floor(cardIndex/5)*(cardSize.height+60)
//     }
//     else{
//         element.position.x=index%2===0?Math.ceil(index/2)*(cardSize.width+100):-Math.ceil(index/2)*(cardSize.width+100)
//         element.position.y=centerPosition.y-Math.floor(cardIndex/5)*(cardSize.height+60)
//     }

//     return element
// }

export const useElementPosition=(element:any,columncount:number,rowcount:number,colspace:number,rowspace:number,cardSize:{width:number,height:number},cardIndex:number)=>{
    const colindex =cardIndex%columncount
    const rowindex = Math.floor(cardIndex / columncount)

    if(columncount%2==0){
        element.position.x = (colindex%2==0?-1:1)* ((Math.ceil((colindex+1)/2)-0.5)*(cardSize.width+colspace));
    }else{
        element.position.x = (colindex%2==0?1:-1)* (Math.ceil(colindex/2)*(cardSize.width+colspace));
    }

    if(rowcount%2==0){
        element.position.y = (Math.floor(rowcount/2)-0.5)*(cardSize.height+rowspace);
    }else{
        element.position.y = Math.floor(rowcount/2)*(cardSize.height+rowspace);
    }

    // element.position.y = rowcount%2==0?(rowcount*(cardSize.height+rowspace)/2 - 0.5*rowspace):(cardSize.height/2 + Math.floor(rowcount/2)*(cardSize.height+rowspace))   //cardSize.height/2 + Math.floor(rowcount/2)*(cardSize.height+rowspace)
    element.position.y = element.position.y - rowindex*(cardSize.height+rowspace)

    // element.position.y = element.position.y-0.5*cardSize.height
    // element.position.x = element.position.x-0.5*cardSize.width
    return element
}
// export const useElementPosition = (element: any, count: number, cardSize: { width: number, height: number }, windowSize: { width: number, height: number }, cardIndex: number) => {
//     let xTable = 0
//     let yTable = 0
//     const centerPosition = {
//         x: 0,
//         y: windowSize.height / 2 - cardSize.height / 2
//     }
//     const index = cardIndex % 5
//     if (index == 0) {
//         xTable = centerPosition.x
//         yTable = centerPosition.y - Math.floor(cardIndex / 5) * (cardSize.height + 60)
//     }
//     else {
//         xTable = index % 2 === 0 ? Math.ceil(index / 2) * (cardSize.width + 100) : -Math.ceil(index / 2) * (cardSize.width + 100)
//         yTable = centerPosition.y - Math.floor(cardIndex / 5) * (cardSize.height + 60)
//     }

//     return { xTable, yTable }
// }
