# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.17] - 2025-02-18

### Security
- Removed mpv command for security considerations
- Reduced attack surface by limiting media playback capabilities

## [0.4.16] - 2025-02-18

### Added
- Added mpv command for media playback
- Support common mpv options like --start, --length, --volume etc

## [0.4.15] - 2025-02-18

### Documentation
- Reorganized README.md structure
- Updated version badge
- Fixed duplicate command list
- Updated copyright information

## [0.4.14] - 2025-02-18

### Documentation
- Updated README.md with new whereis command
- Added complete command list with arguments
- Improved command documentation

## [0.4.13] - 2025-02-18

### Fixed
- Fixed require is not defined error in ESM context
- Updated path and fs imports to use ES modules
- Improved module compatibility

## [0.4.12] - 2025-02-18

### Added
- Added whereis command for binary location lookup
- Enhanced command path resolution capabilities

### Fixed
- Improved command path validation
- Better error handling for command lookup

## [0.4.11] - 2025-02-18

### Fixed
- Fixed command validation in executor
- Improved error handling for command execution
- Enhanced path validation and security checks

## [0.4.10] - 2025-02-18

### Fixed
- Fixed command execution issues in ESM environment
- Added proper path and fs module imports in executor
- Improved command validation and execution

### Added
- Added command executable validation
- Enhanced error handling for command execution

### Security
- Improved command path validation
- Added executable permission checks

## [0.4.9] - 2025-02-18

### Fixed
- Fixed module import issues in ESM/CommonJS mixed environment
- Standardized module imports across the codebase
- Fixed command execution in ESM context

## [0.4.8] - 2025-02-18

### Security
- Enhanced command validation and sanitization
- Improved path security checks in SecurityChecker
- Added better handling of restricted paths

### Changed
- Updated sanitizeInput to handle environment variables safely
- Modified path depth validation logic
- Improved special character handling in command inputs

## [0.4.7] - 2025-02-18

### Security
- Enhanced input sanitization for environment variables and special characters
- Improved handling of quoted strings in command arguments
- Added double space separator for better command injection prevention

### Fixed
- Fixed environment variable parsing in command arguments
- Fixed handling of quoted strings in sanitizeInput
- Improved path validation for restricted paths 