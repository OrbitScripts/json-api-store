import {HttpErrorResponse} from "@angular/common/http";

export type ErrorInterceptor = (error: HttpErrorResponse) => void;