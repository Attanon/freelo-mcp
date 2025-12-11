import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { FreeloClient } from '../client/FreeloClient.js';
import { Tool } from './projects.js';

export const fileTools: Tool[] = [
  {
    name: 'freelo_download_file',
    description: 'Download a file attachment from Freelo by its UUID. Returns base64 by default, or saves to temp file if save_to_file is true.',
    inputSchema: z.object({
      file_uuid: z.string().describe('File UUID from attachment'),
      save_to_file: z.boolean().optional().default(false).describe('If true, save to temp file and return path. If false (default), return base64 content.'),
      filename: z.string().optional().describe('Optional filename for saved file (used with save_to_file)'),
    }),
    handler: async (input, client) => {
      const buffer = await client.downloadFile(input.file_uuid);

      if (input.save_to_file) {
        const filename = input.filename || `freelo_${input.file_uuid}`;
        const filepath = join(tmpdir(), filename);
        await writeFile(filepath, buffer);
        return {
          success: true,
          file_uuid: input.file_uuid,
          saved_to: filepath,
          size_bytes: buffer.length,
        };
      }

      return {
        success: true,
        file_uuid: input.file_uuid,
        content_base64: buffer.toString('base64'),
        size_bytes: buffer.length,
      };
    },
  },
];
