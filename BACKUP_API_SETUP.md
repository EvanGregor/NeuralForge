# Backup API Key Setup

This project now supports automatic fallback to a backup API key when the primary API quota is exhausted.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Primary Gemini API Key
GEMINI_API_KEY=your_primary_api_key_here

# Backup Gemini API Key (will be used when primary quota is exhausted)
GEMINI_BACKUP_API_KEY=AIzaSyBd-y9HukIGKxi4VCyJJWg489CoabdX-eY
```

## How It Works

1. **Primary API Key**: The system starts using your primary API key (`GEMINI_API_KEY`)
2. **Quota Tracking**: The system tracks quota usage for each API key separately
3. **Automatic Fallback**: When the primary API key's quota is exhausted, the system automatically switches to the backup API key
4. **Seamless Experience**: Users won't notice the switch - it happens transparently

## Features

- **Automatic Switching**: No manual intervention required
- **Separate Quota Tracking**: Each API key maintains its own quota counter
- **Error Handling**: If both API keys fail, appropriate error messages are shown
- **Rate Limiting**: Built-in rate limiting to prevent API abuse
- **Caching**: Quota information is cached for better performance

## API Response

The API now returns additional information about quota status:

```json
{
  "response": "Generated content...",
  "quotaInfo": {
    "remaining": 45,
    "total": 50,
    "apiKeyIndex": 0
  }
}
```

- `remaining`: Number of requests remaining for the current API key
- `total`: Total quota for the current API key
- `apiKeyIndex`: 0 for primary key, 1 for backup key

## Error Handling

If both API keys are exhausted or fail, the system will return appropriate error messages indicating the status and whether backup keys are available.
