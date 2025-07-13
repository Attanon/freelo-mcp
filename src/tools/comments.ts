import { z } from 'zod';
import { FreeloClient } from '../client/FreeloClient.js';
import { orderSchema } from '../utils/validators.js';
import { Tool } from './projects.js';

export const commentTools: Tool[] = [
  {
    name: 'freelo_add_comment',
    description: 'Add a comment to a task',
    inputSchema: z.object({
      task_id: z.number().int().positive().describe('Task ID'),
      content: z.string().min(1).describe('Comment content'),
      attachment_uuids: z.array(z.string()).optional().describe('Attachment UUIDs from file uploads'),
    }),
    handler: async (input, client) => {
      const { task_id, attachment_uuids, ...params } = input;
      const comment = await client.createComment(task_id, {
        content: params.content,
        attachments: attachment_uuids,
      });
      return {
        success: true,
        comment: {
          id: comment.id,
          task_id: comment.task_id,
          author: comment.author.name,
          content: comment.content,
          created_at: comment.created_at,
          attachments: comment.attachments?.map((a) => ({
            name: a.name,
            size: a.size,
            mime_type: a.mime_type,
          })) || [],
        },
      };
    },
  },

  {
    name: 'freelo_list_comments',
    description: 'List all comments across projects',
    inputSchema: z.object({
      project_ids: z.array(z.number()).optional().describe('Filter by project IDs'),
      type: z.string().optional().describe('Comment type filter'),
      order_by: z.string().optional().describe('Field to order by'),
      order: orderSchema.optional().describe('Order direction'),
      page: z.number().int().min(0).optional().default(0).describe('Page number'),
    }),
    handler: async (input, client) => {
      const { page, project_ids, ...params } = input;
      const response = await client.getAllComments({
        ...params,
        projects_ids: project_ids,
        p: page,
      });
      
      // Debug: log the response structure
      console.error('[DEBUG] getAllComments response:', JSON.stringify(response, null, 2));
      
      // Check if response has expected structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from getAllComments: not an object');
      }
      
      // Handle case where response might not be paginated
      if (Array.isArray(response)) {
        // Direct array response
        return {
          total: response.length,
          count: response.length,
          page: page || 0,
          per_page: response.length,
          comments: response.map((c) => ({
            id: c.id,
            task_id: c.task_id,
            project_id: c.project_id,
            author: c.author.name,
            content: c.content,
            created_at: c.created_at,
            attachments_count: c.attachments?.length || 0,
          })),
        };
      }
      
      // Handle paginated response
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`Invalid response from getAllComments: data is not an array, got ${typeof response.data}`);
      }
      
      return {
        total: response.total,
        count: response.count,
        page: response.page,
        per_page: response.per_page,
        comments: response.data.map((c) => ({
          id: c.id,
          task_id: c.task_id,
          project_id: c.project_id,
          author: c.author.name,
          content: c.content,
          created_at: c.created_at,
          attachments_count: c.attachments?.length || 0,
        })),
      };
    },
  },
];