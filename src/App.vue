<script setup lang="ts">
import { onMounted,ref } from 'vue'
import useStore from '@/store'
import { storeToRefs } from 'pinia'
import PlayMusic from '@/components/PlayMusic/index.vue'

import { themeChange } from 'theme-change'

const globalConfig = useStore().globalConfig
const prizeConfig = useStore().prizeConfig
const system=useStore().system
const { getTheme: localTheme } = storeToRefs(globalConfig)
const { getPrizeConfig: prizeList } = storeToRefs(prizeConfig)
// const { getIsMobile: isMobile } = storeToRefs(system)

const tipDialog=ref()
// const isMobileValue = ref(structuredClone(isMobile.value))
const setLocalTheme = (theme: any) => {
    themeChange(theme.name)
}

// 判断是否手机端访问
const judgeMobile=()=>{
    const ua = navigator.userAgent
    const isAndroid = ua.indexOf('Android') > -1 || ua.indexOf('Adr') > -1
    const isIOS =!!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
    
    system.setIsMobile(isAndroid||isIOS)
    
return isAndroid||isIOS
}
// 判断是否chrome或者edge访问
const judgeChromeOrEdge=()=>{
    const ua = navigator.userAgent
    const isChrome = ua.indexOf('Chrome') > -1
    const isEdge = ua.indexOf('Edg') > -1

    system.setIsChrome(isChrome)

return isChrome||isEdge
}
onMounted(() => {
    setLocalTheme(localTheme.value)
    if(judgeMobile()||!judgeChromeOrEdge()){
        tipDialog.value.showModal()
    }
})
</script>

<template>
     <dialog id="my_modal_1" ref="tipDialog" class="border-none modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">提示!</h3>
            <p class="py-4" v-if="judgeMobile()">请使用PC进行访问以获得最佳显示效果</p>
            <p class="py-4" v-if=" !judgeChromeOrEdge()">请使用最新版Chrome或者Edge浏览器</p>
            <div class="modal-action">
                <form method="dialog" class="flex justify-start w-full gap-3">
                    <!-- if there is a button in form, it will close the modal -->
                    <button class="btn">确定</button>
                </form>
            </div>
        </div>
    </dialog>
    <router-view></router-view>
    <PlayMusic class="absolute right-0 bottom-1/2"></PlayMusic>
</template>

<style scoped lang="scss"></style>
