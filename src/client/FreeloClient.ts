import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  FreeloConfig,
  PaginatedResponse,
  Project,
  Task,
  Tasklist,
  Comment,
  WorkReport,
  CreateProjectParams,
  CreateTaskParams,
  UpdateTaskParams,
  CreateCommentParams,
  TimeTrackingStartParams,
  CreateWorkReportParams,
  ApiError,
  User,
  Notification,
  SearchParams,
  Attachment,
} from './types.js';

export class FreeloClient {
  private client: AxiosInstance;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly RATE_LIMIT = 25;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  constructor(private config: FreeloConfig) {
    this.client = axios.create({
      baseURL: 'https://api.freelo.io/v1',
      auth: {
        username: config.email,
        password: config.apiKey,
      },
      headers: {
        'User-Agent': config.userAgent || `FreeloMCP/1.0 (${config.email})`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      await this.enforceRateLimit();
      console.error(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`, config.params ? JSON.stringify(config.params) : '');
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        console.error(`[HTTP] Response ${response.status}:`, typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 200) + '...' : response.data);
        return response;
      },
      (error: AxiosError) => {
        console.error(`[HTTP] Error:`, error.response?.status, error.response?.data);
        if (error.response) {
          const apiError: ApiError = {
            error: error.response.statusText,
            message: (error.response.data as any)?.message || 'Unknown error',
            status_code: error.response.status,
          };
          throw apiError;
        }
        throw error;
      }
    );
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceWindow = now - this.lastRequestTime;

    if (timeSinceWindow >= this.RATE_LIMIT_WINDOW) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    if (this.requestCount >= this.RATE_LIMIT) {
      const waitTime = this.RATE_LIMIT_WINDOW - timeSinceWindow;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }

  // Projects
  async getProjects(params?: {
    order_by?: string;
    order?: 'asc' | 'desc';
  }): Promise<Project[]> {
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async getAllProjects(params?: {
    order_by?: string;
    order?: 'asc' | 'desc';
    tags?: string[];
    states_ids?: number[];
    users_ids?: number[];
    created_in_range?: string;
    p?: number;
  }): Promise<PaginatedResponse<Project>> {
    const response = await this.client.get('/all-projects', { params });
    return response.data;
  }

  async getProject(projectId: number): Promise<Project> {
    const response = await this.client.get(`/project/${projectId}`);
    return response.data;
  }

  async createProject(params: CreateProjectParams): Promise<Project> {
    const response = await this.client.post('/projects', params);
    return response.data;
  }

  async archiveProject(projectId: number): Promise<void> {
    await this.client.post(`/project/${projectId}/archive`);
  }

  async activateProject(projectId: number): Promise<void> {
    await this.client.post(`/project/${projectId}/activate`);
  }

  async deleteProject(projectId: number): Promise<void> {
    await this.client.delete(`/project/${projectId}`);
  }

  // Tasks
  async getTasks(projectId: number, tasklistId: number, params?: {
    order_by?: string;
    order?: 'asc' | 'desc';
  }): Promise<Task[]> {
    const response = await this.client.get(
      `/project/${projectId}/tasklist/${tasklistId}/tasks`,
      { params }
    );
    return response.data;
  }

  async getAllTasks(params?: {
    search_query?: string;
    state_id?: number;
    projects_ids?: number[];
    tasklists_ids?: number[];
    order_by?: string;
    order?: 'asc' | 'desc';
    with_label?: string;
    due_date_range?: string;
    worker_id?: number;
    p?: number;
  }): Promise<PaginatedResponse<Task>> {
    const response = await this.client.get('/all-tasks', { params });
    return response.data;
  }

  async getTask(taskId: number): Promise<Task> {
    console.error(`[HTTP] Getting task details for ID: ${taskId}`);
    const response = await this.client.get(`/task/${taskId}`);
    console.error(`[HTTP] Task response structure:`, {
      hasData: !!response.data,
      dataType: typeof response.data,
      keys: response.data ? Object.keys(response.data) : 'no data'
    });
    return response.data;
  }

  async createTask(
    projectId: number,
    tasklistId: number,
    params: CreateTaskParams
  ): Promise<Task> {
    const response = await this.client.post(
      `/project/${projectId}/tasklist/${tasklistId}/tasks`,
      params
    );
    return response.data;
  }

  async updateTask(taskId: number, params: UpdateTaskParams): Promise<Task> {
    const response = await this.client.post(`/task/${taskId}`, params);
    return response.data;
  }

  async finishTask(taskId: number): Promise<void> {
    await this.client.post(`/task/${taskId}/finish`);
  }

  async activateTask(taskId: number): Promise<void> {
    await this.client.post(`/task/${taskId}/activate`);
  }

  async moveTask(taskId: number, tasklistId: number): Promise<void> {
    await this.client.post(`/task/${taskId}/move/${tasklistId}`);
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.client.delete(`/task/${taskId}`);
  }

  // Tasklists
  async getTasklists(params?: {
    projects_ids?: number[];
    order_by?: string;
    order?: 'asc' | 'desc';
    p?: number;
  }): Promise<PaginatedResponse<Tasklist>> {
    const response = await this.client.get('/all-tasklists', { params });
    return response.data;
  }

  async getTasklist(tasklistId: number): Promise<Tasklist> {
    const response = await this.client.get(`/tasklist/${tasklistId}`);
    return response.data;
  }

  async createTasklist(projectId: number, name: string): Promise<Tasklist> {
    const response = await this.client.post(`/project/${projectId}/tasklists`, { name });
    return response.data;
  }

  // Comments
  async createComment(taskId: number, params: CreateCommentParams): Promise<Comment> {
    const response = await this.client.post(`/task/${taskId}/comments`, params);
    return response.data;
  }

  async getAllComments(params?: {
    projects_ids?: number[];
    type?: string;
    order_by?: string;
    order?: 'asc' | 'desc';
    p?: number;
  }): Promise<PaginatedResponse<Comment>> {
    const response = await this.client.get('/all-comments', { params });
    return response.data;
  }

  // Time Tracking
  async startTimeTracking(params: TimeTrackingStartParams): Promise<void> {
    await this.client.post('/timetracking/start', params);
  }

  async stopTimeTracking(): Promise<void> {
    await this.client.post('/timetracking/stop');
  }

  // Work Reports
  async createWorkReport(taskId: number, params: CreateWorkReportParams): Promise<WorkReport> {
    const response = await this.client.post(`/task/${taskId}/work-reports`, params);
    return response.data;
  }

  async getWorkReports(params?: {
    projects_ids?: number[];
    users_ids?: number[];
    tasks_ids?: number[];
    tasks_labels?: string[];
    date_reported_range?: string;
    p?: number;
  }): Promise<PaginatedResponse<WorkReport>> {
    const response = await this.client.get('/work-reports', { params });
    return response.data;
  }

  // Users
  async getUsers(): Promise<User[]> {
    const response = await this.client.get('/users');
    return response.data;
  }

  // Notifications
  async getNotifications(params?: {
    projects_ids?: number[];
    users_ids?: number[];
    teams_uuids?: string[];
    notification_types?: string[];
    only_unread?: boolean;
    p?: number;
  }): Promise<PaginatedResponse<Notification>> {
    const response = await this.client.get('/all-notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.client.post(`/notification/${notificationId}/mark-as-read`);
  }

  // Search
  async search(params: SearchParams): Promise<any> {
    const response = await this.client.post('/search', params);
    return response.data;
  }

  // Files
  async uploadFile(file: Buffer, filename: string): Promise<Attachment> {
    const formData = new FormData();
    const blob = new Blob([file]);
    formData.append('file', blob, filename);

    const response = await this.client.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async downloadFile(fileUuid: string): Promise<Buffer> {
    const response = await this.client.get(`/file/${fileUuid}`, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }
}