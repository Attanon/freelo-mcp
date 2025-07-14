# WIP

# Freelo MCP Server

An MCP (Model Context Protocol) server that provides tools to interact with the Freelo.io project management API.

## Features

- **Project Management**: Create, list, archive, and manage projects
- **Task Management**: Create, update, move, and track tasks
- **Tasklist Management**: Create and manage tasklists
- **Time Tracking**: Start/stop timers and create work reports
- **Comments**: Add comments to tasks
- **Search & Filtering**: Advanced search and filtering capabilities

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

Create a `.env` file in the root directory (copy from `.env.example`):

```env
FREELO_EMAIL=your@email.com
FREELO_API_KEY=your-api-key-from-freelo-settings
FREELO_USER_AGENT=FreeloMCP/1.0 (your@email.com)
```

You can find your API key in your [Freelo settings](https://app.freelo.io/profil/nastaveni).

## Usage with Claude Desktop

Add the server to your Claude Desktop configuration:

1. Open Claude Desktop settings
2. Go to Developer > Model Context Protocol
3. Add the following configuration:

```json
{
  "mcpServers": {
    "freelo": {
      "command": "node",
      "args": ["/path/to/freelo-mcp/dist/index.js"],
      "env": {
        "FREELO_EMAIL": "your@email.com",
        "FREELO_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage with Claude Code

Run this command to add the MCP server. It will add mcp server global for all projects.

```bash
claude mcp add --scope user freelo -e FREELO_EMAIL="your@email.com" -e FREELO_API_KEY="your-api-key" -- node [path-to-cloned-directory]/dist/index.js
```

## Available Tools

### Project Management

- `freelo_list_projects` - List active projects
- `freelo_get_all_projects` - Get all projects with pagination
- `freelo_get_project` - Get detailed project information
- `freelo_create_project` - Create a new project
- `freelo_archive_project` - Archive a project
- `freelo_activate_project` - Activate an archived project
- `freelo_delete_project` - Delete a project permanently

### Task Management

- `freelo_list_tasks` - List tasks in a tasklist
- `freelo_get_all_tasks` - Search tasks across all projects
- `freelo_get_task` - Get detailed task information
- `freelo_create_task` - Create a new task
- `freelo_update_task` - Update task properties
- `freelo_finish_task` - Mark task as finished
- `freelo_activate_task` - Reactivate a finished task
- `freelo_move_task` - Move task to another tasklist
- `freelo_delete_task` - Delete a task permanently

### Tasklist Management

- `freelo_list_tasklists` - List all tasklists
- `freelo_get_tasklist` - Get tasklist details
- `freelo_create_tasklist` - Create a new tasklist

### Time Tracking

- `freelo_start_timer` - Start time tracking
- `freelo_stop_timer` - Stop time tracking
- `freelo_create_work_report` - Create a work report
- `freelo_list_work_reports` - List work reports with filters

### Comments

- `freelo_add_comment` - Add a comment to a task
- `freelo_list_comments` - List all comments

## Example Usage

Here are some example prompts you can use with Claude:

1. **List all active projects:**
   ```
   Use the freelo tools to show me all my active projects
   ```

2. **Create a new project:**
   ```
   Create a new Freelo project called "Website Redesign" with EUR currency
   ```

3. **Search for tasks:**
   ```
   Find all unfinished tasks assigned to me that are due this week
   ```

4. **Start time tracking:**
   ```
   Start tracking time on task ID 12345 with a note "Working on API integration"
   ```

5. **Create a work report:**
   ```
   Log 2 hours of work for task 12345 for today with note "Completed API endpoints"
   ```

## Development

### Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build the TypeScript code
- `npm run typecheck` - Run TypeScript type checking

### Project Structure

```
src/
├── index.ts              # MCP server entry point
├── client/
│   ├── FreeloClient.ts   # API client with authentication
│   └── types.ts          # TypeScript types
├── tools/
│   ├── projects.ts       # Project management tools
│   ├── tasks.ts          # Task management tools
│   ├── tasklists.ts      # Tasklist tools
│   ├── comments.ts       # Comment tools
│   └── timetracking.ts   # Time tracking tools
└── utils/
    ├── formatters.ts     # Data formatting utilities
    └── validators.ts     # Input validation
```

## API Rate Limiting

The Freelo API has a rate limit of 25 requests per minute. The MCP server automatically handles rate limiting to ensure compliance.

## Error Handling

The server provides detailed error messages for:
- Authentication failures (401)
- Resource not found (404)
- Rate limit exceeded (429)
- Server errors (5xx)
- Invalid input parameters

## License

MIT
