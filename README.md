# Email Validator API

A minimal email validation API that checks for valid email formats, disposable domains, and MX records. Designed for deployment on RapidAPI.

## Features

- ✅ Email format validation
- 🚫 Disposable email detection (blacklist + heuristics)
- 📧 MX record checking
- 🔍 Common typo detection for popular email domains
- ⚡ Fast response times
- 🛡️ Built-in security middleware

## API Endpoints

### GET /mailcheck

Validates an email address and returns detailed information.

**Query Parameters:**
- `email` (required): Email address to validate

**Example Request:**
```
GET /mailcheck?email=test@example.com
```

**Example Response:**
```json
{
  "email": "test@example.com",
  "valid": true,
  "reason": "Valid",
  "domain": "example.com",
  "mx_host": "mail.example.com",
  "mx_info": "Using MX pointer mail.example.com from DNS with priority: 10",
  "mx_ip": "192.168.1.1"
}
```

**Invalid Email Response:**
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

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. For development with auto-restart:
   ```bash
   npm run dev
   ```

## Deployment

### For RapidAPI/Serverless Platforms

The API is designed to work with serverless platforms. Make sure to:

1. Set environment variables if needed
2. Configure your platform's routing to point to the `/mailcheck` endpoint
3. The API automatically handles CORS and security headers

### Environment Variables

- `PORT`: Server port (default: 3000)

## Testing

Test the API locally:

```bash
# Health check
curl http://localhost:3000/health

# Valid email
curl "http://localhost:3000/mailcheck?email=test@gmail.com"

# Disposable email
curl "http://localhost:3000/mailcheck?email=test@mailinator.com"

# Invalid email
curl "http://localhost:3000/mailcheck?email=invalid-email"
```

## Response Fields

- `email`: The email address that was checked
- `valid`: Boolean indicating if the email is valid
- `reason`: Explanation of the validation result
- `domain`: The domain part of the email
- `mx_host`: Primary MX record hostname
- `mx_info`: Detailed MX record information
- `mx_ip`: IP address of the MX record (if resolvable)

## License

MIT
