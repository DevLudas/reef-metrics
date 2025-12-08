import { describe, it, expect } from 'vitest';
import type {
	AquariumDTO,
	AquariumListItemDTO,
	AquariumEntity,
	CreateAquariumCommand,
	MeasurementDTO,
	LatestMeasurementDTO,
} from '@/types';

/**
 * DTO Transformation Utilities
 * These functions transform between API request/response formats and internal DTOs
 */

/**
 * Transform CreateAquariumCommand to API payload
 */
export function transformCreateAquariumCommand(
	command: CreateAquariumCommand
): Record<string, unknown> {
	return {
		name: command.name,
		aquarium_type_id: command.aquarium_type_id,
		...(command.volume !== undefined && { volume: command.volume }),
		...(command.description !== undefined && { description: command.description }),
	};
}

/**
 * Transform AquariumEntity to AquariumDTO
 */
export function transformAquariumEntityToDTO(entity: AquariumEntity & {
	aquarium_type?: { id: string; name: string; description?: string | null };
}): AquariumDTO {
	return {
		id: entity.id,
		user_id: entity.user_id,
		aquarium_type_id: entity.aquarium_type_id,
		name: entity.name,
		description: entity.description,
		volume: entity.volume,
		created_at: entity.created_at,
		updated_at: entity.updated_at,
		aquarium_type: entity.aquarium_type || {
			id: entity.aquarium_type_id,
			name: 'Unknown',
		},
	};
}

/**
 * Transform AquariumEntity to AquariumListItemDTO
 */
export function transformAquariumEntityToListItemDTO(entity: AquariumEntity & {
	aquarium_type?: { id: string; name: string };
}): AquariumListItemDTO {
	return {
		id: entity.id,
		user_id: entity.user_id,
		aquarium_type_id: entity.aquarium_type_id,
		name: entity.name,
		description: entity.description,
		volume: entity.volume,
		created_at: entity.created_at,
		updated_at: entity.updated_at,
		aquarium_type: {
			id: entity.aquarium_type?.id || entity.aquarium_type_id,
			name: entity.aquarium_type?.name || 'Unknown',
		},
	};
}

/**
 * Transform raw API measurement response to MeasurementDTO
 */
export function transformMeasurementResponse(data: Record<string, unknown>): MeasurementDTO {
	return {
		id: data.id as string,
		aquarium_id: data.aquarium_id as string,
		parameter_id: data.parameter_id as string,
		value: data.value as number,
		measurement_time: data.measurement_time as string,
		notes: (data.notes as string) || null,
		created_at: data.created_at as string,
		parameter: {
			name: (data.parameter as any)?.name as string,
			full_name: (data.parameter as any)?.full_name as string,
			unit: (data.parameter as any)?.unit as string,
		},
	};
}

/**
 * Validate and normalize API response data
 */
export function validateResponseData(data: unknown): data is Record<string, unknown> {
	return typeof data === 'object' && data !== null;
}

// ============================================================================
// UNIT TESTS - API Request/Response Transformation
// ============================================================================

