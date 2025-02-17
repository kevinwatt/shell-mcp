# shell-mcp

> Shell command execution MCP server

[![Version](https://img.shields.io/badge/version-0.4.6-blue.svg)](https://github.com/kevinwatt/shell-mcp)
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

## Available Commands

The following shell commands are available:

| Command    | Description                                           | Allowed Arguments                    |
|------------|-------------------------------------------------------|-------------------------------------|
| ls         | List directory contents                               | -l, -a, -h, -R, --help, *           |
| cat        | Concatenate and display file contents                 | -n, -b, --help, *                   |
| pwd        | Show current working directory                        | None                                |
| df         | Show disk usage                                       | -h, -T, --help                      |
| echo       | Display text                                          | Any text                            |
| ps         | Show process status                                   | -e, -f, -u, --help                  |
| free       | Show memory usage                                     | -h, -m, -g, --help                  |
| uptime     | Show system uptime                                    | None                                |
| date       | Show system date and time                             | +%Y-%m-%d, +%H:%M:%S, --help        |
| grep       | Search text patterns in files                         | -i, -v, -n, -r, -l, --color, *      |
| w          | Show who is logged on and what they are doing         | -h, -s, --no-header, --help         |
| whois      | Query WHOIS domain registration information           | -H, *                               |
| find       | Search for files in a directory hierarchy             | -name, -type, -size, -mtime, *      |
| netstat    | Network connection information                        | -a, -n, -t, -u, -l, -p, --help      |
| lspci      | List PCI devices                                      | -v, -k, -mm, -nn, --help            |
| lsusb      | List USB devices                                      | -v, -t, -d, -s, --help              |
| dig        | DNS lookup utility                                    | +short, +trace, +dnssec, @*, *      |
| nslookup   | Query DNS records                                     | -type=*, -query=*, *                |
| ip         | Show network devices and interfaces                   | addr, link, route, neigh, -br, *    |
| whereis    | Locate binary, source and manual files                | -b, -m, -s, *                       |
