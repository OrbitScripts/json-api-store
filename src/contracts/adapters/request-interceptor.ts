import {ApiDocument} from "../api";
import {HttpHeaders, HttpParams} from "@angular/common/http";

export interface RequestParams {
    url: string;
    method: string;
    body?: ApiDocument;
    query?: HttpParams;
    headers?: HttpHeaders;
}

export interface RequestInterceptor {
    (params: RequestParams): void;
}