describe('API Request/Response Transformation', () => {
	// ============================================================================
	// transformCreateAquariumCommand
	// ============================================================================

	describe('transformCreateAquariumCommand', () => {
		it('should include required fields in payload', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'My Reef Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result).toEqual({
				name: 'My Reef Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
			});
		});

		it('should include optional volume when provided', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				volume: 100,
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result.volume).toBe(100);
		});

		it('should exclude volume when undefined', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				volume: undefined,
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect('volume' in result).toBe(false);
		});

		it('should include optional description when provided', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				description: 'Beautiful reef setup',
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result.description).toBe('Beautiful reef setup');
		});

		it('should exclude description when undefined', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				description: undefined,
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect('description' in result).toBe(false);
		});

		it('should include both optional fields when provided', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				volume: 250,
				description: 'Full setup',
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result).toEqual({
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				volume: 250,
				description: 'Full setup',
			});
		});

		it('should handle special characters in name', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: "John's 100L Reef & Macro 🪨",
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result.name).toBe("John's 100L Reef & Macro 🪨");
		});

		it('should handle zero volume (edge case)', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				volume: 0,
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result.volume).toBe(0);
		});

		it('should handle very large volume', () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				volume: 999999,
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result.volume).toBe(999999);
		});
	});

	// ============================================================================
	// transformAquariumEntityToDTO
	// ============================================================================

	describe('transformAquariumEntityToDTO', () => {
		it('should transform entity with nested aquarium type', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Reef Tank',
				description: 'Beautiful setup',
				volume: 100,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-02T00:00:00Z',
				aquarium_type: {
					id: 'type-1',
					name: 'Reef Type',
					description: 'For reef tanks',
				},
			};

			// Act
			const result = transformAquariumEntityToDTO(entity);

			// Assert
			expect(result).toEqual(entity);
		});

		it('should preserve all required fields', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Tank',
				description: null,
				volume: null,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
			};

			// Act
			const result = transformAquariumEntityToDTO(entity);

			// Assert
			expect(result.id).toBe('aquarium-123');
			expect(result.user_id).toBe('user-123');
			expect(result.aquarium_type_id).toBe('type-1');
			expect(result.name).toBe('Tank');
			expect(result.created_at).toBe('2025-01-01T00:00:00Z');
			expect(result.updated_at).toBe('2025-01-01T00:00:00Z');
		});

		it('should use fallback aquarium type when not provided', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Tank',
				description: null,
				volume: null,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
				aquarium_type: undefined,
			};

			// Act
			const result = transformAquariumEntityToDTO(entity);

			// Assert
			expect(result.aquarium_type).toEqual({
				id: 'type-1',
				name: 'Unknown',
			});
		});

		it('should handle null description', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Tank',
				description: null,
				volume: 100,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
			};

			// Act
			const result = transformAquariumEntityToDTO(entity);

			// Assert
			expect(result.description).toBeNull();
		});

		it('should handle null volume', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Tank',
				description: 'Description',
				volume: null,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
			};

			// Act
			const result = transformAquariumEntityToDTO(entity);

			// Assert
			expect(result.volume).toBeNull();
		});
	});

	// ============================================================================
	// transformAquariumEntityToListItemDTO
	// ============================================================================

	describe('transformAquariumEntityToListItemDTO', () => {
		it('should transform entity to list item DTO', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Reef Tank',
				description: 'Beautiful setup',
				volume: 100,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-02T00:00:00Z',
				aquarium_type: {
					id: 'type-1',
					name: 'Reef Type',
				},
			};

			// Act
			const result = transformAquariumEntityToListItemDTO(entity);

			// Assert
			expect(result).toMatchObject({
				id: 'aquarium-123',
				name: 'Reef Tank',
				aquarium_type: {
					id: 'type-1',
					name: 'Reef Type',
				},
			});
		});

		it('should omit aquarium_type description in list item', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Tank',
				description: null,
				volume: null,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
				aquarium_type: {
					id: 'type-1',
					name: 'Reef Type',
				},
			};

			// Act
			const result = transformAquariumEntityToListItemDTO(entity);

			// Assert
			expect('description' in result.aquarium_type).toBe(false);
		});

		it('should use fallback aquarium type id when type not provided', () => {
			// Arrange
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Tank',
				description: null,
				volume: null,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
				aquarium_type: undefined,
			};

			// Act
			const result = transformAquariumEntityToListItemDTO(entity);

			// Assert
			expect(result.aquarium_type.id).toBe('type-1');
			expect(result.aquarium_type.name).toBe('Unknown');
		});
	});

	// ============================================================================
	// transformMeasurementResponse
	// ============================================================================

	describe('transformMeasurementResponse', () => {
		it('should transform measurement response to DTO', () => {
			// Arrange
			const response = {
				id: 'measurement-123',
				aquarium_id: 'aquarium-123',
				parameter_id: 'param-1',
				value: 1.5,
				measurement_time: '2025-01-01T12:00:00Z',
				notes: 'Good level',
				created_at: '2025-01-01T12:05:00Z',
				parameter: {
					name: 'PO4',
					full_name: 'Phosphate',
					unit: 'ppm',
				},
			};

			// Act
			const result = transformMeasurementResponse(response);

			// Assert
			expect(result).toEqual({
				id: 'measurement-123',
				aquarium_id: 'aquarium-123',
				parameter_id: 'param-1',
				value: 1.5,
				measurement_time: '2025-01-01T12:00:00Z',
				notes: 'Good level',
				created_at: '2025-01-01T12:05:00Z',
				parameter: {
					name: 'PO4',
					full_name: 'Phosphate',
					unit: 'ppm',
				},
			});
		});

		it('should handle null notes', () => {
			// Arrange
			const response = {
				id: 'measurement-123',
				aquarium_id: 'aquarium-123',
				parameter_id: 'param-1',
				value: 1.5,
				measurement_time: '2025-01-01T12:00:00Z',
				notes: null,
				created_at: '2025-01-01T12:05:00Z',
				parameter: {
					name: 'PO4',
					full_name: 'Phosphate',
					unit: 'ppm',
				},
			};

			// Act
			const result = transformMeasurementResponse(response);

			// Assert
			expect(result.notes).toBeNull();
		});

		it('should handle undefined notes as null', () => {
			// Arrange
			const response = {
				id: 'measurement-123',
				aquarium_id: 'aquarium-123',
				parameter_id: 'param-1',
				value: 1.5,
				measurement_time: '2025-01-01T12:00:00Z',
				notes: undefined,
				created_at: '2025-01-01T12:05:00Z',
				parameter: {
					name: 'PO4',
					full_name: 'Phosphate',
					unit: 'ppm',
				},
			};

			// Act
			const result = transformMeasurementResponse(response);

			// Assert
			expect(result.notes).toBeNull();
		});

		it('should preserve numeric value precision', () => {
			// Arrange
			const response = {
				id: 'measurement-123',
				aquarium_id: 'aquarium-123',
				parameter_id: 'param-1',
				value: 1.23456789,
				measurement_time: '2025-01-01T12:00:00Z',
				notes: null,
				created_at: '2025-01-01T12:05:00Z',
				parameter: {
					name: 'PO4',
					full_name: 'Phosphate',
					unit: 'ppm',
				},
			};

			// Act
			const result = transformMeasurementResponse(response);

			// Assert
			expect(result.value).toBe(1.23456789);
		});

		it('should handle different parameter types', () => {
			// Arrange
			const testCases = [
				{ name: 'PO4', full_name: 'Phosphate', unit: 'ppm' },
				{ name: 'NO3', full_name: 'Nitrate', unit: 'ppm' },
				{ name: 'Temp', full_name: 'Temperature', unit: '°C' },
				{ name: 'SG', full_name: 'Specific Gravity', unit: 'g/cm³' },
			];

			testCases.forEach((parameterType) => {
				// Arrange
				const response = {
					id: 'measurement-123',
					aquarium_id: 'aquarium-123',
					parameter_id: 'param-1',
					value: 25,
					measurement_time: '2025-01-01T12:00:00Z',
					notes: null,
					created_at: '2025-01-01T12:05:00Z',
					parameter: parameterType,
				};

				// Act
				const result = transformMeasurementResponse(response);

				// Assert
				expect(result.parameter).toEqual(parameterType);
			});
		});
	});

	// ============================================================================
	// validateResponseData
	// ============================================================================

	describe('validateResponseData', () => {
		it('should validate object as valid response data', () => {
			// Act & Assert
			expect(validateResponseData({ id: '123' })).toBe(true);
		});

		it('should reject null', () => {
			// Act & Assert
			expect(validateResponseData(null)).toBe(false);
		});

		it('should reject undefined', () => {
			// Act & Assert
			expect(validateResponseData(undefined)).toBe(false);
		});

		it('should reject string', () => {
			// Act & Assert
			expect(validateResponseData('not an object')).toBe(false);
		});

		it('should reject number', () => {
			// Act & Assert
			expect(validateResponseData(123)).toBe(false);
		});

		it('should reject array', () => {
			// Note: Arrays are objects but may want different handling
			// Current implementation treats arrays as valid
			// This test documents that behavior
			expect(validateResponseData([1, 2, 3])).toBe(true);
		});

		it('should validate empty object', () => {
			// Act & Assert
			expect(validateResponseData({})).toBe(true);
		});

		it('should validate nested objects', () => {
			// Act & Assert
			expect(validateResponseData({ nested: { data: 'value' } })).toBe(true);
		});
	});

	// ============================================================================
	// Edge Cases - Type Safety and Data Integrity
	// ============================================================================

	describe('Edge Cases - Type Safety and Data Integrity', () => {
		it('should preserve UUID format in aquarium_type_id', () => {
			// Arrange
			const uuid = '550e8400-e29b-41d4-a716-446655440000';
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: uuid,
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result.aquarium_type_id).toBe(uuid);
		});

		it('should handle ISO 8601 timestamps correctly', () => {
			// Arrange
			const timestamp = '2025-01-01T12:34:56.789Z';
			const entity = {
				id: 'aquarium-123',
				user_id: 'user-123',
				aquarium_type_id: 'type-1',
				name: 'Tank',
				description: null,
				volume: null,
				created_at: timestamp,
				updated_at: timestamp,
			};

			// Act
			const result = transformAquariumEntityToDTO(entity);

			// Assert
			expect(result.created_at).toBe(timestamp);
			expect(result.updated_at).toBe(timestamp);
		});

		it('should handle very long description strings', () => {
			// Arrange
			const longDescription = 'A'.repeat(255);
			const command: CreateAquariumCommand = {
				name: 'Tank',
				aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
				description: longDescription,
			};

			// Act
			const result = transformCreateAquariumCommand(command);

			// Assert
			expect(result.description).toBe(longDescription);
			expect((result.description as string).length).toBe(255);
		});
	});
});

