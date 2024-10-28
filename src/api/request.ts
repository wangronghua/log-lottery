import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useToast } from 'vue-toast-notification';
const toast = useToast();
class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create({
      baseURL: '/api',
      timeout: 10000,
      ...config,
    });

    // 添加请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 在发送请求之前做些什么
        console.log('请求拦截器被触发');

        return config;
      },
      (error: any) => {
        // 对请求错误做些什么
        console.error('请求拦截器发生错误：', error);

        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 对响应数据做些什么
        console.log('响应拦截器被触发');
        // const reponseData = response.data;

        // return reponseData;
        return response;
      },
      (error: any) => {
        // 对响应错误做些什么
        console.error('响应拦截器发生错误：', error);

        return Promise.reject(error);
      }
    );
  }

  public async request<T>(config: AxiosRequestConfig): Promise<T|null> {
    try{
      const response: AxiosResponse<T> = await this.instance.request(config);
  
      return response.data;
    }catch(e){
        toast.open({
            message: `网络错误，请重新登录`,
            type: 'warning',
            position: 'top-right',
            duration: 1500
        })
        
        // location.href="http://mpg.zhenyansong.com/ys/login";
        return null;
    }
  }
}

// 函数
function request<T>(config: AxiosRequestConfig): Promise<T|null> {
  const instance = new Request(config);

  return instance.request(config);
}

export default request;
