import {HttpEvent} from "@angular/common/http";
import {ApiDocument} from "../api";

export type ResponseInterceptor = (response: HttpEvent<ApiDocument>, method: string) => void;