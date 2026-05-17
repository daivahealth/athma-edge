# API Response Formats

Standard response envelopes and error formats used across all endpoints.

## Success Response

```json
{
  "data": { ... }
}
```

For paginated endpoints:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 234
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Invalid query parameter: careSetting must be one of INPATIENT, OUTPATIENT, DAYCARE, EMERGENCY"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

Returned when JWT is missing, malformed, or expired.

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient role: ADMIN required"
}
```

Returned when the user's role does not match the required role for the endpoint.

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Patient with MRN MRN999 not found"
}
```

### 422 Unprocessable Entity

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "error": [
    {
      "field": "username",
      "message": "username must be a string"
    },
    {
      "field": "password",
      "message": "password is required"
    }
  ]
}
```

Returned when request body fails class-validator validation.

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "An unexpected error occurred"
}
```

Detailed error information is logged server-side but not exposed in the response.
