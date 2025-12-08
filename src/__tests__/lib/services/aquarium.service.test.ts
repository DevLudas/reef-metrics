import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AquariumService } from '@/lib/services/aquarium.service';
import type { CreateAquariumCommand, UpdateAquariumCommand } from '@/types';

/**
 * Create a chainable mock for Supabase query builders that supports both
 * direct awaiting and method chaining
 */
const createMockChain = (returnValue: any = null, returnError: any = null) => {
	const resolvedValue = {
		data: returnValue,
		error: returnError,
		count: Array.isArray(returnValue) ? returnValue.length : 0
	};

	const chain = {
		select: vi.fn(function () {
			return this;
		}),
		eq: vi.fn(function () {
			return this;
		}),
		insert: vi.fn(function () {
			return this;
		}),
		update: vi.fn(function () {
			return this;
		}),
		single: vi.fn().mockResolvedValue({ data: returnValue, error: returnError }),
		order: vi.fn(function () {
			return this;
		}),
		range: vi.fn(function () {
			return this;
		}),
		gte: vi.fn(function () {
			return this;
		}),
		lte: vi.fn(function () {
			return this;
		}),
		lt: vi.fn(function () {
			return this;
		}),
		// Support await on the chain itself (Supabase pattern)
		then: vi.fn((resolve) => {
			resolve(resolvedValue);
		}),
	};
	return chain;
};

