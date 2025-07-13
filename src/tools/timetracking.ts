import { z } from 'zod';
import { FreeloClient } from '../client/FreeloClient.js';
import { dateSchema } from '../utils/validators.js';
import { Tool } from './projects.js';

export const timeTrackingTools: Tool[] = [
  {
    name: 'freelo_start_timer',
    description: 'Start time tracking for a task',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID to track time for'),
      note: z.string().optional().describe('Optional note for time tracking'),
    }),
    handler: async (input, client) => {
      await client.startTimeTracking(input);
      return {
        success: true,
        message: `Started time tracking for task ${input.task_id}`,
        note: input.note,
      };
    },
  },

  {
    name: 'freelo_stop_timer',
    description: 'Stop the currently running time tracker',
    inputSchema: z.object({}),
    handler: async (_, client) => {
      await client.stopTimeTracking();
      return {
        success: true,
        message: 'Time tracking stopped',
      };
    },
  },

  {
    name: 'freelo_create_work_report',
    description: 'Create a work report for a task',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID'),
      minutes: z.number().int().positive().describe('Time spent in minutes'),
      note: z.string().optional().describe('Work description'),
      date_reported: dateSchema.describe('Date of work (ISO 8601 format)'),
    }),
    handler: async (input, client) => {
      const { task_id, ...params } = input;
      const report = await client.createWorkReport(task_id, params);
      return {
        success: true,
        work_report: {
          id: report.id,
          task_id: report.task_id,
          minutes: report.minutes,
          note: report.note,
          date_reported: report.date_reported,
          created_at: report.created_at,
        },
      };
    },
  },

  {
    name: 'freelo_list_work_reports',
    description: 'List work reports with filters',
    inputSchema: z.object({
      project_ids: z.array(z.number()).optional().describe('Filter by project IDs'),
      user_ids: z.array(z.number()).optional().describe('Filter by user IDs'),
      task_ids: z.array(z.number()).optional().describe('Filter by task IDs'),
      task_labels: z.array(z.string()).optional().describe('Filter by task labels'),
      date_reported_range: z.string().optional().describe('Date range (YYYY-MM-DD..YYYY-MM-DD)'),
      page: z.number().int().min(0).optional().default(0).describe('Page number'),
    }),
    handler: async (input, client) => {
      const { page, project_ids, user_ids, task_ids, task_labels, ...params } = input;
      const response = await client.getWorkReports({
        ...params,
        projects_ids: project_ids,
        users_ids: user_ids,
        tasks_ids: task_ids,
        tasks_labels: task_labels,
        p: page,
      });
      return {
        total: response.total,
        count: response.count,
        page: response.page,
        per_page: response.per_page,
        work_reports: response.data.map((r) => ({
          id: r.id,
          task_id: r.task_id,
          user_id: r.user_id,
          minutes: r.minutes,
          hours: (r.minutes / 60).toFixed(2),
          note: r.note,
          date_reported: r.date_reported,
          created_at: r.created_at,
        })),
        total_minutes: response.data.reduce((sum, r) => sum + r.minutes, 0),
        total_hours: (response.data.reduce((sum, r) => sum + r.minutes, 0) / 60).toFixed(2),
      };
    },
  },
];