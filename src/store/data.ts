import { IPrizeConfig, IPersonConfig } from '@/types/storeType';
export const defaultMusicList = [
    {
        id: 'Radetzky March.mp3' + new Date().getTime().toString(),
        name: '许冠杰 - 财神到.mp3',
        url: 'https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/1.mp3'
    },
    {
        id: 'Shanghai.mp3' + new Date().getTime().toString(),
        name: 'Vangelis - Anthem (The 2002 FIFA World Cup Official Anthem) [JS Radio Edit].mp3',
        url: 'https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/2.mp3'
    },
    {
        id: 'Waltz No.2.mp3' + new Date().getTime().toString(),
        name: '百石元 - 猪突猛進.mp3',
        url: 'https://miniprogramyuansong.oss-cn-hangzhou.aliyuncs.com/static/prizedraw/3.mp3'
    }
]

export const defaultPrizeList = <IPrizeConfig[]>[
    {
        id: '001',
        name: '三等奖',
        sort: 1,
        isAll: false,
        count: 50,
        isUsedCount: 0,
        picture: {
            id: '2',
            name: '三等奖',
            url: 'https://24years.top/resource/image/image3.png'
        },
        separateCount: {
            enable: true,
            countList: []
        },
        desc: '三等奖',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '002',
        name: '二等奖',
        sort: 2,
        isAll: false,
        count: 2,
        isUsedCount: 0,
        picture: {
            id: '1',
            name: '二等奖',
            url: 'https://24years.top/resource/image/image2.png'
        },
        separateCount: {
            enable: false,
            countList: []
        },
        desc: '二等奖',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '003',
        name: '一等奖',
        sort: 3,
        isAll: false,
        count: 1,
        isUsedCount: 0,
        picture: {
            id: '0',
            name: '一等奖',
            url: 'https://24years.top/resource/image/image1.png'
        },
        separateCount: {
            enable: false,
            countList: []
        },
        desc: '一等奖',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '004',
        name: '超级大奖',
        sort: 4,
        isAll: false,
        count: 1,
        isUsedCount: 0,
        picture: {
            id: '3',
            name: '超级奖',
            url: 'https://24years.top/resource/image/image4.png'
        },
        separateCount: {
            enable: false,
            countList: []
        },
        desc: '超级大奖',
        isShow: true,
        isUsed: false,
        frequency: 1,
    },
    {
        id: '005',
        name: '特别奖',
        sort: 5,
        isAll: false,
        count: 1,
        isUsedCount: 0,
        picture: {
            id: '4',
            name: '特别奖',
            url: 'https://24years.top/resource/image/image5.png'
        },
        separateCount: {
            enable: false,
            countList: []
        },
        desc: '特别奖',
        isShow: true,
        isUsed: false,
        frequency: 1,
    }
]
export const defaultCurrentPrize = <IPrizeConfig>{
    id: '001',
    name: '三等奖',
    sort: 1,
    isAll: false,
    count: 12,
    isUsedCount: 0,
    picture: {
        id: '2',
        name: '三等奖',
        url: 'https://24years.top/resource/image/image3.png'
    },
    separateCount: {
        enable: true,
        countList: []
    },
    desc: '三等奖',
    isShow: true,
    isUsed: false,
    frequency: 1,
}
export const defaultTemporaryPrize = <IPrizeConfig>{
    id: '',
    name: '',
    sort: 0,
    isAll: false,
    count: 1,
    isUsedCount: 0,
    picture: {
        id: '-1',
        name: '',
        url: ''
    },
    separateCount: {
        enable: true,
        countList: []
    },
    desc: '',
    isShow: false,
    isUsed: false,
    frequency: 1,
}

export const defaultImageList = [
    {
        id: '0',
        name: '一等奖',
        url: 'https://24years.top/resource/image/image1.png'
    },
    {
        id: '1',
        name: '二等奖',
        url: 'https://24years.top/resource/image/image2.png'
    },
    {
        id: '2',
        name: '三等奖',
        url: 'https://24years.top/resource/image/image3.png'
    },
    {
        id: '3',
        name: '超级奖',
        url: 'https://24years.top/resource/image/image4.png'
    },
    {
        id: '4',
        name: '特别奖',
        url: 'https://24years.top/resource/image/image5.png'
    }
]
export const defaultPatternList = [21, 38, 55, 54, 53, 70, 87, 88, 89, 23, 40, 57, 74, 91, 92, 93, 76, 59, 42, 25, 24, 27, 28, 29, 46, 63, 62, 61, 78, 95, 96, 97, 20, 19, 31, 48, 65, 66, 67, 84, 101, 100, 99, 32, 33]
