/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface User {
  /**
   * Firebase User ID
   * @example "firebase-user-id-123"
   */
  uid?: string;
  /**
   * @format email
   * @example "user@example.com"
   */
  email?: string;
  /** @example "홍길동" */
  displayName?: string;
  /**
   * 알림 수신용 이메일 (미설정시 기본 이메일 사용)
   * @format email
   * @example "notification@example.com"
   */
  notificationEmail?: string;
  /**
   * 푸시 알림용 토큰
   * @example "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
   */
  pushToken?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

export interface UserSetting {
  /** @example "setting-id-123" */
  id?: string;
  /** @example "firebase-user-id-123" */
  userId?: string;
  /** @example "다리안계곡캠핑장" */
  campingName?: string;
  /** @example "충북 단양" */
  region?: string;
  /**
   * 감시할 구역 목록 (빈 배열이면 모든 구역)
   * @example ["A구역","B구역"]
   */
  area?: string[];
  /**
   * @format date
   * @example "2025-11-01"
   */
  dateFrom?: string;
  /**
   * @format date
   * @example "2025-11-30"
   */
  dateTo?: string;
  /**
   * 알림 활성화 여부 (알림 전송 후 자동으로 false로 변경됨)
   * @example true
   */
  isActive?: boolean;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

export interface Availability {
  /** @example "availability-id-123" */
  id?: string;
  /** @example "다리안계곡캠핑장" */
  campingName?: string;
  /** @example "충북 단양" */
  region?: string;
  /** @example "A구역" */
  area?: string;
  /**
   * @format date
   * @example "2025-11-15"
   */
  date?: string;
  /**
   * 예약 가능한 자리 수
   * @example 3
   */
  availableCount?: number;
  /**
   * 스크래핑 수행 시각
   * @format date-time
   */
  scrapedAt?: string;
  /**
   * 마지막 업데이트 시각
   * @format date-time
   */
  updatedAt?: string;
}

export interface NotificationLog {
  /** @example "notification-log-id-123" */
  id?: string;
  /** @example "firebase-user-id-123" */
  userId?: string;
  /**
   * 사용자 표시 이름 (또는 이메일)
   * @example "홍길동"
   */
  userName?: string;
  /** @example "setting-id-123" */
  settingId?: string;
  /** @example "다리안계곡캠핑장" */
  campingName?: string;
  /** @example "충북 단양" */
  region?: string;
  /** @example "A구역" */
  area?: string;
  /**
   * @format date
   * @example "2025-11-15"
   */
  date?: string;
  /** @example 3 */
  availableCount?: number;
  /** @example "email" */
  notificationType?: "email" | "push";
  /** @format date-time */
  sentAt?: string;
}

export interface ScrapingLog {
  /** @example "scraping-log-id-123" */
  id?: string;
  /** @example "success" */
  status?: "running" | "success" | "error";
  /** @format date-time */
  startedAt?: string;
  /** @format date-time */
  completedAt?: string;
  /**
   * 스크래핑한 항목 수
   * @example 229
   */
  itemsScraped?: number;
  /**
   * 에러 발생 시 에러 메시지
   * @example null
   */
  errorMessage?: string | null;
}

export interface HealthResponse {
  /** @example "healthy" */
  status?: "healthy" | "unhealthy";
  /** @format date-time */
  timestamp?: string;
  /**
   * 서버 가동 시간 (초)
   * @example 25.52
   */
  uptime?: number;
  /**
   * 응답 시간 (밀리초)
   * @example 2468
   */
  responseTime?: number;
  checks?: {
    firestore?: ComponentHealth;
    auth?: ComponentHealth;
    email?: ComponentHealth;
    scheduler?: SchedulerHealth;
  };
  system?: {
    memory?: {
      /** @example "46MB" */
      heapUsed?: string;
      /** @example "58MB" */
      heapTotal?: string;
      /** @example "98MB" */
      rss?: string;
      /** @example "3MB" */
      external?: string;
    };
    cpu?: {
      /** @example 2484000 */
      user?: number;
      /** @example 828000 */
      system?: number;
    };
  };
}

export type DetailedHealthResponse = HealthResponse & {
  metrics?: {
    database?: {
      /** @example 4 */
      users?: number;
      /** @example 6 */
      userSettings?: number;
      /** @example 17450 */
      availability?: number;
      /** @example 5 */
      notifications?: number;
    };
    lastScraping?: {
      /** @example "success" */
      status?: string;
      /** @format date-time */
      startedAt?: string;
      /** @format date-time */
      completedAt?: string;
      /** @example 229 */
      itemsScraped?: number;
    };
  };
};

export interface ComponentHealth {
  /** @example "healthy" */
  status?: "healthy" | "unhealthy";
  /** @example "Firestore connection OK" */
  message?: string;
}

export type SchedulerHealth = ComponentHealth & {
  /**
   * 마지막 실행 시각 (현재는 N/A)
   * @example "N/A"
   */
  lastRun?: string;
};

export interface ErrorResponse {
  /** @example "Internal server error" */
  error?: string;
  /** @example "INTERNAL_ERROR" */
  code?: string;
  /** @example 500 */
  statusCode?: number;
  /** @format date-time */
  timestamp?: string;
  /** 개발 환경에서만 포함됨 */
  stack?: string | null;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:3000",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Camping Reservation Notifier API
 * @version 1.0.0
 * @license MIT
 * @baseUrl http://localhost:3000
 * @contact API Support (https://github.com/kwhong/camping-reservation-notifier)
 *
 * 캠핑장 예약 알림 시스템 REST API
 *
 * 이 API는 캠핑장 예약 가능 현황을 자동으로 스크래핑하고, 사용자가 설정한 조건에 맞는 예약이 가능해지면 이메일 알림을 보내는 서비스입니다.
 *
 * ## 주요 기능
 * - Firebase Authentication 기반 사용자 인증
 * - 사용자별 알림 설정 관리 (CRUD)
 * - 예약 가능 현황 조회 (사용자 설정 기반 필터링)
 * - 알림 전송 기록 조회
 * - 스크래핑 실행 기록 조회
 * - 시스템 헬스 체크
 *
 * ## 인증 방식
 * 모든 API 엔드포인트(헬스 체크 제외)는 Firebase ID Token을 요구합니다.
 * `Authorization: Bearer <Firebase_ID_Token>` 헤더를 포함해야 합니다.
 *
 * ## 기술 스택
 * - Backend: Node.js, Express
 * - Database: Firestore
 * - Scraping: Playwright
 * - Email: Nodemailer (Gmail SMTP)
 * - Logging: Winston
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  health = {
    /**
     * @description 시스템의 전반적인 상태를 확인합니다 (인증 불필요)
     *
     * @tags Health
     * @name GetHealth
     * @summary 기본 헬스 체크
     * @request GET:/health
     * @secure
     */
    getHealth: (params: RequestParams = {}) =>
      this.request<HealthResponse, ErrorResponse>({
        path: `/health`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 시스템 상태와 데이터베이스 메트릭을 함께 반환합니다
     *
     * @tags Health
     * @name GetDetailedHealth
     * @summary 상세 헬스 체크 (메트릭 포함)
     * @request GET:/health/detailed
     * @secure
     */
    getDetailedHealth: (params: RequestParams = {}) =>
      this.request<DetailedHealthResponse, any>({
        path: `/health/detailed`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Kubernetes/Docker용 liveness probe 엔드포인트
     *
     * @tags Health
     * @name GetLiveness
     * @summary Liveness probe
     * @request GET:/health/live
     * @secure
     */
    getLiveness: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "alive" */
          status?: string;
          /** @format date-time */
          timestamp?: string;
        },
        any
      >({
        path: `/health/live`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Kubernetes/Docker용 readiness probe 엔드포인트
     *
     * @tags Health
     * @name GetReadiness
     * @summary Readiness probe
     * @request GET:/health/ready
     * @secure
     */
    getReadiness: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "ready" */
          status?: string;
          /** @format date-time */
          timestamp?: string;
        },
        {
          /** @example "not_ready" */
          status?: string;
          /** @format date-time */
          timestamp?: string;
          checks?: object;
        }
      >({
        path: `/health/ready`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  api = {
    /**
     * @description Firebase ID Token을 검증하고, 사용자가 없으면 생성합니다
     *
     * @tags Authentication
     * @name VerifyToken
     * @summary 토큰 검증 및 사용자 가져오기/생성
     * @request POST:/api/auth/verify
     * @secure
     */
    verifyToken: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          user?: User;
        },
        ErrorResponse
      >({
        path: `/api/auth/verify`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 사용자의 displayName, notificationEmail, pushToken을 업데이트합니다
     *
     * @tags Authentication
     * @name UpdateProfile
     * @summary 사용자 프로필 업데이트
     * @request PUT:/api/auth/profile
     * @secure
     */
    updateProfile: (
      data: {
        /** @example "홍길동" */
        displayName?: string;
        /**
         * @format email
         * @example "notification@example.com"
         */
        notificationEmail?: string;
        /** @example "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" */
        pushToken?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Profile updated successfully" */
          message?: string;
        },
        ErrorResponse
      >({
        path: `/api/auth/profile`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 로그인한 사용자의 모든 알림 설정을 조회합니다
     *
     * @tags Settings
     * @name GetUserSettings
     * @summary 사용자의 모든 알림 설정 조회
     * @request GET:/api/settings
     * @secure
     */
    getUserSettings: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          data?: UserSetting[];
        },
        ErrorResponse
      >({
        path: `/api/settings`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 새로운 알림 설정을 생성합니다
     *
     * @tags Settings
     * @name CreateUserSetting
     * @summary 새 알림 설정 생성
     * @request POST:/api/settings
     * @secure
     */
    createUserSetting: (
      data: {
        /**
         * @default "다리안계곡캠핑장"
         * @example "다리안계곡캠핑장"
         */
        campingName?: string;
        /**
         * @default "충북 단양"
         * @example "충북 단양"
         */
        region?: string;
        /**
         * 빈 배열이면 모든 구역 감시
         * @default []
         * @example ["A구역","B구역"]
         */
        area?: string[];
        /**
         * 감시 시작 날짜 (필수)
         * @format date
         * @example "2025-11-01"
         */
        dateFrom: string;
        /**
         * 감시 종료 날짜 (미입력시 dateFrom과 동일)
         * @format date
         * @example "2025-11-30"
         */
        dateTo?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          data?: UserSetting;
        },
        ErrorResponse
      >({
        path: `/api/settings`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 기존 알림 설정을 업데이트합니다 (본인 소유만 가능)
     *
     * @tags Settings
     * @name UpdateUserSetting
     * @summary 알림 설정 업데이트
     * @request PUT:/api/settings/{id}
     * @secure
     */
    updateUserSetting: (
      id: string,
      data: {
        /** @example "다리안계곡캠핑장" */
        campingName?: string;
        /** @example "충북 단양" */
        region?: string;
        /** @example ["A구역"] */
        area?: string[];
        /**
         * @format date
         * @example "2025-11-01"
         */
        dateFrom?: string;
        /**
         * @format date
         * @example "2025-11-30"
         */
        dateTo?: string;
        /**
         * 알림 활성화 여부
         * @example true
         */
        isActive?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Setting updated successfully" */
          message?: string;
        },
        ErrorResponse
      >({
        path: `/api/settings/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 알림 설정을 삭제합니다 (본인 소유만 가능)
     *
     * @tags Settings
     * @name DeleteUserSetting
     * @summary 알림 설정 삭제
     * @request DELETE:/api/settings/{id}
     * @secure
     */
    deleteUserSetting: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Setting deleted successfully" */
          message?: string;
        },
        ErrorResponse
      >({
        path: `/api/settings/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 사용자의 활성 설정에 맞는 예약 가능 현황을 조회합니다 (availableCount > 0만 반환)
     *
     * @tags Availability
     * @name GetAvailability
     * @summary 예약 가능 현황 조회
     * @request GET:/api/availability
     * @secure
     */
    getAvailability: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          data?: Availability[];
        },
        ErrorResponse
      >({
        path: `/api/availability`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 알림 전송 기록을 최신순으로 조회합니다
     *
     * @tags Logs
     * @name GetNotificationLogs
     * @summary 알림 전송 기록 조회
     * @request GET:/api/logs/notifications
     * @secure
     */
    getNotificationLogs: (
      query?: {
        /**
         * 조회할 최대 개수
         * @default 50
         * @example 50
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          data?: NotificationLog[];
        },
        ErrorResponse
      >({
        path: `/api/logs/notifications`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description 스크래핑 실행 기록을 최신순으로 조회합니다
     *
     * @tags Logs
     * @name GetScrapingLogs
     * @summary 스크래핑 실행 기록 조회
     * @request GET:/api/logs/scraping
     * @secure
     */
    getScrapingLogs: (
      query?: {
        /**
         * 조회할 최대 개수
         * @default 50
         * @example 50
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          data?: ScrapingLog[];
        },
        ErrorResponse
      >({
        path: `/api/logs/scraping`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