describe('AquariumService', () => {
	let service: AquariumService;
	let mockSupabase: any;

	beforeEach(() => {
		mockSupabase = {
			from: vi.fn(),
		};
		service = new AquariumService(mockSupabase as any);
	});

	// ============================================================================
	// DATA TRANSFORMATION LOGIC - createAquarium
	// ============================================================================

	describe('createAquarium', () => {
		const userId = 'user-123';
		const aquariumTypeId = '550e8400-e29b-41d4-a716-446655440000';

		it('should create aquarium with valid data', async () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'My Reef Tank',
				aquarium_type_id: aquariumTypeId,
				volume: 100,
				description: 'Beautiful reef setup',
			};

			const mockAquariumType = { id: aquariumTypeId };
			const mockInsertedAquarium = {
				id: 'aquarium-123',
				user_id: userId,
				name: command.name,
				aquarium_type_id: command.aquarium_type_id,
				volume: command.volume,
				description: command.description,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
			};

			mockSupabase.from
				.mockReturnValueOnce(createMockChain(mockAquariumType, null))
				.mockReturnValueOnce(createMockChain(mockInsertedAquarium, null));

			// Act
			const result = await service.createAquarium(userId, command);

			// Assert
			expect(result).toEqual(mockInsertedAquarium);
			expect(mockSupabase.from).toHaveBeenCalledWith('aquarium_types');
			expect(mockSupabase.from).toHaveBeenCalledWith('aquariums');
		});

		it('should throw AQUARIUM_TYPE_NOT_FOUND when type does not exist', async () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Tank with Invalid Type',
				aquarium_type_id: 'invalid-type-id',
			};

			mockSupabase.from.mockReturnValueOnce(createMockChain(null, null));

			// Act & Assert
			await expect(service.createAquarium(userId, command)).rejects.toThrow(
				'AQUARIUM_TYPE_NOT_FOUND'
			);
		});

		it('should throw DUPLICATE_AQUARIUM_NAME on unique constraint violation', async () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Duplicate Tank',
				aquarium_type_id: aquariumTypeId,
			};

			const mockAquariumType = { id: aquariumTypeId };
			const duplicateError = { code: '23505' };

			mockSupabase.from
				.mockReturnValueOnce(createMockChain(mockAquariumType, null))
				.mockReturnValueOnce(createMockChain(null, duplicateError));

			// Act & Assert
			await expect(service.createAquarium(userId, command)).rejects.toThrow(
				'DUPLICATE_AQUARIUM_NAME'
			);
		});

		it('should handle optional fields correctly', async () => {
			// Arrange
			const command: CreateAquariumCommand = {
				name: 'Minimal Tank',
				aquarium_type_id: aquariumTypeId,
			};

			const mockAquariumType = { id: aquariumTypeId };
			const mockInsertedAquarium = {
				id: 'aquarium-123',
				user_id: userId,
				name: command.name,
				aquarium_type_id: command.aquarium_type_id,
				volume: null,
				description: null,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
			};

			mockSupabase.from
				.mockReturnValueOnce(createMockChain(mockAquariumType, null))
				.mockReturnValueOnce(createMockChain(mockInsertedAquarium, null));

			// Act
			const result = await service.createAquarium(userId, command);

			// Assert
			expect(result.volume).toBeNull();
			expect(result.description).toBeNull();
		});
	});

	// ============================================================================
	// DATA TRANSFORMATION LOGIC - listAquariums
	// ============================================================================

	describe('listAquariums', () => {
		const userId = 'user-123';

		it('should filter by user_id', async () => {
			// Arrange
			const mockAquariums = [
				{
					id: 'aquarium-1',
					user_id: userId,
					name: 'Tank 1',
					aquarium_type_id: '550e8400-e29b-41d4-a716-446655440000',
					volume: 100,
					description: null,
					created_at: '2025-01-01T00:00:00Z',
					updated_at: '2025-01-01T00:00:00Z',
					aquarium_type: { id: 'type-1', name: 'Reef' },
				},
			];

			mockSupabase.from.mockReturnValue(createMockChain(mockAquariums, null));

			// Act
			const result = await service.listAquariums(userId);

			// Assert
			expect(result).toEqual(mockAquariums);
		});

		it('should sort by name when specified', async () => {
			// Arrange
			mockSupabase.from.mockReturnValue(createMockChain([], null));

			// Act
			await service.listAquariums(userId, 'name', 'asc');

			// Assert - Verify order method was called with correct params
			const mockChain = mockSupabase.from.mock.results[0].value;
			expect(mockChain.order).toHaveBeenCalled();
		});

		it('should transform entities to DTOs correctly', async () => {
			// Arrange
			const mockAquariums = [
				{
					id: 'aquarium-1',
					user_id: userId,
					name: 'Reef Tank',
					aquarium_type_id: 'type-1',
					volume: 100,
					description: 'Beautiful reef',
					created_at: '2025-01-01T00:00:00Z',
					updated_at: '2025-01-01T00:00:00Z',
					aquarium_type: { id: 'type-1', name: 'Reef Type' },
				},
			];

			mockSupabase.from.mockReturnValue(createMockChain(mockAquariums, null));

			// Act
			const result = await service.listAquariums(userId);

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: 'aquarium-1',
				name: 'Reef Tank',
				user_id: userId,
			});
		});

		it('should handle empty result set', async () => {
			// Arrange
			mockSupabase.from.mockReturnValue(createMockChain(null, null));

			// Act
			const result = await service.listAquariums(userId);

			// Assert
			expect(result).toEqual([]);
		});

		it('should throw error when query fails', async () => {
			// Arrange
			const queryError = new Error('Database connection failed');
			mockSupabase.from.mockReturnValue(createMockChain(null, queryError));

			// Act & Assert
			await expect(service.listAquariums(userId)).rejects.toEqual(queryError);
		});
	});

	// ============================================================================
	// DATA TRANSFORMATION LOGIC - getAquarium
	// ============================================================================

	describe('getAquarium', () => {
		const userId = 'user-123';
		const aquariumId = 'aquarium-123';

		it('should return aquarium DTO with nested aquarium type', async () => {
			// Arrange
			const mockAquarium = {
				id: aquariumId,
				user_id: userId,
				name: 'My Tank',
				aquarium_type_id: 'type-1',
				volume: 100,
				description: 'Beautiful tank',
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
				aquarium_type: {
					id: 'type-1',
					name: 'Reef Type',
					description: 'Reef tank type',
				},
			};

			mockSupabase.from.mockReturnValue(createMockChain(mockAquarium, null));

			// Act
			const result = await service.getAquarium(userId, aquariumId);

			// Assert
			expect(result).toEqual(mockAquarium);
		});

		it('should throw NOT_FOUND when aquarium does not exist', async () => {
			// Arrange
			const notFoundError = { code: 'PGRST116' };
			mockSupabase.from.mockReturnValue(createMockChain(null, notFoundError));

			// Act & Assert
			await expect(service.getAquarium(userId, aquariumId)).rejects.toThrow('NOT_FOUND');
		});
	});

	// ============================================================================
	// DATA TRANSFORMATION LOGIC - updateAquarium
	// ============================================================================

	describe('updateAquarium', () => {
		const userId = 'user-123';
		const aquariumId = 'aquarium-123';

		it('should update aquarium with new data', async () => {
			// Arrange
			const command: UpdateAquariumCommand = {
				name: 'Updated Tank Name',
				volume: 200,
			};

			const mockUpdatedAquarium = {
				id: aquariumId,
				user_id: userId,
				name: command.name,
				volume: command.volume,
				aquarium_type_id: 'type-1',
				description: 'Old description',
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-02T00:00:00Z',
			};

			// Mock check existing aquarium + update operation
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain(mockUpdatedAquarium, null));

			// Act
			const result = await service.updateAquarium(userId, aquariumId, command);

			// Assert
			expect(result).toEqual(mockUpdatedAquarium);
		});

		it('should validate aquarium type when being updated', async () => {
			// Arrange
			const newTypeId = 'type-2';
			const command: UpdateAquariumCommand = {
				aquarium_type_id: newTypeId,
			};

			// Mock check existing + invalid type check
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain(null, null));

			// Act & Assert
			await expect(service.updateAquarium(userId, aquariumId, command)).rejects.toThrow(
				'AQUARIUM_TYPE_NOT_FOUND'
			);
		});

		it('should throw NOT_FOUND when aquarium does not exist', async () => {
			// Arrange
			const command: UpdateAquariumCommand = { name: 'New Name' };
			const notFoundError = { code: 'PGRST116' };

			mockSupabase.from.mockReturnValue(createMockChain(null, notFoundError));

			// Act & Assert
			await expect(service.updateAquarium(userId, aquariumId, command)).rejects.toThrow(
				'NOT_FOUND'
			);
		});
	});
});

