import { z } from 'zod';
import { FreeloClient } from '../client/FreeloClient.js';
import { orderSchema, dateSchema } from '../utils/validators.js';
import { Tool } from './projects.js';

export const taskTools: Tool[] = [
  {
    name: 'freelo_list_tasks',
    description: 'List tasks in a specific tasklist',
    inputSchema: z.object({
      project_id: z.number().int().positive().describe('Project ID'),
      tasklist_id: z.number().int().positive().describe('Tasklist ID'),
      order_by: z.string().optional().describe('Field to order by'),
      order: orderSchema.optional().describe('Order direction'),
    }),
    handler: async (input, client) => {
      const tasks = await client.getTasks(input.project_id, input.tasklist_id, {
        order_by: input.order_by,
        order: input.order,
      });
      return {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          name: t.name,
          worker: t.worker?.name || 'Unassigned',
          due_date: t.due_date,
          is_finished: t.is_finished,
          labels: t.labels?.map((l) => l.name) || [],
          comments_count: t.comments_count || 0,
          attachments_count: t.attachments_count || 0,
        })),
      };
    },
  },

  {
    name: 'freelo_get_all_tasks',
    description: 'Search and list tasks across all projects with filters',
    inputSchema: z.object({
      search_query: z.string().optional().describe('Search query'),
      state_id: z.number().optional().describe('State ID (1=active, 2=finished)'),
      project_ids: z.array(z.number()).optional().describe('Filter by project IDs'),
      tasklist_ids: z.array(z.number()).optional().describe('Filter by tasklist IDs'),
      worker_id: z.number().optional().describe('Filter by assigned worker ID'),
      with_label: z.string().optional().describe('Filter by label name'),
      due_date_range: z.string().optional().describe('Due date range (YYYY-MM-DD..YYYY-MM-DD)'),
      order_by: z.string().optional().describe('Field to order by'),
      order: orderSchema.optional().describe('Order direction'),
      page: z.number().int().min(0).optional().default(0).describe('Page number'),
    }),
    handler: async (input, client) => {
      const { page, project_ids, tasklist_ids, ...params } = input;
      const response = await client.getAllTasks({
        ...params,
        projects_ids: project_ids,
        tasklists_ids: tasklist_ids,
        p: page,
      });
      return {
        total: response.total,
        count: response.count,
        page: response.page,
        per_page: response.per_page,
        tasks: response.data.map((t) => ({
          id: t.id,
          name: t.name,
          project_id: t.project_id,
          tasklist_id: t.tasklist_id,
          worker: t.worker?.name || 'Unassigned',
          author: t.author.name,
          due_date: t.due_date,
          is_finished: t.is_finished,
          finished_at: t.finished_at,
          labels: t.labels?.map((l) => l.name) || [],
        })),
      };
    },
  },

  {
    name: 'freelo_get_task',
    description: 'Get detailed information about a specific task',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID'),
    }),
    handler: async (input, client) => {
      const task = await client.getTask(input.task_id);
      console.error(`[DEBUG] Raw task data:`, JSON.stringify(task, null, 2));
      
      return {
        id: task.id,
        name: task.name,
        content: task.content,
        project_id: task.project_id,
        tasklist_id: task.tasklist_id,
        created_at: task.created_at || (task as any).date_add,
        updated_at: task.updated_at || (task as any).date_edited_at,
        finished_at: task.finished_at || (task as any).date_finished,
        due_date: task.due_date,
        due_date_end: task.due_date_end,
        worker: task.worker ? {
          id: task.worker.id,
          name: task.worker.name,
          email: task.worker.email,
        } : null,
        author: {
          id: task.author.id,
          name: task.author.name,
          email: task.author.email,
        },
        labels: task.labels?.map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })) || [],
        subtasks: task.subtasks?.map((s) => ({
          id: s.id,
          name: s.name,
          is_finished: s.is_finished,
          worker: s.worker?.name,
        })) || [],
        // Include comments from the API response
        comments: (task as any).comments || [],
        // Additional fields from API
        priority: (task as any).priority_enum,
        state: (task as any).state,
        cost: (task as any).cost,
        minutes: (task as any).minutes,
        total_time_estimate: (task as any).total_time_estimate,
        count_subtasks: (task as any).count_subtasks,
        custom_fields: (task as any).custom_fields,
        project: (task as any).project,
        tasklist: (task as any).tasklist,
        is_finished: task.is_finished,
        is_private: task.is_private,
        comments_count: task.comments_count || 0,
        attachments_count: task.attachments_count || 0,
      };
    },
  },

  {
    name: 'freelo_create_task',
    description: 'Create a new task in a tasklist',
    inputSchema: z.object({
      project_id: z.number().int().positive().describe('Project ID'),
      tasklist_id: z.number().int().positive().describe('Tasklist ID'),
      name: z.string().min(1).describe('Task name'),
      content: z.string().optional().describe('Task description'),
      worker_id: z.number().int().positive().optional().describe('Assigned worker ID'),
      due_date: dateSchema.optional().describe('Due date (ISO 8601 format)'),
      due_date_end: dateSchema.optional().describe('Due date end (ISO 8601 format)'),
      labels: z.array(z.number()).optional().describe('Label IDs to assign'),
      subtasks: z.array(z.string()).optional().describe('Subtask names'),
      is_private: z.boolean().optional().describe('Make task private'),
    }),
    handler: async (input, client) => {
      const { project_id, tasklist_id, ...taskParams } = input;
      const task = await client.createTask(project_id, tasklist_id, taskParams);
      return {
        success: true,
        task: {
          id: task.id,
          name: task.name,
          worker: task.worker?.name || 'Unassigned',
          due_date: task.due_date,
          labels: task.labels?.map((l) => l.name) || [],
        },
      };
    },
  },

  {
    name: 'freelo_update_task',
    description: 'Update an existing task',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID'),
      name: z.string().optional().describe('New task name'),
      content: z.string().optional().describe('New task description'),
      worker_id: z.number().int().positive().nullable().optional().describe('New worker ID (null to unassign)'),
      due_date: dateSchema.nullable().optional().describe('New due date (null to remove)'),
      due_date_end: dateSchema.nullable().optional().describe('New due date end (null to remove)'),
      labels: z.array(z.number()).optional().describe('New label IDs (replaces existing)'),
      is_private: z.boolean().optional().describe('Update private status'),
    }),
    handler: async (input, client) => {
      const { task_id, ...updateParams } = input;
      const task = await client.updateTask(task_id, updateParams);
      return {
        success: true,
        task: {
          id: task.id,
          name: task.name,
          worker: task.worker?.name || 'Unassigned',
          due_date: task.due_date,
          is_private: task.is_private,
        },
      };
    },
  },

  {
    name: 'freelo_finish_task',
    description: 'Mark a task as finished',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID to finish'),
    }),
    handler: async (input, client) => {
      await client.finishTask(input.task_id);
      return {
        success: true,
        message: `Task ${input.task_id} has been marked as finished`,
      };
    },
  },

  {
    name: 'freelo_activate_task',
    description: 'Reactivate a finished task',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID to activate'),
    }),
    handler: async (input, client) => {
      await client.activateTask(input.task_id);
      return {
        success: true,
        message: `Task ${input.task_id} has been reactivated`,
      };
    },
  },

  {
    name: 'freelo_move_task',
    description: 'Move a task to a different tasklist',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID to move'),
      tasklist_id: z.number().int().positive().describe('Target tasklist ID'),
    }),
    handler: async (input, client) => {
      await client.moveTask(input.task_id, input.tasklist_id);
      return {
        success: true,
        message: `Task ${input.task_id} has been moved to tasklist ${input.tasklist_id}`,
      };
    },
  },

  {
    name: 'freelo_delete_task',
    description: 'Delete a task permanently',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID to delete'),
      confirm: z.boolean().describe('Confirm deletion (must be true)'),
    }),
    handler: async (input, client) => {
      if (!input.confirm) {
        return {
          success: false,
          error: 'Deletion not confirmed. Set confirm to true to delete.',
        };
      }
      await client.deleteTask(input.task_id);
      return {
        success: true,
        message: `Task ${input.task_id} has been permanently deleted`,
      };
    },
  },
];