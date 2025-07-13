export interface FreeloConfig {
  email: string;
  apiKey: string;
  userAgent?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  count: number;
  page: number;
  per_page: number;
  data: T[];
}

export interface Currency {
  amount: string;
  currency: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  firstname: string;
  lastname: string;
  avatar?: string;
}

export interface Project {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  currency: Currency;
  budget?: Currency;
  color?: string;
  project_owner: User;
  workers?: User[];
  tasklists?: Tasklist[];
  state_id: number;
  is_template: boolean;
  is_archived: boolean;
}

export interface Tasklist {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  position: number;
  tasks_count?: number;
  finished_tasks_count?: number;
}

export interface Task {
  id: number;
  project_id: number;
  tasklist_id: number;
  name: string;
  content?: string;
  created_at: string;
  updated_at: string;
  finished_at?: string;
  due_date?: string;
  due_date_end?: string;
  position: number;
  worker?: User;
  author: User;
  labels?: Label[];
  subtasks?: Subtask[];
  comments_count?: number;
  attachments_count?: number;
  is_finished: boolean;
  is_private: boolean;
}

export interface Subtask {
  id: number;
  task_id: number;
  name: string;
  position: number;
  is_finished: boolean;
  worker?: User;
}

export interface Comment {
  id: number;
  task_id: number;
  project_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author: User;
  attachments?: Attachment[];
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface WorkReport {
  id: number;
  task_id: number;
  user_id: number;
  minutes: number;
  note?: string;
  date_reported: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  uuid: string;
  name: string;
  size: number;
  mime_type: string;
  url?: string;
}

export interface Notification {
  id: number;
  type: string;
  project_id?: number;
  task_id?: number;
  is_read: boolean;
  created_at: string;
  data: any;
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
}

export interface CreateProjectParams {
  name: string;
  currency_iso: 'CZK' | 'EUR' | 'USD';
  project_owner_id?: number;
}

export interface CreateTaskParams {
  name: string;
  content?: string;
  worker_id?: number;
  due_date?: string;
  due_date_end?: string;
  labels?: number[];
  subtasks?: string[];
  is_private?: boolean;
}

export interface UpdateTaskParams {
  name?: string;
  content?: string;
  worker_id?: number | null;
  due_date?: string | null;
  due_date_end?: string | null;
  labels?: number[];
  is_private?: boolean;
}

export interface CreateCommentParams {
  content: string;
  attachments?: string[];
}

export interface TimeTrackingStartParams {
  task_id: number;
  note?: string;
}

export interface CreateWorkReportParams {
  minutes: number;
  note?: string;
  date_reported: string;
}

export interface SearchParams {
  query: string;
  size?: number;
  from?: number;
  filters?: {
    projects_ids?: number[];
    users_ids?: number[];
    types?: string[];
  };
}