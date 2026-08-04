/**
 * Structured error classes for R2 operations.
 * Integrates with the existing handleApiError pattern.
 */

export class R2Error extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'R2Error';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

/** Missing credentials, bucket not found, connection timeout */
export class R2ConnectionError extends R2Error {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'R2_CONNECTION_ERROR', 503, details);
    this.name = 'R2ConnectionError';
  }
}

/** PutObject failure, network interruption during upload */
export class R2UploadError extends R2Error {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'R2_UPLOAD_ERROR', 500, details);
    this.name = 'R2UploadError';
  }
}

/** File size exceeded, invalid MIME type, bad filename */
export class FileValidationError extends R2Error {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FILE_VALIDATION_ERROR', 400, details);
    this.name = 'FileValidationError';
  }
}

/** Not purchased, not logged in, not admin */
export class DownloadAuthorizationError extends R2Error {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DOWNLOAD_AUTHORIZATION_ERROR', 403, details);
    this.name = 'DownloadAuthorizationError';
  }
}
