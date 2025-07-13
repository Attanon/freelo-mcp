import { z } from 'zod';
import { FreeloClient } from '../client/FreeloClient.js';
import { orderSchema } from '../utils/validators.js';
import { Tool } from './projects.js';

export const tasklistTools: Tool[] = [
  {
    name: 'freelo_list_tasklists',
    description: 'List all tasklists across projects',
    inputSchema: z.object({
      project_ids: z.array(z.number()).optional().describe('Filter by project IDs'),
      order_by: z.string().optional().describe('Field to order by'),
      order: orderSchema.optional().describe('Order direction'),
      page: z.number().int().min(0).optional().default(0).describe('Page number'),
    }),
    handler: async (input, client) => {
      const { page, project_ids, ...params } = input;
      const response = await client.getTasklists({
        ...params,
        projects_ids: project_ids,
        p: page,
      });
      return {
        total: response.total,
        count: response.count,
        page: response.page,
        per_page: response.per_page,
        tasklists: response.data.map((t) => ({
          id: t.id,
          project_id: t.project_id,
          name: t.name,
          position: t.position,
          tasks_count: t.tasks_count || 0,
          finished_tasks_count: t.finished_tasks_count || 0,
          created_at: t.created_at,
        })),
      };
    },
  },

  {
    name: 'freelo_get_tasklist',
    description: 'Get detailed information about a specific tasklist',
    inputSchema: z.object({
      tasklist_id: z.number().int().positive().describe('Tasklist ID'),
    }),
    handler: async (input, client) => {
      const tasklist = await client.getTasklist(input.tasklist_id);
      return {
        id: tasklist.id,
        project_id: tasklist.project_id,
        name: tasklist.name,
        created_at: tasklist.created_at,
        updated_at: tasklist.updated_at,
        position: tasklist.position,
        tasks_count: tasklist.tasks_count || 0,
        finished_tasks_count: tasklist.finished_tasks_count || 0,
        unfinished_tasks_count: (tasklist.tasks_count || 0) - (tasklist.finished_tasks_count || 0),
      };
    },
  },

  {
    name: 'freelo_create_tasklist',
    description: 'Create a new tasklist in a project',
    inputSchema: z.object({
      project_id: z.number().int().positive().describe('Project ID'),
      name: z.string().min(1).describe('Tasklist name'),
    }),
    handler: async (input, client) => {
      const tasklist = await client.createTasklist(input.project_id, input.name);
      return {
        success: true,
        tasklist: {
          id: tasklist.id,
          project_id: tasklist.project_id,
          name: tasklist.name,
          position: tasklist.position,
        },
      };
    },
  },
];