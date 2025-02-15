# shell-mcp

> Shell command execution MCP server

[![Version](https://img.shields.io/badge/version-0.4.3-blue.svg)](https://github.com/kevinwatt/shell-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

An MCP server implementation that provides secure shell command execution capabilities for LLMs.

## Features

- **Secure Execution**: Whitelisted commands and arguments only
- **Resource Control**: Memory and CPU usage monitoring
- **Timeout Control**: Automatic termination of long-running commands
- **Size Limits**: Output size restrictions for safety
- **MCP Integration**: Works with Claude and other MCP-compatible LLMs

## Installation

```bash
npm install @kevinwatt/shell-mcp
```

## Configuration with [Dive Desktop](https://github.com/OpenAgentPlatform/Dive)

1. Click "+ Add MCP Server" in Dive Desktop
2. Copy and paste this configuration:

```json
{
  "mcpServers": {
    "shell": {
      "command": "npx",
      "args": [
        "-y",
        "@kevinwatt/shell-mcp"
      ]
    }
  }
}
```

## Tool Documentation

- **shell_ls, shell_pwd, shell_df, etc.**
  - Execute whitelisted shell commands
  - Inputs:
    - `command` (string, required): Command to execute
    - `args` (array, optional): Command arguments
    - `timeout` (number, optional): Execution timeout in ms

Available commands:
- shell_ls: List directory contents
- shell_pwd: Show current working directory
- shell_df: Show disk usage
- shell_echo: Display text
- shell_ps: Show process status
- shell_free: Show memory usage
- shell_uptime: Show system uptime
- shell_date: Show system date and time

## Usage Examples

Ask your LLM to:

```
"Show current directory using shell_pwd"
"List files using shell_ls with -l argument"
"Check disk usage using shell_df with -h argument"
```

## Manual Start

If needed, start the server manually:

```bash
npx @kevinwatt/shell-mcp
```

## Requirements

- Node.js 18+
- MCP-compatible LLM service

## Development

```bash
# Install dependencies
npm install

# Watch mode
npm run watch

# Run tests
npm test

# Lint
npm run lint
```

## License

MIT © Kevin Watt

## Keywords

- mcp
- shell
- command
- claude
- llm
- automation
