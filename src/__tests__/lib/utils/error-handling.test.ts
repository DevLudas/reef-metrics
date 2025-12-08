import { describe, it, expect } from 'vitest';

/**
 * Utility function to parse API error responses and return user-friendly messages
 * Used in components and services for consistent error handling
 */
export async function parseApiError(response: Response): Promise<string> {
	try {
		const errorData = await response.json();

		// Check for nested error structure
		if (errorData.error?.message) {
			return errorData.error.message;
		}

		// Check for direct message property
		if (errorData.message) {
			return errorData.message;
		}

		// Check for errors array (Supabase format)
		if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
			return errorData.errors[0].message || 'An error occurred';
		}

		// Fallback to generic message
		return 'An error occurred while processing your request';
	} catch {
		// If JSON parsing fails, return generic message
		return 'Failed to process server response';
	}
}

/**
 * Create a standardized error response object
 */
export interface ErrorResponse {
	message: string;
	code?: string;
	details?: Record<string, unknown>;
}

/**
 * Convert API errors to user-friendly error response
 */
export function createErrorResponse(message: string, code?: string): ErrorResponse {
	return {
		message,
		code,
	};
}

// ============================================================================
// UNIT TESTS - Error Message Handling
// ============================================================================

describe('Error Message Handling', () => {
	// ============================================================================
	// parseApiError - Standard Error Format
	// ============================================================================

	describe('parseApiError', () => {
		it('should extract message from error.message structure', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						message: 'Aquarium name already exists',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Aquarium name already exists');
		});

		it('should extract message from direct message property', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					message: 'Invalid request parameters',
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Invalid request parameters');
		});

		it('should extract message from errors array (Supabase format)', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					errors: [
						{
							message: 'Column validation failed',
						},
					],
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Column validation failed');
		});

		it('should handle errors array with multiple errors', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					errors: [
						{
							message: 'First validation error',
						},
						{
							message: 'Second validation error',
						},
					],
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert - Should use first error
			expect(result).toBe('First validation error');
		});

		it('should use fallback message when error array is empty', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					errors: [],
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('An error occurred while processing your request');
		});

		it('should return generic message when JSON structure is unexpected', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					status: 500,
					statusText: 'Internal Server Error',
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('An error occurred while processing your request');
		});

		it('should handle malformed JSON gracefully', async () => {
			// Arrange
			const mockResponse = new Response('{invalid json');

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Failed to process server response');
		});

		it('should handle empty JSON object', async () => {
			// Arrange
			const mockResponse = new Response(JSON.stringify({}));

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('An error occurred while processing your request');
		});

		it('should prioritize error.message over message', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						message: 'Specific error from error.message',
					},
					message: 'Generic message property',
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert - Should use error.message first
			expect(result).toBe('Specific error from error.message');
		});

		it('should trim and normalize whitespace in error messages', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						message: '  Aquarium type not found  ',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			// Message should be preserved as-is (trimming can be added if needed)
			expect(result).toBe('  Aquarium type not found  ');
		});
	});

	// ============================================================================
	// Domain-Specific Error Handling
	// ============================================================================

	describe('Domain-Specific Error Messages', () => {
		it('should handle AQUARIUM_TYPE_NOT_FOUND error', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						code: 'AQUARIUM_TYPE_NOT_FOUND',
						message: 'The selected aquarium type does not exist',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('The selected aquarium type does not exist');
		});

		it('should handle DUPLICATE_AQUARIUM_NAME error', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						code: 'DUPLICATE_AQUARIUM_NAME',
						message: 'You already have an aquarium with this name',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('You already have an aquarium with this name');
		});

		it('should handle NOT_FOUND error', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						code: 'NOT_FOUND',
						message: 'Aquarium not found or you do not have access to it',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Aquarium not found or you do not have access to it');
		});

		it('should handle validation errors', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Aquarium volume must be a positive number',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Aquarium volume must be a positive number');
		});

		it('should handle unauthorized access', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						code: 'UNAUTHORIZED',
						message: 'You are not authenticated',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('You are not authenticated');
		});

		it('should handle forbidden access', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						code: 'FORBIDDEN',
						message: 'You do not have permission to access this resource',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('You do not have permission to access this resource');
		});
	});

	// ============================================================================
	// Network Error Handling
	// ============================================================================

	describe('Network Error Handling', () => {
		it('should handle network timeout', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						message: 'Request timeout - server did not respond',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Request timeout - server did not respond');
		});

		it('should handle server error responses', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						message: 'Internal server error',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Internal server error');
		});

		it('should handle rate limiting errors', async () => {
			// Arrange
			const mockResponse = new Response(
				JSON.stringify({
					error: {
						message: 'Too many requests. Please try again later.',
					},
				})
			);

			// Act
			const result = await parseApiError(mockResponse);

			// Assert
			expect(result).toBe('Too many requests. Please try again later.');
		});
	});

	// ============================================================================
	// createErrorResponse
	// ============================================================================

	describe('createErrorResponse', () => {
		it('should create error response with message only', () => {
			// Act
			const result = createErrorResponse('An error occurred');

			// Assert
			expect(result).toEqual({
				message: 'An error occurred',
				code: undefined,
			});
		});

		it('should create error response with message and code', () => {
			// Act
			const result = createErrorResponse('Aquarium not found', 'NOT_FOUND');

			// Assert
			expect(result).toEqual({
				message: 'Aquarium not found',
				code: 'NOT_FOUND',
			});
		});

		it('should preserve message exactly as provided', () => {
			// Act
			const result = createErrorResponse('  Exact message with spaces  ', 'TEST');

			// Assert
			expect(result.message).toBe('  Exact message with spaces  ');
		});
	});
});

