import { z } from 'zod';
import { FreeloClient } from '../client/FreeloClient.js';
import { currencySchema, orderSchema } from '../utils/validators.js';

export interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (input: any, client: FreeloClient) => Promise<any>;
}

export const projectTools: Tool[] = [
  {
    name: 'freelo_list_projects',
    description: 'List active projects in Freelo',
    inputSchema: z.object({
      order_by: z.string().optional().describe('Field to order by'),
      order: orderSchema.optional().describe('Order direction (asc or desc)'),
    }),
    handler: async (input, client) => {
      const projects = await client.getProjects(input);
      return {
        count: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          owner: p.project_owner.name,
          currency: p.currency.currency,
          workers_count: p.workers?.length || 0,
          tasklists_count: p.tasklists?.length || 0,
          is_archived: p.is_archived,
          is_template: p.is_template,
        })),
      };
    },
  },

  {
    name: 'freelo_get_all_projects',
    description: 'Get all projects (active, archived, templates) with pagination',
    inputSchema: z.object({
      page: z.number().int().min(0).optional().default(0).describe('Page number (0-based)'),
      order_by: z.string().optional().describe('Field to order by'),
      order: orderSchema.optional().describe('Order direction'),
      tags: z.array(z.string()).optional().describe('Filter by tags'),
      states_ids: z.array(z.number()).optional().describe('Filter by state IDs'),
      users_ids: z.array(z.number()).optional().describe('Filter by user IDs'),
      created_in_range: z.string().optional().describe('Date range in format: YYYY-MM-DD..YYYY-MM-DD'),
    }),
    handler: async (input, client) => {
      const { page, ...params } = input;
      const response = await client.getAllProjects({ ...params, p: page });
      return {
        total: response.total,
        count: response.count,
        page: response.page,
        per_page: response.per_page,
        projects: response.data.map((p) => ({
          id: p.id,
          name: p.name,
          owner: p.project_owner.name,
          currency: p.currency.currency,
          state_id: p.state_id,
          is_archived: p.is_archived,
          is_template: p.is_template,
          created_at: p.created_at,
        })),
      };
    },
  },

  {
    name: 'freelo_get_project',
    description: 'Get detailed information about a specific project',
    inputSchema: z.object({
      project_id: z.number().int().positive().describe('Project ID'),
    }),
    handler: async (input, client) => {
      const project = await client.getProject(input.project_id);
      return {
        id: project.id,
        name: project.name,
        created_at: project.created_at,
        updated_at: project.updated_at,
        owner: {
          id: project.project_owner.id,
          name: project.project_owner.name,
          email: project.project_owner.email,
        },
        currency: project.currency,
        budget: project.budget,
        color: project.color,
        workers: project.workers?.map((w) => ({
          id: w.id,
          name: w.name,
          email: w.email,
        })),
        tasklists: project.tasklists?.map((t) => ({
          id: t.id,
          name: t.name,
          tasks_count: t.tasks_count,
          finished_tasks_count: t.finished_tasks_count,
        })),
        state_id: project.state_id,
        is_archived: project.is_archived,
        is_template: project.is_template,
      };
    },
  },

  {
    name: 'freelo_create_project',
    description: 'Create a new project in Freelo',
    inputSchema: z.object({
      name: z.string().min(1).describe('Project name'),
      currency: currencySchema.describe('Project currency (CZK, EUR, or USD)'),
      owner_id: z.number().int().positive().optional().describe('Project owner user ID (defaults to current user)'),
    }),
    handler: async (input, client) => {
      const project = await client.createProject({
        name: input.name,
        currency_iso: input.currency,
        project_owner_id: input.owner_id,
      });
      return {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          currency: project.currency.currency,
          owner: project.project_owner.name,
        },
      };
    },
  },

  {
    name: 'freelo_archive_project',
    description: 'Archive an active project',
    inputSchema: z.object({
      project_id: z.number().int().positive().describe('Project ID to archive'),
    }),
    handler: async (input, client) => {
      await client.archiveProject(input.project_id);
      return {
        success: true,
        message: `Project ${input.project_id} has been archived`,
      };
    },
  },

  {
    name: 'freelo_activate_project',
    description: 'Activate an archived project',
    inputSchema: z.object({
      project_id: z.number().int().positive().describe('Project ID to activate'),
    }),
    handler: async (input, client) => {
      await client.activateProject(input.project_id);
      return {
        success: true,
        message: `Project ${input.project_id} has been activated`,
      };
    },
  },

  {
    name: 'freelo_delete_project',
    description: 'Permanently delete a project (use with caution)',
    inputSchema: z.object({
      project_id: z.number().int().positive().describe('Project ID to delete'),
      confirm: z.boolean().describe('Confirm deletion (must be true)'),
    }),
    handler: async (input, client) => {
      if (!input.confirm) {
        return {
          success: false,
          error: 'Deletion not confirmed. Set confirm to true to delete.',
        };
      }
      await client.deleteProject(input.project_id);
      return {
        success: true,
        message: `Project ${input.project_id} has been permanently deleted`,
      };
    },
  },
];