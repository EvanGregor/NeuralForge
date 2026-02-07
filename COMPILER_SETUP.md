# Compiler Setup Guide

## Overview
The coding module now includes a professional code editor with real-time compilation support using Monaco Editor and Judge0 API.

## Features
- **Monaco Editor**: Professional code editor (same as VS Code)
- **Multi-language Support**: JavaScript, Python, Java, C++, C#, Go, Rust, PHP, Ruby, TypeScript, SQL, and more
- **Real-time Compilation**: Instant code execution and results
- **Test Case Validation**: Automatic testing against provided test cases
- **Fallback Support**: Works even without Judge0 API (JavaScript only)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @monaco-editor/react monaco-editor --legacy-peer-deps
```

### 2. Configure Judge0 API (Optional but Recommended)
1. Sign up for RapidAPI: https://rapidapi.com/
2. Subscribe to Judge0 API: https://rapidapi.com/judge0-official/api/judge0-ce/
3. Get your RapidAPI key
4. Add to your `.env.local`:
```env
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 3. Fallback Mode
If Judge0 API is not configured, the system will automatically fall back to local JavaScript execution. This provides basic functionality but with limited language support.

## Usage

### In Coding Test Page
The compiler is automatically integrated into the coding test page. Users can:
- Select programming language
- Write code with syntax highlighting
- Run code with test cases
- See real-time results and errors

### Code Editor Component
```tsx
import CodeEditor from '@/components/CodeEditor'

<CodeEditor
  initialCode="function solution(input) { return input; }"
  language="javascript"
  onCodeChange={(code) => console.log('Code changed:', code)}
  onRun={(code, language) => console.log('Code executed:', code, language)}
  testCases={[
    { input: "test", expected: "test" }
  ]}
/>
```

## Supported Languages
- JavaScript (with fallback support)
- Python
- Java
- C++
- C
- C#
- Go
- Rust
- PHP
- Ruby
- TypeScript
- SQL
- And more...

## API Endpoints

### `/api/compile`
Main compilation endpoint using Judge0 API.

**Request:**
```json
{
  "code": "console.log('Hello World')",
  "language": "javascript",
  "input": "test input",
  "expectedOutput": "expected output"
}
```

**Response:**
```json
{
  "success": true,
  "status": "Accepted",
  "output": "Hello World",
  "error": "",
  "time": "0.001",
  "memory": "1024",
  "exitCode": 0,
  "language": "javascript",
  "testPassed": true
}
```

### `/api/compile-fallback`
Fallback compilation endpoint for JavaScript only.

## Troubleshooting

### Common Issues

1. **Monaco Editor not loading**
   - Ensure dependencies are installed correctly
   - Check browser console for errors

2. **Compilation failing**
   - Check if Judge0 API key is configured
   - Verify RapidAPI subscription is active
   - Check network connectivity

3. **Fallback mode not working**
   - Ensure JavaScript code is valid
   - Check browser security settings

### Error Messages

- **"Unsupported language"**: Language not supported in current mode
- **"Compilation failed"**: API error or invalid code
- **"No code to run"**: Empty code submission
- **"Runtime Error"**: Code execution error

## Performance Notes

- Judge0 API has rate limits (1000 requests/day on free tier)
- Fallback mode is unlimited but JavaScript-only
- Monaco Editor loads asynchronously for better performance
- Code execution is sandboxed for security

## Security Considerations

- All code execution is sandboxed
- No persistent storage of user code
- API keys are server-side only
- Input validation on all endpoints

## Future Enhancements

- [ ] Custom test case editor
- [ ] Code sharing functionality
- [ ] Performance metrics
- [ ] Code quality analysis
- [ ] Multi-file projects
- [ ] Collaborative editing

