# Email Validator API Documentation

## Base URL
```
https://your-railway-url.railway.app
```

## Authentication
Include your API key in requests using one of these methods:
- Header: `x-rapidapi-key: your-api-key`
- Query parameter: `?api_key=your-api-key`

## Endpoints

### Health Check
```http
GET /health
```
Returns the API status and timestamp.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Email Validation
```http
GET /mailcheck?email={email_address}
```

**Parameters:**
- `email` (required): The email address to validate

**Example Request:**
```bash
curl "https://your-railway-url.railway.app/mailcheck?email=test@gmail.com" \
  -H "x-rapidapi-key: your-api-key"
```

**Success Response:**
```json
{
  "email": "test@gmail.com",
  "valid": true,
  "reason": "Valid",
  "domain": "gmail.com",
  "mx_host": "gmail-smtp-in.l.google.com",
  "mx_info": "Using MX pointer gmail-smtp-in.l.google.com from DNS with priority: 5",
  "mx_ip": "74.125.200.26"
}
```

**Disposable Email Response:**
```json
{
  "email": "test@mailinator.com",
  "valid": false,
  "reason": "Blacklist",
  "domain": "mailinator.com",
  "mx_host": "mail.mailinator.com",
  "mx_info": "Using MX pointer mail.mailinator.com from DNS with priority: 10",
  "mx_ip": "23.239.11.30"
}
```

**Invalid Email Response:**
```json
{
  "email": "invalid-email",
  "valid": false,
  "reason": "Invalid email format",
  "domain": null,
  "mx_host": null,
  "mx_info": null,
  "mx_ip": null
}
```

## Rate Limits
- 100 requests per 15 minutes per IP address
- Rate limit headers are included in responses

## Error Responses

### 400 Bad Request
```json
{
  "error": "Email parameter is required",
  "message": "Please provide an email address to validate",
  "example": "/mailcheck?email=test@example.com"
}
```

### 401 Unauthorized
```json
{
  "error": "API key required",
  "message": "Please provide a valid API key via x-rapidapi-key header or api_key query parameter"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while validating the email",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | The email address that was validated |
| `valid` | boolean | Whether the email is valid (not disposable) |
| `reason` | string | Explanation of the validation result |
| `domain` | string | The domain part of the email |
| `mx_host` | string | Primary MX record hostname |
| `mx_info` | string | Detailed MX record information |
| `mx_ip` | string | IP address of the MX record |

## Testing Examples

### Valid Email
```bash
curl "https://your-railway-url.railway.app/mailcheck?email=user@company.com" \
  -H "x-rapidapi-key: your-api-key"
```

### Disposable Email
```bash
curl "https://your-railway-url.railway.app/mailcheck?email=test@10minutemail.com" \
  -H "x-rapidapi-key: your-api-key"
```

### Invalid Format
```bash
curl "https://your-railway-url.railway.app/mailcheck?email=not-an-email" \
  -H "x-rapidapi-key: your-api-key"
```

## Support
For issues or questions, please check the Railway logs or contact support.
