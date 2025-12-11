#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { FreeloClient } from './client/FreeloClient.js';
import { FreeloConfig } from './client/types.js';
import { projectTools } from './tools/projects.js';
import { taskTools } from './tools/tasks.js';
import { tasklistTools } from './tools/tasklists.js';
import { commentTools } from './tools/comments.js';
import { timeTrackingTools } from './tools/timetracking.js';
import { fileTools } from './tools/files.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Get configuration from environment variables
const config: FreeloConfig = {
  email: process.env.FREELO_EMAIL || '',
  apiKey: process.env.FREELO_API_KEY || '',
  userAgent: process.env.FREELO_USER_AGENT,
};

// Create Freelo client (will be null if config is invalid)
let client: FreeloClient | null = null;
let configError: string | null = null;

try {
  if (!config.email || !config.apiKey) {
    configError = 'FREELO_EMAIL and FREELO_API_KEY environment variables are required';
  } else {
    client = new FreeloClient(config);
  }
} catch (error) {
  configError = error instanceof Error ? error.message : 'Failed to initialize Freelo client';
}

// Create MCP server
const server = new Server(
  {
    name: 'freelo-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Combine all tools
const allTools = [
    // ...projectTools,
    ...taskTools,
    // ...tasklistTools,
    // ...commentTools,
    // ...timeTrackingTools,
    ...fileTools,
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    })),
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[MCP] Tool called: ${name}`, JSON.stringify(args, null, 2));

  const tool = allTools.find((t) => t.name === name);
  if (!tool) {
    console.error(`[MCP] Tool not found: ${name}`);
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  try {
    // Check if client is available
    if (!client) {
      console.error(`[MCP] Client not initialized: ${configError}`);
      throw new McpError(
        ErrorCode.InternalError,
        configError || 'Freelo client not initialized'
      );
    }
    
    // Validate input
    const validatedInput = tool.inputSchema.parse(args);
    console.error(`[MCP] Validated input for ${name}:`, JSON.stringify(validatedInput, null, 2));
    
    // Execute tool handler
    const result = await tool.handler(validatedInput, client);
    console.error(`[MCP] Tool ${name} result:`, JSON.stringify(result, null, 2));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`[MCP] Error in tool ${name}:`, error);
    
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    
    if (error instanceof Error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }
    
    throw new McpError(ErrorCode.InternalError, 'Unknown error occurred');
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Freelo MCP server started');
  console.error(`[DEBUG] Available tools: ${allTools.length}`);
  console.error(`[DEBUG] Config: email=${config.email ? '***' : 'missing'}, apiKey=${config.apiKey ? '***' : 'missing'}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});