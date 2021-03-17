import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { ErrorWrapper } from './ErrorWrapper';
import { httpVerbs } from './HttpVerbs';
export class Http {

    private baseUrl: string;
    private customHeaders: Object;
    private axInstance: AxiosInstance;

    constructor(baseUrl: string, customHeaders?: Object) {
        this.baseUrl = baseUrl;
        customHeaders ? this.customHeaders = customHeaders : this.customHeaders = {};
        this.axInstance = axios.create({
            baseURL: this.baseUrl, headers: this.customHeaders,
        })
        axiosRetry(this.axInstance, {
            retries: 3, retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error: AxiosError) => {
                return error?.response?.status === 429 || error?.response?.status === 501;
            },
        });
    }

    private request = async <T>(verb: httpVerbs, url: string, data?: Object): Promise<AxiosResponse<T>> => {
        const axiosErrorHandler = (err: AxiosError) => {
            let errMsg = err.message;
            if (err.response) {
                const errBody = err.response.data;
                const errStatus = err.response.status;
                const errHeader = err.response.headers;
                const errorIdentifier = (() => {
                    if (errBody.errorIdentifier) {
                        return errBody.errorIdentifier;
                    }
                    return 'UnknownError'
                })();
                if (errBody.message) errMsg = errBody.message;
                const errorDetails = (() => {
                    if (errBody.details) {
                        return errBody.errorDetails;
                    }
                    return ''
                })()
                throw new ErrorWrapper(errStatus, errorIdentifier, errMsg, errorDetails);
            } else if (err.request) {
                const requestInfo = err.request;
                throw new ErrorWrapper(500, 'UnknownError', `Something went wrong with the request: ${errMsg}`, `Request Information: ${requestInfo}`);
            } else {
                throw new ErrorWrapper(500, 'UnknownError', `Something went wrong: ${errMsg}`);
            }
        }

        switch (verb) {
            case httpVerbs.GET:
                return await this.axInstance.request<T>({
                    method: 'get',
                    url,
                }).then().catch(err => {
                    return axiosErrorHandler(err)
                })
            case httpVerbs.POST:
                return await this.axInstance.request<T>({
                    method: 'post',
                    url,
                    data
                }).then().catch(err => {
                    return axiosErrorHandler(err)
                })
            case httpVerbs.PUT:
                return await this.axInstance.request<T>({
                    method: 'put',
                    url,
                    data
                }).then().catch(err => {
                    return axiosErrorHandler(err)
                })
            case httpVerbs.DELETE:
                return await this.axInstance.request<T>({
                    method: 'delete',
                    url,
                    data
                }).then().catch(err => {
                    return axiosErrorHandler(err)
                })

        }
    }

    public get = async <T>(url: string): Promise<AxiosResponse<T>> => {
        return await this.request<T>(httpVerbs.GET, url);
    }

    public post = async <T>(url:string, data: Object): Promise<AxiosResponse<T>> => {
        return await this.request<T>(httpVerbs.POST, url, data);
    }

    public put = async <T>(url:string, data: Object): Promise<AxiosResponse<T>> => {
        return await this.request<T>(httpVerbs.PUT, url, data);
    }

    public del = async <T>(url:string, data: Object): Promise<AxiosResponse<T>> => {
        return await this.request<T>(httpVerbs.DELETE, url, data);
    }



}
